import { spawn } from 'child_process';
import fs from 'fs';

const port = 9230 + Math.floor(Math.random() * 50);
const edge = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
  '--headless=new',
  `--remote-debugging-port=${port}`,
  '--window-size=1280,800',
  `--user-data-dir=C:\\Users\\tblutman\\AppData\\Local\\Temp\\edge-ss-${Date.now()}`,
  'http://localhost:3000/index.html'
]);

let tabs = null;
for (let i = 0; i < 10; i++) {
  await new Promise(r => setTimeout(r, 400));
  try {
    const res = await fetch(`http://localhost:${port}/json`);
    tabs = await res.json();
    if (tabs && tabs.length > 0) break;
  } catch (_) {}
}
const tab = tabs.find(t => t.type === 'page');
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);

ws.send(JSON.stringify({ id: 1, method: 'Page.enable' }));
await new Promise(r => setTimeout(r, 600));

// 1. Capture typewriter scene
let msgId = 2;
function send(method, params = {}) {
  return new Promise(res => {
    const id = msgId++;
    const handler = (e) => {
      const d = JSON.parse(e.data);
      if (d.id === id) {
        ws.removeEventListener('message', handler);
        res(d.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

const ss1 = await send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync('screenshot-typewriter-v2.png', Buffer.from(ss1.data, 'base64'));
console.log('Saved screenshot-typewriter-v2.png');

// 2. Click bypass button to transition to book scene
await send('Runtime.evaluate', {
  expression: `document.getElementById('btnBypassTypewriter').click()`
});

await new Promise(r => setTimeout(r, 1600));

// 3. Capture book scene closed
const ss2 = await send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync('screenshot-book-v2.png', Buffer.from(ss2.data, 'base64'));
console.log('Saved screenshot-book-v2.png');

// 4. Open book to pages 1 & 2
await send('Runtime.evaluate', {
  expression: `document.getElementById('btnToggleBook').click()`
});

await new Promise(r => setTimeout(r, 1000));

const ss3 = await send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync('screenshot-book-open-v2.png', Buffer.from(ss3.data, 'base64'));
console.log('Saved screenshot-book-open-v2.png');

ws.close();
edge.kill();
