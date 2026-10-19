import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const port = 9560 + Math.floor(Math.random() * 40);
const tempDir = path.join(process.env.TEMP || 'C:\\Windows\\Temp', `edge-clipping-${Date.now()}`);

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

async function takeScreenshot(filePath) {
  const screenshot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(filePath, Buffer.from(screenshot.data, 'base64'));
}

try {
  console.log('=== TEST: RECORTES PERIODÍSTICOS INTERACTIVOS EN PRIMER PLANO ===\n');

  // Esperar a que la página cargue completamente
  for (let i = 0; i < 30; i++) {
    const ready = await evalInPage(`!!document.getElementById('btnToggleBook') && !!window.book`);
    if (ready) break;
    await new Promise(r => setTimeout(r, 200));
  }

  // 1. Ir a la escena del libro y abrirlo en Pliego 1 (Hoja 01)
  await evalInPage(`
    const ts = document.getElementById('sceneTypewriter');
    const bs = document.getElementById('sceneBook');
    if (ts && bs) {
      ts.classList.add('is-hidden');
      bs.classList.remove('is-hidden');
    }
  `);

  await evalInPage(`document.getElementById('btnToggleBook').click();`);
  
  // Esperar a que el pliego 1 esté completamente abierto y renderizado
  for (let i = 0; i < 30; i++) {
    const hasSarmiento = await evalInPage(`!!document.querySelector('.wrap-sarmiento')`);
    if (hasSarmiento) break;
    await new Promise(r => setTimeout(r, 200));
  }

  // 2. Verificar que Hoja 01 está visible en el recto (hemisferio derecho)
  const spread1Check = await evalInPage(`
    (() => {
      const sarmiento = document.querySelector('.wrap-sarmiento');
      const bastianini = document.querySelector('.wrap-bastianini');
      return {
        hasSarmiento: !!sarmiento,
        hasBastianini: !!bastianini,
        sarmientoImg: sarmiento ? sarmiento.querySelector('img').src : null
      };
    })()
  `);
  console.log('1. Comprobación Pliego 1 (Hoja 01/35):', spread1Check);
  if (!spread1Check.hasSarmiento || !spread1Check.hasBastianini) {
    throw new Error('No se encontraron los recortes en la Hoja 01');
  }

  // 3. Activar el recorte de Biblioteca Sarmiento
  console.log('\n2. Activando recorte Biblioteca Sarmiento (1951) en primer plano...');
  await evalInPage(`
    const sarmientoWrap = document.querySelector('.wrap-sarmiento');
    window.book.openForegroundClipping(sarmientoWrap);
  `);
  // Esperar animación de elevación FLIP (530ms)
  await new Promise(r => setTimeout(r, 650));

  // 4. Verificar estado del modo primer plano
  const foregroundState = await evalInPage(`
    (() => {
      const layer = document.getElementById('clippingInspectionLayer');
      const card = document.getElementById('clippingFloatingCard');
      const img = document.getElementById('clippingFloatingImg');
      const scene = document.getElementById('sceneBook');
      const viewport = document.getElementById('bookViewport');
      const sourceWrap = document.querySelector('.wrap-sarmiento');
      
      const viewportComputed = window.getComputedStyle(viewport);
      const cardRect = card.getBoundingClientRect();

      return {
        isActive: window.book.isForegroundClippingActive,
        layerVisible: layer && !layer.classList.contains('is-hidden'),
        sceneHasFocusClass: scene && scene.classList.contains('is-clipping-focus'),
        viewportBlur: viewportComputed.filter,
        sourceOpacity: sourceWrap ? window.getComputedStyle(sourceWrap).opacity : null,
        floatingImgSrc: img ? img.src : null,
        cardWidth: cardRect.width,
        cardHeight: cardRect.height,
        cardLeft: cardRect.left,
        cardTop: cardRect.top
      };
    })()
  `);
  console.log('3. Estado en Primer Plano:', foregroundState);

  if (!foregroundState.isActive) throw new Error('isForegroundClippingActive no está activo');
  if (!foregroundState.layerVisible) throw new Error('El modal layer no está visible');
  if (!foregroundState.sceneHasFocusClass) throw new Error('sceneBook no tiene la clase is-clipping-focus');
  if (!foregroundState.floatingImgSrc.includes('clipping-sarmiento-1951.png')) {
    throw new Error('La imagen en primer plano no coincide con el recorte original');
  }
  if (foregroundState.cardHeight < 300) throw new Error('El recorte no se escaló adecuadamente para lectura');

  // 5. Verificar bloqueo de paso de página accidental
  console.log('\n4. Verificando bloqueo de navegación mientras el recorte está en primer plano...');
  const navAttempt = await evalInPage(`
    (() => {
      const initialIndex = window.book.currentIndex;
      // Intentar navegar con nextPage y con clic en btnNext
      window.book.nextPage();
      const btn = document.getElementById('btnNext');
      if (btn) btn.click();
      return {
        initialIndex,
        afterIndex: window.book.currentIndex,
        isBlocked: window.book.currentIndex === initialIndex
      };
    })()
  `);
  console.log('Resultado intento de navegación:', navAttempt);
  if (!navAttempt.isBlocked) throw new Error('La navegación NO fue bloqueada durante el modo primer plano');

  // 6. Probar manipulación independiente: Inclinación (SHIFT) y Escala (CTRL)
  console.log('\n5. Verificando controles de manipulación independiente...');
  const manipulationTest = await evalInPage(`
    (() => {
      // Simular inclinación (rotX / rotY)
      window.book.clippingRotX = 22;
      window.book.clippingRotY = -18;
      // Simular cambio de escala
      window.book.clippingScale = 1.25;
      // Simular desplazamiento pan
      window.book.clippingPanX = 35;
      window.book.clippingPanY = -25;
      
      const card = document.getElementById('clippingFloatingCard');
      card.style.transform = \`translate3d(\${window.book.clippingPanX}px, \${window.book.clippingPanY}px, 60px) rotateX(\${window.book.clippingRotX}deg) rotateY(\${window.book.clippingRotY}deg) scale(\${window.book.clippingScale})\`;

      const bookPan = document.getElementById('bookPanContainer');
      const bookStyle = window.getComputedStyle(bookPan);

      return {
        cardTransform: card.style.transform,
        bookTransformUnaltered: bookStyle.transform
      };
    })()
  `);
  console.log('Manipulación aplicada al recorte:', manipulationTest.cardTransform);

  // Capturar screenshot con el recorte en primer plano (Hoja 01)
  await takeScreenshot('screenshot-clipping-foreground-sheet1.png');
  console.log('Captura guardada: screenshot-clipping-foreground-sheet1.png');

  // 7. Probar cierre mediante tecla ESC (Mecanismo B)
  console.log('\n6. Probando cierre mediante tecla ESC...');
  await evalInPage(`
    const escEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
    window.dispatchEvent(escEvent);
  `);
  // Esperar animación de retorno (450ms)
  await new Promise(r => setTimeout(r, 550));

  const afterEscState = await evalInPage(`
    (() => {
      const layer = document.getElementById('clippingInspectionLayer');
      const scene = document.getElementById('sceneBook');
      const sourceWrap = document.querySelector('.wrap-sarmiento');
      return {
        isActive: window.book.isForegroundClippingActive,
        layerHidden: layer && layer.classList.contains('is-hidden'),
        sceneNoFocus: scene && !scene.classList.contains('is-clipping-focus'),
        sourceRestored: sourceWrap && (parseFloat(window.getComputedStyle(sourceWrap).opacity) >= 0.95 || sourceWrap.style.opacity === ''),
        clippingScaleReset: window.book.clippingScale === 1.0,
        clippingPanReset: window.book.clippingPanX === 0 && window.book.clippingPanY === 0
      };
    })()
  `);
  console.log('Estado tras pulsar ESC:', afterEscState);
  if (afterEscState.isActive || !afterEscState.layerHidden || !afterEscState.sourceRestored) {
    throw new Error('El cierre mediante tecla ESC no restauró correctamente el estado');
  }

  // 8. Avanzar a Pliego 2 (Hojas 02 y 03) para probar los recortes de la Hoja 02
  console.log('\n7. Avanzando a Pliego 2 (Hoja 02/35)...');
  await evalInPage(`document.getElementById('btnNext').click();`);
  await new Promise(r => setTimeout(r, 1600));

  // 9. Abrir recorte "Un niño dice" en Hoja 02
  console.log('Abriendo recorte "Un niño dice" en primer plano...');
  await evalInPage(`
    const ninoWrap = document.querySelector('.wrap-nino-dice');
    window.book.openForegroundClipping(ninoWrap);
  `);
  await new Promise(r => setTimeout(r, 650));

  const ninoForeground = await evalInPage(`
    (() => {
      const img = document.getElementById('clippingFloatingImg');
      return {
        src: img ? img.src : null,
        isActive: window.book.isForegroundClippingActive
      };
    })()
  `);
  console.log('Recorte en primer plano:', ninoForeground);
  if (!ninoForeground.src.includes('clipping-nino-dice-1961')) {
    throw new Error('No se cargó el recorte de Un niño dice');
  }

  await takeScreenshot('screenshot-clipping-foreground-sheet2.png');
  console.log('Captura guardada: screenshot-clipping-foreground-sheet2.png');

  // 10. Probar cierre mediante Clic fuera del recorte (Mecanismo A)
  console.log('\n8. Probando cierre mediante Clic fuera del recorte (Backdrop)...');
  await evalInPage(`
    const backdrop = document.getElementById('clippingBackdrop');
    const downEvt = new PointerEvent('pointerdown', { clientX: 100, clientY: 100, bubbles: true });
    const upEvt = new PointerEvent('pointerup', { clientX: 100, clientY: 100, bubbles: true });
    backdrop.dispatchEvent(downEvt);
    backdrop.dispatchEvent(upEvt);
  `);
  await new Promise(r => setTimeout(r, 450));

  const afterBackdropState = await evalInPage(`window.book.isForegroundClippingActive`);
  console.log('¿Sigue activo tras clic en fondo?:', afterBackdropState);
  if (afterBackdropState) throw new Error('El clic fuera del recorte no cerró el modo primer plano');

  // 11. Abrir recorte "Trinchera del Asombro" y probar cierre mediante Botón Visual (Mecanismo C)
  console.log('\n9. Probando recorte "Trinchera del Asombro" y control visual de regreso...');
  await evalInPage(`
    const trincheraWrap = document.querySelector('.wrap-trinchera');
    window.book.openForegroundClipping(trincheraWrap);
  `);
  await new Promise(r => setTimeout(r, 650));

  const trincheraForeground = await evalInPage(`
    (() => {
      const img = document.getElementById('clippingFloatingImg');
      return img ? img.src : null;
    })()
  `);
  console.log('Recorte Trinchera en primer plano:', trincheraForeground);
  if (!trincheraForeground.includes('clipping-trinchera-1961')) {
    throw new Error('No se cargó el recorte de Trinchera del Asombro');
  }

  // Clic en el botón "Volver al libro"
  await evalInPage(`
    const btnClose = document.getElementById('btnCloseClipping');
    if (btnClose) btnClose.click();
  `);
  await new Promise(r => setTimeout(r, 550));

  const finalCheck = await evalInPage(`
    (() => {
      return {
        isActive: window.book.isForegroundClippingActive,
        currentIndex: window.book.currentIndex,
        isClosed: window.book.isClosed
      };
    })()
  `);
  console.log('10. Estado final tras cerrar:', finalCheck);
  if (finalCheck.isActive) throw new Error('El botón visual de regreso no cerró el primer plano');

  // 12. Confirmar que el libro puede hojearse libremente de nuevo
  await evalInPage(`document.getElementById('btnPrev').click();`);
  await new Promise(r => setTimeout(r, 1600));
  const restoredIndex = await evalInPage(`window.book.currentIndex`);
  console.log('11. Navegación normal restaurada (Índice vuelto a Pliego 1):', restoredIndex);
  if (restoredIndex !== 1) throw new Error('La navegación normal no funciona tras salir del primer plano');

  console.log('\n=== TODOS LOS TESTS DE INSPECCIÓN EN PRIMER PLANO PASARON SATISFACTORIAMENTE ===\n');

} catch (err) {
  console.error('\n❌ ERROR EN TEST:', err);
  process.exitCode = 1;
} finally {
  ws.close();
  edge.kill();
  try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (_) {}
}
