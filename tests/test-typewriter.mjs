import { spawn } from 'child_process';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function runTestSuite() {
  const port = 9240 + Math.floor(Math.random() * 50);
  const edgeProcess = spawn(edgePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--user-data-dir=C:\\Users\\tblutman\\AppData\\Local\\Temp\\edge-test-profile-' + Date.now(),
    'http://localhost:3000/index.html'
  ]);

  let tabs = null;
  for (let i = 0; i < 12; i++) {
    await new Promise(r => setTimeout(r, 400));
    try {
      const tabsRes = await fetch(`http://localhost:${port}/json`);
      tabs = await tabsRes.json();
      if (tabs && tabs.length > 0) break;
    } catch (_) {}
  }

  if (!tabs || tabs.length === 0) {
    edgeProcess.kill();
    throw new Error('Edge failed to start on port ' + port);
  }

  try {
    const pageTab = tabs.find(t => t.type === 'page');
    if (!pageTab) throw new Error('No page tab found');

    const ws = new WebSocket(pageTab.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    let msgId = 1;
    const pending = new Map();
    const errors = [];
    const consoleLogs = [];

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.id && pending.has(data.id)) {
        pending.get(data.id)(data);
        pending.delete(data.id);
      }
      if (data.method === 'Runtime.consoleAPICalled') {
        consoleLogs.push({ type: data.params.type, args: data.params.args.map(a => a.value || a.description) });
      }
      if (data.method === 'Runtime.exceptionThrown') {
        errors.push(data.params.exceptionDetails);
      }
    };

    function send(method, params = {}) {
      return new Promise((resolve) => {
        const id = msgId++;
        pending.set(id, (msg) => {
          resolve(msg.result?.result?.value !== undefined ? msg.result.result.value : msg.result);
        });
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await send('Runtime.enable');
    await send('Page.enable');
    await new Promise(r => setTimeout(r, 500));

    // TEST 1: Physical keyboard typing lowercase 'h', 'a', 'r', 'i', 's', 'p', 'e'
    console.log('=== TEST 1: Physical keyboard typing (case-insensitive) ===');
    const physicalTest = await send('Runtime.evaluate', {
      expression: `(() => {
        const letters = ['h', 'a', 'r', 'i', 's', 'p', 'e'];
        for (const l of letters) {
          window.dispatchEvent(new KeyboardEvent('keydown', { key: l, bubbles: true }));
        }
        return { dispatched: letters.join('') };
      })()`,
      returnByValue: true
    });
    console.log('Dispatched physical lowercase:', physicalTest);

    await new Promise(r => setTimeout(r, 600));

    const checkPhysicalOutput = await send('Runtime.evaluate', {
      expression: `(() => {
        const paperOutput = document.getElementById('paperTypedOutput');
        return paperOutput?.textContent?.trim();
      })()`,
      returnByValue: true
    });
    console.log('Paper output after physical typing:', checkPhysicalOutput);

    // Wait for transition to complete
    await new Promise(r => setTimeout(r, 1400));
    const bookCheck1 = await send('Runtime.evaluate', {
      expression: `(() => {
        const sceneBook = document.getElementById('sceneBook');
        const sceneTypewriter = document.getElementById('sceneTypewriter');
        return {
          typewriterHidden: sceneTypewriter?.classList.contains('is-hidden'),
          bookVisible: !sceneBook?.classList.contains('is-hidden')
        };
      })()`,
      returnByValue: true
    });
    console.log('Unlocked via physical keyboard:', bookCheck1);

    // Reload page to test Backspace and Clear
    await send('Page.reload');
    await new Promise(r => setTimeout(r, 1000));

    console.log('=== TEST 2: Typing, Backspace, and Clear ===');
    await send('Runtime.evaluate', {
      expression: `(() => {
        ['H', 'A', 'R', 'I', 'X'].forEach(k => {
          document.querySelector('.type-key[data-key="' + k + '"]')?.click();
        });
      })()`,
      returnByValue: true
    });
    await new Promise(r => setTimeout(r, 400));

    let paperText = await send('Runtime.evaluate', {
      expression: `document.getElementById('paperTypedOutput')?.textContent?.trim()`,
      returnByValue: true
    });
    console.log('Text with typo:', paperText);

    // Press Backspace virtual key
    await send('Runtime.evaluate', {
      expression: `document.querySelector('.type-key[data-key="BACKSPACE"]')?.click()`,
      returnByValue: true
    });
    await new Promise(r => setTimeout(r, 200));

    paperText = await send('Runtime.evaluate', {
      expression: `document.getElementById('paperTypedOutput')?.textContent?.trim()`,
      returnByValue: true
    });
    console.log('Text after Backspace:', paperText);

    // Press physical Backspace
    await send('Runtime.evaluate', {
      expression: `window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }))`,
      returnByValue: true
    });
    await new Promise(r => setTimeout(r, 200));

    paperText = await send('Runtime.evaluate', {
      expression: `document.getElementById('paperTypedOutput')?.textContent?.trim()`,
      returnByValue: true
    });
    console.log('Text after physical Backspace:', paperText);

    // Press Clear button
    await send('Runtime.evaluate', {
      expression: `document.getElementById('btnClearTypewriter')?.click()`,
      returnByValue: true
    });
    await new Promise(r => setTimeout(r, 200));

    paperText = await send('Runtime.evaluate', {
      expression: `document.getElementById('paperTypedOutput')?.textContent?.trim()`,
      returnByValue: true
    });
    console.log('Text after Clear button:', paperText === '' ? '[EMPTY (CORRECT)]' : paperText);

    // Reload page to test Bypass button
    await send('Page.reload');
    await new Promise(r => setTimeout(r, 1000));

    console.log('=== TEST 3: Bypass button directly into book ===');
    const bypassStateBefore = await send('Runtime.evaluate', {
      expression: `(() => ({
        typewriterHidden: document.getElementById('sceneTypewriter')?.classList.contains('is-hidden'),
        bookVisible: !document.getElementById('sceneBook')?.classList.contains('is-hidden')
      }))()`,
      returnByValue: true
    });
    console.log('Before bypass click:', bypassStateBefore);

    await send('Runtime.evaluate', {
      expression: `document.getElementById('btnBypassTypewriter')?.click()`,
      returnByValue: true
    });

    await new Promise(r => setTimeout(r, 1500));

    const bypassStateAfter = await send('Runtime.evaluate', {
      expression: `(() => ({
        typewriterHidden: document.getElementById('sceneTypewriter')?.classList.contains('is-hidden'),
        bookVisible: !document.getElementById('sceneBook')?.classList.contains('is-hidden')
      }))()`,
      returnByValue: true
    });
    console.log('After bypass click (transition complete):', bypassStateAfter);

    console.log('=== RUNTIME ERRORS IN TESTS ===', errors);
    console.log('=== CONSOLE LOGS IN TESTS ===', consoleLogs);

    ws.close();
  } finally {
    edgeProcess.kill();
  }
}

runTestSuite().catch(console.error);
