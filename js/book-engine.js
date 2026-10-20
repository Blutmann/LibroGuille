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

    // Inclinación visual de la cámara en dos ejes (Pitch: -70° a +70°, Yaw: -45° a +45°)
    this.viewPitch = 16;
    this.viewYaw = 0;
    this.pitchPresets = [
      { label: '0° · Neutro', pitch: 0 },
      { label: '16° · Lectura suave', pitch: 16 },
      { label: '32° · Perspectiva', pitch: 32 },
      { label: '48° · Profunda', pitch: 48 },
      { label: '-18° · Contrapicado', pitch: -18 }
    ];
    this.pitchIndex = 1;

    // Escala del libro (0.65 a 1.25)
    this.bookScale = 1.0;
    this.gestureStartScale = 1.0;

    // Estado del desplazamiento del libro sobre el escritorio (Desk Pan)
    this.panX = 0;
    this.panY = 0;
    this.rotX = 0;
    this.rotZ = 0;
    this.isTwoHandMode = false;

    // Máquina de estados de gestos unificada con Target Locking
    this.activeGesture = null; // 'COVER' | 'PAGE_NEXT' | 'PAGE_PREV' | 'BOOK_PAN' | 'VIEW_PITCH' | 'BOOK_SCALE' | null
    this.gestureStartPointerX = 0;
    this.gestureStartPointerY = 0;
    this.gestureStartCoverAngle = 0;
    this.gestureStartPanX = 0;
    this.gestureStartPanY = 0;
    this.gestureStartPitch = 16;
    this.gestureStartYaw = 0;
    this.grabNormX = 0;
    this.grabNormY = 0;
    this.lastPointerX = 0;
    this.lastPointerTime = 0;
    this.pointerVelocityX = 0;

    // Estado de arrastre progresivo de la hoja interior
    this.activeLeafEl = null;
    this.leafProgress = 0; // 0.0 a 1.0

    // Referencias DOM base
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

    // Referencias y estado de inspección de recortes en primer plano
    this.sceneBookEl = document.getElementById('sceneBook');
    this.clippingInspectionLayer = document.getElementById('clippingInspectionLayer');
    this.clippingBackdrop = document.getElementById('clippingBackdrop');
    this.clippingStage = document.getElementById('clippingStage');
    this.clippingFloatingCard = document.getElementById('clippingFloatingCard');
    this.clippingFloatingImg = document.getElementById('clippingFloatingImg');
    this.btnCloseClipping = document.getElementById('btnCloseClipping');

    this.isForegroundClippingActive = false;
    this.isClippingAnimating = false;
    this.activeClippingSourceEl = null;
    this.clippingPanX = 0;
    this.clippingPanY = 0;
    this.clippingRotX = 0;
    this.clippingRotY = 0;
    this.clippingScale = 1.0;
    this.sourceRotation = 0;

    // Callbacks
    this.onPageChange = options.onPageChange || (() => {});
    this.onTwoHandChange = options.onTwoHandChange || (() => {});
    this.onPitchChange = options.onPitchChange || (() => {});
    this.onYawChange = options.onYawChange || (() => {});
    this.onTiltChange = options.onTiltChange || (() => {});
    this.onScaleChange = options.onScaleChange || (() => {});
    this.onDragModeChange = options.onDragModeChange || (() => {});

    this.init();
  }

  checkIfMobile() {
    return window.innerWidth <= 720;
  }

  init() {
    this.setupBookDom();
    this.panContainer.style.setProperty('--view-pitch', `${this.viewPitch.toFixed(1)}deg`);
    this.panContainer.style.setProperty('--view-yaw', `${this.viewYaw.toFixed(1)}deg`);
    this.applyCoverAngle(0, false);
    this.updateDynamicThickness();
    this.renderCurrentSpread();
    this.bindUnifiedGestureEvents();
    this.bindKeyboardModifiers();
    this.bindTouchSwipe();
    this.bindClippingInspectionEvents();

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
        <!-- Cantos físicos tridimensionales (cabeza y pie del bloque de hojas) -->
        <div class="page-block-head head-left" id="blockHeadLeft" aria-hidden="true"></div>
        <div class="page-block-head head-right" id="blockHeadRight" aria-hidden="true"></div>
        <div class="page-block-tail tail-left" id="blockTailLeft" aria-hidden="true"></div>
        <div class="page-block-tail tail-right" id="blockTailRight" aria-hidden="true"></div>

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
            <div class="book-cover-view" aria-label="Tapa del libro: cuaderno para mis hijos, Papá 1984">
              <span class="sr-only">Tapa del libro: cuaderno para mis hijos, Papá 1984</span>

              <!-- Bolsillo de plástico transparente adherido en el sector inferior derecho -->
              <div class="cover-pocket-sleeve" aria-label="Tarjeta: cuaderno para mis hijos, Papá 1984">
                <!-- Tarjeta rectangular de papel viejo amarillo cálido -->
                <div class="cover-card-paper">
                  <img src="assets/cover/card-handwriting-ink.png" alt="cuaderno para mis hijos, Papá 1984" class="card-original-handwriting-img" loading="eager">
                  <span class="sr-only">cuaderno para mis hijos, Papá 1984</span>
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

    // Pre-cargar Hoja 01 en la base derecha para que al abrir la tapa se descubra progresivamente
    if (this.rightContentEl && this.pages[2]) {
      this.rightContentEl.innerHTML = this.renderPageContent(this.pages[2]);
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
      this.container.style.setProperty('--left-thickness', '0px');
      this.container.style.setProperty('--right-thickness', '22px');
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
    this.container.style.setProperty('--left-thickness', `${leftT}px`);
    this.container.style.setProperty('--right-thickness', `${rightT}px`);
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
    if (this.isForegroundClippingActive) return;
    if (this.coverAngle >= 170) return;
    this.animateCoverTo(180, 520, () => {
      this.currentIndex = this.isMobile ? 2 : 1;
      this.renderCurrentSpread();
      this.notifyChange();
    });
  }

  closeBook() {
    if (this.isForegroundClippingActive) return;
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
    if (this.isForegroundClippingActive) return;
    if (this.coverAngle < 90) {
      this.openBook();
    } else {
      this.closeBook();
    }
  }

  // ==========================================================================
  // INCLINACIÓN DE PERSPECTIVA BIDIMENSIONAL (PITCH / YAW) CON SHIFT
  // ==========================================================================

  setPitch(pitch) {
    this.viewPitch = Math.max(-70, Math.min(70, pitch));
    this.panContainer.style.setProperty('--view-pitch', `${this.viewPitch.toFixed(1)}deg`);
    this.onPitchChange(this.viewPitch);
    if (typeof this.onTiltChange === 'function') {
      this.onTiltChange({ pitch: this.viewPitch, yaw: this.viewYaw });
    }
  }

  setYaw(yaw) {
    this.viewYaw = Math.max(-45, Math.min(45, yaw));
    this.panContainer.style.setProperty('--view-yaw', `${this.viewYaw.toFixed(1)}deg`);
    if (typeof this.onYawChange === 'function') {
      this.onYawChange(this.viewYaw);
    }
    if (typeof this.onTiltChange === 'function') {
      this.onTiltChange({ pitch: this.viewPitch, yaw: this.viewYaw });
    }
  }

  setTilt(pitch, yaw) {
    this.viewPitch = Math.max(-70, Math.min(70, pitch));
    this.viewYaw = Math.max(-45, Math.min(45, yaw));
    this.panContainer.style.setProperty('--view-pitch', `${this.viewPitch.toFixed(1)}deg`);
    this.panContainer.style.setProperty('--view-yaw', `${this.viewYaw.toFixed(1)}deg`);
    this.onPitchChange(this.viewPitch);
    if (typeof this.onYawChange === 'function') {
      this.onYawChange(this.viewYaw);
    }
    if (typeof this.onTiltChange === 'function') {
      this.onTiltChange({ pitch: this.viewPitch, yaw: this.viewYaw });
    }
  }

  setPresetPitch(pitch) {
    this.panContainer.style.transition = 'transform 0.4s cubic-bezier(0.2, 0.85, 0.35, 1)';
    this.setTilt(pitch, 0);
    const foundIndex = this.pitchPresets.findIndex(p => Math.abs(p.pitch - pitch) < 0.5);
    if (foundIndex !== -1) {
      this.pitchIndex = foundIndex;
    }
    setTimeout(() => {
      this.panContainer.style.transition = '';
    }, 420);
  }

  cyclePitch() {
    this.pitchIndex = (this.pitchIndex + 1) % this.pitchPresets.length;
    const nextPitch = this.pitchPresets[this.pitchIndex].pitch;
    this.setPresetPitch(nextPitch);
  }

  // ==========================================================================
  // ESCALA Y TAMAÑO DEL LIBRO (CTRL + arrastre horizontal)
  // ==========================================================================

  setScale(scale) {
    this.bookScale = Math.max(0.65, Math.min(1.25, scale));
    this.panContainer.style.setProperty('--book-scale', this.bookScale.toFixed(3));
    this.onScaleChange(this.bookScale);
  }

  zoomIn(step = 0.1) {
    this.setScale(Math.round((this.bookScale + step) * 100) / 100);
  }

  zoomOut(step = 0.1) {
    this.setScale(Math.round((this.bookScale - step) * 100) / 100);
  }

  resetScale() {
    this.setScale(1.0);
  }

  // ==========================================================================
  // GESTIÓN DE PUNTERO Y ASIGNACIÓN DEFINITIVA DE CONTROLES
  // 1. Sin teclas: Pasar páginas y abrir tapa por arrastre o clic.
  // 2. ALT + arrastrar: Mover libro en el espacio (Desk Pan).
  // 3. SHIFT + arrastrar: Inclinar el libro (Pitch/Tilt).
  // 4. CTRL + arrastrar horizontal: Cambiar tamaño del libro (Zoom).
  // ==========================================================================

  // Polígonos normalizados (0 a 100%) del contorno irregular de corte de tijera
  getClippingPolygon(type) {
    switch (type) {
      case 'sarmiento':
        return [
          [1.05, 0.59], [12.13, 0.68], [28.87, 0.82], [49.79, 0.94], [70.71, 1.12], [87.45, 1.32], [98.54, 1.53],
          [98.95, 2.06], [98.83, 14.41], [98.74, 29.12], [98.54, 43.82], [98.12, 58.53], [97.82, 73.24], [97.41, 87.94],
          [96.99, 98.68], [96.44, 99.18], [85.36, 99.12], [68.62, 99.26], [51.88, 99.18], [33.05, 99.06], [14.23, 98.97],
          [1.88, 98.82], [0.92, 98.24], [1.05, 87.94], [1.17, 70.29], [1.26, 52.65], [1.13, 35.00], [1.00, 17.35], [0.92, 2.65]
        ];
      case 'bastianini':
        return [
          [3.25, 1.39], [17.80, 1.10], [36.13, 0.81], [57.07, 0.64], [78.01, 0.58], [96.60, 0.64], [97.28, 1.16],
          [96.96, 11.56], [96.86, 23.12], [97.28, 37.57], [97.80, 52.02], [98.43, 66.47], [98.85, 80.92], [98.69, 93.93],
          [97.91, 98.84], [83.25, 98.99], [67.54, 99.19], [46.60, 99.13], [28.27, 98.99], [9.95, 98.84], [1.57, 98.70],
          [0.94, 97.98], [1.31, 93.93], [1.99, 79.48], [2.72, 65.03], [3.40, 50.58], [3.56, 36.13], [3.46, 21.68], [3.25, 8.67]
        ];
      case 'nino-dice':
        return [
          [0.65, 0.69], [13.59, 0.66], [29.77, 0.58], [47.57, 0.52], [65.37, 0.44], [83.17, 0.38], [97.41, 0.30],
          [97.90, 0.55], [97.80, 8.52], [97.73, 19.51], [97.90, 30.49], [98.12, 41.48], [98.38, 52.47], [98.64, 63.46],
          [98.87, 74.45], [99.03, 85.44], [99.19, 92.31], [99.35, 99.45], [98.87, 99.70], [83.17, 99.66], [63.75, 99.62],
          [44.34, 99.59], [24.92, 99.56], [10.36, 99.52], [2.59, 99.48], [2.10, 99.24], [2.20, 89.56], [1.94, 77.20],
          [1.68, 66.21], [1.46, 55.22], [1.23, 44.23], [0.97, 33.24], [0.81, 22.25], [0.65, 11.26], [0.58, 0.96]
        ];
      case 'trinchera':
        return [
          [0.94, 0.25], [13.21, 0.51], [30.50, 0.83], [49.37, 1.15], [68.24, 1.46], [85.53, 1.72], [99.06, 1.97],
          [99.37, 2.23], [99.12, 10.32], [98.90, 20.51], [98.68, 30.70], [98.27, 40.89], [97.80, 51.08], [97.33, 61.27],
          [96.70, 71.46], [96.07, 81.66], [95.35, 90.57], [94.97, 96.94], [94.81, 99.55], [94.18, 99.75], [80.82, 99.72],
          [61.95, 99.68], [43.08, 99.64], [24.21, 99.62], [8.49, 99.59], [0.94, 99.55], [0.47, 99.36], [0.57, 91.85],
          [0.63, 80.38], [0.69, 68.92], [0.63, 57.45], [0.69, 47.26], [0.79, 37.07], [0.88, 26.88], [0.79, 16.69],
          [0.88, 6.50], [0.88, 0.51]
        ];
      default:
        return null;
    }
  }

  getClippingTypeFromElement(el) {
    if (!el) return null;
    if (el.classList.contains('wrap-sarmiento') || el.querySelector('.clipping-card-1')) return 'sarmiento';
    if (el.classList.contains('wrap-bastianini') || el.querySelector('.clipping-card-2')) return 'bastianini';
    if (el.classList.contains('wrap-nino-dice') || el.querySelector('.clipping-card-nino')) return 'nino-dice';
    if (el.classList.contains('wrap-trinchera') || el.querySelector('.clipping-card-trinchera')) return 'trinchera';
    return null;
  }

  isPointInClippingSilhouette(wrapEl, clientX, clientY) {
    if (!wrapEl) return false;
    const type = this.getClippingTypeFromElement(wrapEl);
    const poly = this.getClippingPolygon(type);
    if (!poly) return true;

    const rect = wrapEl.getBoundingClientRect();
    if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) {
      return false;
    }

    // Coordenadas relativas en porcentaje (0 a 100)
    const px = ((clientX - rect.left) / rect.width) * 100;
    const py = ((clientY - rect.top) / rect.height) * 100;

    // Algoritmo Ray-Casting
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i][0], yi = poly[i][1];
      const xj = poly[j][0], yj = poly[j][1];

      const intersect = ((yi > py) !== (yj > py)) &&
        (px < (xj - xi) * (py - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  bindUnifiedGestureEvents() {
    const target = this.panContainer;

    const handlePointerDown = (e) => {
      if (e.button !== 0) return;
      if (this.isAnimating || this.isForegroundClippingActive) return;

      // Botones, controles y modales: dejar fluir el evento nativo
      if (e.target.closest('button, a, input, [role="button"]:not(#frontCover), .modal-card, .scene-typewriter, #clippingInspectionLayer')) {
        return;
      }

      // Si el usuario presiona dentro del contorno físico de un recorte interactivo:
      // Bloquear temporalmente el arrastre de la página para dar prioridad al recorte
      const touchedClipping = e.target.closest('.clipping-card-wrap, [data-clipping="true"]');
      if (touchedClipping && !this.isClosed && this.coverAngle >= 150 && this.isPointInClippingSilhouette(touchedClipping, e.clientX, e.clientY)) {
        return;
      }

      // MODIFICADORES MUTUAMENTE EXCLUYENTES
      // GESTO 1: Cambio de escala / tamaño con CTRL horizontal
      if (e.ctrlKey && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        this.startScaleGesture(e);
        return;
      }

      // GESTO 2: Inclinación de perspectiva en dos ejes (Pitch / Yaw) con SHIFT
      if (e.shiftKey && !e.altKey && !e.ctrlKey) {
        e.preventDefault();
        this.gestureStartPointerX = e.clientX;
        this.gestureStartPointerY = e.clientY;
        this.startPitchGesture(e);
        return;
      }

      // GESTO 3: Desplazamiento del libro en el espacio (Desk Pan) con ALT o modo Desk Pan activo
      if ((e.altKey || this.isDeskPanMode) && !e.shiftKey && !e.ctrlKey) {
        e.preventDefault();
        this.gestureStartPointerX = e.clientX;
        this.gestureStartPointerY = e.clientY;
        this.startBookPanGesture(e, true);
        return;
      }

      // GESTO 4: Interacción física con zonas claramente delimitadas
      // Si el usuario toca el escritorio fuera del libro: ignorar
      const touchedBook = e.target.closest('#bookContainer');
      if (!touchedBook) {
        return;
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

      // Delimitación física de zonas de interacción en los extremos del libro visible
      // Ancho total del pliego abierto = rect.width; hoja = rect.width / 2
      // Extremo izquierdo (~25% exterior) y Extremo derecho (~25% exterior)
      const isExplicitTrigger = !!e.target.closest('[data-leaf-trigger], .page-edge-strip, .page-turn-trigger, .cover-open-affordance, .cover-pocket-sleeve');
      const isLeftOuterEdge = (e.clientX <= rect.left + rect.width * 0.25);
      const isRightOuterEdge = (e.clientX >= rect.right - rect.width * 0.25);

      // En libro cerrado, la tapa completa o el extremo derecho permite arrastrar para abrir
      if (this.isClosed || this.coverAngle < 15) {
        if (isRightOuterEdge || isExplicitTrigger || e.clientX >= centerX) {
          this.startCoverDragGesture(e);
        }
        return;
      }

      // Libro abierto o en proceso de giro:
      // ZONA IZQUIERDA (Extremo físico izquierdo): retroceder o cerrar según el estado
      if (isLeftOuterEdge || (isExplicitTrigger && e.target.closest('.edge-left, [data-leaf-trigger="prev"]'))) {
        if (this.currentIndex > 1) {
          this.startPageDragGesture(e, 'prev');
          return;
        } else {
          // Pliego 02-03 (hoja 01): extremo izquierdo cierra el libro hacia la portada
          this.startCoverDragGesture(e);
          return;
        }
      }

      // ZONA DERECHA (Extremo físico derecho): avanzar hoja/pliego o continuar abriendo
      if (isRightOuterEdge || (isExplicitTrigger && e.target.closest('.edge-right, [data-leaf-trigger="next"]'))) {
        if (this.coverAngle < 165) {
          this.startCoverDragGesture(e);
          return;
        } else {
          this.startPageDragGesture(e, 'next');
          return;
        }
      }

      // Zona central/interior: lectura e inspección, no activa arrastre accidental de hoja
    };

    target.addEventListener('pointerdown', handlePointerDown);

    // Detección de clic intencional en recortes periodísticos con delimitación estricta de silueta
    let clippingPointerTarget = null;
    let clippingPointerDownX = 0;
    let clippingPointerDownY = 0;
    let clippingPointerDownTime = 0;

    this.container.addEventListener('pointerdown', (e) => {
      if (this.isForegroundClippingActive || this.isClosed || this.coverAngle < 150) return;
      const wrap = e.target.closest('.clipping-card-wrap, [data-clipping="true"]');
      if (wrap && this.isPointInClippingSilhouette(wrap, e.clientX, e.clientY)) {
        clippingPointerTarget = wrap;
        clippingPointerDownX = e.clientX;
        clippingPointerDownY = e.clientY;
        clippingPointerDownTime = performance.now();
      }
    });

    this.container.addEventListener('pointerup', (e) => {
      if (!clippingPointerTarget || this.isForegroundClippingActive) {
        clippingPointerTarget = null;
        return;
      }
      const dist = Math.hypot(e.clientX - clippingPointerDownX, e.clientY - clippingPointerDownY);
      const dt = performance.now() - clippingPointerDownTime;
      const targetWrap = clippingPointerTarget;
      clippingPointerTarget = null;

      // Clic intencional sobre el recorte: verificar que al soltar también esté dentro de la silueta física
      if (dist < 12 && dt < 600 && this.isPointInClippingSilhouette(targetWrap, e.clientX, e.clientY)) {
        e.preventDefault();
        e.stopPropagation();
        this.openForegroundClipping(targetWrap);
      }
    });

    // Accesibilidad por teclado (Enter o Espacio sobre el recorte)
    this.container.addEventListener('keydown', (e) => {
      if (this.isForegroundClippingActive) return;
      if (e.key === 'Enter' || e.key === ' ') {
        const wrap = e.target.closest('.clipping-card-wrap, [data-clipping="true"]');
        if (wrap) {
          e.preventDefault();
          e.stopPropagation();
          this.openForegroundClipping(wrap);
        }
      }
    });
  }

  // --- GESTO: Escala / Tamaño del libro con CTRL horizontal ---
  startScaleGesture(e) {
    if (this.isMobile || this.isForegroundClippingActive) return;
    this.activeGesture = 'BOOK_SCALE';
    this.gestureStartScale = this.bookScale;
    this.gestureStartPointerX = e.clientX;
    try { this.panContainer.setPointerCapture(e.pointerId); } catch (_) {}

    const handlePointerMove = (moveEvt) => {
      if (this.activeGesture !== 'BOOK_SCALE') return;
      // Dirección del zoom: CTRL + arrastrar a la derecha aumenta (+), a la izquierda reduce (-)
      const deltaX = moveEvt.clientX - this.gestureStartPointerX;
      const factor = 0.0035;
      const newScale = Math.max(0.65, Math.min(1.25, this.gestureStartScale + (deltaX * factor)));
      this.setScale(newScale);
    };

    const handlePointerUp = (upEvt) => {
      if (this.activeGesture !== 'BOOK_SCALE') return;
      this.activeGesture = null;
      try { this.panContainer.releasePointerCapture(upEvt.pointerId); } catch (_) {}
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  }

  // --- GESTO: Inclinación de la vista en dos ejes con SHIFT (Pitch y Yaw combinados) ---
  startPitchGesture(e) {
    if (this.isForegroundClippingActive) return;
    this.activeGesture = 'VIEW_PITCH';
    this.gestureStartPitch = this.viewPitch;
    this.gestureStartYaw = this.viewYaw;
    this.gestureStartPointerX = e.clientX;
    this.gestureStartPointerY = e.clientY;
    this.panContainer.classList.add('is-dragging');
    try { this.panContainer.setPointerCapture(e.pointerId); } catch (_) {}

    const handlePointerMove = (moveEvt) => {
      if (this.activeGesture !== 'VIEW_PITCH') return;
      const deltaX = moveEvt.clientX - this.gestureStartPointerX;
      const deltaY = moveEvt.clientY - this.gestureStartPointerY;
      // Arrastrar verticalmente (arriba/abajo) inclina el cabeceo (pitch)
      // Arrastrar horizontalmente (izq/der) inclina la orientación lateral (yaw)
      // Movimientos diagonales combinan fluidamente ambos ejes con respuesta continua
      const factor = 0.22;
      const newPitch = this.gestureStartPitch - deltaY * factor;
      const newYaw = this.gestureStartYaw + deltaX * factor;
      this.setTilt(newPitch, newYaw);
    };

    const handlePointerUp = (upEvt) => {
      if (this.activeGesture !== 'VIEW_PITCH') return;
      this.activeGesture = null;
      this.panContainer.classList.remove('is-dragging');
      try { this.panContainer.releasePointerCapture(upEvt.pointerId); } catch (_) {}
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
  }

  // --- GESTO: Apertura y Cierre de la Tapa ---
  startCoverDragGesture(e) {
    if (this.isForegroundClippingActive) return;
    this.activeGesture = 'COVER';
    this.gestureStartCoverAngle = this.coverAngle;

    // Renderizado progresivo: asegurar que la base derecha muestre Hoja 01 al girar la tapa
    if (this.rightContentEl && this.pages[2]) {
      this.rightContentEl.innerHTML = this.renderPageContent(this.pages[2]);
    }

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
    if (this.isAnimating || this.isForegroundClippingActive) return;

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
    this.container.classList.add('is-page-flipping');

    const rect = this.container.getBoundingClientRect();
    const pageWidth = rect.width / 2 || 490;

    // Crear la hoja 3D dinámica
    const leaf = document.createElement('div');
    leaf.className = `flipping-leaf is-dragging-leaf ${direction === 'prev' ? 'flip-left-to-right' : 'flip-right-to-left'}`;

    let frontContent = '';
    let backContent = '';

    // Asegurar visibilidad progresiva de la página izquierda base durante el arrastre
    if (this.leftPageEl) {
      this.leftPageEl.style.opacity = '1';
      this.leftPageEl.style.visibility = 'visible';
    }

    if (direction === 'next') {
      const oldRightData = this.getVisiblePages().right;
      const nextLeftIndex = this.currentIndex + 2;
      const newLeftData = this.pages[nextLeftIndex];

      frontContent = this.renderPageContent(oldRightData);
      backContent = this.renderPageContent(newLeftData);

      // Revelar la página siguiente que queda descubierta progresivamente debajo del giro
      const underlyingRightData = this.pages[nextLeftIndex + 1] || null;
      if (this.rightContentEl) {
        this.rightContentEl.innerHTML = this.renderPageContent(underlyingRightData);
      }
    } else {
      const currentLeftData = this.getVisiblePages().left;
      const targetIndex = Math.max(1, this.currentIndex - 2);
      const prevRightData = this.pages[targetIndex + 1];

      frontContent = this.renderPageContent(currentLeftData);
      backContent = this.renderPageContent(prevRightData);

      // Revelar la página anterior que queda descubierta progresivamente debajo del giro
      const underlyingLeftData = (targetIndex <= 1) ? this.pages[1] : (this.pages[targetIndex] || null);
      if (this.leftContentEl) {
        this.leftContentEl.innerHTML = this.renderPageContent(underlyingLeftData);
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
      this.container.classList.remove('is-page-flipping');

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
    if (this.isMobile || this.isForegroundClippingActive) return;
    this.activeGesture = 'BOOK_PAN';
    this.isTwoHandMode = isTwoHand || e.altKey;
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
    this.setTilt(16, 0);
    this.setScale(1.0);
    this.applyPanTransform();

    setTimeout(() => {
      this.panContainer.style.transition = '';
    }, 520);
  }

  // ==========================================================================
  // TECLADO MODIFICADOR (ALT)
  // ==========================================================================

  bindKeyboardModifiers() {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Alt') {
        this.setTwoHandMode(true);
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.key === 'Alt') {
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
      if (this.isForegroundClippingActive) return;
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    this.container.addEventListener('touchend', (e) => {
      if (this.isForegroundClippingActive) return;
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
  // Animación física realista de hoja en vuelo 3D (elevación translateZ, curvatura cilíndrica y sombras)
  // ==========================================================================

  nextPage() {
    this.animatePageTurn('next');
  }

  prevPage() {
    this.animatePageTurn('prev');
  }

  animatePageTurn(direction) {
    if (this.isAnimating || this.isForegroundClippingActive) return;

    if (direction === 'next') {
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

      this.isAnimating = true;
      const oldRightData = this.getVisiblePages().right;
      const nextLeftIndex = this.currentIndex + 2;
      const newLeftData = this.pages[nextLeftIndex];

      // Revelar la página siguiente que quedará debajo en el hemisferio derecho
      if (this.rightContentEl && this.pages[nextLeftIndex + 1]) {
        this.rightContentEl.innerHTML = this.renderPageContent(this.pages[nextLeftIndex + 1]);
      }

      const leaf = document.createElement('div');
      leaf.className = 'flipping-leaf flip-right-to-left';
      leaf.style.transition = 'none';
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

      const duration = 720;
      const startTime = performance.now();

      const step = (now) => {
        const elapsed = now - startTime;
        const t = Math.min(1, elapsed / duration);
        // Easing suave natural (ease-in-out cúbico)
        const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

        const angle = -180 * ease;
        const sinP = Math.sin(ease * Math.PI);
        const liftZ = sinP * 32; // Elevación vertical en el cenit de la curva
        const crestPos = (ease * 80 + 10).toFixed(0);
        const shadowOpacity = (sinP * 0.82).toFixed(2);

        leaf.style.transform = `rotateY(${angle.toFixed(1)}deg) translateZ(${liftZ.toFixed(1)}px)`;
        leaf.style.setProperty('--leaf-crest', `${crestPos}%`);
        leaf.style.setProperty('--leaf-shadow-opacity', shadowOpacity);

        if (t < 1) {
          requestAnimationFrame(step);
        } else {
          leaf.remove();
          this.activeLeafEl = null;
          this.currentIndex = Math.min(maxIndex, this.currentIndex + 2);
          this.renderCurrentSpread();
          this.updateDynamicThickness();
          this.isAnimating = false;
          this.notifyChange();
        }
      };

      requestAnimationFrame(step);
    } else {
      // Dirección: retroceso ('prev')
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

      this.isAnimating = true;
      const currentLeftData = this.getVisiblePages().left;
      const targetIndex = Math.max(1, this.currentIndex - 2);
      const prevRightData = this.pages[targetIndex + 1];

      // Revelar la página previa que quedará debajo en el hemisferio izquierdo
      if (this.leftContentEl && this.pages[targetIndex]) {
        this.leftContentEl.innerHTML = this.renderPageContent(this.pages[targetIndex]);
      }

      const leaf = document.createElement('div');
      leaf.className = 'flipping-leaf flip-left-to-right';
      leaf.style.transition = 'none';
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

      const duration = 720;
      const startTime = performance.now();

      const step = (now) => {
        const elapsed = now - startTime;
        const t = Math.min(1, elapsed / duration);
        const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

        const angle = 180 * ease;
        const sinP = Math.sin(ease * Math.PI);
        const liftZ = sinP * 32;
        const crestPos = ((1 - ease) * 80 + 10).toFixed(0);
        const shadowOpacity = (sinP * 0.82).toFixed(2);

        leaf.style.transform = `rotateY(${angle.toFixed(1)}deg) translateZ(${liftZ.toFixed(1)}px)`;
        leaf.style.setProperty('--leaf-crest', `${crestPos}%`);
        leaf.style.setProperty('--leaf-shadow-opacity', shadowOpacity);

        if (t < 1) {
          requestAnimationFrame(step);
        } else {
          leaf.remove();
          this.activeLeafEl = null;
          this.currentIndex = targetIndex;
          this.renderCurrentSpread();
          this.updateDynamicThickness();
          this.isAnimating = false;
          this.notifyChange();
        }
      };

      requestAnimationFrame(step);
    }
  }

  // ==========================================================================
  // RENDERIZADO DEL PLIEGO
  // ==========================================================================

  getVisiblePages() {
    if (this.isClosed || this.currentIndex <= 0) {
      return { left: null, right: this.pages[2] || this.pages[0] || null };
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
      let mainInnerHtml = '';
      if (pageData.sheetNumber === 1) {
        mainInnerHtml = `
          <div class="sheet-scrapbook-composition" aria-label="Composición documental: Primeros reconocimientos literarios (1951 - 1959)">
            <!-- Bloque superior izquierdo: 1951, Biblioteca Popular Sarmiento -->
            <div class="scrapbook-col scrapbook-item item-sarmiento col-sarmiento">
              <img src="assets/sheet-01/date-1951.png" alt="sept. 1.951 (fecha mecanografiada)" class="date-typewritten-1951" loading="eager">
              <div class="clipping-card-wrap wrap-sarmiento" tabindex="0" role="button" data-clipping="true" aria-label="Examinar recorte de Biblioteca Sarmiento (1951) en primer plano" title="Hacé clic para examinar este recorte en primer plano">
                <img src="assets/sheet-01/clipping-sarmiento-1951.png" alt="Recorte periodístico original: Biblioteca Popular 'Sarmiento' - Acto Literario, Segundo premio a Guillermo B. Harispe" class="clipping-card-1" loading="eager">
              </div>
            </div>
            <!-- Bloque escalonado inferior derecho: 1959, Certamen René Bastianini -->
            <div class="scrapbook-col scrapbook-item item-bastianini col-bastianini">
              <div class="clipping-card-wrap wrap-bastianini" tabindex="0" role="button" data-clipping="true" aria-label="Examinar recorte del Certamen René Bastianini (1959) en primer plano" title="Hacé clic para examinar este recorte en primer plano">
                <img src="assets/sheet-01/clipping-bastianini-1959.png" alt="Recorte periodístico original: El VI Certamen René Bastianini 1959 - Mención de honor a Guillermo B. Harispe" class="clipping-card-2" loading="eager">
              </div>
              <img src="assets/sheet-01/date-lanacion-1959.png" alt="LA NACIÓN 2/3 Dbre/59 (fecha manuscrita en birome azul)" class="date-handwritten-1959" loading="eager">
            </div>
          </div>
        `;
      } else if (pageData.sheetNumber === 2) {
        mainInnerHtml = `
          <div class="sheet-scrapbook-composition sheet-02-composition" aria-label="Composición documental: Publicación de Trinchera del asombro (Julio 1961)">
            <!-- Bloque izquierdo: 8.7.61, Un niño dice / Soneto / Nota editorial -->
            <div class="scrapbook-col scrapbook-item item-nino-dice col-nino-dice">
              <img src="assets/sheet-02/date-1961-07-08.png" alt="8.7.61 (fecha mecanografiada)" class="date-typewritten-1961-left" loading="eager">
              <div class="clipping-card-wrap wrap-nino-dice" tabindex="0" role="button" data-clipping="true" data-hires="assets/sheet-02/clipping-nino-dice-1961-hires.png" aria-label="Examinar recorte de Un niño dice: Soneto (1961) en primer plano" title="Hacé clic para examinar este recorte en primer plano">
                <img src="assets/sheet-02/clipping-nino-dice-1961.png" data-hires="assets/sheet-02/clipping-nino-dice-1961-hires.png" alt="Recorte periodístico original: Un niño dice: Soneto y nota de Trinchera del Asombro por Guillermo B. Harispe (8 de julio de 1961)" class="clipping-card-nino" loading="eager">
              </div>
            </div>
            <!-- Bloque derecho: 26.7.61, Diario El Argentino, Crítica de Ana Etchegoyen -->
            <div class="scrapbook-col scrapbook-item item-trinchera col-trinchera">
              <div class="heading-group-trinchera">
                <img src="assets/sheet-02/header-el-argentino-1961.png" alt="el argentino (encabezado mecanografiado)" class="header-el-argentino-1961" loading="eager">
                <img src="assets/sheet-02/date-1961-07-26.png" alt="26.7.61 (fecha mecanografiada)" class="date-typewritten-1961-right" loading="eager">
              </div>
              <div class="clipping-card-wrap wrap-trinchera" tabindex="0" role="button" data-clipping="true" data-hires="assets/sheet-02/clipping-trinchera-1961-hires.png" aria-label="Examinar recorte de Trinchera del asombro por Ana Etchegoyen (1961) en primer plano" title="Hacé clic para examinar este recorte en primer plano">
                <img src="assets/sheet-02/clipping-trinchera-1961.png" data-hires="assets/sheet-02/clipping-trinchera-1961-hires.png" alt="Recorte periodístico original: Trinchera del asombro de Guillermo B. Harispe por Ana Etchegoyen, El Argentino (26 de julio de 1961)" class="clipping-card-trinchera" loading="eager">
              </div>
            </div>
          </div>
        `;
      } else if (pageData.image) {
        mainInnerHtml = `<img src="${pageData.image}" alt="Hoja ${pageData.sheetLabel}" class="sheet-scanned-image" loading="lazy">`;
      }

      return `
        <div class="page-content-wrapper sheet-layout" data-sheet-index="${pageData.sheetNumber}">
          <div class="sheet-main-content" data-sheet="${pageData.sheetNumber}">
            ${mainInnerHtml}
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
    if (this.isForegroundClippingActive) return;
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
    if (this.isForegroundClippingActive) return;
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
      isDragEnabled: this.isDeskPanMode,
      isForegroundClippingActive: this.isForegroundClippingActive,
      viewPitch: this.viewPitch,
      viewYaw: this.viewYaw
    };
    this.onPageChange(state);
  }

  // ==========================================================================
  // PRIMER PLANO: INSPECCIÓN INTERACTIVA DE RECORTES PERIODÍSTICOS
  // ==========================================================================

  openForegroundClipping(sourceWrapEl) {
    if (this.isForegroundClippingActive || this.isClippingAnimating || this.isClosed) return;
    if (!this.clippingInspectionLayer || !this.clippingFloatingCard || !this.clippingFloatingImg) return;

    const imgEl = sourceWrapEl.querySelector('img') || sourceWrapEl;
    if (!imgEl) return;

    this.isForegroundClippingActive = true;
    this.isClippingAnimating = true;
    this.activeClippingSourceEl = sourceWrapEl;

    // 1. Obtener rect del elemento fuente y del layer modal
    const srcRect = imgEl.getBoundingClientRect();
    const layerRect = this.clippingInspectionLayer.getBoundingClientRect();

    const startLeft = srcRect.left - layerRect.left;
    const startTop = srcRect.top - layerRect.top;

    // 2. Extraer rotación del artículo en la página para continuidad visual
    let initialAngle = 0;
    const parentCol = sourceWrapEl.closest('.scrapbook-item, .scrapbook-col') || sourceWrapEl;
    const computedStyle = window.getComputedStyle(parentCol);
    const transform = computedStyle.transform;
    if (transform && transform !== 'none') {
      const values = transform.split('(')[1].split(')')[0].split(',');
      const a = parseFloat(values[0]);
      const b = parseFloat(values[1]);
      initialAngle = Math.round(Math.atan2(b, a) * (180 / Math.PI) * 10) / 10;
    }
    this.sourceRotation = initialAngle;

    // 3. Configurar la imagen del recorte en primer plano con carga progresiva de alta fidelidad
    const baseSrc = imgEl.src;
    const hiresCandidate = sourceWrapEl.dataset.hires || imgEl.dataset.hires || 
                           sourceWrapEl.getAttribute('data-hires') || imgEl.getAttribute('data-hires');

    // Iniciar inmediatamente con la imagen base (ya disponible en memoria, sin parpadeos)
    this.clippingFloatingImg.src = baseSrc;
    this.clippingFloatingImg.alt = imgEl.alt || 'Recorte periodístico original en primer plano';

    // Cargar la versión master de alta resolución en segundo plano y sustituirla fluidamente
    if (hiresCandidate && hiresCandidate !== baseSrc) {
      const hiresLoader = new Image();
      hiresLoader.onload = () => {
        if (this.isForegroundClippingActive) {
          this.clippingFloatingImg.src = hiresCandidate;
        }
      };
      hiresLoader.src = hiresCandidate;
    }

    // 4. Dimensiones óptimas de lectura según viewport y proporciones originales
    const naturalW = imgEl.naturalWidth || srcRect.width || 320;
    const naturalH = imgEl.naturalHeight || srcRect.height || 650;
    const aspect = naturalW / naturalH;

    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    // Escala cómoda de lectura en primer plano
    let targetH = Math.min(viewportH * 0.84, 760);
    if (this.isMobile) {
      targetH = Math.min(viewportH * 0.78, 560);
    }
    let targetW = targetH * aspect;
    const maxTargetW = Math.min(viewportW * 0.88, 720);
    if (targetW > maxTargetW) {
      targetW = maxTargetW;
      targetH = targetW / aspect;
    }

    const targetLeft = Math.round((viewportW - targetW) / 2) - layerRect.left;
    const targetTop = Math.round((viewportH - targetH) / 2) - layerRect.top;

    // Asignar tipo de recorte para aplicar el clip-path idéntico a la tarjeta flotante
    const clipType = this.getClippingTypeFromElement(sourceWrapEl);
    if (clipType) {
      this.clippingFloatingCard.setAttribute('data-clipping-type', clipType);
    } else {
      this.clippingFloatingCard.removeAttribute('data-clipping-type');
    }

    this.clippingPanX = 0;
    this.clippingPanY = 0;
    this.clippingRotX = 0;
    this.clippingRotY = 0;
    this.clippingScale = 1.0;

    // 5. Configurar inicio FLIP (coincidente con la posición en la hoja o centrado de seguridad)
    const card = this.clippingFloatingCard;
    card.style.transition = 'none';
    const hasValidSrcRect = srcRect.width > 20 && srcRect.height > 20;
    const initLeft = hasValidSrcRect ? startLeft : targetLeft;
    const initTop = hasValidSrcRect ? startTop : targetTop;
    const initW = hasValidSrcRect ? srcRect.width : targetW;
    const initH = hasValidSrcRect ? srcRect.height : targetH;

    card.style.left = `${initLeft}px`;
    card.style.top = `${initTop}px`;
    card.style.width = `${initW}px`;
    card.style.height = `${initH}px`;
    card.style.transform = `translate3d(0, 0, 0) rotate(${initialAngle}deg)`;

    // Mostrar modal y atenuar fuente original (deja su leve silueta en el papel)
    this.clippingInspectionLayer.classList.remove('is-hidden');
    if (this.sceneBookEl) {
      this.sceneBookEl.classList.add('is-clipping-focus');
    }
    sourceWrapEl.style.opacity = '0.18';

    // Reflujo sincrónico
    void card.offsetWidth;

    // 6. Animación de elevación y aproximación al primer plano
    const animateToTarget = () => {
      card.style.transition = 'all 0.52s cubic-bezier(0.16, 1, 0.3, 1)';
      card.style.left = `${targetLeft}px`;
      card.style.top = `${targetTop}px`;
      card.style.width = `${targetW}px`;
      card.style.height = `${targetH}px`;
      card.style.transform = `translate3d(0, 0, 0) rotate(0deg)`;

      setTimeout(() => {
        card.style.transition = 'none';
        this.isClippingAnimating = false;
        try { card.focus(); } catch (_) {}
      }, 540);
    };

    setTimeout(animateToTarget, 20);

    this.notifyChange();
  }

  closeForegroundClipping() {
    if (!this.isForegroundClippingActive || this.isClippingAnimating) return;
    if (!this.clippingInspectionLayer || !this.clippingFloatingCard) return;

    this.isClippingAnimating = true;

    const card = this.clippingFloatingCard;
    const sourceWrapEl = this.activeClippingSourceEl;
    const imgEl = sourceWrapEl ? (sourceWrapEl.querySelector('img') || sourceWrapEl) : null;
    const layerRect = this.clippingInspectionLayer.getBoundingClientRect();

    // Eliminar desenfoque ambiental del libro
    if (this.sceneBookEl) {
      this.sceneBookEl.classList.remove('is-clipping-focus');
    }

    // Comenzar el desvanecimiento de vuelta a opacidad 1 en la hoja
    if (sourceWrapEl) {
      sourceWrapEl.style.opacity = '1';
    }

    const returnAngle = this.sourceRotation || 0;

    if (imgEl) {
      const srcRect = imgEl.getBoundingClientRect();
      const endLeft = srcRect.left - layerRect.left;
      const endTop = srcRect.top - layerRect.top;

      card.style.transition = 'all 0.44s cubic-bezier(0.25, 1, 0.5, 1)';
      card.style.left = `${endLeft}px`;
      card.style.top = `${endTop}px`;
      card.style.width = `${srcRect.width}px`;
      card.style.height = `${srcRect.height}px`;
      card.style.transform = `translate3d(0, 0, 0) rotate(${returnAngle}deg)`;
    } else {
      card.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
      card.style.opacity = '0';
      card.style.transform = 'scale(0.85)';
    }

    setTimeout(() => {
      if (sourceWrapEl) {
        sourceWrapEl.style.opacity = '';
      }
      this.clippingInspectionLayer.classList.add('is-hidden');
      card.style.transition = 'none';
      card.style.transform = 'none';
      card.style.opacity = '1';

      this.isForegroundClippingActive = false;
      this.isClippingAnimating = false;
      this.activeClippingSourceEl = null;
      this.clippingPanX = 0;
      this.clippingPanY = 0;
      this.clippingRotX = 0;
      this.clippingRotY = 0;
      this.clippingScale = 1.0;
      card.removeAttribute('data-clipping-type');

      this.notifyChange();
    }, 450);
  }

  bindClippingInspectionEvents() {
    if (!this.clippingInspectionLayer || !this.clippingFloatingCard) return;

    // MECANISMO C: Control visual de regreso
    if (this.btnCloseClipping) {
      this.btnCloseClipping.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeForegroundClipping();
      });
    }

    // MECANISMO A: Clic fuera del recorte (en cualquier área del fondo atenuado)
    let backdropDownX = 0;
    let backdropDownY = 0;
    let backdropDownTime = 0;

    if (this.clippingBackdrop) {
      this.clippingBackdrop.addEventListener('pointerdown', (e) => {
        backdropDownX = e.clientX;
        backdropDownY = e.clientY;
        backdropDownTime = performance.now();
      });

      this.clippingBackdrop.addEventListener('pointerup', (e) => {
        const dist = Math.hypot(e.clientX - backdropDownX, e.clientY - backdropDownY);
        const dt = performance.now() - backdropDownTime;
        // Distinguir clic intencional de soltar un arrastre del recorte
        if (dist < 10 && dt < 450) {
          this.closeForegroundClipping();
        }
      });
    }

    // MANIPULACIÓN INDEPENDIENTE DEL RECORTE EN PRIMER PLANO
    // ALT + arrastrar: Mover el recorte en el espacio
    // SHIFT + arrastrar: Inclinar el recorte
    // CTRL + arrastrar horizontal: Cambiar la escala (arrastrar a la izquierda aumenta, a la derecha reduce)
    // Sin modificadores: Arrastrar el recorte suavemente sin afectar al libro
    let isManipulating = false;
    let manipStartX = 0;
    let manipStartY = 0;
    let startPanX = 0;
    let startPanY = 0;
    let startRotX = 0;
    let startRotY = 0;
    let startScale = 1.0;
    let manipMode = 'PAN';

    const updateCardTransform = () => {
      const maxPanX = window.innerWidth * 0.38;
      const maxPanY = window.innerHeight * 0.38;
      this.clippingPanX = Math.max(-maxPanX, Math.min(maxPanX, this.clippingPanX));
      this.clippingPanY = Math.max(-maxPanY, Math.min(maxPanY, this.clippingPanY));
      this.clippingRotX = Math.max(-48, Math.min(48, this.clippingRotX));
      this.clippingRotY = Math.max(-48, Math.min(48, this.clippingRotY));
      this.clippingScale = Math.max(0.6, Math.min(2.4, this.clippingScale));

      this.clippingFloatingCard.style.transform = `translate3d(${this.clippingPanX}px, ${this.clippingPanY}px, 60px) rotateX(${this.clippingRotX}deg) rotateY(${this.clippingRotY}deg) scale(${this.clippingScale})`;
    };

    this.clippingFloatingCard.addEventListener('pointerdown', (e) => {
      if (this.isClippingAnimating || !this.isForegroundClippingActive) return;
      e.stopPropagation();
      isManipulating = true;
      manipStartX = e.clientX;
      manipStartY = e.clientY;
      startPanX = this.clippingPanX;
      startPanY = this.clippingPanY;
      startRotX = this.clippingRotX;
      startRotY = this.clippingRotY;
      startScale = this.clippingScale;

      if (e.ctrlKey) {
        manipMode = 'SCALE';
      } else if (e.shiftKey) {
        manipMode = 'TILT';
      } else {
        manipMode = 'PAN'; // ALT o arrastre directo
      }

      this.clippingFloatingCard.classList.add('is-dragging');
      try { this.clippingFloatingCard.setPointerCapture(e.pointerId); } catch (_) {}
    });

    window.addEventListener('pointermove', (e) => {
      if (!isManipulating || !this.isForegroundClippingActive) return;
      e.preventDefault();

      const dx = e.clientX - manipStartX;
      const dy = e.clientY - manipStartY;

      if (manipMode === 'SCALE') {
        // Dirección del zoom: CTRL + arrastrar a la derecha aumenta (+), a la izquierda reduce (-)
        const factor = 0.0035;
        this.clippingScale = Math.max(0.6, Math.min(2.4, startScale + (dx * factor)));
      } else if (manipMode === 'TILT') {
        this.clippingRotX = startRotX - (dy * 0.28);
        this.clippingRotY = startRotY + (dx * 0.28);
      } else {
        this.clippingPanX = startPanX + dx;
        this.clippingPanY = startPanY + dy;
      }

      updateCardTransform();
    });

    const handlePointerUp = (e) => {
      if (!isManipulating) return;
      isManipulating = false;
      this.clippingFloatingCard.classList.remove('is-dragging');
      try { this.clippingFloatingCard.releasePointerCapture(e.pointerId); } catch (_) {}
    };

    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
  }
}

