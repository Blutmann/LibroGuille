/**
 * Estructura de datos del libro: "Libro para mis hijos"
 * Autor: Guillermo Bautista Harispe
 *
 * Diseñada para desacoplar completamente el contenido de la interfaz.
 * En futuras etapas, para incorporar las fotografías originales escaneadas y los
 * textos definitivos, solo será necesario reemplazar las rutas de imagen y los campos
 * de texto en este archivo sin alterar la lógica de la aplicación.
 */

export const BOOK_METADATA = {
  title: "Libro para mis hijos",
  author: "Guillermo Bautista Harispe",
  subtitle: "Crónicas familiares, fotografías y documentos",
  editionNotice: "PROTOTIPO DE PRESERVACIÓN DIGITAL",
  warningNotice: "PÁGINAS DE PRUEBA — CONTENIDO FICTICIO IDENTIFICABLE",
  totalPages: 10
};

// Generador de imágenes ficticias en formato SVG vectorial (cero dependencias externas)
function createVintagePhotoSvg(title, subtitle, iconType = "portrait") {
  const iconMarkup = iconType === "portrait" 
    ? `<circle cx="200" cy="115" r="38" fill="#5c4838" opacity="0.75"/>
       <path d="M140 195 C140 150, 260 150, 260 195 Z" fill="#5c4838" opacity="0.75"/>`
    : `<rect x="130" y="100" width="140" height="90" rx="4" fill="#5c4838" opacity="0.5"/>
       <polygon points="120,105 200,55 280,105" fill="#4d3a2b" opacity="0.75"/>
       <circle cx="165" cy="135" r="14" fill="#3a2a1d" opacity="0.6"/>
       <circle cx="235" cy="135" r="14" fill="#3a2a1d" opacity="0.6"/>`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 270" width="100%" height="100%">
    <defs>
      <radialGradient id="vignette" cx="50%" cy="50%" r="65%">
        <stop offset="40%" stop-color="#dfcfb8"/>
        <stop offset="85%" stop-color="#b8a184"/>
        <stop offset="100%" stop-color="#8c7356"/>
      </radialGradient>
      <filter id="noiseFilter">
        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" result="noise"/>
        <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.08 0" in="noise" result="coloredNoise"/>
        <feComposite operator="in" in2="SourceGraphic"/>
      </filter>
    </defs>
    <!-- Fondo fotográfico sepia con viñeteado -->
    <rect width="100%" height="100%" fill="url(#vignette)"/>
    
    <!-- Silueta ilustrativa simulada -->
    <g transform="translate(0, 10)">
      ${iconMarkup}
    </g>

    <!-- Marco de paspartú interior -->
    <rect x="12" y="12" width="376" height="246" fill="none" stroke="#6b543f" stroke-width="1.5" stroke-dasharray="4 2" opacity="0.45"/>
    
    <!-- Sellos de agua de prueba -->
    <text x="200" y="215" font-family="'Georgia', serif" font-size="13" font-style="italic" fill="#3b2b1d" text-anchor="middle" font-weight="bold">${title}</text>
    <text x="200" y="233" font-family="'Courier New', monospace" font-size="10" fill="#4a3726" text-anchor="middle" letter-spacing="1">[ ESPACIO PARA FOTOGRAFÍA ORIGINAL ]</text>
    <text x="200" y="248" font-family="'Courier New', monospace" font-size="9" fill="#6e5742" text-anchor="middle">${subtitle}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const BOOK_PAGES = [
  {
    id: 0,
    pageNumber: null,
    side: "cover",
    type: "cover-front",
    title: "Libro para mis hijos",
    subtitle: "Guillermo Bautista Harispe",
    date: "1924 — 1952",
    badge: "MUESTRA DE PRUEBA",
    isFictional: true,
    coverColor: "burgundy", // borgoña sobrio con dorado
    embossingText: "LIBRO PARA MIS HIJOS",
    transcription: "Tapa del libro: 'Libro para mis hijos', escrito por Guillermo Bautista Harispe."
  },
  {
    id: 1,
    pageNumber: null,
    side: "verso",
    type: "inside-cover",
    title: "Guarda del libro",
    subtitle: "Ex Libris y anotación inicial",
    badge: "CONTENIDO FICTICIO",
    isFictional: true,
    body: `
      <div class="ex-libris-box">
        <div class="ex-libris-header">EX LIBRIS</div>
        <div class="ornament-divider">❦</div>
        <p class="ex-libris-name">Familia Harispe</p>
        <p class="ex-libris-note" style="font-style: italic; opacity: 0.7;">[Espacio reservado para lema o inscripción original del libro físico]</p>
      </div>
      <div class="archival-note">
        <strong>Ficha de preservación archivística:</strong>
        <p>Manuscrito original empastado en tela editorial. Medidas aproximadas: 21 × 27 cm. Escrito con tinta ferrogálica y fotografías pegadas al soporte original.</p>
      </div>
    `,
    transcription: "Guarda interior: Ex Libris de la Familia Harispe y ficha técnica de preservación archivística."
  },
  {
    id: 2,
    pageNumber: 1,
    side: "recto",
    type: "title-page",
    title: "Portada Interior",
    subtitle: "Manuscrito de memorias",
    badge: "DOCUMENTO PRINCIPAL",
    isFictional: false,
    body: `
      <div class="title-page-content">
        <div class="ornament-top">❖</div>
        <h1 class="main-title">Libro para mis hijos</h1>
        <div class="rule-line"></div>
        <p class="author-label">por</p>
        <h2 class="author-name">Guillermo Bautista Harispe</h2>
        <div class="rule-line"></div>
        <p class="location-date">Provincia de Buenos Aires, República Argentina</p>
        <div class="ornament-bottom">❧</div>
      </div>
    `,
    transcription: "Portada interior: 'Libro para mis hijos', por Guillermo Bautista Harispe. República Argentina."
  },
  {
    id: 3,
    pageNumber: 2,
    side: "verso",
    type: "foreword",
    title: "Dedicatoria",
    subtitle: "Espacio reservado para el manuscrito auténtico",
    badge: "MUESTRA DE MAQUETACIÓN",
    isFictional: true,
    body: `
      <div class="archival-placeholder-box">
        <h3 class="page-heading">A mis queridos hijos</h3>
        <p style="font-size: 0.88rem; color: #5c4e3f; margin-bottom: 14px; line-height: 1.6;">
          Este folio albergará la dedicatoria y palabras manuscritas originales de <strong>Guillermo Bautista Harispe</strong> una vez digitalizado el ejemplar físico.
        </p>
        <div style="background: rgba(140, 110, 80, 0.08); border-left: 3px solid var(--gold-foil); padding: 12px 14px; border-radius: 0 4px 4px 0; font-size: 0.82rem; color: #4a3e32; line-height: 1.5;">
          <strong>Compromiso de integridad histórica:</strong><br>
          En respeto a Guillermo y a sus descendientes, este prototipo no redacta recuerdos, dedicatorias ni frases inventadas en su nombre. El contenido final provendrá exclusivamente de los documentos físicos auténticos.
        </div>
        <div class="handwriting-signature" style="margin-top: 24px; opacity: 0.45; font-style: italic; font-size: 0.8rem;">
          <span class="sig-name">[Firma y fecha originales pendientes de incorporación]</span>
        </div>
      </div>
    `,
    transcription: "Página de dedicatoria: Espacio reservado para la dedicatoria original de Guillermo Bautista Harispe. Pendiente de escaneo del documento físico."
  },
  {
    id: 4,
    pageNumber: 3,
    side: "recto",
    type: "photo-spread",
    title: "Retrato de juventud",
    subtitle: "Espacio reservado para fotografía original",
    badge: "FOTOGRAFÍA SIMULADA",
    isFictional: true,
    photoData: {
      src: createVintagePhotoSvg("Guillermo Bautista Harispe", "Estudio fotográfico c. 1922", "portrait"),
      caption: "Espacio reservado para el retrato de juventud de Guillermo Bautista Harispe en sus años de estudiante.",
      year: "c. 1922",
      archivalCode: "FOT-001 (Original pendiente de escaneo)"
    },
    transcription: "Fotografía: Espacio reservado para el retrato original de Guillermo Bautista Harispe, c. 1922."
  },
  {
    id: 5,
    pageNumber: 4,
    side: "verso",
    type: "story-spread",
    title: "Los Primeros Años",
    subtitle: "Capítulo I — Orígenes",
    badge: "MUESTRA DE MAQUETACIÓN",
    isFictional: true,
    body: `
      <div class="archival-placeholder-box">
        <h3 class="page-heading">Capítulo I: De los orígenes</h3>
        <p style="font-size: 0.88rem; color: #5c4e3f; margin-bottom: 14px; line-height: 1.6;">
          Folio reservado para la transcripción fiel del primer capítulo manuscrito de memorias familiares.
        </p>
        <div style="background: rgba(140, 110, 80, 0.08); border-left: 3px solid var(--gold-foil); padding: 12px 14px; border-radius: 0 4px 4px 0; font-size: 0.82rem; color: #4a3e32; line-height: 1.5;">
          <strong>Preservación de la voz genuina:</strong><br>
          Para salvaguardar la autenticidad del legado, este desarrollo no simula relatos ni anécdotas no documentadas. Las vivencias de los abuelos, la infancia y el hogar familiar se integrarán directamente desde los folios originales.
        </div>
      </div>
    `,
    transcription: "Capítulo I: De los orígenes. Espacio reservado para la transcripción textual de los manuscritos originales de Guillermo Bautista Harispe."
  },
  {
    id: 6,
    pageNumber: 5,
    side: "recto",
    type: "photo-spread",
    title: "La Casa y el Taller",
    subtitle: "Espacio reservado para fotografía original",
    badge: "FOTOGRAFÍA SIMULADA",
    isFictional: true,
    photoData: {
      src: createVintagePhotoSvg("Fachada y Patio Familiar", "Fotografía a la albúmina c. 1930", "landscape"),
      caption: "Fachada de la casa familiar y vista del patio con parral. Lugar de reunión de los domingos.",
      year: "c. 1930",
      archivalCode: "FOT-002 (Original pendiente de escaneo)"
    },
    transcription: "Fotografía: Fachada de la casa familiar y patio con parral, c. 1930. Encuentro de domingo."
  },
  {
    id: 7,
    pageNumber: 6,
    side: "verso",
    type: "document-preview",
    title: "Los Recortes y Testimonios",
    subtitle: "Página preparada para recortes futuros",
    badge: "PREPARADO PARA FUTUROS DESPLEGABLES",
    isFictional: true,
    body: `
      <h3 class="page-heading">Notas y Crónicas de Prensa</h3>
      <div class="editorial-text">
        <p>En este sector del libro original se conservan recortes periodísticos de época doblados en cuatro partes y adheridos a la hoja mediante esquineros de cartón.</p>
        <div class="future-clipping-card">
          <div class="clipping-tag">Espacio para recorte periodístico desplegable</div>
          <p class="clipping-preview-text">"Diario La Nación — Crónica social y laboral de la época (1936)"</p>
          <span class="clipping-subtext">En la próxima iteración, este elemento contará con animación 3D de desdoble y lectura ampliada.</span>
        </div>
      </div>
    `,
    transcription: "Página de documentos: Espacio preparado para desplegar recortes de prensa doblados con interacción futura."
  },
  {
    id: 8,
    pageNumber: null,
    side: "recto",
    type: "inside-back-cover",
    title: "Guarda posterior",
    subtitle: "Cierre del volumen",
    badge: "CONTENIDO FICTICIO",
    isFictional: true,
    body: `
      <div class="back-cover-end-matter">
        <div class="colophon">
          <h4>Colofón de digitalización</h4>
          <p>Este prototipo interactivo reproduce la estructura y proporción del manuscrito familiar original.</p>
          <p>Preservación digital en curso para la familia Harispe.</p>
          <div class="ornament-divider">❦</div>
          <p class="copyright-note">Uso privado y familiar. Todos los derechos reservados.</p>
        </div>
      </div>
    `,
    transcription: "Guarda interior posterior con colofón de digitalización y notas de preservación familiar."
  },
  {
    id: 9,
    pageNumber: null,
    side: "cover",
    type: "cover-back",
    title: "Contratapa",
    subtitle: "Cierre de encuadernación",
    badge: "MUESTRA DE PRUEBA",
    isFictional: true,
    coverColor: "burgundy",
    embossingText: "G. B. H.",
    transcription: "Contratapa de tela borgoña con monograma 'G. B. H.' en bajo relieve."
  }
];
