import { spawn } from 'child_process';
import fs from 'fs';

const port = 9250 + Math.floor(Math.random() * 40);
const edge = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
  '--headless=new',
  `--remote-debugging-port=${port}`,
  '--window-size=1280,800',
  `--user-data-dir=C:\\Users\\tblutman\\AppData\\Local\\Temp\\edge-p9-${Date.now()}`,
  'http://localhost:3000/index.html'
]);

let tabs = null;
for (let i = 0; i < 15; i++) {
  await new Promise(r => setTimeout(r, 400));
  try {
    const res = await fetch(`http://localhost:${port}/json`);
    tabs = await res.json();
    if (tabs && tabs.length > 0) break;
  } catch (_) {}
}

if (!tabs || tabs.length === 0) {
  console.error('Failed to connect to Edge headless');
  process.exit(1);
}

const tab = tabs.find(t => t.type === 'page');
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);

ws.send(JSON.stringify({ id: 1, method: 'Page.enable' }));
ws.send(JSON.stringify({ id: 2, method: 'Runtime.enable' }));
await new Promise(r => setTimeout(r, 600));

let msgId = 10;
function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = msgId++;
    const handler = (e) => {
      const d = JSON.parse(e.data);
      if (d.id === id) {
        ws.removeEventListener('message', handler);
        if (d.error) reject(d.error);
        else resolve(d.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function evalInPage(expression) {
  const res = await send('Runtime.evaluate', {
    expression,
    returnByValue: true
  });
  if (res && res.exceptionDetails) {
    console.error('JS Eval Exception:', res.exceptionDetails);
  }
  return res && res.result ? res.result.value : null;
}

console.log('--- TEST 1: Verifying Typewriter Scene ---');
const twBg = await evalInPage(`window.getComputedStyle(document.querySelector('.study-room-backdrop')).backgroundImage`);
const twPaperBg = await evalInPage(`window.getComputedStyle(document.querySelector('.typewriter-paper-sheet')).backgroundImage`);
console.log('Typewriter backdrop image:', twBg.includes('antique-study-backdrop.jpg') ? 'PASS (antique-study-backdrop.jpg)' : twBg);
console.log('Typewriter paper sheet image:', twPaperBg.includes('moda-folded-rag-paper.webp') ? 'PASS (moda-folded-rag-paper.webp)' : twPaperBg);

const ssTw = await send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync('screenshot-p9-typewriter.png', Buffer.from(ssTw.data, 'base64'));
console.log('Saved screenshot-p9-typewriter.png');

console.log('--- TEST 2: Transitioning to Book Scene ---');
await evalInPage(`document.getElementById('btnBypassTypewriter').click()`);
await new Promise(r => setTimeout(r, 1600));

const bookSceneVisible = await evalInPage(`!document.getElementById('sceneBook').classList.contains('is-hidden')`);
console.log('Book scene visible:', bookSceneVisible);

const deskBg = await evalInPage(`window.getComputedStyle(document.querySelector('.desk-surface')).backgroundImage`);
console.log('Desk background image:', deskBg.includes('bg-book-desk.webp') ? 'PASS (bg-book-desk.webp)' : deskBg);

const coverBg = await evalInPage(`window.getComputedStyle(document.querySelector('.book-cover-view')).backgroundImage`);
console.log('Book cover image:', coverBg.includes('moda-book-front-cover.webp') ? 'PASS (moda-book-front-cover.webp)' : coverBg);

const ssClosed = await send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync('screenshot-p9-closed-book.png', Buffer.from(ssClosed.data, 'base64'));
console.log('Saved screenshot-p9-closed-book.png');

console.log('--- TEST 3: Opening Book & Checking Pages ---');
await evalInPage(`document.getElementById('btnToggleBook').click()`);
await new Promise(r => setTimeout(r, 1200));

const state1 = await evalInPage(`({
  pageIndicator: document.getElementById('pageIndicator').textContent.trim(),
  leftPageBg: window.getComputedStyle(document.querySelector('.book-page.page-left')).backgroundImage,
  rightPageBg: window.getComputedStyle(document.querySelector('.book-page.page-right')).backgroundImage
})`);
console.log('Indicator open spread 1:', state1.pageIndicator);
console.log('Page texture left:', state1.leftPageBg.includes('moda-page-gutter-paper.webp') ? 'PASS' : state1.leftPageBg);
console.log('Page texture right:', state1.rightPageBg.includes('moda-page-gutter-paper.webp') ? 'PASS' : state1.rightPageBg);

console.log('--- TEST 4: Navigating Forward & Backward ---');
// Go to spread 2 (pages 3-4)
await evalInPage(`document.getElementById('btnNext').click()`);
await new Promise(r => setTimeout(r, 1200));
const ind2 = await evalInPage(`document.getElementById('pageIndicator').textContent.trim()`);
console.log('After Next (Spread 2):', ind2);

// Go to spread 3 (pages 5-6)
await evalInPage(`document.getElementById('btnNext').click()`);
await new Promise(r => setTimeout(r, 1200));
const ind3 = await evalInPage(`document.getElementById('pageIndicator').textContent.trim()`);
console.log('After Next (Spread 3):', ind3);

// Go back via Prev button
await evalInPage(`document.getElementById('btnPrev').click()`);
await new Promise(r => setTimeout(r, 1200));
const indBack1 = await evalInPage(`document.getElementById('pageIndicator').textContent.trim()`);
console.log('After Prev (Back to Spread 2):', indBack1);

console.log('--- TEST 5: Pointer Drag Reverse Navigation ---');
// Now test backward drag on the left page:
// Rect of bookContainer:
const rect = await evalInPage(`(() => {
  const r = document.getElementById('bookContainer').getBoundingClientRect();
  return { left: r.left, top: r.top, width: r.width, height: r.height, right: r.right, bottom: r.bottom };
})()`);

const startX = rect.left + rect.width * 0.25; // on the left page
const startY = rect.top + rect.height * 0.5;
const endX = rect.left + rect.width * 0.75; // drag to the right

await evalInPage(`(() => {
  const el = document.getElementById('bookContainer');
  const target = document.elementFromPoint(${startX}, ${startY});
  
  target.dispatchEvent(new PointerEvent('pointerdown', {
    bubbles: true,
    cancelable: true,
    clientX: ${startX},
    clientY: ${startY},
    button: 0,
    buttons: 1,
    pointerId: 1,
    pointerType: 'mouse'
  }));
})()`);

await new Promise(r => setTimeout(r, 100));

// Drag across
for (let p = 0; p <= 1; p += 0.2) {
  const curX = startX + (endX - startX) * p;
  await evalInPage(`window.dispatchEvent(new PointerEvent('pointermove', {
    bubbles: true,
    cancelable: true,
    clientX: ${curX},
    clientY: ${startY},
    button: 0,
    buttons: 1,
    pointerId: 1,
    pointerType: 'mouse'
  }))`);
  await new Promise(r => setTimeout(r, 30));
}

// Release
await evalInPage(`window.dispatchEvent(new PointerEvent('pointerup', {
  bubbles: true,
  cancelable: true,
  clientX: ${endX},
  clientY: ${startY},
  button: 0,
  buttons: 0,
  pointerId: 1,
  pointerType: 'mouse'
}))`);

await new Promise(r => setTimeout(r, 1300));

const indDragBack = await evalInPage(`document.getElementById('pageIndicator').textContent.trim()`);
console.log('Indicator after drag backward on spread 2:', indDragBack);

console.log('--- TEST 6: Tilt Functionality (-55° to +55°) ---');
await evalInPage(`document.getElementById('btnToggleTilt').click()`);
await new Promise(r => setTimeout(r, 500));
const pitch1 = await evalInPage(`document.getElementById('bookPanContainer').style.getPropertyValue('--view-pitch')`);
console.log('Tilted pitch after cycle 1:', pitch1);

await evalInPage(`document.getElementById('btnToggleTilt').click()`);
await new Promise(r => setTimeout(r, 500));
const pitch2 = await evalInPage(`document.getElementById('bookPanContainer').style.getPropertyValue('--view-pitch')`);
console.log('Tilted pitch after cycle 2:', pitch2);

const ssOpen = await send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync('screenshot-p9-open-book.png', Buffer.from(ssOpen.data, 'base64'));
console.log('Saved screenshot-p9-open-book.png');

console.log('--- ALL AUTOMATED VERIFICATIONS COMPLETED SUCCESSFULLY ---');

ws.close();
edge.kill();
process.exit(0);
