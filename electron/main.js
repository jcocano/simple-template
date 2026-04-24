const electron = require("electron");
const { app, BrowserWindow, crashReporter, protocol, session, nativeImage } = electron;
const path = require("path");
const fs = require("fs");
const db = require("./storage/db");
const seed = require("./storage/seed");
const imageFiles = require("./storage/image-files");
const storageIpc = require("./ipc/storage");
const secretsIpc = require("./ipc/secrets");
const smtpIpc = require("./ipc/smtp");
const shellIpc = require("./ipc/shell");
const oauthIpc = require("./ipc/oauth");
const aiIpc = require("./ipc/ai");
const cdnIpc = require("./ipc/cdn");
const imagesLocalIpc = require("./ipc/images-local");
const shareIpc = require("./ipc/share");
const mcpIpc = require("./ipc/mcp");
const mcp = require("./mcp");

// st-img://{wsId}/{filename} custom protocol serves workspace images from disk
// without relaxing webSecurity. Must be registered as `secure` + `standard`
// before whenReady, otherwise renderer blocks requests via CORS policy.
protocol.registerSchemesAsPrivileged([
  {
    scheme: "st-img",
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      stream: true,
      corsEnabled: true,
    },
  },
  {
    scheme: "simpletemplete",
    privileges: { standard: true, secure: true },
  },
]);

if (!app || !BrowserWindow) {
  console.error(
    "Electron main process unavailable. Ensure ELECTRON_RUN_AS_NODE is unset before launching Electron."
  );
  process.exit(1);
}

// Force the app name so dev builds (which run the raw Electron binary)
// still show "Simple Template" in the menu bar, About panel and process
// title — not the bundled "Electron" name from node_modules.
const APP_NAME = "Simple Template";
app.setName(APP_NAME);
process.title = APP_NAME;

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
  return;
}

if (process.defaultApp && process.argv.length >= 2) {
  app.setAsDefaultProtocolClient("simpletemplete", process.execPath, [path.resolve(process.argv[1])]);
} else {
  app.setAsDefaultProtocolClient("simpletemplete");
}

crashReporter.start({ uploadToServer: false });

function logCrash(kind, err) {
  try {
    const logDir = app.getPath("logs");
    fs.mkdirSync(logDir, { recursive: true });
    const line = `[${new Date().toISOString()}] ${kind}: ${err && err.stack ? err.stack : String(err)}\n`;
    fs.appendFileSync(path.join(logDir, "main.log"), line);
  } catch (_) {
    // last-resort: don't let the logger itself throw
  }
  console.error(kind, err);
}

process.on("uncaughtException", (err) => logCrash("uncaughtException", err));
process.on("unhandledRejection", (reason) => logCrash("unhandledRejection", reason));

let pendingDeepLink = null;
let mainWindow = null;

function forwardDeepLink(url) {
  if (!url || typeof url !== "string" || !url.startsWith("simpletemplete://")) return;
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
    mainWindow.webContents.send("share:deeplink", url);
  } else {
    pendingDeepLink = url;
  }
}

function findDeepLinkInArgv(argv) {
  if (!Array.isArray(argv)) return null;
  return argv.find((a) => typeof a === "string" && a.startsWith("simpletemplete://")) || null;
}

function createWindow() {
  const isMac = process.platform === "darwin";
  const isWin = process.platform === "win32";

  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 720,
    backgroundColor: "#10131a",
    autoHideMenuBar: true,
    titleBarStyle: "hidden",
    // Runtime window icon — used by Linux taskbar and Windows title bar/dock.
    // macOS ignores this and uses the .icns from the packaged app bundle.
    icon: path.join(__dirname, "..", "build", "icon.png"),
    ...(isMac ? { trafficLightPosition: { x: 10, y: 6 } } : {}),
    ...(isWin
      ? {
          titleBarOverlay: {
            color: "#0b0d12",
            symbolColor: "#cbd1dc",
            height: 28
          }
        }
      : {}),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: path.join(__dirname, "preload.js")
    }
  });

  mainWindow = win;

  win.webContents.on("did-finish-load", () => {
    if (pendingDeepLink) {
      win.webContents.send("share:deeplink", pendingDeepLink);
      pendingDeepLink = null;
    }
  });

  win.on("closed", () => {
    mainWindow = null;
  });

  const devUrl = process.env.ELECTRON_START_URL;

  if (devUrl) {
    win.loadURL(devUrl);
    win.webContents.openDevTools({ mode: "detach" });
    return;
  }

  win.loadFile(path.join(__dirname, "..", "dist", "index.html"));
}

