/**
 * Estructura de datos del libro: "Libro para mis hijos"
 * Autor: Guillermo Bautista Harispe
 *
 * Configuración: 35 hojas físicas vacías, preparadas para recibir posteriormente
 * las imágenes escaneadas de los documentos y manuscritos originales.
 */

export const TOTAL_SHEETS = 35;

export const BOOK_METADATA = {
  title: "Libro para mis hijos",
  author: "Guillermo Bautista Harispe",
  subtitle: "Manuscrito familiar y recuerdos",
  editionNotice: "PRESERVACIÓN DIGITAL",
  warningNotice: "",
  totalSheets: TOTAL_SHEETS,
  totalPages: TOTAL_SHEETS
};

// Generación de las 35 hojas con numeración editorial fija (01/35 a 35/35)
// La Hoja 01 contiene los recortes originales de 1951 y 1959; las hojas 02 a 35 quedan vacías para futuro contenido.
const emptySheets = Array.from({ length: TOTAL_SHEETS }, (_, idx) => {
  const sheetNum = idx + 1;
  const formattedNumber = `${String(sheetNum).padStart(2, '0')}/${TOTAL_SHEETS}`;
  
  if (sheetNum === 1) {
    return {
      id: idx + 2,
      sheetNumber: 1,
      sheetLabel: formattedNumber,
      type: "sheet",
      side: "recto",
      title: "Primeros reconocimientos literarios (1951 · 1959)",
      subtitle: "Biblioteca Popular Sarmiento y Certamen René Bastianini",
      image: "assets/sheet-01/sheet-01-composite.png",
      transcription: "Hoja 01/35: Primer recorte: 'sept. 1.951' - Biblioteca Popular Sarmiento :: Acto Literario. Segundo premio: 'Romance al tiempo mago', composición del alumno de la Escuela de Comercio, señor Guillermo B. Harispe Macchiavello. Segundo recorte: 'EL VI CERTAMEN RENÉ BASTIANINI 1959'. Jurado constituído por Jorge Luis Borges, Nicolás Cócaro y Carlos O. Bastianini. Mención de honor: 'Tierra en la lejanía', de Guillermo B. Harispe. Fecha manuscrita en birome azul: 'LA NACIÓN 2/3 Dbre/59'."
    };
  }

  return {
    id: idx + 2, // Índices 3 a 36 en el pliego
    sheetNumber: sheetNum,
    sheetLabel: formattedNumber,
    type: "sheet",
    side: (sheetNum % 2 === 1) ? "recto" : "verso",
    image: null, // Campo preparado para la imagen del documento original escaneado
    transcription: `Hoja ${formattedNumber}`
  };
});

export const BOOK_PAGES = [
  // 0. Portada exterior (tapa dura azul y cuero)
  {
    id: 0,
    sheetNumber: null,
    sheetLabel: null,
    side: "cover",
    type: "cover-front",
    title: "Libro para mis hijos",
    subtitle: "cuaderno para mis hijos · Papá 1984",
    transcription: "Tapa del libro: 'cuaderno / para / mis hijos / Papá 1984', tarjeta en letra de imprenta manuscrita en tinta azul dentro de un bolsillo plástico transparente en el sector inferior derecho con subrayado artesanal en 'apá'."
  },
  // 1. Guarda anterior (reverso de tapa frontal)
  {
    id: 1,
    sheetNumber: null,
    sheetLabel: null,
    side: "verso",
    type: "inside-cover",
    title: "Guarda interior",
    transcription: "Guarda interior anterior."
  },
  // 2 a 36: Las 35 hojas interiores vacías
  ...emptySheets,
  // 37. Guarda posterior (cara previa a la contratapa)
  {
    id: TOTAL_SHEETS + 2, // 37
    sheetNumber: null,
    sheetLabel: null,
    side: "recto",
    type: "inside-back-cover",
    title: "Guarda posterior",
    transcription: "Guarda interior posterior."
  },
  // 38. Contratapa exterior
  {
    id: TOTAL_SHEETS + 3, // 38
    sheetNumber: null,
    sheetLabel: null,
    side: "cover",
    type: "cover-back",
    title: "Contratapa",
    transcription: "Contratapa de encuadernación."
  }
];
