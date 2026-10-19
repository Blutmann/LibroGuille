import fs from 'fs';
import zlib from 'zlib';

function readPNG(filePath) {
  const buf = fs.readFileSync(filePath);
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  let pos = 8;
  const idats = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    if (type === 'IDAT') idats.push(buf.subarray(pos + 8, pos + 8 + len));
    pos += 12 + len;
  }
  const decompressed = zlib.inflateSync(Buffer.concat(idats));
  const bytesPerPixel = 4;
  const stride = 1 + width * bytesPerPixel;
  const pixels = Buffer.alloc(width * height * 4);
  let prevLine = Buffer.alloc(width * bytesPerPixel);
  for (let y = 0; y < height; y++) {
    const filter = decompressed[y * stride];
    const currentLine = decompressed.subarray(y * stride + 1, (y + 1) * stride);
    const lineBuf = Buffer.alloc(width * bytesPerPixel);
    for (let x = 0; x < width * bytesPerPixel; x++) {
      let b = currentLine[x];
      const a = (x >= bytesPerPixel) ? lineBuf[x - bytesPerPixel] : 0;
      const c = (x >= bytesPerPixel) ? prevLine[x - bytesPerPixel] : 0;
      const d = prevLine[x];
      if (filter === 0) lineBuf[x] = b;
      else if (filter === 1) lineBuf[x] = (b + a) & 0xff;
      else if (filter === 2) lineBuf[x] = (b + d) & 0xff;
      else if (filter === 3) lineBuf[x] = (b + Math.floor((a + d) / 2)) & 0xff;
      else if (filter === 4) {
        const p = a + d - c;
        const pa = Math.abs(p - a), pb = Math.abs(p - d), pc = Math.abs(p - c);
        lineBuf[x] = (b + ((pa <= pb && pa <= pc) ? a : (pb <= pc ? d : c))) & 0xff;
      }
    }
    lineBuf.copy(pixels, y * width * 4);
    prevLine = lineBuf;
  }
  return { width, height, pixels };
}

// Function to write 32-bit RGBA PNG
function writePNG(filePath, width, height, pixels) {
  const header = Buffer.alloc(33);
  header.write('\x89PNG\r\n\x1a\n', 0, 'binary');
  header.writeUInt32BE(13, 8);
  header.write('IHDR', 12, 'ascii');
  header.writeUInt32BE(width, 16);
  header.writeUInt32BE(height, 20);
  header[24] = 8; // bit depth
  header[25] = 6; // RGBA
  header[26] = 0; // compression
  header[27] = 0; // filter
  header[28] = 0; // interlace
  
  // Calculate CRC for IHDR
  const crc32 = calcCRC(header.subarray(12, 29));
  header.writeInt32BE(crc32, 29);

  // Scanlines with filter byte 0
  const stride = 1 + width * 4;
  const raw = Buffer.alloc(height * stride);
  for (let y = 0; y < height; y++) {
    raw[y * stride] = 0; // filter None
    pixels.copy(raw, y * stride + 1, y * width * 4, (y + 1) * width * 4);
  }
  const compressed = zlib.deflateSync(raw, { level: 9 });

  const idatChunk = Buffer.alloc(12 + compressed.length);
  idatChunk.writeUInt32BE(compressed.length, 0);
  idatChunk.write('IDAT', 4, 'ascii');
  compressed.copy(idatChunk, 8);
  idatChunk.writeInt32BE(calcCRC(idatChunk.subarray(4, 8 + compressed.length)), 8 + compressed.length);

  const iendChunk = Buffer.alloc(12);
  iendChunk.writeUInt32BE(0, 0);
  iendChunk.write('IEND', 4, 'ascii');
  iendChunk.writeInt32BE(calcCRC(iendChunk.subarray(4, 8)), 8);

  fs.writeFileSync(filePath, Buffer.concat([header, idatChunk, iendChunk]));
}

// CRC32 implementation
function calcCRC(buf) {
  let c = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = c ^ buf[n];
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
  }
  return (c ^ 0xffffffff);
}

// Point-in-polygon with distance for smooth anti-aliased edge
function pointPolygonDistance(px, py, poly) {
  let inside = false;
  let minDist = 1e9;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1];
    const xj = poly[j][0], yj = poly[j][1];
    
    const intersect = ((yi > py) !== (yj > py)) &&
      (px < (xj - xi) * (py - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;

    // Segment distance
    const l2 = (xj - xi) * (xj - xi) + (yj - yi) * (yj - yi);
    if (l2 === 0) {
      const d = Math.hypot(px - xi, py - yi);
      if (d < minDist) minDist = d;
    } else {
      let t = ((px - xi) * (xj - xi) + (py - yi) * (yj - yi)) / l2;
      t = Math.max(0, Math.min(1, t));
      const projX = xi + t * (xj - xi);
      const projY = yi + t * (yj - yi);
      const d = Math.hypot(px - projX, py - projY);
      if (d < minDist) minDist = d;
    }
  }
  return inside ? minDist : -minDist;
}

const orig = readPNG('C:/Users/Administrador/.gemini/antigravity/brain/6dd4e2fc-b09a-491a-9501-65066fe03a9a/.user_uploaded/media_1792373664482_818d4b89.png');

