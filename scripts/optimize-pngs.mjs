import fs from 'fs';
import zlib from 'zlib';

function compressPNG(inPath, outPath) {
  const buf = fs.readFileSync(inPath);
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

  const rawDecompressed = zlib.inflateSync(Buffer.concat(idats));
  console.log(inPath, 'Decompressed size:', (rawDecompressed.length / 1024 / 1024).toFixed(2), 'MB');

  // Re-compress with zlib level 6
  const recompressed = zlib.deflateSync(rawDecompressed, { level: 6 });
  console.log(inPath, 'Recompressed IDAT size:', (recompressed.length / 1024 / 1024).toFixed(2), 'MB');

  const header = buf.subarray(0, 33);
  const idatChunk = Buffer.alloc(12 + recompressed.length);
  idatChunk.writeUInt32BE(recompressed.length, 0);
  idatChunk.write('IDAT', 4, 'ascii');
  recompressed.copy(idatChunk, 8);
  
  function calcCRC(b) {
    let c = 0xffffffff;
    for (let n = 0; n < b.length; n++) {
      c = c ^ b[n];
      for (let k = 0; k < 8; k++) {
        c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
      }
    }
    return (c ^ 0xffffffff);
  }

  idatChunk.writeInt32BE(calcCRC(idatChunk.subarray(4, 8 + recompressed.length)), 8 + recompressed.length);

  const iendChunk = Buffer.alloc(12);
  iendChunk.writeUInt32BE(0, 0);
  iendChunk.write('IEND', 4, 'ascii');
  iendChunk.writeInt32BE(calcCRC(iendChunk.subarray(4, 8)), 8);

  fs.writeFileSync(outPath, Buffer.concat([header, idatChunk, iendChunk]));
  console.log('Saved optimized PNG:', outPath, (fs.statSync(outPath).size / 1024 / 1024).toFixed(2), 'MB');
}

compressPNG('assets/sheet-02/clipping-nino-dice-1961-hires.png', 'assets/sheet-02/clipping-nino-dice-1961-hires.png');
compressPNG('assets/sheet-02/clipping-trinchera-1961-hires.png', 'assets/sheet-02/clipping-trinchera-1961-hires.png');
