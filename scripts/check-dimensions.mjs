import fs from 'fs';

function getDimensions(filePath) {
  const buf = fs.readFileSync(filePath);
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) {
    const width = buf.readUInt32BE(16);
    const height = buf.readUInt32BE(20);
    return { type: 'PNG', width, height };
  } else if (buf[0] === 0xFF && buf[1] === 0xD8) {
    let offset = 2;
    while (offset < buf.length) {
      if (buf[offset] !== 0xFF) break;
      const marker = buf[offset + 1];
      if (marker === 0xC0 || marker === 0xC2) {
        const height = buf.readUInt16BE(offset + 5);
        const width = buf.readUInt16BE(offset + 7);
        return { type: 'JPEG', width, height };
      }
      const len = buf.readUInt16BE(offset + 2);
      offset += 2 + len;
    }
  }
  return { type: 'Unknown' };
}

const files = [
  'C:\\Users\\tblutman\\.gemini\\antigravity\\brain\\6154f28f-17c5-4df1-97f6-8b285cfbc856\\.user_uploaded\\media_1792429053202_7bde71d7.jpg',
  'assets/sheet-02/sheet-02-original.png',
  'assets/sheet-02/clipping-nino-dice-1961.png',
  'assets/sheet-02/clipping-trinchera-1961.png',
  'assets/sheet-01/clipping-sarmiento-1951.png',
  'assets/sheet-01/clipping-bastianini-1959.png',
  'assets/sheet-01/sheet-01-composite.png'
];

for (const f of files) {
  if (fs.existsSync(f)) {
    console.log(f, getDimensions(f), 'Bytes:', fs.statSync(f).size);
  } else {
    console.log(f, 'NOT FOUND');
  }
}
