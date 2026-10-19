/**
 * Motor de interacción física y mecánica del libro (Iteración 6)
 * "Libro para mis hijos" — Guillermo Bautista Harispe
 *
 * Características clave de esta iteración:
 * - A1. Retroceso de páginas por arrastre completamente funcional en ambas direcciones.
 * - A2. Apertura progresiva continua: la página izquierda no aparece abruptamente (en spread 1 la tapa es la cara izquierda).
 * - B1 y B2. Modos LECTURA (predeterminado, seguro para selección/lectura) y ARRASTRE (manipulación 3D interactiva).
 * - B3. Inclinación de cámara conservada (SHIFT + arrastre y botón táctil).
 */

import { BOOK_PAGES, BOOK_METADATA } from './data/book-data.js';

export class BookEngine {
  constructor(options = {}) {
    this.pages = BOOK_PAGES;
    this.metadata = BOOK_METADATA;
    this.container = options.container;
    this.panContainer = options.panContainer || this.container.parentElement;
    
    // Modo Desplazamiento de Mesa (Desk Pan) para accesibilidad
    // Pasar páginas y abrir la tapa están SIEMPRE ACTIVOS por defecto
    this.isDeskPanMode = false;

    // Estado físico del libro
    this.coverAngle = 0; // 0° = cerrado, 180° = completamente abierto
    this.isClosed = true;
    this.currentIndex = 0; // 0 = portada, 1 = pág 1-2, 3 = pág 3-4, etc.
    this.isAnimating = false;
    this.isMobile = this.checkIfMobile();

    // Inclinación visual de la cámara (-55° a +55°, permitiendo vista casi vertical/frontal para lectura)
    this.viewPitch = 15;
    this.pitchLevels = [0, 15, 30, 48]; // 0° = frontal/vertical, 15° = lectura cómoda, 30° = plano, 48° = cenital
    this.pitchIndex = 1;

    // Estado del desplazamiento del libro sobre el escritorio (Desk Pan)
    this.panX = 0;
    this.panY = 0;
    this.rotX = 0;
    this.rotZ = 0;
    this.isTwoHandMode = false;

    // Máquina de estados de gestos unificada con Target Locking
    this.activeGesture = null; // 'COVER' | 'PAGE_NEXT' | 'PAGE_PREV' | 'BOOK_PAN' | 'VIEW_PITCH' | null
    this.gestureStartPointerX = 0;
    this.gestureStartPointerY = 0;
    this.gestureStartCoverAngle = 0;
    this.gestureStartPanX = 0;
    this.gestureStartPanY = 0;
    this.gestureStartPitch = 18;
    this.grabNormX = 0;
    this.grabNormY = 0;
    this.lastPointerX = 0;
    this.lastPointerTime = 0;
    this.pointerVelocityX = 0;

    // Estado de arrastre progresivo de la hoja interior
    this.activeLeafEl = null;
    this.leafProgress = 0; // 0.0 a 1.0

    // Referencias DOM
    this.frontCoverEl = null;
    this.frontCoverBackContentEl = null;
    this.leftPageEl = null;
    this.rightPageEl = null;
    this.leftContentEl = null;
    this.rightContentEl = null;
    this.spineEl = null;
    this.closedSpineEl = null;
    this.coverBackingEl = null;
    this.bookBodyEl = null;

    // Callbacks
    this.onPageChange = options.onPageChange || (() => {});
    this.onTwoHandChange = options.onTwoHandChange || (() => {});
    this.onPitchChange = options.onPitchChange || (() => {});
    this.onDragModeChange = options.onDragModeChange || (() => {});

    this.init();
  }

  checkIfMobile() {
    return window.innerWidth <= 720;
  }

  init() {
    this.setupBookDom();
    this.applyCoverAngle(0, false);
    this.updateDynamicThickness();
    this.renderCurrentSpread();
    this.bindUnifiedGestureEvents();
    this.bindKeyboardModifiers();
    this.bindTouchSwipe();

    window.addEventListener('resize', () => {
      this.isMobile = this.checkIfMobile();
      this.renderCurrentSpread();
      this.applyCoverAngle(this.coverAngle, false);
      this.updateDynamicThickness();
    });
  }

  // ==========================================================================
  // A3. CONTROL ACCESIBLE DEL DESPLAZAMIENTO DEL LIBRO (DESK PAN)
  // Pasar hojas y abrir tapa están SIEMPRE ACTIVOS.
  // Mover el libro sobre la mesa requiere CTRL o activar este modo.
  // ==========================================================================

  setDeskPanMode(enabled) {
    this.isDeskPanMode = !!enabled;
    if (this.isDeskPanMode) {
      this.panContainer.classList.add('desk-pan-mode-active');
    } else {
      this.panContainer.classList.remove('desk-pan-mode-active');
    }
    this.onDragModeChange(this.isDeskPanMode);
  }

  toggleDeskPanMode() {
    this.setDeskPanMode(!this.isDeskPanMode);
    return this.isDeskPanMode;
  }

  // Alias retrocompatible
  setDragMode(enabled) {
    return this.setDeskPanMode(enabled);
  }

  toggleDragMode() {
    return this.toggleDeskPanMode();
  }

  // ==========================================================================
  // ESTRUCTURA DOM BASE
  // ==========================================================================

