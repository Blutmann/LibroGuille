import fs from 'fs';
import path from 'path';
import os from 'os';

function searchDir(dir, depth = 0) {
  if (depth > 6) return;
  try {
    const list = fs.readdirSync(dir);
    for (const item of list) {
      if (item.startsWith('.') || item === 'AppData' || item === 'node_modules' || item === 'Windows') continue;
      const full = path.join(dir, item);
      try {
        const st = fs.statSync(full);
        if (st.isDirectory()) {
          searchDir(full, depth + 1);
        } else if (/\.(jpe?g|png|heic)$/i.test(item)) {
          if (/IMG_|sheet|hoja|cuaderno|harispe|guille|sarmiento|bastianini|97[0-9]{2}/i.test(item) || st.size > 2000000) {
            console.log(full, (st.size / 1024 / 1024).toFixed(2) + ' MB');
          }
        }
      } catch (_) {}
    }
  } catch (_) {}
}

searchDir(os.homedir());
