#!/usr/bin/env node
// Launches Electron for dev mode. On macOS, also renames the bundled
// Electron.app to "Simple Template.app" so the Dock tile and menu bar
// read the product name instead of "Electron". The renamed bundle is
// cached in build/dev-runtime/ and only rebuilt when the Electron
// version in node_modules changes.

import { spawn, execSync } from "child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const APP_NAME = "Simple Template";

function electronVersion() {
  const p = path.join(ROOT, "node_modules", "electron", "package.json");
  return JSON.parse(readFileSync(p, "utf8")).version;
}

function prepareMacRuntime() {
  const srcApp = path.join(ROOT, "node_modules", "electron", "dist", "Electron.app");
  const runtimeDir = path.join(ROOT, "build", "dev-runtime");
  const dstApp = path.join(runtimeDir, `${APP_NAME}.app`);
  const stampPath = path.join(runtimeDir, ".electron-version");
  const version = electronVersion();

  const upToDate =
    existsSync(dstApp) &&
    existsSync(stampPath) &&
    readFileSync(stampPath, "utf8").trim() === version;

  if (!upToDate) {
    rmSync(runtimeDir, { recursive: true, force: true });
    mkdirSync(runtimeDir, { recursive: true });

    // `ditto` preserves metadata and extended attributes; faster than cpSync -r.
    execSync(`ditto "${srcApp}" "${dstApp}"`, { stdio: "inherit" });

    renameSync(
      path.join(dstApp, "Contents", "MacOS", "Electron"),
      path.join(dstApp, "Contents", "MacOS", APP_NAME)
    );

    const plist = path.join(dstApp, "Contents", "Info.plist");
    const buddy = "/usr/libexec/PlistBuddy";
    const set = (key, value) => {
      try {
        execSync(`${buddy} -c 'Set :${key} "${value}"' "${plist}"`, { stdio: "pipe" });
      } catch {
        execSync(`${buddy} -c 'Add :${key} string "${value}"' "${plist}"`, { stdio: "pipe" });
      }
    };
    set("CFBundleName", APP_NAME);
    set("CFBundleDisplayName", APP_NAME);
    set("CFBundleExecutable", APP_NAME);
    set("CFBundleIdentifier", "com.simpletemplate.app.dev");

    // Re-sign ad-hoc so macOS accepts the patched bundle.
    try {
      execSync(`codesign --force --deep --sign - "${dstApp}"`, { stdio: "pipe" });
    } catch (err) {
      console.warn("[dev-runtime] codesign failed (continuing):", err.message);
    }

    writeFileSync(stampPath, version);
    console.log(`[dev-runtime] Electron ${version} -> "${APP_NAME}.app"`);
  }

  return path.join(dstApp, "Contents", "MacOS", APP_NAME);
}

function electronBinary() {
  const dist = path.join(ROOT, "node_modules", "electron", "dist");
  if (process.platform === "win32") return path.join(dist, "electron.exe");
  return path.join(dist, "electron");
}

const binary = process.platform === "darwin" ? prepareMacRuntime() : electronBinary();

const env = { ...process.env, ELECTRON_START_URL: "http://127.0.0.1:5173" };
delete env.ELECTRON_RUN_AS_NODE;

const child = spawn(binary, [ROOT], { stdio: "inherit", env });
child.on("exit", (code) => process.exit(code ?? 0));
child.on("error", (err) => {
  console.error("[dev-runtime] failed to launch:", err);
  process.exit(1);
});