  setupBookDom() {
    this.container.innerHTML = `
      <div class="book-cover-backing" id="coverBacking"></div>
      <div class="book-closed-spine" id="closedSpine"></div>
      <div class="book-body" id="bookBody">
        <!-- Página izquierda base (para páginas interiores currentIndex > 1) -->
        <div class="book-page page-left" id="pageLeft" aria-live="polite">
          <div class="page-turn-trigger corner-top-left" data-leaf-trigger="prev" title="Arrastrar para retroceder">
            <div class="corner-peel-hint"></div>
          </div>
          <div class="page-turn-trigger corner-bottom-left" data-leaf-trigger="prev" title="Arrastrar para retroceder">
            <div class="corner-peel-hint"></div>
          </div>
          <div class="page-edge-strip edge-left" data-leaf-trigger="prev"></div>
          <div class="page-inner-content" id="pageLeftContent"></div>
        </div>

        <!-- Lomo central con canal de costura -->
        <div class="book-spine-crease" id="bookSpine"></div>

        <!-- Página derecha base (con triggers de avance) -->
        <div class="book-page page-right" id="pageRight" aria-live="polite">
          <div class="page-turn-trigger corner-top-right" data-leaf-trigger="next" title="Arrastrar para avanzar">
            <div class="corner-peel-hint"></div>
          </div>
          <div class="page-turn-trigger corner-bottom-right" data-leaf-trigger="next" title="Arrastrar para avanzar">
            <div class="corner-peel-hint"></div>
          </div>
          <div class="page-edge-strip edge-right" data-leaf-trigger="next"></div>
          <div class="page-inner-content" id="pageRightContent"></div>
        </div>

        <!-- Tapa frontal interactiva con apertura variable (0° a 180°) -->
        <div class="book-front-cover" id="frontCover" role="button" aria-label="Tapa frontal del libro">
          <div class="cover-face front-face">
            <div class="book-cover-view" aria-label="Tapa del libro: Cuaderno para mis hijos, Papá 1984">
              <span class="sr-only">Tapa del libro: Cuaderno para mis hijos, Papá 1984</span>

              <!-- Bolsillo de plástico transparente adherido en el sector inferior derecho -->
              <div class="cover-pocket-sleeve" aria-label="Tarjeta manuscrita: Cuaderno para mis hijos, Papá 1984">
                <!-- Tarjeta rectangular de papel viejo amarillo cálido -->
                <div class="cover-card-paper">
                  <div class="card-handwritten-text">
                    <span class="card-line card-line-1">Cuaderno</span>
                    <span class="card-line card-line-2">para</span>
                    <span class="card-line card-line-3">mis hijos</span>
                    <span class="card-line card-line-4">Papá 1984</span>
                  </div>
                </div>
                <!-- Película plástica transparente superpuesta con reflejo y abertura superior -->
                <div class="pocket-plastic-film" aria-hidden="true">
                  <div class="pocket-slit-opening"></div>
                  <div class="pocket-sheen"></div>
                </div>
              </div>

              <div class="cover-open-affordance">
                <span>📖 Arrastrá para abrir el libro</span>
              </div>
            </div>
          </div>
          <div class="cover-face back-face">
            <div class="page-turn-trigger corner-top-left" data-leaf-trigger="prev" title="Arrastrar para cerrar">
              <div class="corner-peel-hint"></div>
            </div>
            <div class="page-turn-trigger corner-bottom-left" data-leaf-trigger="prev" title="Arrastrar para cerrar">
              <div class="corner-peel-hint"></div>
            </div>
            <div class="page-edge-strip edge-left" data-leaf-trigger="prev"></div>
            <div class="page-inner-content" id="frontCoverBackContent"></div>
          </div>
        </div>
      </div>
    `;

    this.frontCoverEl = this.container.querySelector('#frontCover');
    this.frontCoverBackContentEl = this.container.querySelector('#frontCoverBackContent');
    this.leftPageEl = this.container.querySelector('#pageLeft');
    this.rightPageEl = this.container.querySelector('#pageRight');
    this.leftContentEl = this.container.querySelector('#pageLeftContent');
    this.rightContentEl = this.container.querySelector('#pageRightContent');
    this.spineEl = this.container.querySelector('#bookSpine');
    this.closedSpineEl = this.container.querySelector('#closedSpine');
    this.coverBackingEl = this.container.querySelector('#coverBacking');
    this.bookBodyEl = this.container.querySelector('#bookBody');

    // Cargar guarda interior en el reverso de la tapa frontal
    if (this.frontCoverBackContentEl && this.pages[1]) {
      this.frontCoverBackContentEl.innerHTML = this.renderPageContent(this.pages[1]);
    }
  }

  prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // ==========================================================================
  // GROSOR DINÁMICO DE PÁGINAS (Canto estratificado en tiempo real)
  // ==========================================================================

  updateDynamicThickness() {
    const totalPages = this.pages.length || 10;
    
    // Si el libro está cerrado, todas las páginas están apiladas a la derecha
    if (this.isClosed || this.coverAngle < 10) {
      const maxEdge = this.generateLayeredEdgeShadow(22, 'right');
      this.container.style.setProperty('--right-edge-shadow', maxEdge);
      this.container.style.setProperty('--left-edge-shadow', 'none');
      return;
    }

    // Ratio de avance: 0 (al inicio de lectura) a 1 (al final de las páginas)
    const ratio = Math.max(0, Math.min(1, (this.currentIndex - 1) / Math.max(1, totalPages - 2)));
    const maxT = 20; // Grosor máximo en px
    const minT = 3;  // Grosor mínimo en px

    const leftT = Math.round(minT + ratio * (maxT - minT));
    const rightT = Math.round(minT + (1 - ratio) * (maxT - minT));

    const leftShadow = this.generateLayeredEdgeShadow(leftT, 'left');
    const rightShadow = this.generateLayeredEdgeShadow(rightT, 'right');

    this.container.style.setProperty('--left-edge-shadow', leftShadow);
    this.container.style.setProperty('--right-edge-shadow', rightShadow);
  }

  generateLayeredEdgeShadow(thickness, side) {
    const isRight = side === 'right';
    const sign = isRight ? 1 : -1;
    const layers = [];

    if (thickness >= 3) {
      layers.push(`${sign * 2}px 0 0 #eae2d0`);
    }
    if (thickness >= 6) {
      layers.push(`${sign * 5}px 1px 0 #ded4be`);
    }
    if (thickness >= 10) {
      layers.push(`${sign * 8}px 2px 0 #cfc3a9`);
    }
    if (thickness >= 14) {
      layers.push(`${sign * 12}px 3px 0 #bdae92`);
    }
    if (thickness >= 18) {
      layers.push(`${sign * 16}px 4px 0 #a39376`);
      layers.push(`${sign * 20}px 5px 0 #8c7b5f`);
    }

    layers.push(`0 3px 0 #ded4be`);
    layers.push(`0 6px 0 #cfc3a9`);
    if (thickness >= 10) {
      layers.push(`0 10px 0 #baa98c`);
      layers.push(`0 16px 24px rgba(0, 0, 0, 0.65)`);
    } else {
      layers.push(`0 8px 12px rgba(0, 0, 0, 0.4)`);
    }

    return layers.join(', ');
  }

