import { spawn } from 'child_process';
import fs from 'fs';

async function capture() {
  const edge = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
    '--remote-debugging-port=9223',
    '--headless=new',
    '--disable-gpu',
    '--window-size=1280,800',
    'http://localhost:3000'
  ]);
  await new Promise(r => setTimeout(r, 2000));
  try {
    const list = await (await fetch('http://127.0.0.1:9223/json/list')).json();
    const p = list.find(x => x.url.includes('localhost:3000')) || list[0];
    const ws = new WebSocket(p.webSocketDebuggerUrl);
    let id = 1;
    const req = (method, params = {}) => new Promise((resolve) => {
      const cur = id++;
      const handler = (e) => {
        const m = JSON.parse(e.data);
        if (m.id === cur) {
          ws.removeEventListener('message', handler);
          resolve(m.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id: cur, method, params }));
    });
    await new Promise(r => ws.onopen = r);

    // Click bypass button to enter book scene
    await req('Runtime.evaluate', {
      expression: `
        const btn = document.getElementById('btnBypassTypewriter');
        if (btn) btn.click();
      `
    });

    await new Promise(r => setTimeout(r, 1200));

    // Ensure we are on cover view (pageClosed)
    await req('Runtime.evaluate', {
      expression: `
        if (window.book && typeof window.book.goToPage === 'function') {
          window.book.goToPage(0);
        }
      `
    });

    await new Promise(r => setTimeout(r, 1000));

    // Capture screenshot of the cover card specifically and full screen
    const fullShot = await req('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('temp-cover-screenshot.png', Buffer.from(fullShot.data, 'base64'));
    console.log('Saved temp-cover-screenshot.png');

    // Also get clip rect of .cover-pocket-sleeve
    const clipRes = await req('Runtime.evaluate', {
      expression: `(() => {
        const el = document.querySelector('.cover-pocket-sleeve');
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { x: r.x, y: r.y, width: r.width, height: r.height, scale: 1 };
      })()`,
      returnByValue: true
    });

    if (clipRes.result.value) {
      const c = clipRes.result.value;
      const cardShot = await req('Page.captureScreenshot', {
        format: 'png',
        clip: { x: Math.max(0, c.x - 20), y: Math.max(0, c.y - 20), width: c.width + 40, height: c.height + 40, scale: 1 }
      });
      fs.writeFileSync('temp-card-crop.png', Buffer.from(cardShot.data, 'base64'));
      console.log('Saved temp-card-crop.png');
    }

    ws.close();
  } finally {
    edge.kill();
  }
}

capture();
