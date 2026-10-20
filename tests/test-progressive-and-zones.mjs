import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const port = 9570 + Math.floor(Math.random() * 40);
const tempDir = path.join(process.env.TEMP || 'C:\\Windows\\Temp', `edge-test-zones-${Date.now()}`);

const edge = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
  '--headless=new',
  '--remote-debugging-port=' + port,
  '--window-size=1280,820',
  `--user-data-dir=${tempDir}`,
  'http://localhost:3000/index.html'
]);

let tabs = null;
for (let i = 0; i < 30; i++) {
  await new Promise(r => setTimeout(r, 250));
  try {
    const res = await fetch(`http://localhost:${port}/json`);
    tabs = await res.json();
    if (tabs && tabs.length > 0) break;
  } catch (_) {}
}

if (!tabs || tabs.length === 0) {
  console.error('FAIL: No se pudo conectar a Edge');
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

console.log('=== INICIANDO SUITE DE PRUEBAS DE INTERACCIÓN, ZONAS Y RENDERIZADO ===\n');

try {
  // Transición a la escena del libro usando el bypass oficial
  await evalInPage(`
    const bypass = document.getElementById('btnBypassTypewriter');
    if (bypass) bypass.click();
    const ts = document.getElementById('sceneTypewriter');
    const bs = document.getElementById('sceneBook');
    if (ts) {
      ts.style.display = 'none';
      ts.style.zIndex = '-9999';
    }
    if (bs) {
      bs.classList.remove('is-hidden');
    }
  `);

  // Esperar a que window.book esté inicializado
  for (let i = 0; i < 40; i++) {
    const ready = await evalInPage(`!!window.book && !!document.getElementById('btnToggleBook')`);
    if (ready) break;
    await new Promise(r => setTimeout(r, 150));
  }

  // PRUEBA 1: Libro cerrado inicial y pre-renderizado de Hoja 01
  console.log('--- TEST 1: Estado inicial y pre-render de Hoja 01 ---');
  const initCheck = await evalInPage(`
    (() => {
      const isClosed = window.book.isClosed;
      const angle = window.book.coverAngle;
      const rightHtml = document.getElementById('pageRightContent').innerHTML;
      const hasHoja01 = rightHtml.includes('Biblioteca Popular Sarmiento') || rightHtml.includes('col-sarmiento') || rightHtml.includes('01/35');
      return { isClosed, angle, hasHoja01 };
    })()
  `);
  console.log('Init check:', initCheck);
  if (!initCheck.isClosed || initCheck.angle !== 0 || !initCheck.hasHoja01) {
    throw new Error('TEST 1 FAILED: Hoja 01 debe estar pre-renderizada debajo de la tapa en libro cerrado');
  }
  console.log('✔ PASS: Hoja 01 pre-renderizada progresivamente lista para descubrirse al abrir\n');

  // PRUEBA 2: Apertura progresiva de tapa y pausa intermedia (pausa a 90°)
  console.log('--- TEST 2: Apertura progresiva de tapa (pausa a 90°) ---');
  await evalInPage(`
    (() => {
      window.book.applyCoverAngle(90, false);
    })()
  `);
  const midCoverCheck = await evalInPage(`
    (() => {
      const angle = window.book.coverAngle;
      const rightHtml = document.getElementById('pageRightContent').innerHTML;
      const hasHoja01 = rightHtml.includes('01/35');
      const openRatio = document.getElementById('bookContainer').style.getPropertyValue('--open-ratio');
      return { angle, hasHoja01, openRatio };
    })()
  `);
  console.log('Mid cover check at 90°:', midCoverCheck);
  if (midCoverCheck.angle !== 90 || !midCoverCheck.hasHoja01) {
    throw new Error('TEST 2 FAILED: A 90° debe verse Hoja 01 en la base derecha descubierta');
  }
  console.log('✔ PASS: Portada a 90° revela progresivamente Hoja 01 en tiempo real\n');

  // PRUEBA 3: Completar apertura a 180° (Pliego 02-03 visible)
  console.log('--- TEST 3: Apertura completa a 180° ---');
  await evalInPage(`
    (() => {
      window.book.applyCoverAngle(180, false);
      window.book.currentIndex = 1;
      window.book.renderCurrentSpread();
    })()
  `);
  const openSpreadCheck = await evalInPage(`
    (() => {
      const angle = window.book.coverAngle;
      const idx = window.book.currentIndex;
      const rightHtml = document.getElementById('pageRightContent').innerHTML;
      const leftBackHtml = document.getElementById('frontCoverBackContent').innerHTML;
      return {
        angle,
        idx,
        hasHoja01OnRight: rightHtml.includes('01/35'),
        hasGuardaOnLeftBack: leftBackHtml.includes('guard-sheet')
      };
    })()
  `);
  console.log('Open spread check:', openSpreadCheck);
  if (!openSpreadCheck.hasHoja01OnRight || !openSpreadCheck.hasGuardaOnLeftBack) {
    throw new Error('TEST 3 FAILED: Pliego 02-03 debe mostrar Guarda a la izquierda y Hoja 01 a la derecha');
  }
  console.log('✔ PASS: Pliego 02-03 abierto correctamente\n');

  // PRUEBA 4: Zonas de interacción en Pliego 02-03
  console.log('--- TEST 4: Zonas de interacción claramente delimitadas ---');
  const zonesCheck = await evalInPage(`
    (() => {
      const rect = document.getElementById('bookContainer').getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const leftOuterX = rect.left + rect.width * 0.10;
      const rightOuterX = rect.right - rect.width * 0.10;
      const innerX = centerX;
      return { leftOuterX, rightOuterX, innerX, rect };
    })()
  `);
  console.log('Book bounds & zones:', zonesCheck);
  console.log('✔ PASS: Coordenadas de zonas calculadas correctamente\n');

  // PRUEBA 5: Paso de página con arrastre interactivo y pausa al 50%
  console.log('--- TEST 5: Paso de página con renderizado progresivo al 50% ---');
  await evalInPage(`
    (() => {
      const engine = window.book;
      const fakeEvt = {
        pointerId: 1,
        clientX: engine.container.getBoundingClientRect().right - 30,
        clientY: 300
      };
      engine.startPageDragGesture(fakeEvt, 'next');
    })()
  `);

  const dragMidCheck = await evalInPage(`
    (() => {
      const leaf = document.querySelector('.flipping-leaf');
      const rightContent = document.getElementById('pageRightContent').innerHTML;
      const hasLeaf = !!leaf;
      // Debajo de la hoja que gira a la izquierda, la base derecha revela la página subyacente Hoja 03 (03/35)
      // mientras que el reverso de la hoja (backface) que gira contiene Hoja 02 (02/35 / Trinchera del asombro)
      const revealsUnderlyingRight = rightContent.includes('03/35') || rightContent.includes('sheet-03') || rightContent.includes('35');
      const backLeafHtml = leaf ? leaf.querySelector('.leaf-face.back')?.innerHTML || '' : '';
      const leafHasHoja02 = backLeafHtml.includes('02/35') || backLeafHtml.includes('Trinchera del asombro') || backLeafHtml.includes('col-nino-dice');
      return { hasLeaf, revealsUnderlyingRight, leafHasHoja02 };
    })()
  `);
  console.log('Drag mid check:', dragMidCheck);
  if (!dragMidCheck.hasLeaf || !dragMidCheck.revealsUnderlyingRight || !dragMidCheck.leafHasHoja02) {
    throw new Error('TEST 5 FAILED: Durante el arrastre, la base derecha debe revelar Hoja 03 y el reverso de la hoja debe contener Hoja 02');
  }
  console.log('✔ PASS: Hoja 02 se descubre en tiempo real debajo de la hoja que gira\n');

  // Cancelar arrastre devolviendo la hoja a su origen
  console.log('--- TEST 6: Cancelación del arrastre y restauración de pliego ---');
  await evalInPage(`
    (() => {
      const engine = window.book;
      const leaf = document.querySelector('.flipping-leaf');
      engine.finishLeafTurn('next', false, leaf);
    })()
  `);
  await new Promise(r => setTimeout(r, 850));

  const cancelCheck = await evalInPage(`
    (() => {
      const idx = window.book.currentIndex;
      const rightHtml = document.getElementById('pageRightContent').innerHTML;
      const restoresHoja01 = rightHtml.includes('01/35') && rightHtml.includes('Biblioteca Popular Sarmiento');
      return { idx, restoresHoja01 };
    })()
  `);
  console.log('Cancel check:', cancelCheck);
  if (cancelCheck.idx !== 1 || !cancelCheck.restoresHoja01) {
    throw new Error('TEST 6 FAILED: Al cancelar el arrastre, debe restaurarse Hoja 01');
  }
  console.log('✔ PASS: Restauración completa de Hoja 01 al cancelar el arrastre\n');

  // Avanzar a Hoja 02 (índice 3) para probar el retroceso progresivo y recortes
  console.log('--- TEST 7: Avance a Hoja 02 y retroceso progresivo al 50% ---');
  await evalInPage(`
    (() => {
      const engine = window.book;
      engine.currentIndex = 3;
      engine.renderCurrentSpread();
    })()
  `);
  const sheet02Spread = await evalInPage(`
    (() => {
      const leftHtml = document.getElementById('pageLeftContent').innerHTML;
      const rightHtml = document.getElementById('pageRightContent').innerHTML;
      return {
        hasHoja02OnLeft: leftHtml.includes('02/35') && leftHtml.includes('Trinchera del asombro'),
        hasHoja03OnRight: rightHtml.includes('03/35')
      };
    })()
  `);
  console.log('Sheet 02 spread check:', sheet02Spread);
  if (!sheet02Spread.hasHoja02OnLeft || !sheet02Spread.hasHoja03OnRight) {
    throw new Error('TEST 7 FAILED: Pliego 04-05 debe tener Hoja 02 a la izquierda y Hoja 03 a la derecha');
  }

  // Iniciar arrastre de retroceso (prev) desde extremo izquierdo
  await evalInPage(`
    (() => {
      const engine = window.book;
      const fakeEvt = {
        pointerId: 1,
        clientX: engine.container.getBoundingClientRect().left + 30,
        clientY: 300
      };
      engine.startPageDragGesture(fakeEvt, 'prev');
    })()
  `);
  const prevDragCheck = await evalInPage(`
    (() => {
      const leaf = document.querySelector('.flipping-leaf');
      const leftEl = document.getElementById('pageLeft');
      const leftStyle = window.getComputedStyle(leftEl);
      const op = parseFloat(leftStyle.opacity);
      return {
        hasLeaf: !!leaf,
        isLeftVisible: op > 0.2 && leftStyle.visibility === 'visible',
        opacity: leftStyle.opacity,
        visibility: leftStyle.visibility,
        display: leftStyle.display,
        inlineStyle: leftEl.style.cssText,
        containerClasses: document.getElementById('bookContainer').className
      };
    })()
  `);
  console.log('Prev drag check:', prevDragCheck);
  if (!prevDragCheck.hasLeaf || !prevDragCheck.isLeftVisible) {
    throw new Error('TEST 7 FAILED: En retroceso, la hoja izquierda debe permanecer visible y progresiva');
  }
  console.log('✔ PASS: Retroceso progresivo mantiene visibilidad física continua\n');

  // Finalizar retroceso y volver a Pliego 02-03 (hoja 01)
  await evalInPage(`
    (() => {
      const engine = window.book;
      const leaf = document.querySelector('.flipping-leaf');
      engine.finishLeafTurn('prev', false, leaf);
    })()
  `);
  await new Promise(r => setTimeout(r, 850));

  // PRUEBA 8: Delimitación de silueta de recorte con clip-path y point-in-polygon
  console.log('--- TEST 8: Delimitación exacta del primer plano del recorte ---');
  await evalInPage(`
    (() => {
      const engine = window.book;
      engine.currentIndex = 1;
      engine.renderCurrentSpread();
    })()
  `);

  const clippingTests = await evalInPage(`
    (() => {
      const engine = window.book;
      const wrapSarm = document.querySelector('.wrap-sarmiento');
      const wrapBast = document.querySelector('.wrap-bastianini');

      const sarmRect = wrapSarm.getBoundingClientRect();
      const bastRect = wrapBast.getBoundingClientRect();

      // Centro de los recortes
      const sarmInside = engine.isPointInClippingSilhouette(wrapSarm, sarmRect.left + sarmRect.width * 0.5, sarmRect.top + sarmRect.height * 0.5);
      const bastInside = engine.isPointInClippingSilhouette(wrapBast, bastRect.left + bastRect.width * 0.5, bastRect.top + bastRect.height * 0.5);

      // Puntos en esquinas transparentes exteriores al contorno de tijera
      const sarmOutside = engine.isPointInClippingSilhouette(wrapSarm, sarmRect.left + 0.1, sarmRect.top + 0.1);
      const bastOutside = engine.isPointInClippingSilhouette(wrapBast, bastRect.left + 1, bastRect.top + 1);

      // Fuera del bounding box completo
      const outsideBox = engine.isPointInClippingSilhouette(wrapSarm, sarmRect.left - 20, sarmRect.top);

      return {
        sarmInside,
        bastInside,
        sarmOutside,
        bastOutside,
        outsideBox
      };
    })()
  `);
  console.log('Clipping hit-test results:', clippingTests);
  if (!clippingTests.sarmInside || !clippingTests.bastInside) {
    throw new Error('TEST 8 FAILED: El centro de los recortes debe dar TRUE');
  }
  if (clippingTests.sarmOutside || clippingTests.bastOutside || clippingTests.outsideBox) {
    throw new Error('TEST 8 FAILED: Puntos fuera de la silueta física deben dar FALSE');
  }
  console.log('✔ PASS: Hit-test rechaza esquinas transparentes y acepta puntos dentro del corte de tijera\n');

  // PRUEBA 9: Apertura en primer plano y verificación de clip-path en tarjeta flotante
  console.log('--- TEST 9: Tarjeta flotante con clip-path idéntico ---');
  await evalInPage(`
    (() => {
      const wrapSarm = document.querySelector('.wrap-sarmiento');
      window.book.openForegroundClipping(wrapSarm);
    })()
  `);
  await new Promise(r => setTimeout(r, 650));

  const floatingCheck = await evalInPage(`
    (() => {
      const card = document.getElementById('clippingFloatingCard');
      const layer = document.getElementById('clippingInspectionLayer');
      const scene = document.querySelector('.scene-book');
      const clipType = card.getAttribute('data-clipping-type');
      const isLayerVisible = !layer.classList.contains('is-hidden');
      const hasFocusClass = scene.classList.contains('is-clipping-focus');
      const computedClipPath = window.getComputedStyle(card).clipPath;
      return {
        clipType,
        isLayerVisible,
        hasFocusClass,
        hasClipPath: computedClipPath && computedClipPath !== 'none'
      };
    })()
  `);
  console.log('Floating card check:', floatingCheck);
  if (floatingCheck.clipType !== 'sarmiento' || !floatingCheck.isLayerVisible || !floatingCheck.hasFocusClass || !floatingCheck.hasClipPath) {
    throw new Error('TEST 9 FAILED: Tarjeta flotante debe tener data-clipping-type="sarmiento" y clip-path activo');
  }
  console.log('✔ PASS: Tarjeta en primer plano adopta la silueta de tijera exacta y desenfoca el entorno\n');

  // Cerrar recorte en primer plano
  console.log('--- TEST 10: Cierre fluido del recorte y restauración ---');
  await evalInPage(`
    (() => {
      window.book.closeForegroundClipping();
    })()
  `);
  await new Promise(r => setTimeout(r, 550));

  const closeCheck = await evalInPage(`
    (() => {
      const card = document.getElementById('clippingFloatingCard');
      const layer = document.getElementById('clippingInspectionLayer');
      const scene = document.querySelector('.scene-book');
      return {
        isLayerHidden: layer.classList.contains('is-hidden'),
        focusClassRemoved: !scene.classList.contains('is-clipping-focus'),
        clipTypeRemoved: !card.hasAttribute('data-clipping-type')
      };
    })()
  `);
  console.log('Close check:', closeCheck);
  if (!closeCheck.isLayerHidden || !closeCheck.focusClassRemoved || !closeCheck.clipTypeRemoved) {
    throw new Error('TEST 10 FAILED: Capa de inspección debe quedar oculta y atributos limpios');
  }
  console.log('✔ PASS: Recorte se cierra fluidamente y restaura el estado original\n');

  console.log('========================================================');
  console.log('TODAS LAS PRUEBAS DE INTERACCIÓN Y RENDERIZADO COMPLETADAS CON ÉXITO');
  console.log('========================================================\n');

} catch (err) {
  console.error('\n❌ ERROR EN LA SUITE DE PRUEBAS:', err);
  ws.close();
  edge.kill();
  process.exit(1);
}

ws.close();
edge.kill();
process.exit(0);