  // ==========================================================================
  // A2. APERTURA PROGRESIVA Y GEOMETRÍA CONTINUA (0° a 180°)
  // ==========================================================================

  applyCoverAngle(angle, animated = false) {
    this.coverAngle = Math.max(0, Math.min(180, angle));
    this.container.style.setProperty('--cover-angle', this.coverAngle.toFixed(1));

    const openRatio = this.coverAngle / 180;
    this.container.style.setProperty('--open-ratio', openRatio.toFixed(4));

    const rect = this.container.getBoundingClientRect();
    const pageWidth = rect.width / 2 || 490;
    
    // Centrado continuo sin saltos según el ángulo real
    if (this.isMobile) {
      this.panContainer.style.setProperty('--closed-offset-x', '0px');
    } else {
      const offsetX = (-pageWidth / 2) * (1 - openRatio);
      this.panContainer.style.setProperty('--closed-offset-x', `${offsetX.toFixed(1)}px`);
    }

    // Geometría continua del fondo de cuero (backing)
    const backingLeftStr = `calc(50% - 14px)`;
    const backingWidthStr = `calc(50% + 24px)`;
    this.container.style.setProperty('--backing-left', backingLeftStr);
    this.container.style.setProperty('--backing-width', backingWidthStr);

    // Lomo cerrado vs lomo abierto con atenuación progresiva continua
    if (this.closedSpineEl && !this.isMobile) {
      const closedSpineOpacity = Math.max(0, 1 - openRatio * 2.4);
      this.closedSpineEl.style.opacity = closedSpineOpacity.toFixed(2);
      this.closedSpineEl.style.pointerEvents = closedSpineOpacity > 0.5 ? 'auto' : 'none';
    }
    if (this.spineEl && !this.isMobile) {
      const openSpineOpacity = Math.max(0, (openRatio - 0.25) / 0.75);
      this.spineEl.style.opacity = openSpineOpacity.toFixed(2);
      this.spineEl.style.display = openSpineOpacity > 0.05 ? 'block' : 'none';
    }

    // Estado cerrado estricto solo cuando está prácticamente plano en 0°
    const wasClosed = this.isClosed;
    this.isClosed = this.coverAngle < 5;

    if (this.isClosed) {
      this.container.classList.add('is-closed');
      this.currentIndex = 0;
    } else {
      this.container.classList.remove('is-closed');
      if (this.currentIndex === 0) {
        this.currentIndex = this.isMobile ? 2 : 1;
      }
    }

    // A2: La visibilidad de la página izquierda base no aparece abruptamente:
    // En el pliego inicial (currentIndex <= 1), la tapa frontal rotando ES la página izquierda.
    // Solo cuando el usuario avanza a páginas interiores (currentIndex > 1) se activa la página izquierda estática.
    if (this.currentIndex <= 1) {
      this.container.classList.add('is-cover-view');
      if (this.leftPageEl) {
        this.leftPageEl.style.opacity = '0';
        this.leftPageEl.style.pointerEvents = 'none';
        this.leftPageEl.style.visibility = 'hidden';
      }
    } else {
      this.container.classList.remove('is-cover-view');
      if (this.leftPageEl) {
        this.leftPageEl.style.opacity = '1';
        this.leftPageEl.style.pointerEvents = 'auto';
        this.leftPageEl.style.visibility = 'visible';
      }
    }

    // Visibilidad y z-index de la tapa frontal
    if (this.frontCoverEl) {
      if (this.currentIndex > 1 && this.coverAngle >= 170) {
        this.frontCoverEl.style.display = 'none';
      } else {
        this.frontCoverEl.style.display = 'block';
        this.frontCoverEl.style.zIndex = this.currentIndex <= 1 ? '70' : '1';
      }
    }

    this.updateDynamicThickness();

    if (wasClosed !== this.isClosed) {
      this.notifyChange();
    }
  }

