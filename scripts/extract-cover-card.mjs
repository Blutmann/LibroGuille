import { spawn } from 'child_process';
import fs from 'fs';

async function locateCard() {
  const edge = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
    '--remote-debugging-port=9222',
    '--headless=new',
    '--disable-gpu',
    'http://localhost:3000'
  ]);
  await new Promise(r => setTimeout(r, 2000));
  try {
    const list = await (await fetch('http://127.0.0.1:9222/json/list')).json();
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

    const imgBuf = fs.readFileSync('C:/Users/Administrador/.gemini/antigravity/brain/6dd4e2fc-b09a-491a-9501-65066fe03a9a/.user_uploaded/media_1792385896862_efeb4bbe.jpg');
    const b64 = imgBuf.toString('base64');

    // Send base64 as argument
    const expr = `(async (base64) => {
      return new Promise((resolve) => {
        const img = document.createElement('img');
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
          
          let minX = canvas.width, maxX = 0, minY = canvas.height, maxY = 0;
          for (let y = 0; y < canvas.height; y++) {
            for (let x = 0; x < canvas.width; x++) {
              const idx = (y * canvas.width + x) * 4;
              const r = data[idx], g = data[idx+1], b = data[idx+2];
              // Yellow card criteria: R > 150, G > 140, B < 150, (R+G) > 2.3 * B
              if (r > 150 && g > 140 && b < 140 && (r + g) > 2.4 * b) {
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
              }
            }
          }
          const cropCanvas = document.createElement('canvas');
          cropCanvas.width = maxX - minX;
          cropCanvas.height = maxY - minY;
          const cropCtx = cropCanvas.getContext('2d');
          cropCtx.drawImage(canvas, minX, minY, cropCanvas.width, cropCanvas.height, 0, 0, cropCanvas.width, cropCanvas.height);
          const cropB64 = cropCanvas.toDataURL('image/png').split(',')[1];

          resolve({
            width: canvas.width,
            height: canvas.height,
            minX, maxX, minY, maxY,
            cardW: maxX - minX,
            cardH: maxY - minY,
            cropB64
          });
        };
        img.src = 'data:image/jpeg;base64,' + base64;
      });
    })("${b64}")`;

    const res = await req('Runtime.evaluate', {
      expression: expr,
      awaitPromise: true,
      returnByValue: true
    });

    const info = res.result.value;
    console.log('Card bounding box:', info.minX, info.minY, info.cardW, info.cardH);
    if (!fs.existsSync('assets/cover')) fs.mkdirSync('assets/cover', { recursive: true });
    fs.writeFileSync('assets/cover/cover-card-original.png', Buffer.from(info.cropB64, 'base64'));
    console.log('Saved assets/cover/cover-card-original.png');
    ws.close();
  } finally {
    edge.kill();
  }
}
locateCard();
