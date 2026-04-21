const electron = require("electron");
const { app, BrowserWindow } = electron;
const path = require("path");

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
      nodeIntegration: false
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