  animateCoverTo(targetAngle, duration = 460, onComplete = null) {
    if (this.isAnimating) return;
    this.isAnimating = true;

    if (this.frontCoverEl) {
      this.frontCoverEl.classList.add('is-settling');
    }

    const startAngle = this.coverAngle;
    const startTime = performance.now();

    const step = (now) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      const ease = 1 - Math.pow(1 - t, 3);
      const current = startAngle + (targetAngle - startAngle) * ease;

      this.applyCoverAngle(current, false);

      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        this.applyCoverAngle(targetAngle, false);
        if (this.frontCoverEl) {
          this.frontCoverEl.classList.remove('is-settling');
        }
        this.isAnimating = false;
        this.renderCurrentSpread();
        this.notifyChange();
        if (onComplete) onComplete();
      }
    };

    requestAnimationFrame(step);
  }

  openBook() {
    if (this.coverAngle >= 170) return;
    this.animateCoverTo(180, 520, () => {
      this.currentIndex = this.isMobile ? 2 : 1;
      this.renderCurrentSpread();
      this.notifyChange();
    });
  }

  closeBook() {
    if (this.coverAngle <= 5) return;
    if (this.currentIndex > 1) {
      this.currentIndex = this.isMobile ? 2 : 1;
      this.renderCurrentSpread();
    }
    this.animateCoverTo(0, 520, () => {
      this.currentIndex = 0;
      this.notifyChange();
    });
  }

  toggleBookOpenClose() {
    if (this.coverAngle < 90) {
      this.openBook();
    } else {
      this.closeBook();
    }
  }

  // ==========================================================================
  // INCLINACIÓN DE PERSPECTIVA (B3)
  // ==========================================================================

  setPitch(pitch) {
    this.viewPitch = Math.max(-55, Math.min(55, pitch));
    this.panContainer.style.setProperty('--view-pitch', `${this.viewPitch.toFixed(1)}deg`);
    this.onPitchChange(this.viewPitch);
  }

  cyclePitch() {
    this.pitchIndex = (this.pitchIndex + 1) % this.pitchLevels.length;
    const nextPitch = this.pitchLevels[this.pitchIndex];
    this.panContainer.style.transition = 'transform 0.4s cubic-bezier(0.2, 0.85, 0.35, 1)';
    this.setPitch(nextPitch);
    setTimeout(() => {
      this.panContainer.style.transition = '';
    }, 420);
  }

  // ==========================================================================
  // A1 y A3. GESTIÓN DE PUNTERO Y SEPARACIÓN DEFINITIVA DE GESTOS
  // 1. Pasar páginas y abrir tapa: SIEMPRE DISPONIBLE por arrastre o clic.
  // 2. Mover libro sobre la mesa: SÓLO con CTRL o modo Desk Pan.
  // 3. Arrastre en la mesa sin CTRL: NO mueve el libro.
  // ==========================================================================

  bindUnifiedGestureEvents() {
    const target = this.panContainer;

    const handlePointerDown = (e) => {
      if (e.button !== 0) return;
      if (this.isAnimating) return;

      // Botones, controles y modales: dejar fluir el evento nativo
      if (e.target.closest('button, a, input, [role="button"]:not(#frontCover), .modal-card, .scene-typewriter')) {
        return;
      }

      // GESTO 1: Inclinación de vista con SHIFT (B3)
      if (e.shiftKey) {
        e.preventDefault();
        this.gestureStartPointerY = e.clientY;
        this.startPitchGesture(e);
        return;
      }

      // GESTO 2: Desplazamiento del libro sobre la mesa (Desk Pan)
      // REGLA A3: SÓLO con CTRL presionado o si está activo el modo Desk Pan accesible
      if (e.ctrlKey || this.isDeskPanMode) {
        e.preventDefault();
        this.gestureStartPointerX = e.clientX;
        this.gestureStartPointerY = e.clientY;
        this.startBookPanGesture(e, true);
        return;
      }

      // GESTO 3: Interacción directa con el libro físico (Tapa o Páginas)
      // Si el usuario toca el escritorio fuera del libro SIN CTRL: NO MOVER EL LIBRO
      const touchedBook = e.target.closest('#bookContainer');
      if (!touchedBook) {
        return; // Clic o arrastre neutro sobre la mesa no desplaza el libro
      }

      this.gestureStartTime = performance.now();
      this.gestureStartPointerX = e.clientX;
      this.gestureStartPointerY = e.clientY;
      this.lastPointerX = e.clientX;
      this.lastPointerTime = performance.now();
      this.pointerVelocityX = 0;

      const rect = this.container.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      this.grabNormX = (e.clientX - centerX) / (rect.width / 2);
      this.grabNormY = (e.clientY - centerY) / (rect.height / 2);

      // CASO A: Libro cerrado o en inicio de apertura
      if (this.isClosed || this.coverAngle < 15) {
        this.startCoverDragGesture(e);
        return;
      }

      // CASO B: Libro abierto o entreabierto
      const isLeftTouch = (e.clientX < centerX);

      if (isLeftTouch) {
        if (this.currentIndex > 1) {
          // En pliegos interiores (página 3 en adelante), arrastrar a la derecha retrocede de página
          this.startPageDragGesture(e, 'prev');
          return;
        } else {
          // En pliego 1 (o portada), el hemisferio izquierdo es la contratapa/tapa: arrastrar a la derecha la cierra
          this.startCoverDragGesture(e);
          return;
        }
      }

      // Hemisferio derecho (avance de página o apertura de tapa)
      if (!isLeftTouch) {
        if (this.coverAngle < 165) {
          this.startCoverDragGesture(e);
          return;
        } else {
          this.startPageDragGesture(e, 'next');
          return;
        }
      }
    };

    target.addEventListener('pointerdown', handlePointerDown);
  }

  // --- GESTO: Inclinación de la vista con SHIFT (B3) ---
  startPitchGesture(e) {
    this.activeGesture = 'VIEW_PITCH';
    this.gestureStartPitch = this.viewPitch;
    try { this.panContainer.setPointerCapture(e.pointerId); } catch (_) {}

    const handlePointerMove = (moveEvt) => {
      if (this.activeGesture !== 'VIEW_PITCH') return;
      const deltaY = moveEvt.clientY - this.gestureStartPointerY;
      const newPitch = this.gestureStartPitch - deltaY * 0.22;
      this.setPitch(newPitch);
    };

    const handlePointerUp = (upEvt) => {
      if (this.activeGesture !== 'VIEW_PITCH') return;
      this.activeGesture = null;
      try { this.panContainer.releasePointerCapture(upEvt.pointerId); } catch (_) {}
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  }

  // --- GESTO: Apertura y Cierre de la Tapa ---
  startCoverDragGesture(e) {
    this.activeGesture = 'COVER';
    this.gestureStartCoverAngle = this.coverAngle;
    if (this.frontCoverEl) {
      this.frontCoverEl.classList.add('is-dragging');
    }
    try { this.panContainer.setPointerCapture(e.pointerId); } catch (_) {}

    const rect = this.container.getBoundingClientRect();
    const pageWidth = rect.width / 2 || 490;

    const handlePointerMove = (moveEvt) => {
      if (this.activeGesture !== 'COVER') return;

      const now = performance.now();
      const dt = now - this.lastPointerTime;
      if (dt > 10) {
        this.pointerVelocityX = (moveEvt.clientX - this.lastPointerX) / dt;
        this.lastPointerX = moveEvt.clientX;
        this.lastPointerTime = now;
      }

      const deltaX = this.gestureStartPointerX - moveEvt.clientX;
      const angleDelta = (deltaX / pageWidth) * 180;
      const newAngle = Math.max(0, Math.min(180, this.gestureStartCoverAngle + angleDelta));

      this.applyCoverAngle(newAngle, false);
    };

    const handlePointerUp = (upEvt) => {
      if (this.activeGesture !== 'COVER') return;
      this.activeGesture = null;

      if (this.frontCoverEl) {
        this.frontCoverEl.classList.remove('is-dragging');
      }

      try { this.panContainer.releasePointerCapture(upEvt.pointerId); } catch (_) {}
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);

      const totalDist = Math.abs(upEvt.clientX - this.gestureStartPointerX);
      const isQuickClick = (totalDist < 12 && (performance.now() - this.gestureStartTime < 300));

      if (isQuickClick) {
        this.toggleBookOpenClose();
        return;
      }

      // Asentamiento físico
      if (this.pointerVelocityX < -0.35) {
        this.animateCoverTo(180, 420);
      } else if (this.pointerVelocityX > 0.35) {
        this.animateCoverTo(0, 420);
      } else if (this.coverAngle < 90) {
        this.animateCoverTo(0, 360);
      } else {
        this.animateCoverTo(180, 360);
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  }

  // ==========================================================================
  // A1. PASO DE PÁGINA BIDIRECCIONAL POR ARRASTRE (AVANCE Y RETROCESO)
  // ==========================================================================

  startPageDragGesture(e, direction) {
    if (this.isAnimating) return;

    // Si estamos en la página 1 y se retrocede hacia la derecha, iniciar cierre de tapa
    if (direction === 'prev' && this.currentIndex <= 1) {
      this.startCoverDragGesture(e);
      return;
    }

    // Comprobar límites
    const maxIndex = this.pages.length - 2;
    if (direction === 'next' && this.currentIndex >= maxIndex) return;
    if (direction === 'prev' && this.currentIndex <= 1) return;

    this.activeGesture = direction === 'next' ? 'PAGE_NEXT' : 'PAGE_PREV';
    this.leafProgress = 0;

    const rect = this.container.getBoundingClientRect();
    const pageWidth = rect.width / 2 || 490;

    // Crear la hoja 3D dinámica
    const leaf = document.createElement('div');
    leaf.className = `flipping-leaf is-dragging-leaf ${direction === 'prev' ? 'flip-left-to-right' : 'flip-right-to-left'}`;

    let frontContent = '';
    let backContent = '';

    if (direction === 'next') {
      const oldRightData = this.getVisiblePages().right;
      const nextLeftIndex = this.currentIndex + 2;
      const newLeftData = this.pages[nextLeftIndex];

      frontContent = this.renderPageContent(oldRightData);
      backContent = this.renderPageContent(newLeftData);

      // Actualizar página derecha base temporalmente para que al levantarse la hoja se vea la siguiente
      if (this.rightContentEl && this.pages[nextLeftIndex + 1]) {
        this.rightContentEl.innerHTML = this.renderPageContent(this.pages[nextLeftIndex + 1]);
      }
    } else {
      const currentLeftData = this.getVisiblePages().left;
      const targetIndex = Math.max(1, this.currentIndex - 2);
      const prevRightData = this.pages[targetIndex + 1];

      frontContent = this.renderPageContent(currentLeftData);
      backContent = this.renderPageContent(prevRightData);

      // Actualizar página izquierda base temporalmente para que al levantarse la hoja se vea la anterior
      if (this.leftContentEl && this.pages[targetIndex]) {
        this.leftContentEl.innerHTML = this.renderPageContent(this.pages[targetIndex]);
      }
    }

    leaf.innerHTML = `
      <div class="leaf-face front">
        <div class="page-inner-content">${frontContent}</div>
        <div class="leaf-shadow-overlay"></div>
      </div>
      <div class="leaf-face back">
        <div class="page-inner-content">${backContent}</div>
        <div class="leaf-shadow-overlay"></div>
      </div>
    `;

    this.bookBodyEl.appendChild(leaf);
    this.activeLeafEl = leaf;
    try { this.panContainer.setPointerCapture(e.pointerId); } catch (_) {}

    const handlePointerMove = (moveEvt) => {
      if (!this.activeLeafEl) return;

      const now = performance.now();
      const dt = now - this.lastPointerTime;
      if (dt > 10) {
        this.pointerVelocityX = (moveEvt.clientX - this.lastPointerX) / dt;
        this.lastPointerX = moveEvt.clientX;
        this.lastPointerTime = now;
      }

      // Delta según la dirección
      const deltaX = direction === 'next'
        ? (this.gestureStartPointerX - moveEvt.clientX)
        : (moveEvt.clientX - this.gestureStartPointerX);

      const progress = Math.max(0, Math.min(1, deltaX / (pageWidth * 1.15)));
      this.leafProgress = progress;

      // Rotación tridimensional pura en el eje del lomo
      const angle = direction === 'next' ? (-180 * progress) : (180 * progress);
      const sinP = Math.sin(progress * Math.PI);
      const liftZ = sinP * 26; // Elevación vertical en el cenit de la curva

      // Resalte cilíndrico de curvatura óptica y sombra
      const crestPos = (progress * 80 + 10).toFixed(0);
      leaf.style.transform = `rotateY(${angle.toFixed(1)}deg) translateZ(${liftZ.toFixed(1)}px)`;
      leaf.style.setProperty('--leaf-crest', `${crestPos}%`);
      leaf.style.setProperty('--leaf-shadow-opacity', (sinP * 0.75).toFixed(2));
    };

    const handlePointerUp = (upEvt) => {
      if (!this.activeLeafEl) return;
      this.activeGesture = null;

      try { this.panContainer.releasePointerCapture(upEvt.pointerId); } catch (_) {}
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);

      const totalDist = Math.abs(upEvt.clientX - this.gestureStartPointerX);
      const isQuickClick = (totalDist < 14 && (performance.now() - this.gestureStartTime < 320));

      if (isQuickClick) {
        // Clic rápido en la página: completar el giro inmediatamente
        this.finishLeafTurn(direction, true, leaf);
        return;
      }

      // Decisión de completar o cancelar el giro
      const shouldComplete = this.leafProgress > 0.35 || 
        (direction === 'next' && this.pointerVelocityX < -0.25) || 
        (direction === 'prev' && this.pointerVelocityX > 0.25);

      this.finishLeafTurn(direction, shouldComplete, leaf);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  }

  finishLeafTurn(direction, complete, leafEl) {
    this.isAnimating = true;
    leafEl.classList.remove('is-dragging-leaf');
    leafEl.classList.add('is-finishing-turn');

    const targetAngle = complete
      ? (direction === 'next' ? -180 : 180)
      : 0;

    leafEl.style.transform = `rotateY(${targetAngle}deg) translateZ(0px)`;
    leafEl.style.setProperty('--leaf-shadow-opacity', '0');

    let isDone = false;
    const cleanup = () => {
      if (isDone) return;
      isDone = true;
      leafEl.removeEventListener('transitionend', cleanup);
      leafEl.remove();
      this.activeLeafEl = null;

      if (complete) {
        if (direction === 'next') {
          this.currentIndex = Math.min(this.pages.length - 2, this.currentIndex + 2);
        } else {
          this.currentIndex = Math.max(1, this.currentIndex - 2);
        }
      }

      this.renderCurrentSpread();
      this.updateDynamicThickness();
      this.isAnimating = false;
      this.notifyChange();
    };

    leafEl.addEventListener('transitionend', cleanup);
    setTimeout(cleanup, 780); // Temporizador de seguridad con cadencia física (750ms)
  }

  // --- GESTO: Desplazamiento del Libro (Desk Pan) ---
  startBookPanGesture(e, isTwoHand) {
    if (this.isMobile) return;
    this.activeGesture = 'BOOK_PAN';
    this.isTwoHandMode = isTwoHand || e.ctrlKey;
    this.panContainer.classList.add('is-dragging');

    this.gestureStartPanX = this.panX;
    this.gestureStartPanY = this.panY;
    try { this.panContainer.setPointerCapture(e.pointerId); } catch (_) {}

    const handlePointerMove = (moveEvt) => {
      if (this.activeGesture !== 'BOOK_PAN') return;
      const deltaX = moveEvt.clientX - this.gestureStartPointerX;
      const deltaY = moveEvt.clientY - this.gestureStartPointerY;

      this.panX = Math.max(-280, Math.min(280, this.gestureStartPanX + deltaX));
      this.panY = Math.max(-160, Math.min(160, this.gestureStartPanY + deltaY));

      if (this.isTwoHandMode) {
        this.rotZ = (this.panX * 0.015);
        this.rotX = (this.panY * -0.012);
      } else {
        const torqueZ = (this.panX * 0.035) + (this.grabNormX * 3.5);
        const torqueX = (this.panY * -0.03) - (this.grabNormY * 3.0);
        this.rotZ = Math.max(-8, Math.min(8, torqueZ));
        this.rotX = Math.max(-6, Math.min(6, torqueX));
      }

      this.applyPanTransform();
    };

    const handlePointerUp = (upEvt) => {
      if (this.activeGesture !== 'BOOK_PAN') return;
      this.activeGesture = null;
      this.panContainer.classList.remove('is-dragging');

      try { this.panContainer.releasePointerCapture(upEvt.pointerId); } catch (_) {}
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);

      // Inercia de retorno de rotaciones
      this.panContainer.style.transition = 'transform 0.4s cubic-bezier(0.2, 0.85, 0.35, 1)';
      this.rotX = 0;
      this.rotZ = 0;
      this.applyPanTransform();

      setTimeout(() => {
        this.panContainer.style.transition = '';
      }, 420);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  }

  applyPanTransform() {
    this.panContainer.style.setProperty('--pan-x', `${this.panX.toFixed(1)}px`);
    this.panContainer.style.setProperty('--pan-y', `${this.panY.toFixed(1)}px`);
    this.panContainer.style.setProperty('--pan-rot-x', `${this.rotX.toFixed(1)}deg`);
    this.panContainer.style.setProperty('--pan-rot-z', `${this.rotZ.toFixed(1)}deg`);
  }

  resetPan() {
    this.panContainer.style.transition = 'transform 0.5s cubic-bezier(0.2, 0.85, 0.35, 1)';
    this.panX = 0;
    this.panY = 0;
    this.rotX = 0;
    this.rotZ = 0;
    this.setPitch(18);
    this.applyPanTransform();

    setTimeout(() => {
      this.panContainer.style.transition = '';
    }, 520);
  }

  // ==========================================================================
  // TECLADO MODIFICADOR (CTRL)
  // ==========================================================================

  bindKeyboardModifiers() {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Control') {
        this.setTwoHandMode(true);
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.key === 'Control') {
        this.setTwoHandMode(false);
      }
    });

    window.addEventListener('blur', () => {
      this.setTwoHandMode(false);
    });
  }

  setTwoHandMode(active) {
    if (this.isTwoHandMode === active) return;
    this.isTwoHandMode = active;
    if (active) {
      this.panContainer.classList.add('is-two-hands');
    } else {
      this.panContainer.classList.remove('is-two-hands');
    }
    this.onTwoHandChange(active);
  }

  // ==========================================================================
  // SOPORTE TÁCTIL MÓVIL (SWIPE SUAVE)
  // ==========================================================================

  bindTouchSwipe() {
    let touchStartX = 0;
    let touchStartY = 0;

    this.container.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    this.container.addEventListener('touchend', (e) => {
      const touchEndX = e.changedTouches[0].screenX;
      const touchEndY = e.changedTouches[0].screenY;
      const diffX = touchEndX - touchStartX;
      const diffY = touchEndY - touchStartY;

      if (Math.abs(diffX) > 45 && Math.abs(diffX) > Math.abs(diffY)) {
        if (diffX < 0) {
          this.nextPage();
        } else {
          this.prevPage();
        }
      }
    }, { passive: true });
  }

  // ==========================================================================
  // NAVEGACIÓN PROGRAMÁTICA (BOTONES / TECLAS DE FLECHA)
  // ==========================================================================

  nextPage() {
    if (this.isAnimating) return;

    if (this.coverAngle < 90) {
      this.openBook();
      return;
    }

    const maxIndex = this.pages.length - 2;
    if (this.currentIndex >= maxIndex) return;

    if (this.isMobile) {
      this.currentIndex = Math.min(maxIndex, this.currentIndex + 1);
      this.renderCurrentSpread();
      this.updateDynamicThickness();
      this.notifyChange();
      return;
    }

    if (this.prefersReducedMotion()) {
      this.currentIndex = Math.min(maxIndex, this.currentIndex + 2);
      this.renderCurrentSpread();
      this.updateDynamicThickness();
      this.notifyChange();
      return;
    }

    this.isAnimating = true;
    const oldRightData = this.getVisiblePages().right;
    const nextLeftIndex = this.currentIndex + 2;
    const newLeftData = this.pages[nextLeftIndex];

    // Revelar la página siguiente que quedará debajo en el hemisferio derecho
    if (this.rightContentEl && this.pages[nextLeftIndex + 1]) {
      this.rightContentEl.innerHTML = this.renderPageContent(this.pages[nextLeftIndex + 1]);
    }

    const leaf = document.createElement('div');
    leaf.className = 'flipping-leaf flip-right-to-left is-finishing-turn';
    leaf.innerHTML = `
      <div class="leaf-face front">
        <div class="page-inner-content">${this.renderPageContent(oldRightData)}</div>
        <div class="leaf-shadow-overlay"></div>
      </div>
      <div class="leaf-face back">
        <div class="page-inner-content">${this.renderPageContent(newLeftData)}</div>
        <div class="leaf-shadow-overlay"></div>
      </div>
    `;

    this.bookBodyEl.appendChild(leaf);
    this.activeLeafEl = leaf;
    void leaf.offsetWidth; // Reflow

    leaf.style.transform = 'rotateY(-180deg) translateZ(0px)';
    leaf.style.setProperty('--leaf-crest', '90%');
    leaf.style.setProperty('--leaf-shadow-opacity', '0');

    let finished = false;
    const handleAnimEnd = () => {
      if (finished) return;
      finished = true;
      leaf.removeEventListener('transitionend', handleAnimEnd);
      leaf.remove();
      this.activeLeafEl = null;
      this.currentIndex = Math.min(maxIndex, this.currentIndex + 2);
      this.renderCurrentSpread();
      this.updateDynamicThickness();
      this.isAnimating = false;
      this.notifyChange();
    };

    leaf.addEventListener('transitionend', handleAnimEnd);
    setTimeout(handleAnimEnd, 780);
  }

  prevPage() {
    if (this.isAnimating) return;

    if (this.coverAngle < 90) return;

    if (this.isMobile) {
      if (this.currentIndex <= 2) {
        this.closeBook();
        return;
      }
      this.currentIndex = Math.max(2, this.currentIndex - 1);
      this.renderCurrentSpread();
      this.updateDynamicThickness();
      this.notifyChange();
      return;
    }

    if (this.currentIndex <= 1) {
      this.closeBook();
      return;
    }

    if (this.prefersReducedMotion()) {
      this.currentIndex = Math.max(1, this.currentIndex - 2);
      this.renderCurrentSpread();
      this.updateDynamicThickness();
      this.notifyChange();
      return;
    }

    this.isAnimating = true;
    const currentLeftData = this.getVisiblePages().left;
    const targetIndex = Math.max(1, this.currentIndex - 2);
    const prevRightData = this.pages[targetIndex + 1];

    // Revelar la página previa que quedará debajo en el hemisferio izquierdo
    if (this.leftContentEl && this.pages[targetIndex]) {
      this.leftContentEl.innerHTML = this.renderPageContent(this.pages[targetIndex]);
    }

    const leaf = document.createElement('div');
    leaf.className = 'flipping-leaf flip-left-to-right is-finishing-turn';
    leaf.innerHTML = `
      <div class="leaf-face front">
        <div class="page-inner-content">${this.renderPageContent(currentLeftData)}</div>
        <div class="leaf-shadow-overlay"></div>
      </div>
      <div class="leaf-face back">
        <div class="page-inner-content">${this.renderPageContent(prevRightData)}</div>
        <div class="leaf-shadow-overlay"></div>
      </div>
    `;

    this.bookBodyEl.appendChild(leaf);
    this.activeLeafEl = leaf;
    void leaf.offsetWidth; // Reflow

    leaf.style.transform = 'rotateY(180deg) translateZ(0px)';
    leaf.style.setProperty('--leaf-crest', '10%');
    leaf.style.setProperty('--leaf-shadow-opacity', '0');

    let finished = false;
    const handleAnimEnd = () => {
      if (finished) return;
      finished = true;
      leaf.removeEventListener('transitionend', handleAnimEnd);
      leaf.remove();
      this.activeLeafEl = null;
      this.currentIndex = targetIndex;
      this.renderCurrentSpread();
      this.updateDynamicThickness();
      this.isAnimating = false;
      this.notifyChange();
    };

    leaf.addEventListener('transitionend', handleAnimEnd);
    setTimeout(handleAnimEnd, 780);
  }

  // ==========================================================================
  // RENDERIZADO DEL PLIEGO
  // ==========================================================================

  getVisiblePages() {
    if (this.isClosed || this.currentIndex <= 0) {
      return { left: null, right: this.pages[0] || null };
    }

    if (this.isMobile) {
      return { left: null, right: this.pages[this.currentIndex] || null };
    }

    if (this.currentIndex >= this.pages.length - 2) {
      return {
        left: this.pages[this.pages.length - 2] || null,
        right: this.pages[this.pages.length - 1] || null
      };
    }

    const leftIndex = this.currentIndex % 2 === 1 ? this.currentIndex : this.currentIndex - 1;
    const rightIndex = leftIndex + 1;

    return {
      left: this.pages[leftIndex] || null,
      right: this.pages[rightIndex] || null
    };
  }

  renderCurrentSpread() {
    const { left, right } = this.getVisiblePages();

    // Actualizar guarda interior de la tapa frontal (en reverso de portada)
    if (this.frontCoverBackContentEl && this.pages[1]) {
      this.frontCoverBackContentEl.innerHTML = this.renderPageContent(this.pages[1]);
    }

    if (this.isMobile) {
      if (this.leftPageEl) {
        this.leftPageEl.style.display = 'none';
      }
      if (this.rightPageEl) {
        this.rightPageEl.style.display = 'flex';
        this.rightPageEl.style.width = '100%';
        this.rightContentEl.innerHTML = this.renderPageContent(right);
      }
      if (this.spineEl) this.spineEl.style.display = 'none';
      return;
    }

    // Modo escritorio abierto
    if (this.spineEl) {
      const openRatio = this.coverAngle / 180;
      this.spineEl.style.display = openRatio > 0.15 ? 'block' : 'none';
    }

    // Visibilidad de página izquierda base
    if (this.leftPageEl) {
      this.leftPageEl.style.display = 'flex';
      this.leftPageEl.style.width = '50%';
      this.leftContentEl.innerHTML = this.renderPageContent(left);
      if (this.currentIndex <= 1) {
        this.container.classList.add('is-cover-view');
        this.leftPageEl.style.opacity = '0';
        this.leftPageEl.style.pointerEvents = 'none';
        this.leftPageEl.style.visibility = 'hidden';
      } else {
        this.container.classList.remove('is-cover-view');
        this.leftPageEl.style.opacity = '1';
        this.leftPageEl.style.pointerEvents = 'auto';
        this.leftPageEl.style.visibility = 'visible';
      }
    }

    if (this.rightPageEl) {
      this.rightPageEl.style.display = 'flex';
      this.rightPageEl.style.width = '50%';
      this.rightContentEl.innerHTML = this.renderPageContent(right);
    }

    // Asegurar jerarquía física: en pliegos interiores la tapa queda por detrás y no intercepta clics
    if (this.frontCoverEl) {
      if (this.currentIndex <= 1) {
        this.frontCoverEl.style.display = 'block';
        this.frontCoverEl.style.zIndex = '70';
        this.frontCoverEl.style.pointerEvents = 'auto';
      } else {
        this.frontCoverEl.style.display = 'none';
        this.frontCoverEl.style.zIndex = '1';
        this.frontCoverEl.style.pointerEvents = 'none';
      }
    }
  }

  renderPageContent(pageData) {
    if (!pageData) {
      return `<div class="page-content-wrapper sheet-layout guard-sheet"><div class="sheet-main-content"></div></div>`;
    }

    if (pageData.sheetNumber) {
      const imageHtml = pageData.image 
        ? `<img src="${pageData.image}" alt="Hoja ${pageData.sheetLabel}" class="sheet-scanned-image" loading="lazy">` 
        : '';
      return `
        <div class="page-content-wrapper sheet-layout" data-sheet-index="${pageData.sheetNumber}">
          <div class="sheet-main-content" data-sheet="${pageData.sheetNumber}">
            ${imageHtml}
          </div>
          <footer class="sheet-footer">
            <span class="sheet-number-display">${pageData.sheetLabel}</span>
          </footer>
        </div>
      `;
    }

    if (pageData.type === 'inside-cover' || pageData.type === 'inside-back-cover') {
      return `
        <div class="page-content-wrapper sheet-layout guard-sheet">
          <div class="sheet-main-content"></div>
        </div>
      `;
    }

    return `
      <div class="page-content-wrapper sheet-layout">
        <div class="sheet-main-content"></div>
      </div>
    `;
  }

  // ==========================================================================
  // ACCESIBILIDAD Y METADATOS
  // ==========================================================================

  getCurrentTranscription() {
    const { left, right } = this.getVisiblePages();
    let text = `Transcripción accesible de lectura — "Libro para mis hijos"\n`;
    text += `Autor: ${this.metadata.author}\n\n`;

    if (this.isClosed) {
      text += `[Estado: Libro cerrado sobre el escritorio]\n`;
      text += `${this.pages[0]?.transcription || 'Tapa frontal con títulos en bajo relieve.'}\n`;
      return text;
    }

    if (left) {
      const leftTitle = left.sheetLabel ? `Hoja ${left.sheetLabel}` : (left.title || 'Guarda');
      text += `--- LADO IZQUIERDO (${leftTitle}) ---\n`;
      text += `${left.transcription || '(Hoja vacía preparada para escaneo original)'}\n\n`;
    }

    if (right) {
      const rightTitle = right.sheetLabel ? `Hoja ${right.sheetLabel}` : (right.title || 'Guarda');
      text += `--- LADO DERECHO (${rightTitle}) ---\n`;
      text += `${right.transcription || '(Hoja vacía preparada para escaneo original)'}\n\n`;
    }

    return text;
  }

  goToPage(pageIndex) {
    const maxIndex = this.pages.length - 2;
    const target = Math.max(0, Math.min(maxIndex, pageIndex));
    if (target === 0) {
      this.closeBook();
      return;
    }
    if (this.isClosed) {
      this.openBook();
    }
    this.currentIndex = target;
    this.renderCurrentSpread();
    this.updateDynamicThickness();
    this.notifyChange();
  }

  goToSheet(sheetNum) {
    if (sheetNum < 1 || sheetNum > 35) return;
    const targetPageIndex = sheetNum + 1; // hoja 1 está en el índice 2
    if (this.isClosed) {
      this.openBook();
    }
    if (this.isMobile) {
      this.currentIndex = targetPageIndex;
    } else {
      this.currentIndex = targetPageIndex % 2 === 1 ? targetPageIndex : targetPageIndex - 1;
    }
    this.renderCurrentSpread();
    this.updateDynamicThickness();
    this.notifyChange();
  }

  notifyChange() {
    const state = {
      currentIndex: this.currentIndex,
      totalPages: this.pages.length,
      isClosed: this.isClosed,
      coverAngle: this.coverAngle,
      canGoNext: this.currentIndex < (this.pages.length - 2),
      canGoPrev: this.currentIndex > 0 || this.coverAngle > 10,
      visiblePages: this.getVisiblePages(),
      isDeskPanMode: this.isDeskPanMode,
      isDragEnabled: this.isDeskPanMode
    };
    this.onPageChange(state);
  }
}
