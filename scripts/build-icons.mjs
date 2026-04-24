// Generates the app icon artifacts from `assets/icon.svg`:
//   build/icon.png        → 512×512 plain artwork (Linux + Windows runtime)
//   build/icon-macos.png  → 512×512 squircle+bg variant (macOS Dock runtime)
//   build/icon.icns       → macOS bundle, built from the squircle master
//   build/icon.ico        → Windows bundle, built from the plain master
//
// The macOS master follows the Big Sur icon grid exactly: 824×824 tile
// centered in a 1024×1024 canvas (100px gutter), corner radius 185.4,
// drop shadow (28px blur / 12px Y offset), artwork inset ~80% of tile.
// See Apple HIG "App icons" — the gutter matters because the Dock scales
// the full 1024 and the shadow falls outside the tile, giving icons the
// familiar breathing room next to neighbors.
//
// Linux/Windows keep the plain artwork — those platforms render icons
// without shape masking, so a transparent envelope reads better than a
// squircle with baked-in padding.
//
// Cross-platform (pure JS — no brew/iconutil required). Rerun this after
// editing assets/icon.svg:
//   npm run build:icons

import sharp from 'sharp';
import png2icons from 'png2icons';
import { writeFile } from 'fs/promises';

const SRC = 'assets/icon.svg';
const OUT = 'build';

// --- Plain master (Linux / Windows runtime / Windows .ico) ---
const plainMaster = await sharp(SRC)
  .resize(1024, 1024)
  .png({ compressionLevel: 9 })
  .toBuffer();

await sharp(plainMaster)
  .resize(512, 512)
  .png({ compressionLevel: 9 })
  .toFile(`${OUT}/icon.png`);

// --- macOS icon (Big Sur grid) ---
const CANVAS = 1024;
const TILE = 824;
const TILE_OFFSET = (CANVAS - TILE) / 2;   // 100
const TILE_RADIUS = 185.4;
const SHADOW_Y = 12;
const SHADOW_BLUR_SIGMA = 14;               // ~28px gaussian radius
const SHADOW_OPACITY = 0.18;

// Artwork fills roughly 80% of the tile — gives visual weight without
// crowding the edges. Centered inside the tile.
const ARTWORK = Math.round(TILE * 0.80);    // 659
const ARTWORK_OFFSET = TILE_OFFSET + Math.round((TILE - ARTWORK) / 2);

// Drop shadow: black squircle offset downward, then gaussian-blurred.
const shadowSvg = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS}" height="${CANVAS}">` +
    `<rect x="${TILE_OFFSET}" y="${TILE_OFFSET + SHADOW_Y}" ` +
      `width="${TILE}" height="${TILE}" ` +
      `rx="${TILE_RADIUS}" ry="${TILE_RADIUS}" ` +
      `fill="#000000" fill-opacity="${SHADOW_OPACITY}"/>` +
  `</svg>`
);
const shadowPng = await sharp(shadowSvg).blur(SHADOW_BLUR_SIGMA).png().toBuffer();

// Squircle tile with a subtle vertical gradient (white → light-blue) so the
// envelope's inner white "paper" has enough contrast against the tile
// background. Gradient also gives the tile a gentle sense of depth.
const tileSvg = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS}" height="${CANVAS}">` +
    `<defs>` +
      `<linearGradient id="tileBg" x1="0" y1="0" x2="0" y2="1">` +
        `<stop offset="0" stop-color="#FFFFFF"/>` +
        `<stop offset="1" stop-color="#DBEAFE"/>` +
      `</linearGradient>` +
    `</defs>` +
    `<rect x="${TILE_OFFSET}" y="${TILE_OFFSET}" ` +
      `width="${TILE}" height="${TILE}" ` +
      `rx="${TILE_RADIUS}" ry="${TILE_RADIUS}" ` +
      `fill="url(#tileBg)"/>` +
  `</svg>`
);
const tilePng = await sharp(tileSvg).png().toBuffer();

// Envelope artwork rasterized at the target size for crisp edges.
const artworkPng = await sharp(SRC)
  .resize(ARTWORK, ARTWORK)
  .png()
  .toBuffer();

// Layered composite: transparent canvas → shadow → tile → artwork.
const macMaster = await sharp({
  create: {
    width: CANVAS,
    height: CANVAS,
    channels: 4,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  },
})
  .composite([
    { input: shadowPng,  top: 0, left: 0 },
    { input: tilePng,    top: 0, left: 0 },
    { input: artworkPng, top: ARTWORK_OFFSET, left: ARTWORK_OFFSET },
  ])
  .png({ compressionLevel: 9 })
  .toBuffer();

// 512×512 variant for app.dock.setIcon at runtime.
await sharp(macMaster)
  .resize(512, 512)
  .png({ compressionLevel: 9 })
  .toFile(`${OUT}/icon-macos.png`);

// --- macOS .icns (multi-resolution, built from the squircle master) ---
const icns = png2icons.createICNS(macMaster, png2icons.BILINEAR, 0);
if (!icns) throw new Error('icns generation failed');
await writeFile(`${OUT}/icon.icns`, icns);

// --- Windows .ico (plain master, 9 resolutions 16 → 256) ---
const ico = png2icons.createICO(plainMaster, png2icons.BILINEAR, 0, false, true);
if (!ico) throw new Error('ico generation failed');
await writeFile(`${OUT}/icon.ico`, ico);

console.log(
  `Wrote ${OUT}/icon.png · ${OUT}/icon-macos.png · ${OUT}/icon.icns · ${OUT}/icon.ico`
);
