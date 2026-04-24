// Generates the app icon artifacts from `assets/icon.svg`:
//   build/icon.png   → 512×512 (Linux + BrowserWindow runtime icon)
//   build/icon.icns  → macOS (packaged via electron-builder)
//   build/icon.ico   → Windows (packaged via electron-builder)
//
// Cross-platform (pure JS — no brew/iconutil required). Rerun this after
// editing assets/icon.svg:
//   npm run build:icons

import sharp from 'sharp';
import png2icons from 'png2icons';
import { writeFile } from 'fs/promises';

const SRC = 'assets/icon.svg';
const OUT = 'build';

// Master 1024×1024 PNG — reused as the input to icns/ico multi-res packers.
const master = await sharp(SRC)
  .resize(1024, 1024)
  .png({ compressionLevel: 9 })
  .toBuffer();

// Linux app icon + runtime window icon. Electron recommends 512×512.
await sharp(master)
  .resize(512, 512)
  .png({ compressionLevel: 9 })
  .toFile(`${OUT}/icon.png`);

// macOS .icns — png2icons picks the required resolutions internally.
const icns = png2icons.createICNS(master, png2icons.BILINEAR, 0);
if (!icns) throw new Error('icns generation failed');
await writeFile(`${OUT}/icon.icns`, icns);

// Windows .ico with multi-resolution (last arg = true enables multi-size).
const ico = png2icons.createICO(master, png2icons.BILINEAR, 0, false, true);
if (!ico) throw new Error('ico generation failed');
await writeFile(`${OUT}/icon.ico`, ico);

console.log(`Wrote ${OUT}/icon.png · ${OUT}/icon.icns · ${OUT}/icon.ico`);
