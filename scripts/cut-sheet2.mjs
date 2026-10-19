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

function writePNG(filePath, width, height, pixels) {
  const header = Buffer.alloc(33);
  header.write('\x89PNG\r\n\x1a\n', 0, 'binary');
  header.writeUInt32BE(13, 8);
  header.write('IHDR', 12, 'ascii');
  header.writeUInt32BE(width, 16);
  header.writeUInt32BE(height, 20);
  header[24] = 8;
  header[25] = 6;
  header[26] = 0;
  header[27] = 0;
  header[28] = 0;
  
  const crc32 = calcCRC(header.subarray(12, 29));
  header.writeInt32BE(crc32, 29);

  const stride = 1 + width * 4;
  const raw = Buffer.alloc(height * stride);
  for (let y = 0; y < height; y++) {
    raw[y * stride] = 0;
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

function pointPolygonDistance(px, py, poly) {
  let inside = false;
  let minDist = 1e9;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1];
    const xj = poly[j][0], yj = poly[j][1];
    
    const intersect = ((yi > py) !== (yj > py)) &&
      (px < (xj - xi) * (py - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;

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

const orig = readPNG('assets/sheet-02/sheet-02-32bpp.png');
console.log('Original image loaded:', orig.width, 'x', orig.height);

// =========================================================================
// 1. FECHA IZQUIERDA: 8 . 7 . 61
// =========================================================================
const dLeftBox = { minX: 185, maxX: 335, minY: 146, maxY: 198 };
const dLeftW = dLeftBox.maxX - dLeftBox.minX;
const dLeftH = dLeftBox.maxY - dLeftBox.minY;
const dLeftPixels = Buffer.alloc(dLeftW * dLeftH * 4);

for (let y = 0; y < dLeftH; y++) {
  const origY = dLeftBox.minY + y;
  for (let x = 0; x < dLeftW; x++) {
    const origX = dLeftBox.minX + x;
    const origIdx = (origY * orig.width + origX) * 4;
    const outIdx = (y * dLeftW + x) * 4;

    const r = orig.pixels[origIdx];
    const g = orig.pixels[origIdx + 1];
    const b = orig.pixels[origIdx + 2];
    const luma = 0.299 * r + 0.587 * g + 0.114 * b;

    let alpha = 0;
    if (luma < 125) {
      alpha = 255;
    } else if (luma < 162) {
      alpha = Math.round((1 - (luma - 125) / (162 - 125)) * 255);
    }

    dLeftPixels[outIdx] = r;
    dLeftPixels[outIdx + 1] = g;
    dLeftPixels[outIdx + 2] = b;
    dLeftPixels[outIdx + 3] = alpha;
  }
}
writePNG('assets/sheet-02/date-1961-07-08.png', dLeftW, dLeftH, dLeftPixels);
console.log('✓ date-1961-07-08.png:', dLeftW, 'x', dLeftH);

// =========================================================================
// 2. ENCABEZADO Y FECHA DERECHA: el argentino 26 . 7 . 61
// =========================================================================
const dRightBox = { minX: 462, maxX: 748, minY: 135, maxY: 236 };
const dRightW = dRightBox.maxX - dRightBox.minX;
const dRightH = dRightBox.maxY - dRightBox.minY;
const dRightPixels = Buffer.alloc(dRightW * dRightH * 4);

for (let y = 0; y < dRightH; y++) {
  const origY = dRightBox.minY + y;
  for (let x = 0; x < dRightW; x++) {
    const origX = dRightBox.minX + x;
    const origIdx = (origY * orig.width + origX) * 4;
    const outIdx = (y * dRightW + x) * 4;

    const r = orig.pixels[origIdx];
    const g = orig.pixels[origIdx + 1];
    const b = orig.pixels[origIdx + 2];
    const luma = 0.299 * r + 0.587 * g + 0.114 * b;

    let alpha = 0;
    if (luma < 130) {
      alpha = 255;
    } else if (luma < 165) {
      alpha = Math.round((1 - (luma - 130) / (165 - 130)) * 255);
    }

    dRightPixels[outIdx] = r;
    dRightPixels[outIdx + 1] = g;
    dRightPixels[outIdx + 2] = b;
    dRightPixels[outIdx + 3] = alpha;
  }
}
writePNG('assets/sheet-02/header-el-argentino-1961.png', dRightW, dRightH, dRightPixels);
console.log('✓ header-el-argentino-1961.png:', dRightW, 'x', dRightH);

// =========================================================================
// 3. RECORTE IZQUIERDO: UN NIÑO DICE / SONETO / NOTA HARISPE
// =========================================================================
// Polígono exacto de corte manual con tijera abarcando TODO el texto hasta y=924
const polyLeft = [
  // Borde superior (corte con cinta adhesiva superior)
  [135.0, 203.0],
  [175.0, 202.8],
  [225.0, 202.2],
  [280.0, 201.8],
  [335.0, 201.2],
  [390.0, 200.8],
  [434.0, 200.2],
  // Esquina superior derecha
  [435.5, 202.0],
  // Borde derecho (corte vertical con sutiles variaciones de tijera manual)
  [435.2, 260.0],
  [435.0, 340.0],
  [435.5, 420.0],
  [436.2, 500.0],
  [437.0, 580.0],
  [437.8, 660.0],
  [438.5, 740.0],
  [439.0, 820.0],
  [439.5, 870.0],
  [440.0, 922.0],
  // Esquina inferior derecha
  [438.5, 923.8],
  // Borde inferior (corte de tijera limpio bajo 'Guillermo B. Harispe.')
  [390.0, 923.5],
  [330.0, 923.2],
  [270.0, 923.0],
  [210.0, 922.8],
  [165.0, 922.5],
  [141.0, 922.2],
  // Esquina inferior izquierda
  [139.5, 920.5],
  // Borde izquierdo (corte de tijera vertical orgánico)
  [139.8, 850.0],
  [139.0, 760.0],
  [138.2, 680.0],
  [137.5, 600.0],
  [136.8, 520.0],
  [136.0, 440.0],
  [135.5, 360.0],
  [135.0, 280.0],
  [134.8, 205.0]
];

const leftMinX = 133, leftMaxX = 442;
const leftMinY = 198, leftMaxY = 926;
const leftW = leftMaxX - leftMinX;
const leftH = leftMaxY - leftMinY;
const leftPixels = Buffer.alloc(leftW * leftH * 4);

for (let y = 0; y < leftH; y++) {
  const origY = leftMinY + y;
  for (let x = 0; x < leftW; x++) {
    const origX = leftMinX + x;
    const dist = pointPolygonDistance(origX + 0.5, origY + 0.5, polyLeft);

    let alpha = 0;
    if (dist >= 0.6) alpha = 255;
    else if (dist <= -0.6) alpha = 0;
    else alpha = Math.round(((dist + 0.6) / 1.2) * 255);

    const origIdx = (origY * orig.width + origX) * 4;
    const outIdx = (y * leftW + x) * 4;

    leftPixels[outIdx] = orig.pixels[origIdx];
    leftPixels[outIdx + 1] = orig.pixels[origIdx + 1];
    leftPixels[outIdx + 2] = orig.pixels[origIdx + 2];
    leftPixels[outIdx + 3] = alpha;
  }
}
writePNG('assets/sheet-02/clipping-nino-dice-1961.png', leftW, leftH, leftPixels);
console.log('✓ clipping-nino-dice-1961.png:', leftW, 'x', leftH);

// =========================================================================
// 4. RECORTE DERECHO: TRINCHERA DEL ASOMBRO (ANA ETCHEGOYEN)
// =========================================================================
const polyRight = [
  // Borde superior (corte manual ligeramente diagonal)
  [456.0, 231.0],
  [495.0, 233.0],
  [550.0, 235.5],
  [610.0, 238.0],
  [670.0, 240.5],
  [725.0, 242.5],
  [768.0, 244.5],
  // Esquina superior derecha
  [769.0, 246.5],
  // Borde derecho (desciende con sutil estrechamiento manual)
  [768.2, 310.0],
  [767.5, 390.0],
  [766.8, 470.0],
  [765.5, 550.0],
  [764.0, 630.0],
  [762.5, 710.0],
  [760.5, 790.0],
  [758.5, 870.0],
  [756.2, 940.0],
  [755.0, 990.0],
  [754.5, 1010.5],
  // Esquina inferior derecha
  [752.5, 1012.0],
  // Borde inferior (corte de tijera limpio bajo 'Gualeguaychú, Julio de 1961.')
  [710.0, 1011.8],
  [650.0, 1011.5],
  [590.0, 1011.2],
  [530.0, 1011.0],
  [480.0, 1010.8],
  [456.0, 1010.5],
  // Esquina inferior izquierda
  [454.5, 1009.0],
  // Borde izquierdo
  [454.8, 950.0],
  [455.0, 860.0],
  [455.2, 770.0],
  [455.0, 680.0],
  [455.2, 600.0],
  [455.5, 520.0],
  [455.8, 440.0],
  [455.5, 360.0],
  [455.8, 280.0],
  [455.8, 233.0]
];

const rightMinX = 453, rightMaxX = 771;
const rightMinY = 229, rightMaxY = 1014;
const rightW = rightMaxX - rightMinX;
const rightH = rightMaxY - rightMinY;
const rightPixels = Buffer.alloc(rightW * rightH * 4);

for (let y = 0; y < rightH; y++) {
  const origY = rightMinY + y;
  for (let x = 0; x < rightW; x++) {
    const origX = rightMinX + x;
    const dist = pointPolygonDistance(origX + 0.5, origY + 0.5, polyRight);

    let alpha = 0;
    if (dist >= 0.6) alpha = 255;
    else if (dist <= -0.6) alpha = 0;
    else alpha = Math.round(((dist + 0.6) / 1.2) * 255);

    const origIdx = (origY * orig.width + origX) * 4;
    const outIdx = (y * rightW + x) * 4;

    rightPixels[outIdx] = orig.pixels[origIdx];
    rightPixels[outIdx + 1] = orig.pixels[origIdx + 1];
    rightPixels[outIdx + 2] = orig.pixels[origIdx + 2];
    rightPixels[outIdx + 3] = alpha;
  }
}
writePNG('assets/sheet-02/clipping-trinchera-1961.png', rightW, rightH, rightPixels);
console.log('✓ clipping-trinchera-1961.png:', rightW, 'x', rightH);

console.log('\n=== EXTRACCIÓN DOCUMENTAL DE HOJA 02 COMPLETADA EXITOSAMENTE ===');
