# Libro para mis hijos — Guillermo Bautista Harispe
### Prototipo Web Interactivo de Preservación y Digitalización (Versión 2.0: Realismo Físico)

Este proyecto recrea la experiencia de explorar y hojear un libro familiar antiguo sobre una mesa de lectura, con volumen tridimensional, sombras de encuadernación y física de papel realista.

---

## 🚀 Cómo ejecutar y ver el prototipo

### Método 1: Doble clic en Windows (Recomendado)
1. Abrí la carpeta del proyecto en el Explorador de Windows:
   `C:\Users\tblutman\Documents\libro-para-mis-hijos`
2. Hacé doble clic en el archivo **`run.bat`**.
3. Se abrirá automáticamente tu navegador predeterminado en `http://localhost:3000`.

### Método 2: Desde la consola (PowerShell o CMD)
```powershell
node C:\Users\tblutman\Documents\libro-para-mis-hijos\serve.js --open
```

---

## 📖 Novedades de la Versión 2.0 (Enfoque en Realismo Físico)

1. **Presencia Tridimensional del Objeto:**
   - **Mesa de lectura:** Superficie de madera cálida de nogal con iluminación cenital suave proveniente de una lámpara de lectura.
   - **Tapas duras con ceja:** La encuadernación exterior sobresale del bloque de hojas con biselado perimetral y costura.
   - **Canto de hojas estratificado:** Los laterales muestran el espesor real de decenas de páginas apiladas y cortadas.
   - **Lomo central y caída de papel:** Las hojas nacen con curvatura parabólica desde el canal central de costura, evitando la sensación de lámina plana.
   - **Sombra de apoyo proyectada:** El libro arroja sombra física de contacto y difusión sobre la madera.

2. **Interacción con el Objeto (Desk Pan):**
   - En escritorio, es posible **agarrar y reacomodar el libro completo sobre la mesa** con el mouse (`cursor: grab / grabbing`).
   - El movimiento está acotado por márgenes elásticos para que el libro nunca se escape del campo de visión ni dificulte la lectura.
   - Se incluye un botón discreto de recentrado (`⌖ Centrar`).

3. **Navegación Táctil y Esquinas Interactivas:**
   - **Hojear desde las esquinas:** Al pasar el cursor por los extremos superior o inferior de las páginas, la esquina se levanta sutilmente (*dog-ear peel hint*), invitando a pasar la página haciendo clic.
   - **Cinemática de volteo:** Animación no lineal con aceleración y deceleración física, elevación de la hoja en el cenit y caída suave con sombreado dinámico de oclusión.
   - **Controles visibles:** Se conservan las flechas clásicas (`‹` y `›`).
   - **Eliminación del slider digital:** Se suprimió la barra de desplazamiento para despojar la pantalla de elementos artificiales y centrar la atención en el objeto libro.
   - **Móvil:** Adaptación a página individual con soporte para gestos táctiles de deslizamiento (*swipe* horizontal) sin interferir con el desplazamiento vertical de la pantalla.

4. **Contenido Ficticio y Preparación para el Futuro:**
   - Todo el contenido continúa en `js/data/book-data.js` debidamente identificado como ficticio de prueba.
   - Las páginas fotográficas simulan marcos y esquineros de álbum clásico para sustitución directa cuando estén disponibles los escaneos originales de Guillermo Bautista Harispe.

5. **Accesibilidad:**
   - Soporte para `prefers-reduced-motion` (desactiva giros 3D).
   - Modal de transcripción accesible en texto plano y alto contraste.

---

## 📂 Estructura de archivos

```
libro-para-mis-hijos/
├── index.html              # Estructura semántica del visor y la mesa
├── serve.js                # Servidor local HTTP nativo
├── run.bat                 # Lanzador rápido para Windows
├── README.md               # Documentación y registro de iteraciones
├── css/
│   ├── main.css            # Mesa de madera, iluminación cálida y UI discreta
│   └── book.css            # Tapas duras, lomo, cantos, esquinas y cinemática 3D
└── js/
    ├── app.js              # Controlador principal y atajos de teclado
    ├── book-engine.js      # Motor físico del libro, arrastre en mesa y volteo
    └── data/
        └── book-data.js    # Base de datos editorial desacoplada
```
