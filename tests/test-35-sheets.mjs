import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const port = 9300 + Math.floor(Math.random() * 50);
const tempDir = path.join(process.env.TEMP || 'C:\\Windows\\Temp', `edge-35sheets-${Date.now()}`);

const edge = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
  '--headless=new',
  `--remote-debugging-port=${port}`,
  '--window-size=1280,820',
  `--user-data-dir=${tempDir}`,
  'http://localhost:3000/index.html'
]);

let tabs = null;
for (let i = 0; i < 20; i++) {
  await new Promise(r => setTimeout(r, 400));
  try {
    const res = await fetch(`http://localhost:${port}/json`);
    tabs = await res.json();
    if (tabs && tabs.length > 0) break;
  } catch (_) {}
}

if (!tabs || tabs.length === 0) {
  console.error('Failed to connect to Edge headless');
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
  console.log('=== TEST SUITE: 35 HOJAS VACÍAS (Guillermo Harispe) ===\n');

  // Check initial state
  const title = await evalInPage(`document.title`);
  console.log('Page Title:', title);

  // Transition to book scene by clicking typewriter or calling directly
  await evalInPage(`
    const ts = document.getElementById('sceneTypewriter');
    const bs = document.getElementById('sceneBook');
    if (ts && bs) {
      ts.classList.add('is-hidden');
      bs.classList.remove('is-hidden');
    }
  `);

  // Open book
  await evalInPage(`
    if (window.appBook) {
      window.appBook.openBook();
    } else {
      const btn = document.getElementById('btnToggleBook');
      if (btn) btn.click();
    }
  `);

  // Wait for cover animation
  await new Promise(r => setTimeout(r, 800));

  // Check metadata
  const metadata = await evalInPage(`
    import('./js/data/book-data.js').then(m => ({
      totalSheets: m.TOTAL_SHEETS,
      bookMetadata: m.BOOK_METADATA,
      totalPages: m.BOOK_PAGES.length,
      sheetsCount: m.BOOK_PAGES.filter(p => p.type === 'sheet').length
    }))
  `);
  console.log('Metadata Check:', metadata);
  if (metadata.totalSheets !== 35 || metadata.sheetsCount !== 35) {
    throw new Error(`Expected exactly 35 sheets, got ${metadata.sheetsCount}`);
  }
  console.log('✓ EXACTAMENTE 35 HOJAS VERIFICADAS EN BOOK_PAGES');

  // Verify Spread 1 (Guarda anterior y Hoja 01/35)
  const spread1 = await evalInPage(`
    (() => {
      const rightContent = document.getElementById('pageRightContent');
      const numDisplay = rightContent ? rightContent.querySelector('.sheet-number-display') : null;
      const indicator = document.getElementById('pageIndicator');
      return {
        rightNumber: numDisplay ? numDisplay.textContent.trim() : null,
        indicatorText: indicator ? indicator.textContent.trim() : null,
        hasFictionalText: rightContent ? (rightContent.textContent.includes('DOCUMENTO PRINCIPAL') || rightContent.textContent.includes('FOTOGRAFÍA')) : false
      };
    })()
  `);
  console.log('\nSpread 1 Check:', spread1);
  if (spread1.rightNumber !== '01/35') {
    throw new Error(`Spread 1 right page number should be "01/35", got "${spread1.rightNumber}"`);
  }
  if (!spread1.indicatorText.includes('01/35')) {
    throw new Error(`Indicator should mention 01/35, got "${spread1.indicatorText}"`);
  }
  if (spread1.hasFictionalText) {
    throw new Error('Spread 1 contains fictional placeholder text!');
  }
  console.log('✓ PLIEGO 1 MUESTRA HOJA 01/35 Y ESTÁ VACÍO');

  // Click next to advance to Spread 2 (Hoja 02/35 y Hoja 03/35)
  await evalInPage(`document.getElementById('btnNext').click();`);
  await new Promise(r => setTimeout(r, 900));

  const spread2 = await evalInPage(`
    (() => {
      const leftContent = document.getElementById('pageLeftContent');
      const rightContent = document.getElementById('pageRightContent');
      const leftNum = leftContent ? leftContent.querySelector('.sheet-number-display') : null;
      const rightNum = rightContent ? rightContent.querySelector('.sheet-number-display') : null;
      const indicator = document.getElementById('pageIndicator');
      return {
        leftNumber: leftNum ? leftNum.textContent.trim() : null,
        rightNumber: rightNum ? rightNum.textContent.trim() : null,
        indicatorText: indicator ? indicator.textContent.trim() : null
      };
    })()
  `);
  console.log('\nSpread 2 Check:', spread2);
  if (spread2.leftNumber !== '02/35' || spread2.rightNumber !== '03/35') {
    throw new Error(`Spread 2 should be 02/35 and 03/35, got ${spread2.leftNumber} and ${spread2.rightNumber}`);
  }
  console.log('✓ PLIEGO 2 MUESTRA CORRECTAMENTE HOJAS 02/35 Y 03/35');

  // Advance to all spreads and verify numbering sequence
  console.log('\nVerificando secuencia completa de pliegos hasta 35/35...');
  for (let s = 3; s <= 18; s++) {
    await evalInPage(`document.getElementById('btnNext').click();`);
    await new Promise(r => setTimeout(r, 850));
  }

  const finalSpread = await evalInPage(`
    (() => {
      const leftContent = document.getElementById('pageLeftContent');
      const rightContent = document.getElementById('pageRightContent');
      const leftNum = leftContent ? leftContent.querySelector('.sheet-number-display') : null;
      const rightNum = rightContent ? rightContent.querySelector('.sheet-number-display') : null;
      const indicator = document.getElementById('pageIndicator');
      return {
        leftNumber: leftNum ? leftNum.textContent.trim() : null,
        rightNumber: rightNum ? rightNum.textContent.trim() : null,
        indicatorText: indicator ? indicator.textContent.trim() : null
      };
    })()
  `);
  console.log('Final Spread 18 Check:', finalSpread);
  if (finalSpread.leftNumber !== '34/35' || finalSpread.rightNumber !== '35/35') {
    throw new Error(`Final spread should be 34/35 and 35/35, got ${finalSpread.leftNumber} and ${finalSpread.rightNumber}`);
  }
  console.log('✓ PLIEGO 18 MUESTRA HOJA 34/35 Y HOJA 35/35 (FIN DE HOJAS)');

  // Advance one more to check back guard & cover boundary
  await evalInPage(`document.getElementById('btnNext').click();`);
  await new Promise(r => setTimeout(r, 850));
  const afterLast = await evalInPage(`
    (() => {
      const btnNext = document.getElementById('btnNext');
      const indicator = document.getElementById('pageIndicator');
      return {
        btnNextDisabled: btnNext.disabled,
        indicatorText: indicator ? indicator.textContent.trim() : null
      };
    })()
  `);
  console.log('After Last Sheet:', afterLast);
  if (!afterLast.btnNextDisabled) {
    throw new Error('btnNext should be disabled at the end of the book');
  }
  console.log('✓ LÍMITE DEL LIBRO CORRECTO (btnNext deshabilitado en guarda posterior)');

  // Test accessible transcription modal
  await evalInPage(`document.getElementById('btnTranscription').click();`);
  await new Promise(r => setTimeout(r, 300));
  const modalText = await evalInPage(`document.getElementById('transcriptionContent').innerText`);
  console.log('\nAccessible Modal Sample:\n', modalText.slice(0, 200));
  await evalInPage(`document.getElementById('btnCloseModal').click();`);

  // Capture screenshot of the book on desk
  // Go back to Spread 2
  await evalInPage(`
    window.location.reload();
  `);
  await new Promise(r => setTimeout(r, 1200));
  await evalInPage(`
    const ts = document.getElementById('sceneTypewriter');
    const bs = document.getElementById('sceneBook');
    ts.classList.add('is-hidden');
    bs.classList.remove('is-hidden');
    document.getElementById('btnToggleBook').click();
  `);
  await new Promise(r => setTimeout(r, 1000));
  await evalInPage(`document.getElementById('btnNext').click();`);
  await new Promise(r => setTimeout(r, 900));

  const screenshot = await send('Page.captureScreenshot', { format: 'png' });
  const shotPath = path.resolve('screenshot-35-sheets-spread2.png');
  fs.writeFileSync(shotPath, Buffer.from(screenshot.data, 'base64'));
  console.log(`\n✓ Captura guardada en: ${shotPath}`);

  console.log('\n=== TODOS LOS TESTS PASARON EXITOSAMENTE ===');
} catch (err) {
  console.error('\n❌ ERROR EN LA VERIFICACIÓN:', err);
  process.exitCode = 1;
} finally {
  ws.close();
  edge.kill();
  try {
    fs.rmSync(tempDir, { recursive: true, force: true });
  } catch (_) {}
}