// =========================================================================
// 1. RECORTE 1: BIBLIOTECA POPULAR SARMIENTO (1951)
// =========================================================================
// Define the authentic physical scissor contour in orig coordinates:
// Notice: slight hand-held scissor variation, gentle diagonal and rounded snips
const polySarmiento = [
  // Top edge (slightly diagonal and organic)
  [18.5, 63.0],
  [45.0, 63.3],
  [85.0, 63.8],
  [135.0, 64.2],
  [185.0, 64.8],
  [225.0, 65.5],
  [251.5, 66.2],
  // Top-right corner (gentle scissor snip)
  [252.5, 68.0],
  // Right edge (subtle hand cut variation)
  [252.2, 110.0],
  [252.0, 160.0],
  [251.5, 210.0],
  [250.5, 260.0],
  [249.8, 310.0],
  [248.8, 360.0],
  [247.8, 396.5],
  // Bottom-right corner
  [246.5, 398.2],
  // Bottom edge (natural scissor cut, cleanly trimming above stray dots)
  [220.0, 398.0],
  [180.0, 398.5],
  [140.0, 398.2],
  [95.0, 397.8],
  [50.0, 397.5],
  [20.5, 397.0],
  // Bottom-left corner
  [18.2, 395.0],
  // Left edge (authentic scissor cut)
  [18.5, 360.0],
  [18.8, 300.0],
  [19.0, 240.0],
  [18.7, 180.0],
  [18.4, 120.0],
  [18.2, 70.0]
];

// Crop box with 2px padding for anti-aliasing
const sarmMinX = 16, sarmMaxX = 255;
const sarmMinY = 61, sarmMaxY = 401;
const sarmW = sarmMaxX - sarmMinX;
const sarmH = sarmMaxY - sarmMinY;
const sarmPixels = Buffer.alloc(sarmW * sarmH * 4);

for (let y = 0; y < sarmH; y++) {
  const origY = sarmMinY + y;
  for (let x = 0; x < sarmW; x++) {
    const origX = sarmMinX + x;
    const dist = pointPolygonDistance(origX + 0.5, origY + 0.5, polySarmiento);
    
    // Smooth anti-aliased edge over ~1.2px
    let alpha = 0;
    if (dist >= 0.6) alpha = 255;
    else if (dist <= -0.6) alpha = 0;
    else alpha = Math.round(((dist + 0.6) / 1.2) * 255);

    const origIdx = (origY * orig.width + origX) * 4;
    const outIdx = (y * sarmW + x) * 4;

    sarmPixels[outIdx] = orig.pixels[origIdx];
    sarmPixels[outIdx + 1] = orig.pixels[origIdx + 1];
    sarmPixels[outIdx + 2] = orig.pixels[origIdx + 2];
    sarmPixels[outIdx + 3] = alpha;
  }
}

writePNG('assets/sheet-01/clipping-sarmiento-1951.png', sarmW, sarmH, sarmPixels);
console.log('Saved clipping-sarmiento-1951.png:', sarmW, 'x', sarmH);

// =========================================================================
// 2. RECORTE 2: EL VI CERTAMEN RENÉ BASTIANINI (1959)
// =========================================================================
const polyBastianini = [
  // Top edge (authentic scissor cut with subtle angle)
  [37.2, 444.8],
  [65.0, 443.8],
  [100.0, 442.8],
  [140.0, 442.2],
  [180.0, 442.0],
  [215.5, 442.2],
  // Top-right corner
  [216.8, 444.0],
  // Right edge (natural hand-cut contour)
  [216.2, 480.0],
  [216.0, 520.0],
  [216.8, 570.0],
  [217.8, 620.0],
  [219.0, 670.0],
  [219.8, 720.0],
  [219.5, 765.0],
  // Bottom-right corner
  [218.0, 782.0],
  [190.0, 782.5],
  [160.0, 783.2],
  [120.0, 783.0],
  [85.0, 782.5],
  [50.0, 782.0],
  [34.0, 781.5],
  // Bottom-left corner
  [32.8, 779.0],
  // Left edge (subtle slant)
  [33.5, 765.0],
  [34.8, 715.0],
  [36.2, 665.0],
  [37.5, 615.0],
  [37.8, 565.0],
  [37.6, 515.0],
  [37.2, 470.0]
];

const bastMinX = 31, bastMaxX = 222;
const bastMinY = 440, bastMaxY = 786;
const bastW = bastMaxX - bastMinX;
const bastH = bastMaxY - bastMinY;
const bastPixels = Buffer.alloc(bastW * bastH * 4);

for (let y = 0; y < bastH; y++) {
  const origY = bastMinY + y;
  for (let x = 0; x < bastW; x++) {
    const origX = bastMinX + x;
    const dist = pointPolygonDistance(origX + 0.5, origY + 0.5, polyBastianini);
    
    let alpha = 0;
    if (dist >= 0.6) alpha = 255;
    else if (dist <= -0.6) alpha = 0;
    else alpha = Math.round(((dist + 0.6) / 1.2) * 255);

    const origIdx = (origY * orig.width + origX) * 4;
    const outIdx = (y * bastW + x) * 4;

    bastPixels[outIdx] = orig.pixels[origIdx];
    bastPixels[outIdx + 1] = orig.pixels[origIdx + 1];
    bastPixels[outIdx + 2] = orig.pixels[origIdx + 2];
    bastPixels[outIdx + 3] = alpha;
  }
}

writePNG('assets/sheet-01/clipping-bastianini-1959.png', bastW, bastH, bastPixels);
console.log('Saved clipping-bastianini-1959.png:', bastW, 'x', bastH);
