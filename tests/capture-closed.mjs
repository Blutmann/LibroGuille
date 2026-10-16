import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const port = 9325;
const edge = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
  '--headless=new',
  `--remote-debugging-port=${port}`,
  '--window-size=1280,800',
  `--user-data-dir=C:\\Users\\tblutman\\AppData\\Local\\Temp\\edge-cb-${Date.now()}`,
  'http://localhost:3000/index.html'
]);

await new Promise(r => setTimeout(r, 2200));
const res = await fetch(`http://localhost:${port}/json`);
const tabs = await res.json();
const tab = tabs.find(t => t.type === 'page');
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);

let msgId = 1;
function send(method, params = {}) {
  return new Promise(resolve => {
    const id = msgId++;
    const handler = (e) => {
      const d = JSON.parse(e.data);
      if (d.id === id) {
        ws.removeEventListener('message', handler);
        resolve(d.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

// Click bypass and wait 2.2s for transition
await send('Runtime.evaluate', { expression: "document.getElementById('btnBypassTypewriter').click()" });
await new Promise(r => setTimeout(r, 2200));

const ss = await send('Page.captureScreenshot', { format: 'png' });
const artDir = 'C:\\Users\\tblutman\\.gemini\\antigravity\\brain\\87775e60-e0ae-40a4-afe2-d956c7f38b76';
fs.writeFileSync('screenshot-p9-closed-book.png', Buffer.from(ss.data, 'base64'));
fs.writeFileSync(path.join(artDir, 'screenshot-p9-closed-book.png'), Buffer.from(ss.data, 'base64'));
console.log('Saved screenshot-p9-closed-book.png! Size: ' + ss.data.length);

ws.close();
edge.kill();
process.exit(0);
