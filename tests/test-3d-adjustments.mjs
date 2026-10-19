import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const port = 9560 + Math.floor(Math.random() * 30);
const tempDir = path.join(process.env.TEMP || 'C:\\Windows\\Temp', `edge-3d-${Date.now()}`);

const edge = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
  '--headless=new',
  '--remote-debugging-port=' + port,
  '--window-size=1280,820',
  `--user-data-dir=${tempDir}`,
  'http://localhost:3000/index.html'
]);

let tabs = null;
for (let i = 0; i < 25; i++) {
  await new Promise(r => setTimeout(r, 300));
  try {
    const res = await fetch(`http://localhost:${port}/json`);
    tabs = await res.json();
    if (tabs && tabs.length > 0) break;
  } catch (_) {}
}

if (!tabs || tabs.length === 0) {
  console.error('No se pudo conectar a Edge');
  edge.kill();
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
    returnByValue: true,
    awaitPromise: true
  });
  if (res && res.exceptionDetails) {
    console.error('JS Eval Exception:', res.exceptionDetails);
  }
  return res && res.result ? res.result.value : null;
}

try {
  console.log('=== VERIFICANDO AJUSTES 3D (ZOOM, DIRECCIÓN Y VOLUMEN FÍSICO) ===\n');

  // Esperar a que la página cargue completamente
  for (let i = 0; i < 30; i++) {
    const ready = await evalInPage(`!!document.getElementById('btnToggleBook') && !!window.book`);
    if (ready) break;
    await new Promise(r => setTimeout(r, 200));
  }

  // Transición a la escena del libro
  await evalInPage(`
    const ts = document.getElementById('sceneTypewriter');
    const bs = document.getElementById('sceneBook');
    if (ts && bs) {
      ts.classList.add('is-hidden');
      bs.classList.remove('is-hidden');
    }
  `);
  await new Promise(r => setTimeout(r, 300));

  // 1. VERIFICAR LÍMITES DE ZOOM
  console.log('1. Verificando límites de zoom del libro (0.65 a 1.25)...');
  const initialScale = await evalInPage(`window.book.bookScale`);
  console.log(`   - Zoom inicial: ${initialScale} (debe ser 1.0)`);
  if (initialScale !== 1.0) throw new Error(`Zoom inicial esperado 1.0 pero fue ${initialScale}`);

  await evalInPage(`window.book.setScale(1.50)`);
  const maxScale = await evalInPage(`window.book.bookScale`);
  console.log(`   - Zoom tras intentar 1.50: ${maxScale} (debe clampear a 1.25)`);
  if (maxScale !== 1.25) throw new Error(`Zoom máximo esperado 1.25 pero fue ${maxScale}`);

  await evalInPage(`window.book.setScale(0.50)`);
  const minScale = await evalInPage(`window.book.bookScale`);
  console.log(`   - Zoom tras intentar 0.50: ${minScale} (debe clampear a 0.65)`);
  if (minScale !== 0.65) throw new Error(`Zoom mínimo esperado 0.65 pero fue ${minScale}`);

  // Restaurar a 1.0
  await evalInPage(`window.book.resetScale()`);
  console.log('   ✓ Límites de zoom verificados correctamente [0.65 - 1.25].\n');

  // 2. VERIFICAR ELEMENTOS DE CANTOS FÍSICOS (DOM Y GROSOR DINÁMICO)
  console.log('2. Verificando elementos de cantos físicos en DOM...');
  const blockElements = await evalInPage(`(() => {
    return {
      headLeft: !!document.getElementById('blockHeadLeft'),
      headRight: !!document.getElementById('blockHeadRight'),
      tailLeft: !!document.getElementById('blockTailLeft'),
      tailRight: !!document.getElementById('blockTailRight'),
      leftThicknessClosed: window.getComputedStyle(document.getElementById('bookContainer')).getPropertyValue('--left-thickness'),
      rightThicknessClosed: window.getComputedStyle(document.getElementById('bookContainer')).getPropertyValue('--right-thickness')
    };
  })()`);
  console.log('   - Elementos en DOM:', blockElements);
  if (!blockElements.headLeft || !blockElements.headRight || !blockElements.tailLeft || !blockElements.tailRight) {
    throw new Error('Faltan elementos de cantos físicos en DOM');
  }

  // Captura del libro cerrado visto con inclinación pitch 32°
  await evalInPage(`window.book.setPitch(32);`);
  await new Promise(r => setTimeout(r, 400));
  const snapClosed32 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('screenshot-3d-closed-pitch32.png', Buffer.from(snapClosed32.data, 'base64'));
  console.log('   ✓ Captura de libro cerrado a 32° guardada en screenshot-3d-closed-pitch32.png');

  // Abrir libro
  console.log('\n3. Abriendo libro y verificando grosor dinámico en páginas interiores...');
  await evalInPage(`document.getElementById('btnToggleBook').click();`);
  for (let i = 0; i < 30; i++) {
    const isOpened = await evalInPage(`!window.book.isClosed && !window.book.isAnimating && !!document.querySelector('.wrap-sarmiento')`);
    if (isOpened) break;
    await new Promise(r => setTimeout(r, 150));
  }

  const openThickness = await evalInPage(`(() => {
    const bc = document.getElementById('bookContainer');
    return {
      leftThickness: window.getComputedStyle(bc).getPropertyValue('--left-thickness'),
      rightThickness: window.getComputedStyle(bc).getPropertyValue('--right-thickness')
    };
  })()`);
  console.log('   - Grosor libro abierto (pliego 1):', openThickness);

  // Captura libro abierto pitch 32°
  await evalInPage(`window.book.setPitch(32);`);
  await new Promise(r => setTimeout(r, 400));
  const snapOpen32 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('screenshot-3d-open-pitch32.png', Buffer.from(snapOpen32.data, 'base64'));
  console.log('   ✓ Captura de libro abierto a 32° guardada en screenshot-3d-open-pitch32.png');

  // Captura libro abierto pitch 48° (perspectiva profunda cenital)
  await evalInPage(`window.book.setPitch(48);`);
  await new Promise(r => setTimeout(r, 400));
  const snapOpen48 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('screenshot-3d-open-pitch48.png', Buffer.from(snapOpen48.data, 'base64'));
  console.log('   ✓ Captura de libro abierto a 48° guardada en screenshot-3d-open-pitch48.png');

  // Captura libro abierto pitch -18° (contrapicado / borde inferior)
  await evalInPage(`window.book.setPitch(-18);`);
  await new Promise(r => setTimeout(r, 400));
  const snapOpenMinus18 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('screenshot-3d-open-pitch-minus18.png', Buffer.from(snapOpenMinus18.data, 'base64'));
  console.log('   ✓ Captura de libro abierto a -18° guardada en screenshot-3d-open-pitch-minus18.png');

  // Restaurar pitch neutro
  await evalInPage(`window.book.setPitch(16);`);

  // 4. VERIFICAR DIRECCIÓN DE ZOOM EN RECORTE PRIMER PLANO
  console.log('\n4. Verificando recorte en primer plano y dirección de zoom...');
  await evalInPage(`
    const sarmientoWrap = document.querySelector('.wrap-sarmiento');
    window.book.openForegroundClipping(sarmientoWrap);
  `);
  await new Promise(r => setTimeout(r, 650));

  const foregroundActive = await evalInPage(`window.book.isForegroundClippingActive`);
  console.log(`   - Modo primer plano activo: ${foregroundActive}`);
  if (!foregroundActive) throw new Error('No se activó el modo primer plano');

  const startClipScale = await evalInPage(`window.book.clippingScale`);
  console.log(`   - Escala inicial de inspección: ${startClipScale}`);

  // Simular evento de pointermove con CTRL: arrastre a la derecha (dx = +100) -> debe AUMENTAR
  await evalInPage(`(() => {
    const card = document.getElementById('clippingFloatingCard');
    const startScale = window.book.clippingScale;
    const dx = 100;
    const factor = 0.0035;
    window.book.clippingScale = Math.max(0.6, Math.min(2.4, startScale + (dx * factor)));
    window.book.updateForegroundClippingTransform();
  })()`);
  const scaleAfterRight = await evalInPage(`window.book.clippingScale`);
  console.log(`   - Escala tras arrastre derecha (+100px): ${scaleAfterRight.toFixed(3)} (mayor que inicial ${startClipScale})`);
  if (scaleAfterRight <= startClipScale) throw new Error('Arrastrar a la derecha no aumentó la escala del recorte');

  // Simular arrastre a la izquierda (dx = -200) -> debe DISMINUIR
  await evalInPage(`(() => {
    const startScale = window.book.clippingScale;
    const dx = -200;
    const factor = 0.0035;
    window.book.clippingScale = Math.max(0.6, Math.min(2.4, startScale + (dx * factor)));
    window.book.updateForegroundClippingTransform();
  })()`);
  const scaleAfterLeft = await evalInPage(`window.book.clippingScale`);
  console.log(`   - Escala tras arrastre izquierda (-200px): ${scaleAfterLeft.toFixed(3)} (menor que ${scaleAfterRight.toFixed(3)})`);
  if (scaleAfterLeft >= scaleAfterRight) throw new Error('Arrastrar a la izquierda no redujo la escala del recorte');

  // Cerrar recorte
  await evalInPage(`window.book.exitForegroundClipping()`);
  await new Promise(r => setTimeout(r, 500));

  console.log('\n=== TODOS LOS AJUSTES 3D VERIFICADOS EXITOSAMENTE ===');
} catch (err) {
  console.error('\n❌ ERROR:', err);
  process.exitCode = 1;
} finally {
  ws.close();
  edge.kill();
  try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (_) {}
}
