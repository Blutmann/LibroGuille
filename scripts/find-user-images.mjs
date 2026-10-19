import fs from 'fs';
import path from 'path';
import os from 'os';

const dirs = [
  path.join(os.homedir(), 'Downloads'),
  path.join(os.homedir(), 'Pictures'),
  path.join(os.homedir(), 'Desktop'),
  path.join(os.homedir(), 'Documents')
];

for (const d of dirs) {
  if (fs.existsSync(d)) {
    console.log('=== ' + d + ' ===');
    try {
      const files = fs.readdirSync(d);
      for (const f of files) {
        const full = path.join(d, f);
        try {
          const st = fs.statSync(full);
          if (st.isFile() && /\.(jpg|jpeg|png|webp|heic|tif|tiff)$/i.test(f)) {
            console.log(f, (st.size / 1024 / 1024).toFixed(2) + ' MB', st.mtime.toISOString());
          }
        } catch (_) {}
      }
    } catch (e) {
      console.log('Error reading', d, e.message);
    }
  }
}
