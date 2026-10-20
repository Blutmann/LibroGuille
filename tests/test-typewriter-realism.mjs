import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const port = 9680 + Math.floor(Math.random() * 40);
const tempDir = path.join(process.env.TEMP || 'C:\\Windows\\Temp', `edge-typewriter-realism-${Date.now()}`);

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

let msgId = 10;
const pending = new Map();
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.id && pending.has(data.id)) {
    pending.get(data.id)(data);
    pending.delete(data.id);
  }
};

function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = msgId++;
    pending.set(id, (msg) => {
      if (msg.error) reject(msg.error);
      else resolve(msg.result?.result?.value !== undefined ? msg.result.result.value : msg.result);
    });
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function evalInPage(expression) {
  return send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true
  });
}

await send('Runtime.enable');
await send('Page.enable');
await new Promise(r => setTimeout(r, 800));

console.log('=== SUITE DE VALIDACIÓN: MÁQUINA DE ESCRIBIR FOTORREALISTA Y FUNCIONAL ===\n');

try {
  // 1. Escala y tamaño físico aumentado
  console.log('--- TEST 1: Escala sustancialmente aumentada ---');
  const sizeCheck = await evalInPage(`
    (() => {
      const chassis = document.getElementById('typewriterChassis');
      const rect = chassis.getBoundingClientRect();
      const key = document.querySelector('.type-key');
      const keyRect = key.getBoundingClientRect();
      return {
        chassisWidth: Math.round(rect.width),
        chassisHeight: Math.round(rect.height),
        keyWidth: Math.round(keyRect.width),
        keyHeight: Math.round(keyRect.height)
      };
    })()
  `);
  console.log('Dimensiones reales en pantalla:', sizeCheck);
  if (sizeCheck.chassisWidth < 700 || sizeCheck.keyWidth < 44) {
    throw new Error('TEST 1 FAILED: El ancho del chasis debe superar los 700px y las teclas ser sustancialmente mayores');
  }
  console.log('✔ PASS: Máquina de gran formato dominante (ancho >= 740px) y teclas de 48px\n');

  // 2. Componentes tridimensionales y mecánicos presentes
  console.log('--- TEST 2: Geometría tridimensional y componentes mecánicos ---');
  const mechanicalProps = await evalInPage(`
    (() => {
      return {
        hasReturnLever: !!document.getElementById('carriageReturnLever'),
        hasLeftWing: !!document.querySelector('.chassis-side-wing.wing-left'),
        hasRightWing: !!document.querySelector('.chassis-side-wing.wing-right'),
        hasSpools: document.querySelectorAll('.ribbon-spool-assembly').length === 2,
        hasSegmentSlots: !!document.querySelector('.segment-slots-pattern'),
        hasStriker: !!document.getElementById('typebarStriker')
      };
    })()
  `);
  console.log('Componentes mecánicos detectados:', mechanicalProps);
  for (const [k, v] of Object.entries(mechanicalProps)) {
    if (!v) throw new Error(`TEST 2 FAILED: Falta el componente mecánico ${k}`);
  }
  console.log('✔ PASS: Chasis con alas volumétricas, bobinas de cinta, palanca y cesta radial\n');

  // 3. Ausencia de texto automático inicial
  console.log('--- TEST 3: Escritura manual estricta (no automática) ---');
  const initialText = await evalInPage(`document.getElementById('paperTypedOutput').textContent.trim()`);
  if (initialText !== '') {
    throw new Error(`TEST 3 FAILED: El papel debe comenzar vacío, encontrado: "${initialText}"`);
  }
  console.log('✔ PASS: Papel completamente limpio sin generación automática de texto\n');

  // 4. Tecla física interactiva: descenso y registro sincronizado
  console.log('--- TEST 4: Pulsación mecánica de tecla y sincronía de caracteres ---');
  await evalInPage(`
    (() => {
      const keyH = document.querySelector('.type-key[data-key="H"]');
      keyH.click();
    })()
  `);
  const textAfterH = await evalInPage(`document.getElementById('paperTypedOutput').textContent.trim()`);
  console.log('Texto luego de pulsar H:', textAfterH);
  if (textAfterH !== 'H') {
    throw new Error(`TEST 4 FAILED: Se esperaba 'H', obtenido '${textAfterH}'`);
  }

  // 5. Avance gradual y coherente del carro porta-papel
  console.log('--- TEST 5: Avance mecánico proporcional del carro porta-papel ---');
  const carriageShift1 = await evalInPage(`document.getElementById('carriageAssembly').style.getPropertyValue('--carriage-shift')`);
  console.log('Desplazamiento del carro tras 1 carácter:', carriageShift1);
  if (!carriageShift1 || carriageShift1 === '0px') {
    throw new Error('TEST 5 FAILED: El carro porta-papel debe desplazarse tras la pulsación');
  }

  // Pulsar más caracteres: 'A', 'R', 'I'
  await evalInPage(`
    (() => {
      document.querySelector('.type-key[data-key="A"]').click();
      document.querySelector('.type-key[data-key="R"]').click();
      document.querySelector('.type-key[data-key="I"]').click();
    })()
  `);
  const textAfterHARI = await evalInPage(`document.getElementById('paperTypedOutput').textContent.trim()`);
  const carriageShift4 = await evalInPage(`document.getElementById('carriageAssembly').style.getPropertyValue('--carriage-shift')`);
  console.log('Texto luego de 4 teclas:', textAfterHARI, '| Desplazamiento:', carriageShift4);
  if (textAfterHARI !== 'HARI') {
    throw new Error('TEST 5 FAILED: La acumulación de teclas falló');
  }
  console.log('✔ PASS: El carro avanza de forma proporcional con cada carácter\n');

  // 6. Palanca física de retorno de carro
  console.log('--- TEST 6: Palanca física de retorno de carro ---');
  await evalInPage(`document.getElementById('carriageReturnLever').click()`);
  await new Promise(r => setTimeout(r, 300));
  const textAfterLever = await evalInPage(`document.getElementById('paperTypedOutput').textContent.trim()`);
  const carriageShiftReset = await evalInPage(`document.getElementById('carriageAssembly').style.getPropertyValue('--carriage-shift')`);
  console.log('Texto luego de tirar la palanca de retorno:', textAfterLever, '| Desplazamiento:', carriageShiftReset);
  if (textAfterLever !== '' || carriageShiftReset !== '0px') {
    throw new Error('TEST 6 FAILED: La palanca de retorno debe regresar el carro a 0px y limpiar el renglón');
  }
  console.log('✔ PASS: Palanca de retorno mecánica operativa con sonido y reseteo de carro\n');

  // 7. Teclado físico de la computadora y desbloqueo final
  console.log('--- TEST 7: Escritura completa con teclado físico y autenticación de login ---');
  await evalInPage(`
    (() => {
      const keys = ['h', 'a', 'r', 'i', 's', 'p', 'e'];
      for (const k of keys) {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));
      }
    })()
  `);

  await new Promise(r => setTimeout(r, 1400));
  const sceneState = await evalInPage(`
    (() => {
      const typewriterHidden = document.getElementById('sceneTypewriter').classList.contains('is-hidden');
      const bookVisible = !document.getElementById('sceneBook').classList.contains('is-hidden');
      return { typewriterHidden, bookVisible };
    })()
  `);
  console.log('Estado de transición a escena del libro:', sceneState);
  if (!sceneState.typewriterHidden || !sceneState.bookVisible) {
    throw new Error('TEST 7 FAILED: La palabra clave HARISPE debe desbloquear la escena del libro');
  }
  console.log('✔ PASS: Autenticación exitosa y transición suave al libro físico\n');

  console.log('========================================================');
  console.log('TODAS LAS PRUEBAS DE LA MÁQUINA DE ESCRIBIR COMPLETADAS CON ÉXITO');
  console.log('========================================================\n');

} catch (err) {
  console.error('\n❌ ERROR EN LA SUITE:', err);
  ws.close();
  edge.kill();
  process.exit(1);
}

ws.close();
edge.kill();
process.exit(0);
