import fs from 'fs';
import path from 'path';
import os from 'os';

function search(dir, depth = 0) {
  if (depth > 5) return;
  try {
    const list = fs.readdirSync(dir);
    for (const item of list) {
      if (item === 'node_modules' || item === '.git') continue;
      const full = path.join(dir, item);
      try {
        const st = fs.statSync(full);
        if (st.isDirectory()) {
          search(full, depth + 1);
        } else if (/\.(jpe?g|png|webp)$/i.test(item)) {
          if (/976|sarmiento|bastianini|harispe|hoja\s*0?1/i.test(item)) {
            console.log(full, (st.size / 1024).toFixed(1) + ' KB');
          }
        }
      } catch (_) {}
    }
  } catch (_) {}
}

const targets = [
  os.tmpdir(),
  path.join(os.homedir(), 'Downloads'),
  path.join(os.homedir(), 'Documents'),
  path.join(os.homedir(), 'Pictures'),
  path.join(os.homedir(), 'Desktop')
];

for (const t of targets) {
  console.log('Searching', t);
  search(t);
}
