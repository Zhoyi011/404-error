import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) {
      c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
    }
  }
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePng(width, height, rgba) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = width * 4 + 1;
  const raw = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    raw[y * stride] = 0; // filter none
    rgba.copy(raw, y * stride + 1, y * width * 4, (y + 1) * width * 4);
  }
  const compressed = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    signature,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', compressed),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

function encodeIcoFromPng(pngBuf, width, height) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // ICO type
  header.writeUInt16LE(1, 4); // 1 image

  const entry = Buffer.alloc(16);
  entry[0] = width >= 256 ? 0 : width;
  entry[1] = height >= 256 ? 0 : height;
  entry[2] = 0;
  entry[3] = 0;
  entry.writeUInt16LE(1, 4); // color planes
  entry.writeUInt16LE(32, 6); // bits per pixel
  entry.writeUInt32LE(pngBuf.length, 8);
  entry.writeUInt32LE(22, 12); // offset after header+entry

  return Buffer.concat([header, entry, pngBuf]);
}

function clamp(v, lo = 0, hi = 255) {
  return v < lo ? lo : v > hi ? hi : v;
}

function smoothstep(edge0, edge1, x) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function sdRoundedBox(px, py, cx, cy, hw, hh, r) {
  const dx = Math.abs(px - cx) - hw + r;
  const dy = Math.abs(py - cy) - hh + r;
  const out = Math.hypot(Math.max(dx, 0), Math.max(dy, 0));
  const inside = Math.min(Math.max(dx, dy), 0);
  return out + inside - r;
}

function blendOver(dst, idx, r, g, b, a) {
  if (a <= 0) return;
  const alpha = a / 255;
  const inv = 1 - alpha;
  dst[idx] = clamp(Math.round(r * alpha + dst[idx] * inv));
  dst[idx + 1] = clamp(Math.round(g * alpha + dst[idx + 1] * inv));
  dst[idx + 2] = clamp(Math.round(b * alpha + dst[idx + 2] * inv));
  dst[idx + 3] = clamp(Math.round(255 * (alpha + (dst[idx + 3] / 255) * inv)));
}

