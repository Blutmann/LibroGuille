import { spawn } from 'child_process';
import fs from 'fs';

const viewports = [
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 375, height: 667 }
];

async function captureAll(prefix) {
  for (const vp of viewports) {
    const port = 9310 + Math.floor(Math.random() * 50);
    const edge = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
      '--headless=new',
      `--remote-debugging-port=${port}`,
      `--window-size=${vp.width},${vp.height}`,
      `--user-data-dir=C:\\Users\\Administrador\\AppData\\Local\\Temp\\edge-ss-${Date.now()}`,
      'http://localhost:3000/index.html'
    ]);

    let tabs = null;
    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 250));
      try {
        const res = await fetch(`http://localhost:${port}/json`);
        tabs = await res.json();
        if (tabs && tabs.length > 0) break;
      } catch (_) {}
    }
    const tab = tabs.find(t => t.type === 'page');
    const ws = new WebSocket(tab.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    let msgId = 1;
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

    await send('Page.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: 1,
      mobile: vp.name === 'mobile'
    });
    await new Promise(r => setTimeout(r, 600));

    // Capture typewriter
    const ss1 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${prefix}-${vp.name}-typewriter.png`, Buffer.from(ss1.data, 'base64'));

    // Transition to book
    await send('Runtime.evaluate', { expression: 'document.getElementById("btnBypassTypewriter").click()' });
    await new Promise(r => setTimeout(r, 1200));

    // Capture book
    const ss2 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${prefix}-${vp.name}-book.png`, Buffer.from(ss2.data, 'base64'));

    edge.kill();
    console.log(`Captured ${prefix}: ${vp.name} (${vp.width}x${vp.height})`);
  }
}

const prefix = process.argv[2] || 'ss-before';
await captureAll(prefix);
