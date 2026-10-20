/**
 * Controlador de la Máquina de Escribir Mecánica 3D (Iteración 6: Etapa C)
 * "Libro para mis hijos" — Guillermo Bautista Harispe
 *
 * Incluye síntesis de sonido mecánico local con Web Audio API (cero dependencias),
 * palanca de tipos animada (Typebar Striker) y micro-desplazamiento del carro.
 */

class TypewriterAudio {
  constructor() {
    this.audioCtx = null;
    this.isMuted = false;
  }

  ensureContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  playKeystroke() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.audioCtx) return;

    try {
      const t = this.audioCtx.currentTime;

      // 1. Golpe del tipo contra cinta y papel (ruido blanco filtrado en banda)
      const bufferSize = Math.floor(this.audioCtx.sampleRate * 0.035);
      const noiseBuffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.audioCtx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const filter = this.audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1350, t);
      filter.Q.setValueAtTime(3.2, t);

      const noiseGain = this.audioCtx.createGain();
      noiseGain.gain.setValueAtTime(0.24, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.034);

      whiteNoise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.audioCtx.destination);
      whiteNoise.start(t);

      // 2. Click metálico de la palanca mecánica
      const osc = this.audioCtx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(920, t);
      osc.frequency.exponentialRampToValueAtTime(340, t + 0.024);

      const oscGain = this.audioCtx.createGain();
      oscGain.gain.setValueAtTime(0.18, t);
      oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.024);

      osc.connect(oscGain);
      oscGain.connect(this.audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.028);

      // 3. Trinquete del carro (ratchet tick de avance)
      const ratchet = this.audioCtx.createOscillator();
      ratchet.type = 'square';
      ratchet.frequency.setValueAtTime(1700, t + 0.03);
      ratchet.frequency.exponentialRampToValueAtTime(550, t + 0.045);

      const ratchetGain = this.audioCtx.createGain();
      ratchetGain.gain.setValueAtTime(0, t);
      ratchetGain.gain.setValueAtTime(0.07, t + 0.03);
      ratchetGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

      ratchet.connect(ratchetGain);
      ratchetGain.connect(this.audioCtx.destination);
      ratchet.start(t + 0.03);
      ratchet.stop(t + 0.055);
    } catch (_) {
      // Degradar silenciosamente si el contexto de audio falla
    }
  }

  playBell() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.audioCtx) return;

    try {
      const t = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(2480, t);

      const gain = this.audioCtx.createGain();
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(t);
      osc.stop(t + 1.15);
    } catch (_) {}
  }

  playCarriageReturn() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.audioCtx) return;

    try {
      const t = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(420, t);
      osc.frequency.exponentialRampToValueAtTime(160, t + 0.22);

      const gain = this.audioCtx.createGain();
      gain.gain.setValueAtTime(0.14, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.25);

      setTimeout(() => {
        if (!this.audioCtx) return;
        const t2 = this.audioCtx.currentTime;
        const thump = this.audioCtx.createOscillator();
        thump.type = 'sine';
        thump.frequency.setValueAtTime(140, t2);
        thump.frequency.exponentialRampToValueAtTime(40, t2 + 0.06);

        const thumpGain = this.audioCtx.createGain();
        thumpGain.gain.setValueAtTime(0.22, t2);
        thumpGain.gain.exponentialRampToValueAtTime(0.001, t2 + 0.07);

        thump.connect(thumpGain);
        thumpGain.connect(this.audioCtx.destination);
        thump.start(t2);
        thump.stop(t2 + 0.08);
      }, 180);
    } catch (_) {}
  }

  playBackspace() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.audioCtx) return;

    try {
      const t = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(500, t);
      osc.frequency.exponentialRampToValueAtTime(200, t + 0.035);

      const gain = this.audioCtx.createGain();
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.04);
    } catch (_) {}
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }
}

export class TypewriterController {
  constructor(options = {}) {
    this.container = options.container || document.getElementById('sceneTypewriter');
    this.paperOutput = options.paperOutput || document.getElementById('paperTypedOutput');
    this.hiddenInput = options.hiddenInput || document.getElementById('typewriterHiddenInput');
    this.btnClear = options.btnClear || document.getElementById('btnClearTypewriter');
    this.btnBypass = options.btnBypass || document.getElementById('btnBypassTypewriter');
    this.btnSound = options.btnSound || document.getElementById('btnToggleSound');
    this.typebarStriker = options.typebarStriker || document.getElementById('typebarStriker');
    this.carriageAssembly = options.carriageAssembly || document.getElementById('carriageAssembly');
    this.returnLever = options.returnLever || document.getElementById('carriageReturnLever');
    this.targetWord = (options.targetWord || 'HARISPE').toUpperCase();
    this.onUnlock = options.onUnlock || (() => {});

    this.audio = new TypewriterAudio();
    this.typedText = '';
    this.isUnlocked = false;
    this.isActive = true;
    this.carriageStep = 0;

    this.init();
  }