function renderBrandIcon(size, { maskable = false } = {}) {
  const buf = Buffer.alloc(size * size * 4);
  const scale = maskable ? 0.72 : 0.92;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const nx = (x + 0.5) / size; // 0..1
      const ny = (y + 0.5) / size;

      // Radial midnight background
      const gx = nx - 0.5;
      const gy = ny - 0.44;
      const radial = Math.min(1, Math.hypot(gx, gy) / 0.65);
      let bgR = Math.round(15 * (1 - radial) + 5 * radial);
      let bgG = Math.round(36 * (1 - radial) + 7 * radial);
      let bgB = Math.round(63 * (1 - radial) + 13 * radial);

      // Faint crimson bottom-right horror glow
      const hDist = Math.hypot(nx - 0.76, ny - 0.78);
      if (hDist < 0.5) {
        const hg = (1 - hDist / 0.5) * 0.28;
        bgR = clamp(Math.round(bgR + 225 * hg));
        bgG = clamp(Math.round(bgG + 29 * hg));
        bgB = clamp(Math.round(bgB + 72 * hg));
      }

      if (maskable) {
        buf[idx] = bgR;
        buf[idx + 1] = bgG;
        buf[idx + 2] = bgB;
        buf[idx + 3] = 255;
      } else {
        // Rounded square tile alpha
        const tileD = sdRoundedBox(nx, ny, 0.5, 0.5, 0.48, 0.48, 0.19);
        const tileA = 1 - smoothstep(-0.008, 0.008, tileD);
        buf[idx] = bgR;
        buf[idx + 1] = bgG;
        buf[idx + 2] = bgB;
        buf[idx + 3] = Math.round(tileA * 255);
      }

      if (buf[idx + 3] === 0) continue;

      // Map to scaled symbol coordinates centered at (0.5, 0.5)
      const sx = (nx - 0.5) / scale + 0.5;
      const sy = (ny - 0.5) / scale + 0.5;

      // Subtle scanlines inside monitor area
      const frameOuter = sdRoundedBox(sx, sy, 0.5, 0.46, 0.34, 0.25, 0.055);
      const frameInner = sdRoundedBox(sx, sy, 0.5, 0.46, 0.315, 0.225, 0.04);

      if (frameInner <= 0.006) {
        const innerA = (1 - smoothstep(-0.004, 0.004, frameInner)) * 245;
        blendOver(buf, idx, 9, 15, 29, innerA);

        // Title bar divider
        if (Math.abs(sy - 0.305) < 0.006) {
          blendOver(buf, idx, 30, 41, 59, 230);
        }

        // Traffic dots
        const dots = [
          [0.245, 0.27, 244, 63, 94],
          [0.295, 0.27, 251, 191, 36],
          [0.345, 0.27, 56, 189, 248],
        ];
        for (const [dx, dy, dr, dg, db] of dots) {
          const dd = Math.hypot(sx - dx, sy - dy) - 0.015;
          if (dd < 0.006) {
            blendOver(buf, idx, dr, dg, db, (1 - smoothstep(-0.004, 0.004, dd)) * 255);
          }
        }

        // Eye contour (lens intersection of two circles)
        const eyeX = sx - 0.5;
        const eyeY = sy - 0.485;
        const eyeDist = Math.hypot(eyeX * 0.72, eyeY * 1.45);
        if (eyeDist < 0.195) {
          // Dark sclera
          const sclA = (1 - smoothstep(0.18, 0.195, eyeDist)) * 255;
          blendOver(buf, idx, 5, 7, 13, sclA);

          // Cyan eye border ring
          if (eyeDist > 0.165) {
            const ringA =
              smoothstep(0.162, 0.172, eyeDist) * (1 - smoothstep(0.186, 0.195, eyeDist)) * 255;
            blendOver(buf, idx, 56, 189, 248, ringA);
          }

          // Crimson iris
          const irisD = Math.hypot(eyeX, eyeY);
          if (irisD < 0.095) {
            const irisA = (1 - smoothstep(0.088, 0.095, irisD)) * 255;
            const shade = Math.max(0, 1 - irisD / 0.095);
            blendOver(
              buf,
              idx,
              Math.round(160 + 85 * shade),
              Math.round(18 + 30 * shade),
              Math.round(52 + 40 * shade),
              irisA
            );
          }

          // Pupil
          if (irisD < 0.038) {
            const pupA = (1 - smoothstep(0.033, 0.038, irisD)) * 255;
            blendOver(buf, idx, 5, 7, 13, pupA);
          }

          // Specular highlight
          const specD = Math.hypot(eyeX - 0.03, eyeY + 0.028);
          if (specD < 0.018) {
            const spA = (1 - smoothstep(0.012, 0.018, specD)) * 235;
            blendOver(buf, idx, 255, 255, 255, spA);
          }
        }
      }

      // Gradient frame border (cyan -> crimson)
      if (frameOuter <= 0.006 && frameInner >= -0.006) {
        const borderA =
          (1 - smoothstep(-0.004, 0.004, frameOuter)) *
          smoothstep(-0.004, 0.004, frameInner) *
          255;
        const gradT = Math.max(0, Math.min(1, (sx - 0.16 + sy - 0.21) / 1.1));
        const br = Math.round(56 * (1 - gradT) + 244 * gradT);
        const bg = Math.round(189 * (1 - gradT) + 63 * gradT);
        const bb = Math.round(248 * (1 - gradT) + 94 * gradT);
        blendOver(buf, idx, br, bg, bb, borderA);
      }

      // Monitor stand neck & base
      const neckD = sdRoundedBox(sx, sy, 0.5, 0.74, 0.055, 0.032, 0.008);
      if (neckD < 0.006) {
        blendOver(buf, idx, 30, 41, 59, (1 - smoothstep(-0.004, 0.004, neckD)) * 255);
      }
      const baseD = sdRoundedBox(sx, sy, 0.5, 0.785, 0.175, 0.02, 0.015);
      if (baseD < 0.006) {
        const baseA = (1 - smoothstep(-0.004, 0.004, baseD)) * 240;
        blendOver(buf, idx, 56, 189, 248, baseA);
      }
      const pillD = sdRoundedBox(sx, sy, 0.41, 0.785, 0.045, 0.008, 0.006);
      if (pillD < 0.004) {
        blendOver(buf, idx, 244, 63, 94, (1 - smoothstep(-0.003, 0.003, pillD)) * 255);
      }
    }
  }

  return encodePng(size, size, buf);
}

const root = process.cwd();
const publicDir = path.join(root, 'public');
const tauriIconsDir = path.join(root, 'src-tauri', 'icons');
fs.mkdirSync(tauriIconsDir, { recursive: true });

const icons = [
  { file: path.join(publicDir, 'pwa-192x192.png'), size: 192, maskable: false },
  { file: path.join(publicDir, 'pwa-512x512.png'), size: 512, maskable: false },
  { file: path.join(publicDir, 'pwa-maskable-512x512.png'), size: 512, maskable: true },
  { file: path.join(publicDir, 'apple-touch-icon.png'), size: 180, maskable: false },
];

for (const item of icons) {
  const png = renderBrandIcon(item.size, { maskable: item.maskable });
  fs.writeFileSync(item.file, png);
  console.log(`Generated ${path.relative(root, item.file)} (${png.length} bytes)`);
}

// Tauri v2 required desktop icons (32x32, 128x128, 256x256 @2x, 512x512 icon.png, 256x256 icon.ico)
const tauriPngSizes = [
  { name: '32x32.png', size: 32 },
  { name: '128x128.png', size: 128 },
  { name: '128x128@2x.png', size: 256 },
  { name: 'icon.png', size: 512 },
];

for (const item of tauriPngSizes) {
  const png = renderBrandIcon(item.size, { maskable: false });
  fs.writeFileSync(path.join(tauriIconsDir, item.name), png);
}

const icoPng256 = renderBrandIcon(256, { maskable: false });
const icoBuf = encodeIcoFromPng(icoPng256, 256, 256);
fs.writeFileSync(path.join(tauriIconsDir, 'icon.ico'), icoBuf);
console.log(`Generated src-tauri/icons/* and icon.ico (${icoBuf.length} bytes)`);
