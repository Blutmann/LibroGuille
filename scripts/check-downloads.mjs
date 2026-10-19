import fs from 'fs';
import path from 'path';
import os from 'os';

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

const p1 = path.join(os.homedir(), 'Downloads', 'IMG_9765.JPEG');
const p2 = path.join(os.homedir(), 'Downloads', 'IMG_9767.JPEG');

console.log('IMG_9765:', getDimensions(p1), fs.statSync(p1).size);
console.log('IMG_9767:', getDimensions(p2), fs.statSync(p2).size);