app.whenReady().then(() => {
  if (process.platform === "darwin" && typeof app.setAboutPanelOptions === "function") {
    app.setAboutPanelOptions({
      applicationName: APP_NAME,
      applicationVersion: app.getVersion(),
      copyright: "MIT — Jesus Cocaño",
    });
  }

  // macOS Dock / App Switcher icon. In a packaged .app the OS reads this
  // from Contents/Resources/icon.icns, but when running the Electron binary
  // directly in dev mode the Dock shows the default Electron icon. This
  // runtime override fixes dev and is a harmless no-op in packaged builds.
  // Uses the squircle variant so the Dock tile matches the packaged .icns.
  if (process.platform === "darwin" && app.dock) {
    try {
      const dockIcon = nativeImage.createFromPath(
        path.join(__dirname, "..", "build", "icon-macos.png")
      );
      if (!dockIcon.isEmpty()) app.dock.setIcon(dockIcon);
    } catch (err) {
      console.error("[main] failed to set dock icon", err);
    }
  }
  db.init();
  seed.ensureFirstWorkspace();

  // Content-Security-Policy — prod only. Dev keeps Vite HMR unconstrained.
  // Inline scripts/styles are required by index.html (TWEAKS block + ~800
  // lines of embedded CSS). Google Fonts is loaded as a stylesheet link.
  // st-img:// is our custom protocol for workspace images.
  if (!process.env.ELECTRON_START_URL) {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      "img-src 'self' data: blob: st-img: https: http:",
      "connect-src 'self' https:",
      "media-src 'self' data: blob:",
    ].join("; ");
    session.defaultSession.webRequest.onHeadersReceived((details, cb) => {
      cb({
        responseHeaders: {
          ...details.responseHeaders,
          "Content-Security-Policy": [csp],
        },
      });
    });
  }

  // Custom protocol handler. Returns file bytes or 404.
  protocol.handle("st-img", async (request) => {
    try {
      const parsed = imageFiles.parseStImgUrl(request.url);
      if (!parsed) return new Response(null, { status: 400 });
      const data = imageFiles.read(parsed.workspaceId, parsed.localPath);
      if (!data) return new Response(null, { status: 404 });
      return new Response(data.bytes, {
        status: 200,
        headers: {
          "Content-Type": data.mime,
          "Cache-Control": "no-cache",
        },
      });
    } catch (err) {
      console.error("[st-img] handler error", err);
      return new Response(null, { status: 500 });
    }
  });

  storageIpc.register();
  secretsIpc.register();
  smtpIpc.register();
  shellIpc.register();
  oauthIpc.register();
  aiIpc.register();
  cdnIpc.register();
  imagesLocalIpc.register();
  shareIpc.register();
  mcpIpc.register();
  createWindow();

  // MCP server starts after the window is created so activity/change events
  // have a webContents to target. init() also reads persisted settings and
  // boots the HTTP server if `mcp:enabled` is true.
  mcp.init({ mainWindow }).catch((err) => logCrash("mcp:init", err));

  const coldStartUrl = findDeepLinkInArgv(process.argv);
  if (coldStartUrl) forwardDeepLink(coldStartUrl);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("second-instance", (_event, argv) => {
  const url = findDeepLinkInArgv(argv);
  if (url) forwardDeepLink(url);
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.on("open-url", (event, url) => {
  event.preventDefault();
  forwardDeepLink(url);
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", async (event) => {
  try {
    await mcp.shutdown();
  } catch (err) {
    logCrash("mcp:shutdown", err);
  }
});
