/**
 * Controlador principal de la aplicación (Iteración 6: Corrección de Interacciones y Realismo Mecánico)
 * "Libro para mis hijos" — Guillermo Bautista Harispe
 */

import { BookEngine } from './book-engine.js';
import { TypewriterController } from './typewriter.js';
import { BOOK_METADATA } from './data/book-data.js';

document.addEventListener('DOMContentLoaded', () => {
  const sceneTypewriter = document.getElementById('sceneTypewriter');
  const sceneBook = document.getElementById('sceneBook');

  const bookContainer = document.getElementById('bookContainer');
  const bookPanContainer = document.getElementById('bookPanContainer');
  const btnPrev = document.getElementById('btnPrev');
  const btnNext = document.getElementById('btnNext');
  const btnResetPan = document.getElementById('btnResetPan');
  const btnToggleBook = document.getElementById('btnToggleBook');
  const textToggleBook = document.getElementById('textToggleBook');
  const btnToggleTilt = document.getElementById('btnToggleTilt');
  const tiltMenu = document.getElementById('tiltMenu');
  const btnZoomIn = document.getElementById('btnZoomIn');
  const btnZoomOut = document.getElementById('btnZoomOut');
  const scaleDisplayLabel = document.getElementById('scaleDisplayLabel');
  const btnToggleDragMode = document.getElementById('btnToggleDragMode');
  const iconToggleDrag = document.getElementById('iconToggleDrag');
  const textToggleDrag = document.getElementById('textToggleDrag');
  const deskHints = document.getElementById('deskHints');
  const twoHandBadge = document.getElementById('twoHandBadge');
  const pageIndicator = document.getElementById('pageIndicator');
  const btnTranscription = document.getElementById('btnTranscription');
  const modalTranscription = document.getElementById('modalTranscription');
  const btnCloseModal = document.getElementById('btnCloseModal');
  const transcriptionContent = document.getElementById('transcriptionContent');

  // Inicializar motor del libro físico con estado inicial cerrado y modo LECTURA
  const book = new BookEngine({
    container: bookContainer,
    panContainer: bookPanContainer,
    onPageChange: (state) => {
      updateUI(state);
    },
    onTwoHandChange: (isTwoHand) => {
      if (twoHandBadge) {
        if (isTwoHand) {
          twoHandBadge.classList.add('active');
        } else {
          twoHandBadge.classList.remove('active');
        }
      }
    },
    onScaleChange: (scale) => {
      if (scaleDisplayLabel) {
        scaleDisplayLabel.textContent = `${Math.round(scale * 100)}%`;
      }
    },
    onPitchChange: (pitch) => {
      if (tiltMenu) {
        const items = tiltMenu.querySelectorAll('.tilt-menu-item');
        items.forEach(item => {
          const itemPitch = parseFloat(item.getAttribute('data-pitch'));
          if (Math.abs(itemPitch - pitch) < 1) {
            item.classList.add('is-selected');
          } else {
            item.classList.remove('is-selected');
          }
        });
      }
    },
    onDragModeChange: (isDragActive) => {
      updateDragModeUI(isDragActive);
    }
  });

  window.book = book;

  // Inicializar la máquina de escribir mecánica 3D con Web Audio API (Etapa C)
  const typewriter = new TypewriterController({
    container: sceneTypewriter,
    paperOutput: document.getElementById('paperTypedOutput'),
    hiddenInput: document.getElementById('typewriterHiddenInput'),
    btnClear: document.getElementById('btnClearTypewriter'),
    btnBypass: document.getElementById('btnBypassTypewriter'),
    btnSound: document.getElementById('btnToggleSound'),
    typebarStriker: document.getElementById('typebarStriker'),
    carriageAssembly: document.getElementById('carriageAssembly'),
    targetWord: 'HARISPE',
    onUnlock: () => {
      // Transición cinematográfica fluida hacia la escena del libro físico
      if (sceneBook) {
        sceneBook.classList.remove('is-hidden');
      }
      setTimeout(() => {
        book.notifyChange();
      }, 120);
    }
  });

  // Actualización del botón de Desplazamiento sobre la mesa (Desk Pan / ALT)
  function updateDragModeUI(isDragActive) {
    if (!btnToggleDragMode) return;
    if (isDragActive) {
      btnToggleDragMode.classList.add('is-active');
      btnToggleDragMode.setAttribute('title', 'Desplazamiento del libro activo — Arrastrá sobre la mesa para mover el tomo');
      if (iconToggleDrag) iconToggleDrag.textContent = '✋';
      if (textToggleDrag) textToggleDrag.textContent = 'Mover libro: ON';
      if (deskHints) {
        deskHints.innerHTML = `
          <span class="hint-item"><span class="hint-icon">✋</span> Desplazamiento activo: arrastrá el libro sobre la mesa</span>
          <span class="hint-separator">·</span>
          <span class="hint-item"><span class="hint-icon">📖</span> Hojas: arrastrá esquinas libremente</span>
          <span class="hint-separator">·</span>
          <span class="hint-item"><span class="hint-icon">📐</span> Shift+arrastre: inclinación</span>
          <span class="hint-separator">·</span>
          <span class="hint-item"><span class="hint-icon">🔍</span> Ctrl+arrastre: tamaño</span>
        `;
      }
    } else {
      btnToggleDragMode.classList.remove('is-active');
      btnToggleDragMode.setAttribute('title', 'Mantené ALT y arrastrá para mover el libro sobre el escritorio');
      if (iconToggleDrag) iconToggleDrag.textContent = '✋';
      if (textToggleDrag) textToggleDrag.textContent = 'Mover libro (ALT)';
      if (deskHints) {
        deskHints.innerHTML = `
          <span class="hint-item"><span class="hint-icon">📖</span> Hojear: arrastrá las hojas libremente</span>
          <span class="hint-separator">·</span>
          <span class="hint-item"><span class="hint-icon">✋</span> Mover: Alt+arrastre</span>
          <span class="hint-separator">·</span>
          <span class="hint-item"><span class="hint-icon">📐</span> Inclinación: Shift+arrastre</span>
          <span class="hint-separator">·</span>
          <span class="hint-item"><span class="hint-icon">🔍</span> Tamaño: Ctrl+arrastre</span>
        `;
      }
    }
  }

  // Alternar Desplazamiento del libro sobre la mesa
  if (btnToggleDragMode) {
    btnToggleDragMode.addEventListener('click', () => {
      book.toggleDeskPanMode();
    });
  }

  // Actualización reactiva de los controles de la interfaz
  function updateUI(state) {
    if (state.isClosed || state.coverAngle < 15) {
      btnPrev.disabled = true;
      btnNext.disabled = false;
      pageIndicator.textContent = "Libro cerrado sobre el escritorio";
      if (textToggleBook) textToggleBook.textContent = "Abrir libro";
      return;
    }

    if (state.coverAngle < 165) {
      btnPrev.disabled = false;
      btnNext.disabled = false;
      pageIndicator.textContent = `Libro entreabierto (${Math.round(state.coverAngle)}°)`;
      if (textToggleBook) textToggleBook.textContent = "Cerrar libro";
      return;
    }

    if (textToggleBook) textToggleBook.textContent = "Cerrar libro";
    btnPrev.disabled = false;
    btnNext.disabled = !state.canGoNext;

    // Etiqueta legible de hojas
    const { left, right } = state.visiblePages;
    if (state.currentIndex >= state.totalPages - 2) {
      pageIndicator.textContent = "Contratapa posterior";
    } else if (book.isMobile) {
      const label = right?.sheetLabel ? `Hoja ${right.sheetLabel}` : (right?.title || '');
      pageIndicator.textContent = label;
    } else {
      let label = "";
      if (left?.sheetLabel && right?.sheetLabel) {
        label = `Hojas ${left.sheetLabel} y ${right.sheetLabel}`;
      } else if (!left?.sheetLabel && right?.sheetLabel) {
        label = `Guarda interior y Hoja ${right.sheetLabel}`;
      } else if (left?.sheetLabel && !right?.sheetLabel) {
        label = `Hoja ${left.sheetLabel} y Guarda posterior`;
      } else {
        label = `${left?.title || ''} y ${right?.title || ''}`;
      }
      pageIndicator.textContent = label;
    }
  }

  // Alternar apertura y cierre del libro
  if (btnToggleBook) {
    btnToggleBook.addEventListener('click', () => {
      book.toggleBookOpenClose();
    });
  }

  // Navegación con botones visibles (siempre activa)
  btnNext.addEventListener('click', () => {
    book.nextPage();
  });

  btnPrev.addEventListener('click', () => {
    book.prevPage();
  });

  // Centrar el libro en el escritorio
  if (btnResetPan) {
    btnResetPan.addEventListener('click', () => {
      book.resetPan();
    });
  }

  // Opciones de inclinación de perspectiva (B3)
  if (btnToggleTilt && tiltMenu) {
    btnToggleTilt.addEventListener('click', (e) => {
      e.stopPropagation();
      tiltMenu.classList.toggle('is-hidden');
    });

    const tiltItems = tiltMenu.querySelectorAll('.tilt-menu-item');
    tiltItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const pitch = parseFloat(item.getAttribute('data-pitch'));
        book.setPresetPitch(pitch);
        tiltMenu.classList.add('is-hidden');
      });
    });

    document.addEventListener('click', (e) => {
      if (!tiltMenu.classList.contains('is-hidden')) {
        if (!tiltMenu.contains(e.target) && !btnToggleTilt.contains(e.target)) {
          tiltMenu.classList.add('is-hidden');
        }
      }
    });
  }

  // Controles de zoom / escala del libro
  if (btnZoomIn) {
    btnZoomIn.addEventListener('click', () => {
      book.zoomIn(0.1);
    });
  }

  if (btnZoomOut) {
    btnZoomOut.addEventListener('click', () => {
      book.zoomOut(0.1);
    });
  }

  // Navegación por teclado (activa solo cuando la escena del libro está visible)
  window.addEventListener('keydown', (e) => {
    if (sceneBook && sceneBook.classList.contains('is-hidden')) {
      return;
    }

    if (e.key === 'Escape') {
      if (tiltMenu && !tiltMenu.classList.contains('is-hidden')) {
        tiltMenu.classList.add('is-hidden');
        return;
      }
      if (modalTranscription.classList.contains('active')) {
        closeTranscriptionModal();
        return;
      }
    }

    if (modalTranscription.classList.contains('active')) return;

    if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
      e.preventDefault();
      book.nextPage();
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      e.preventDefault();
      book.prevPage();
    } else if (e.key === 'Home') {
      e.preventDefault();
      if (!book.isClosed) book.closeBook();
    } else if (e.key === 'End') {
      e.preventDefault();
      if (book.isClosed) book.openBook();
      book.goToPage(book.pages.length - 1);
    }
  });

  // Modal de transcripción accesible
  function openTranscriptionModal() {
    const text = book.getCurrentTranscription();
    transcriptionContent.innerHTML = text
      .split('\n\n')
      .map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`)
      .join('');
    modalTranscription.classList.add('active');
    btnCloseModal.focus();
  }

  function closeTranscriptionModal() {
    modalTranscription.classList.remove('active');
    btnTranscription.focus();
  }

  btnTranscription.addEventListener('click', openTranscriptionModal);
  btnCloseModal.addEventListener('click', closeTranscriptionModal);
  modalTranscription.addEventListener('click', (e) => {
    if (e.target === modalTranscription) {
      closeTranscriptionModal();
    }
  });

  // Estado inicial
  book.notifyChange();
  updateDragModeUI(false);
});
