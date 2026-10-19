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
  function calcCRC(buf) {
    let c = 0xffffffff;
    for (let n = 0; n < buf.length; n++) {
      c = c ^ buf[n];
      for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    return (c ^ 0xffffffff);
  }
  const header = Buffer.alloc(33);
  header.write('\x89PNG\r\n\x1a\n', 0, 'binary');
  header.writeUInt32BE(13, 8);
  header.write('IHDR', 12, 'ascii');
  header.writeUInt32BE(width, 16);
  header.writeUInt32BE(height, 20);
  header[24] = 8; header[25] = 6; header[26] = 0; header[27] = 0; header[28] = 0;
  header.writeInt32BE(calcCRC(header.subarray(12, 29)), 29);

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

const card = readPNG('assets/cover/cover-card-original.png');
const inkPixels = Buffer.alloc(card.width * card.height * 4);

// Estimate background paper color: canary yellow
// Paper average in card: R ~ 215, G ~ 200, B ~ 105
// Clean perimeter frame shadows (x < 25, y < 15, y > card.height - 8, x > card.width - 15)
for (let y = 0; y < card.height; y++) {
  for (let x = 0; x < card.width; x++) {
    const idx = (y * card.width + x) * 4;
    
    // Clear borders where black plastic frame touched
    if (x < 30 || y < 14 || x > card.width - 20 || y > card.height - 8) {
      inkPixels[idx] = 0;
      inkPixels[idx+1] = 0;
      inkPixels[idx+2] = 0;
      inkPixels[idx+3] = 0;
      continue;
    }

    const r = card.pixels[idx];
    const g = card.pixels[idx+1];
    const b = card.pixels[idx+2];
    
    const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
    let alpha = 0;
    
    // Background yellow paper has brightness > 160
    // Ink strokes are significantly darker:
    if (brightness < 162) {
      const t = Math.min(1, Math.max(0, (162 - brightness) / 95));
      alpha = Math.round(Math.pow(t, 0.8) * 255);
    }

    // Authentic vintage blue ballpoint ink: deep navy blue #14325e
    const inkFactor = Math.min(1, brightness / 160);
    const inkR = Math.round(18 + inkFactor * 16);
    const inkG = Math.round(44 + inkFactor * 22);
    const inkB = Math.round(92 + inkFactor * 28);

    inkPixels[idx] = inkR;
    inkPixels[idx+1] = inkG;
    inkPixels[idx+2] = inkB;
    inkPixels[idx+3] = alpha;
  }
}

writePNG('assets/cover/card-handwriting-ink.png', card.width, card.height, inkPixels);
console.log('Saved assets/cover/card-handwriting-ink.png successfully!');
