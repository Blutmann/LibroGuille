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

// Generación de las 35 hojas vacías con numeración editorial fija (01/35 a 35/35)
const emptySheets = Array.from({ length: TOTAL_SHEETS }, (_, idx) => {
  const sheetNum = idx + 1;
  const formattedNumber = `${String(sheetNum).padStart(2, '0')}/${TOTAL_SHEETS}`;
  return {
    id: idx + 2, // Índices 2 a 36 en el pliego
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
    subtitle: "Cuaderno para mis hijos · Papá 1984",
    transcription: "Tapa del libro: 'Cuaderno para mis hijos / Papá 1984', tarjeta manuscrita en tinta azul dentro de un bolsillo plástico transparente en el sector inferior derecho."
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
