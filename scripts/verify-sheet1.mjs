import { spawn } from 'child_process';
import fs from 'fs';

async function verifySheet1() {
  const edge = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
    '--remote-debugging-port=9224',
    '--headless=new',
    '--disable-gpu',
    '--window-size=1280,800',
    'http://localhost:3000'
  ]);
  await new Promise(r => setTimeout(r, 2000));
  try {
    const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
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

    // Bypass typewriter
    await req('Runtime.evaluate', {
      expression: `
        const btn = document.getElementById('btnBypassTypewriter');
        if (btn) btn.click();
      `
    });

    await new Promise(r => setTimeout(r, 1200));

    // Go to sheet 1
    await req('Runtime.evaluate', {
      expression: `
        if (window.book && typeof window.book.goToPage === 'function') {
          window.book.goToPage(1);
        }
      `
    });

    await new Promise(r => setTimeout(r, 1500));

    const shot = await req('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('temp-sheet1-screenshot.png', Buffer.from(shot.data, 'base64'));
    console.log('Saved temp-sheet1-screenshot.png');

    ws.close();
  } finally {
    edge.kill();
  }
}

verifySheet1();