  init() {
    if (!this.container) return;

    // Vinculación de teclas físicas en pantalla
    const keys = this.container.querySelectorAll('.type-key');
    keys.forEach((keyEl) => {
      const char = keyEl.dataset.key;
      keyEl.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleVirtualKey(char, keyEl);
      });
    });

    // Teclado físico de la computadora
    this.boundKeyDown = this.handlePhysicalKeyDown.bind(this);
    window.addEventListener('keydown', this.boundKeyDown);

    // Input oculto para sincronización en navegadores móviles
    if (this.hiddenInput) {
      this.hiddenInput.addEventListener('input', () => {
        const val = this.hiddenInput.value;
        if (val) {
          const lastChar = val.slice(-1);
          this.executeKeystroke(lastChar);
          this.hiddenInput.value = '';
        }
      });

      const paperSheet = this.container.querySelector('.typewriter-paper-sheet');
      if (paperSheet) {
        paperSheet.addEventListener('click', () => {
          if (this.isActive && !this.isUnlocked) {
            this.hiddenInput.focus();
          }
        });
      }
    }

    // Botón de borrado
    if (this.btnClear) {
      this.btnClear.addEventListener('click', (e) => {
        e.preventDefault();
        this.clear();
      });
    }

    // Palanca física de retorno de carro
    if (this.returnLever) {
      this.returnLever.addEventListener('click', (e) => {
        e.preventDefault();
        this.pullReturnLever();
      });
    }

    // Botón de bypass / omisión accesible
    if (this.btnBypass) {
      this.btnBypass.addEventListener('click', (e) => {
        e.preventDefault();
        this.unlock(true);
      });
    }

    // Control de sonido Web Audio API
    if (this.btnSound) {
      this.btnSound.addEventListener('click', (e) => {
        e.preventDefault();
        const isMuted = this.audio.toggleMute();
        this.updateSoundButtonUI(isMuted);
      });
    }

    this.render();
  }

  updateSoundButtonUI(isMuted) {
    if (!this.btnSound) return;
    const icon = this.btnSound.querySelector('#soundIcon');
    const text = this.btnSound.querySelector('#soundText');
    if (isMuted) {
      this.btnSound.classList.add('is-muted');
      if (icon) icon.textContent = '🔇';
      if (text) text.textContent = 'Silencio';
    } else {
      this.btnSound.classList.remove('is-muted');
      if (icon) icon.textContent = '🔊';
      if (text) text.textContent = 'Sonido ON';
    }
  }

  handleVirtualKey(char, keyEl) {
    if (!this.isActive || this.isUnlocked) return;

    this.highlightKeyElement(keyEl);

    if (char === 'BACKSPACE') {
      this.backspace();
    } else if (char === 'CLEAR') {
      this.clear();
    } else if (char === 'SPACE') {
      this.executeKeystroke(' ');
    } else if (char) {
      this.executeKeystroke(char);
    }
  }

  handlePhysicalKeyDown(e) {
    if (!this.isActive || this.isUnlocked) return;
    if (e.ctrlKey || e.altKey || e.metaKey) return;

    if (e.key === 'Backspace') {
      e.preventDefault();
      this.backspace();
      this.highlightKeyByChar('BACKSPACE');
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      this.checkWord();
      return;
    }

    if (e.key === 'Escape') {
      this.clear();
      return;
    }

    if (e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault();
      this.executeKeystroke(' ');
      this.highlightKeyByChar('SPACE');
      return;
    }

    if (e.key.length === 1 && /[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(e.key)) {
      e.preventDefault();
      const char = e.key.toUpperCase();
      this.executeKeystroke(char);
      this.highlightKeyByChar(char);
    }
  }

  executeKeystroke(char) {
    if (!char || this.isUnlocked) return;
    if (this.typedText.length >= 22) return;

    // 1. Sonido mecánico de golpe de tipo y carro (no bloqueante)
    this.audio.playKeystroke();

    // 2. Animación mecánica del martillo de tipos (Typebar Striker)
    this.animateStriker();

    // 3. Micro-avance del carro porta-papel (escapement)
    this.advanceCarriage();

    // 4. Registro inmediato del carácter: garantiza que el tecleo rápido no pierda ni desincronice caracteres
    this.typedText += char.toUpperCase();
    this.render();
    this.checkWord();
  }

  animateStriker() {
    if (!this.typebarStriker) return;
    this.typebarStriker.classList.remove('is-striking');
    void this.typebarStriker.offsetWidth; // Reflow para reiniciar animación
    this.typebarStriker.classList.add('is-striking');
    setTimeout(() => {
      if (this.typebarStriker) {
        this.typebarStriker.classList.remove('is-striking');
      }
    }, 110);
  }

  advanceCarriage() {
    if (!this.carriageAssembly) return;
    this.carriageStep = this.typedText.length;
    const maxSteps = 16;
    const currentStep = Math.min(maxSteps, this.carriageStep);
    const shift = (currentStep * -14.5).toFixed(1);
    this.carriageAssembly.style.setProperty('--carriage-shift', `${shift}px`);

    if (this.carriageStep === this.targetWord.length - 1) {
      this.audio.playBell();
    }
  }

  pullReturnLever() {
    if (!this.isActive || this.isUnlocked) return;
    if (this.returnLever) {
      this.returnLever.classList.add('is-pulled');
      setTimeout(() => {
        if (this.returnLever) this.returnLever.classList.remove('is-pulled');
      }, 350);
    }
    this.audio.playCarriageReturn();
    this.clear();
  }

  highlightKeyByChar(char) {
    const keyEl = this.container.querySelector(`.type-key[data-key="${char}"]`);
    if (keyEl) {
      this.highlightKeyElement(keyEl);
    }
  }

  highlightKeyElement(el) {
    el.classList.add('is-pressed');
    setTimeout(() => {
      el.classList.remove('is-pressed');
    }, 120);
  }

  backspace() {
    if (this.typedText.length > 0) {
      this.audio.playBackspace();
      this.typedText = this.typedText.slice(0, -1);
      this.carriageStep = this.typedText.length;
      if (this.carriageAssembly) {
        const maxSteps = 16;
        const currentStep = Math.min(maxSteps, this.carriageStep);
        const shift = (currentStep * -14.5).toFixed(1);
        this.carriageAssembly.style.setProperty('--carriage-shift', `${shift}px`);
      }
      this.render();
    }
  }

  clear() {
    this.audio.playBackspace();
    this.typedText = '';
    this.carriageStep = 0;
    if (this.carriageAssembly) {
      this.carriageAssembly.style.setProperty('--carriage-shift', '0px');
    }
    this.render();
  }

  render() {
    if (!this.paperOutput) return;
    const display = this.typedText || '';
    this.paperOutput.innerHTML = `${this.escapeHtml(display)}<span class="typewriter-cursor" aria-hidden="true"></span>`;
  }

  checkWord() {
    const normalized = this.typedText.replace(/\s+/g, '').toUpperCase();
    if (normalized.endsWith(this.targetWord) || normalized === this.targetWord) {
      this.unlock(false);
    }
  }

  unlock(isBypass = false) {
    if (this.isUnlocked) return;
    this.isUnlocked = true;
    this.isActive = false;

    // Campanazo de fin de carro / palabra alcanzada
    this.audio.playBell();

    if (this.paperOutput) {
      if (isBypass) {
        this.paperOutput.innerHTML = `${this.escapeHtml(this.targetWord)}<span class="typewriter-cursor" aria-hidden="true"></span>`;
      }
      this.paperOutput.style.color = '#8e2a22';
      this.paperOutput.style.textShadow = '0 0 5px rgba(142, 42, 34, 0.45)';
    }

    const chassis = this.container.querySelector('.typewriter-chassis');
    if (chassis) {
      chassis.style.transition = 'transform 0.6s cubic-bezier(0.2, 0.85, 0.35, 1), filter 0.6s ease';
      chassis.style.transform = 'rotateX(4deg) scale(0.92)';
    }

    setTimeout(() => {
      this.container.classList.add('is-hidden');
      setTimeout(() => {
        this.destroy();
        if (typeof this.onUnlock === 'function') {
          this.onUnlock();
        }
      }, 700);
    }, 550);
  }

  escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  destroy() {
    this.isActive = false;
    window.removeEventListener('keydown', this.boundKeyDown);
  }
}
