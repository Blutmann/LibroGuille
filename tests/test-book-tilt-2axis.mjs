import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const port = 9580 + Math.floor(Math.random() * 30);
const tempDir = path.join(process.env.TEMP || 'C:\\Windows\\Temp', `edge-tilt-${Date.now()}`);

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

async function captureScreenshot(filePath) {
  const res = await send('Page.captureScreenshot', { format: 'png' });
  if (res && res.data) {
    const buf = Buffer.from(res.data, 'base64');
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, buf);
    console.log(`   📸 Captura guardada: ${filePath}`);
  }
}

try {
  console.log('=== TEST DE INCLINACIÓN BIDIMENSIONAL (PITCH Y YAW) DEL LIBRO 3D ===\n');

  // Esperar a que la página cargue
  for (let i = 0; i < 30; i++) {
    const ready = await evalInPage(`!!document.getElementById('btnToggleBook') && !!window.book`);
    if (ready) break;
    await new Promise(r => setTimeout(r, 200));
  }

  // Transición directa a la escena del libro
  await evalInPage(`
    const ts = document.getElementById('sceneTypewriter');
    const bs = document.getElementById('sceneBook');
    if (ts && bs) {
      ts.classList.add('is-hidden');
      bs.classList.remove('is-hidden');
    }
  `);
  await new Promise(r => setTimeout(r, 300));

  // 1. ESTADO INICIAL
  console.log('1. Verificando estado inicial de inclinación...');
  const initialPitch = await evalInPage(`window.book.viewPitch`);
  const initialYaw = await evalInPage(`window.book.viewYaw`);
  console.log(`   - viewPitch inicial: ${initialPitch}° (esperado 16)`);
  console.log(`   - viewYaw inicial: ${initialYaw}° (esperado 0)`);
  if (initialPitch !== 16) throw new Error(`viewPitch inicial incorrecto: ${initialPitch}`);
  if (initialYaw !== 0) throw new Error(`viewYaw inicial incorrecto: ${initialYaw}`);

  const initialCssPitch = await evalInPage(`document.getElementById('bookPanContainer').style.getPropertyValue('--view-pitch')`);
  const initialCssYaw = await evalInPage(`document.getElementById('bookPanContainer').style.getPropertyValue('--view-yaw')`);
  console.log(`   - CSS --view-pitch: ${initialCssPitch}`);
  console.log(`   - CSS --view-yaw: ${initialCssYaw}`);

  // 2. MÉTODOS setPitch, setYaw, setTilt Y CLAMPING
  console.log('\n2. Verificando métodos setPitch, setYaw, setTilt y clamping...');
  await evalInPage(`window.book.setPitch(32)`);
  let curPitch = await evalInPage(`window.book.viewPitch`);
  let curYaw = await evalInPage(`window.book.viewYaw`);
  if (curPitch !== 32 || curYaw !== 0) throw new Error(`setPitch modificó yaw o no actualizó pitch correctamente`);
  console.log(`   ✓ setPitch(32) -> pitch=${curPitch}°, yaw=${curYaw}°`);

  await evalInPage(`window.book.setYaw(-25)`);
  curPitch = await evalInPage(`window.book.viewPitch`);
  curYaw = await evalInPage(`window.book.viewYaw`);
  if (curPitch !== 32 || curYaw !== -25) throw new Error(`setYaw modificó pitch o no actualizó yaw`);
  console.log(`   ✓ setYaw(-25) -> pitch=${curPitch}°, yaw=${curYaw}°`);

  await evalInPage(`window.book.setTilt(20, 35)`);
  curPitch = await evalInPage(`window.book.viewPitch`);
  curYaw = await evalInPage(`window.book.viewYaw`);
  if (curPitch !== 20 || curYaw !== 35) throw new Error(`setTilt no aplicó ambos ejes`);
  console.log(`   ✓ setTilt(20, 35) -> pitch=${curPitch}°, yaw=${curYaw}°`);

  // Clamping yaw: [-45, 45]
  await evalInPage(`window.book.setYaw(70)`);
  curYaw = await evalInPage(`window.book.viewYaw`);
  if (curYaw !== 45) throw new Error(`Yaw no clampeó a 45°: ${curYaw}`);
  await evalInPage(`window.book.setYaw(-80)`);
  curYaw = await evalInPage(`window.book.viewYaw`);
  if (curYaw !== -45) throw new Error(`Yaw no clampeó a -45°: ${curYaw}`);
  console.log(`   ✓ Límites de yaw respetados [-45°, 45°]`);

  // Clamping pitch: [-70, 70]
  await evalInPage(`window.book.setPitch(95)`);
  curPitch = await evalInPage(`window.book.viewPitch`);
  if (curPitch !== 70) throw new Error(`Pitch no clampeó a 70°: ${curPitch}`);
  await evalInPage(`window.book.setPitch(-95)`);
  curPitch = await evalInPage(`window.book.viewPitch`);
  if (curPitch !== -70) throw new Error(`Pitch no clampeó a -70°: ${curPitch}`);
  console.log(`   ✓ Límites de pitch respetados [-70°, 70°]`);

  // 3. SIMULACIÓN DE GESTO SHIFT + ARRASTRE
  console.log('\n3. Simulando interacción física SHIFT + arrastre con puntero...');
  // Restablecer a posición base
  await evalInPage(`window.book.setTilt(16, 0)`);

  // Simular PointerDown con SHIFT en el centro
  const pointerTestResult = await evalInPage(`
    (function() {
      const container = document.getElementById('bookPanContainer');
      const startX = 600;
      const startY = 400;

      // PointerDown con shiftKey
      const downEvt = new PointerEvent('pointerdown', {
        bubbles: true,
        cancelable: true,
        clientX: startX,
        clientY: startY,
        button: 0,
        buttons: 1,
        shiftKey: true
      });
      container.dispatchEvent(downEvt);

      const activeAfterDown = window.book.activeGesture;
      const isDraggingClass = container.classList.contains('is-dragging');

      // PointerMove 1: Solo vertical (dy = -50 -> subir el mouse debe aumentar el pitch)
      window.dispatchEvent(new PointerEvent('pointermove', {
        bubbles: true,
        clientX: startX,
        clientY: startY - 50,
        shiftKey: true
      }));
      const pitchAfterMove1 = window.book.viewPitch;
      const yawAfterMove1 = window.book.viewYaw;

      // PointerMove 2: Diagonal (dx = +80, dy = -60 -> mover der y arriba aumenta yaw y aumenta pitch)
      window.dispatchEvent(new PointerEvent('pointermove', {
        bubbles: true,
        clientX: startX + 80,
        clientY: startY - 60,
        shiftKey: true
      }));
      const pitchAfterMove2 = window.book.viewPitch;
      const yawAfterMove2 = window.book.viewYaw;

      // PointerUp
      window.dispatchEvent(new PointerEvent('pointerup', {
        bubbles: true,
        clientX: startX + 80,
        clientY: startY - 60,
        shiftKey: true
      }));
      const activeAfterUp = window.book.activeGesture;
      const isDraggingAfterUp = container.classList.contains('is-dragging');

      return {
        activeAfterDown,
        isDraggingClass,
        pitchAfterMove1,
        yawAfterMove1,
        pitchAfterMove2,
        yawAfterMove2,
        activeAfterUp,
        isDraggingAfterUp
      };
    })()
  `);

  console.log('   - Gesto activo tras pointerdown:', pointerTestResult.activeAfterDown);
  console.log('   - Clase is-dragging durante el arrastre:', pointerTestResult.isDraggingClass);
  console.log(`   - Tras dy=-50: pitch=${pointerTestResult.pitchAfterMove1.toFixed(1)}°, yaw=${pointerTestResult.yawAfterMove1.toFixed(1)}°`);
  console.log(`   - Tras diagonal (+80, -60): pitch=${pointerTestResult.pitchAfterMove2.toFixed(1)}°, yaw=${pointerTestResult.yawAfterMove2.toFixed(1)}°`);
  console.log('   - Gesto tras pointerup:', pointerTestResult.activeAfterUp);
  console.log('   - is-dragging tras pointerup:', pointerTestResult.isDraggingAfterUp);

  if (pointerTestResult.activeAfterDown !== 'VIEW_PITCH') throw new Error(`activeGesture debió ser VIEW_PITCH`);
  if (!pointerTestResult.isDraggingClass) throw new Error(`panContainer debió tener clase is-dragging`);
  if (pointerTestResult.pitchAfterMove1 <= 16) throw new Error(`Pitch debió aumentar al subir el mouse (dy < 0)`);
  if (Math.abs(pointerTestResult.yawAfterMove1) > 0.01) throw new Error(`Yaw no debió variar con movimiento puramente vertical`);
  if (pointerTestResult.yawAfterMove2 <= 0) throw new Error(`Yaw debió aumentar al mover hacia la derecha (dx > 0)`);
  if (pointerTestResult.activeAfterUp !== null) throw new Error(`activeGesture debió ser null tras pointerup`);
  if (pointerTestResult.isDraggingAfterUp) throw new Error(`is-dragging debió removerse tras pointerup`);
  console.log('   ✓ Interacción física SHIFT + arrastre bidimensional verificada exitosamente.');

  // 4. RESTABLECIMIENTO (RESET PAN Y PRESETS)
  console.log('\n4. Verificando restablecimiento con resetPan y Presets...');
  await evalInPage(`window.book.resetPan()`);
  await new Promise(r => setTimeout(r, 600));
  curPitch = await evalInPage(`window.book.viewPitch`);
  curYaw = await evalInPage(`window.book.viewYaw`);
  const curScale = await evalInPage(`window.book.bookScale`);
  console.log(`   - Tras resetPan: pitch=${curPitch}°, yaw=${curYaw}°, scale=${curScale}`);
  if (curPitch !== 16 || curYaw !== 0 || curScale !== 1.0) throw new Error(`resetPan no restauró pitch=16, yaw=0, scale=1.0`);

  // Presets
  await evalInPage(`window.book.setTilt(40, 25)`);
  await evalInPage(`window.book.setPresetPitch(32)`);
  await new Promise(r => setTimeout(r, 500));
  curPitch = await evalInPage(`window.book.viewPitch`);
  curYaw = await evalInPage(`window.book.viewYaw`);
  console.log(`   - Tras setPresetPitch(32): pitch=${curPitch}°, yaw=${curYaw}°`);
  if (curPitch !== 32 || curYaw !== 0) throw new Error(`Preset debió fijar pitch en 32 y restablecer yaw a 0`);

  // Preset -32° Contrapicado profundo
  await evalInPage(`
    const btnMinus32 = document.querySelector('.tilt-menu-item[data-pitch="-32"]');
    if (btnMinus32) btnMinus32.click();
    else window.book.setPresetPitch(-32);
  `);
  await new Promise(r => setTimeout(r, 500));
  curPitch = await evalInPage(`window.book.viewPitch`);
  const isSelectedMinus32 = await evalInPage(`
    (() => {
      const btn = document.querySelector('.tilt-menu-item[data-pitch="-32"]');
      return btn ? btn.classList.contains('is-selected') : false;
    })()
  `);
  const cssPitchMinus32 = await evalInPage(`document.getElementById('bookPanContainer').style.getPropertyValue('--view-pitch')`);
  console.log(`   - Tras preset -32°: pitch=${curPitch}°, css=${cssPitchMinus32}, is-selected=${isSelectedMinus32}`);
  if (curPitch !== -32) throw new Error(`Preset -32° falló al establecer pitch=-32`);
  if (!isSelectedMinus32) throw new Error(`El botón -32° debe tener clase is-selected`);
  console.log('   ✓ Preset -32° Contrapicado profundo verificado exitosamente.');
  console.log('   ✓ Presets y botón restablecer restauran los ángulos de referencia fielmente.');

  // 5. COMPATIBILIDAD CON RECORTE EN PRIMER PLANO
  console.log('\n5. Verificando compatibilidad con recortes periodísticos en primer plano...');
  // Abrir libro e ir a hoja 01/02
  await evalInPage(`window.book.openBook()`);
  await new Promise(r => setTimeout(r, 650));
  await evalInPage(`window.book.goToSheet(2)`);
  await new Promise(r => setTimeout(r, 400));

  // Ajustar inclinación 3D del libro
  await evalInPage(`window.book.setTilt(24, -18)`);

  // Abrir recorte
  const openedClipping = await evalInPage(`
    (function() {
      const wrap = document.querySelector('.clipping-card-wrap');
      if (!wrap) return false;
      window.book.openForegroundClipping(wrap);
      return true;
    })()
  `);
  if (!openedClipping) throw new Error('No se encontró recorte en la hoja 02');
  await new Promise(r => setTimeout(r, 500));

  const isFgActive = await evalInPage(`window.book.isForegroundClippingActive`);
  console.log(`   - Recorte en primer plano activo: ${isFgActive}`);
  if (!isFgActive) throw new Error('isForegroundClippingActive debió ser true');

  // Manipular inclinación del recorte independientemente
  await evalInPage(`
    window.book.clippingRotX = 15;
    window.book.clippingRotY = -20;
    window.book.clippingFloatingCard.style.transform = "rotateX(15deg) rotateY(-20deg)";
  `);

  // Cerrar recorte
  await evalInPage(`window.book.closeForegroundClipping()`);
  await new Promise(r => setTimeout(r, 550));

  // Verificar que el libro conservó su tilt original
  curPitch = await evalInPage(`window.book.viewPitch`);
  curYaw = await evalInPage(`window.book.viewYaw`);
  console.log(`   - Tras cerrar recorte: book pitch=${curPitch}°, yaw=${curYaw}°`);
  if (curPitch !== 24 || curYaw !== -18) throw new Error('El libro no conservó su inclinación tras cerrar el recorte');
  console.log('   ✓ Convivencia y separación impecable con el modo de primer plano.');

  // 6. CAPTURAS VISUALES DE VOLUMEN EN DISTINTOS ÁNGULOS COMBINADOS
  console.log('\n6. Capturando evidencias visuales del volumen 3D con inclinación bidimensional...');
  
  // Ángulo 1: Libro abierto con inclinación vertical alta y yaw positivo (ve lomo y lateral izquierdo)
  await evalInPage(`window.book.setTilt(32, 24)`);
  await new Promise(r => setTimeout(r, 300));
  await captureScreenshot('tests/screenshots/tilt-open-pitch32-yaw24.png');

  // Ángulo 2: Libro abierto con inclinación vertical suave y yaw negativo (ve canto derecho y estratificación)
  await evalInPage(`window.book.setTilt(18, -26)`);
  await new Promise(r => setTimeout(r, 300));
  await captureScreenshot('tests/screenshots/tilt-open-pitch18-yawNeg26.png');

  // Ángulo 3: Libro cerrado con inclinación diagonal
  await evalInPage(`window.book.closeBook()`);
  await new Promise(r => setTimeout(r, 650));
  await evalInPage(`window.book.setTilt(28, 22)`);
  await new Promise(r => setTimeout(r, 300));
  await captureScreenshot('tests/screenshots/tilt-closed-pitch28-yaw22.png');

  // Ángulo 4: Libro cerrado con yaw negativo (canto frontal derecho)
  await evalInPage(`window.book.setTilt(20, -24)`);
  await new Promise(r => setTimeout(r, 300));
  await captureScreenshot('tests/screenshots/tilt-closed-pitch20-yawNeg24.png');

  // Ángulo 5: Libro con inclinación contrapicado profundo -32°
  await evalInPage(`window.book.setTilt(-32, 0)`);
  await new Promise(r => setTimeout(r, 300));
  await captureScreenshot('tests/screenshots/tilt-pitchMinus32.png');

  // Restaurar estado base
  await evalInPage(`window.book.resetPan()`);
  await new Promise(r => setTimeout(r, 500));

  console.log('\n=== TODOS LOS TESTS DE INCLINACIÓN 2D PASARON CON ÉXITO ===');
} catch (err) {
  console.error('\n❌ ERROR EN EL TEST:', err.message);
  process.exitCode = 1;
} finally {
  ws.close();
  edge.kill();
  try {
    fs.rmSync(tempDir, { recursive: true, force: true });
  } catch (_) {}
}
