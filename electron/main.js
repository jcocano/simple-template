const electron = require("electron");
const { app, BrowserWindow, protocol } = electron;
const path = require("path");
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

// st-img://{wsId}/{filename} — protocolo custom para servir imágenes del disco
// sin relajar webSecurity. Hay que registrarlo como `secure` + `standard`
// ANTES de whenReady, si no el renderer bloquea el request por CORS.
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
]);

if (!app || !BrowserWindow) {
  console.error(
    "Electron main process unavailable. Ensure ELECTRON_RUN_AS_NODE is unset before launching Electron."
  );
  process.exit(1);
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

  const devUrl = process.env.ELECTRON_START_URL;

  if (devUrl) {
    win.loadURL(devUrl);
    win.webContents.openDevTools({ mode: "detach" });
    return;
  }

  win.loadFile(path.join(__dirname, "..", "index.html"));
}

app.whenReady().then(() => {
  db.init();
  seed.ensureFirstWorkspace();

  // Actual handler del protocolo custom. Devuelve los bytes del archivo o 404.
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
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
