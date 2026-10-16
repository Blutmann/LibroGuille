# 05 — UI Design System & Guía de Estilo

> **Estado:** Especificación de diseño de interfaz (Design Tokens y Componentes)  
> **Concepto rector:** "El manuscrito iluminado en la mesa de roble"  
> **Paleta conceptual:** Cuero borgoña, marfil envejecido, tinta ferrogálica y latón dorado.  

---

## 1. Dirección visual y principios de diseño

1. **Materialidad sobre abstracción:** Cada elemento visual en pantalla responde a un material físico real: madera de nogal, papel marfil, cartón prensado, cuero con pátina y tinta sepia.
2. **Subordinación de la interfaz:** Los controles de navegación, botones y avisos del navegador son discretos, semi-transparentes y de escala reducida; el ojo del usuario debe reposar un 95% sobre el libro.
3. **Calidez e intimidad atemporal:** Evitar tonos blancos puros (`#ffffff`) o negros digitales (`#000000`). Toda la escala cromática está teñida de ocres, ámbares y sombras cálidas para emular la iluminación de una lámpara de lectura hogareña.
4. **Cinemática con inercia física:** Las animaciones deben tener peso; el papel no flota como gas ni rota rígidamente como plástico.

---

## 2. Design Tokens: Paleta Cromática

### Superficie ambiental y madera
- `--wood-desk-base`: `#1c1511` (Madera de nogal profunda, base de la mesa).
- `--wood-desk-grain1`: `#2a1f18` (Veta cálida expuesta).
- `--lamp-glow`: `rgba(255, 235, 195, 0.12)` (Haz difuso de la lámpara cenital).

### El Libro y el Papel
- `--paper-ivory`: `#faf6eb` (Tono principal de la hoja: marfil cálido, no reflectante).
- `--paper-ivory-dark`: `#ebe2ce` (Envejecimiento en los bordes y zonas de sombra).
- `--paper-edge`: `#d8ceba` (Canto de páginas apiladas).
- `--paper-edge-shadow`: `#b3a690` (Estrato de profundidad de corte del papel).

### Encuadernación y Cuero
- `--cover-burgundy`: `#3c1216` (Cuero borgoña noble, base de tapas duras).
- `--cover-burgundy-light`: `#4e181d` (Reflejo de luz sobre el lomo de cuero).
- `--cover-rim`: `#632027` (Bisel exterior de la ceja de encuadernación).

### Tipografía y Tintas
- `--ink-primary`: `#2b241d` (Tinta ferrogálica envejecida: marrón casi negro, suave al ojo).
- `--ink-secondary`: `#5e5246` (Epígrafes, notas marginales y subtítulos).
- `--ink-muted`: `#8a7c6c` (Metadatos, fechas archivísticas y foliación).
- `--ink-highlight`: `#7e2822` (Rojo lacre editorial para capitulares y títulos principales).

### Acentos Metálicos y Contraste
- `--gold-foil`: `#c99e58` (Pan de oro envejecido para estampados en tapa y botones).
- `--gold-foil-light`: `#e8c688` (Brillo metálico en bordes y medallas).

### Máquina de Escribir y Estudio de Época (Iteración 7)
- `--typewriter-lacquer-base`: `#0c0d0e` (Laca negra profunda y esmalte de época).
- `--typewriter-lacquer-highlight`: `#26272a` (Luz satinada en el bisel superior del chasis).
- `--chrome-bezel`: `#b8bfc6` (Aro exterior cromado de las teclas circulares).
- `--typebar-graphite`: `#17181a` (Acero pavonado de la cesta de tipos y martillo).
- `--boiserie-walnut`: `#1a100b` (Paneles de madera noble de la pared de fondo).
- `--amber-glass`: `#3d2311` (Cristal ahumado del tintero de escritorio).
- `--pen-ebonite`: `#121212` (Ebonita negra torneada del cuerpo de la pluma).

---

## 3. Tipografía

El sistema tipográfico combina fuentes con serifa de corte humanista y clásico con fuentes monoespaciadas para la dimensión archivística:

| Rol tipográfico | Familia tipográfica primaria y fallback | Tamaño / Peso | Uso en interfaz |
| :--- | :--- | :--- | :--- |
| **Display / Títulos** | `"Baskerville", "Georgia", serif` | 1.8rem – 2.3rem / Bold | Título en portada, encabezados de capítulo y capitulares. |
| **Cuerpo de texto** | `"Georgia", "Palatino Linotype", "URW Palladio L", serif` | 0.96rem (15.5px) / Regular | Relatos, párrafos editoriales, dedicatorias. Altura de línea: 1.7. |
| **Foliación y fecha** | `"Georgia", serif` / Italic | 0.82rem / Italic | Pies de página y número de pliego. |
| **Archivística / Sellos** | `"Courier New", Courier, monospace` | 0.65rem – 0.74rem / Bold | Códigos de preservación, carteles de contenido ficticio. |
| **Controles de UI** | `-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif` | 0.8rem / Medium | Botones de transcripción, centrado e indicadores de sistema. |

---

## 4. Profundidad, Sombras y Tratamiento de Materiales

1. **Sombra proyectada del libro sobre la mesa (`filter: drop-shadow`):**
   - Combina una sombra de contacto oclusión inmediata (`0 4px 10px rgba(0,0,0,0.9)`) con una sombra difusa arrojada hacia la derecha (`25px 40px 45px rgba(0, 0, 0, 0.75)`).
2. **Lomo central y canal de costura (`book-spine-crease`):**
   - Gradiente lineal de 7 paradas con sombras densas (`rgba(15, 10, 6, 0.5)`) y un filete de luz especular (`rgba(255, 250, 240, 0.2)`) simulando la curvatura hacia el hilo de encuadernación.
3. **Canto de hojas apiladas (`book-body` box-shadows):**
   - Sistema de sombras en capas paralelas a izquierda y derecha (`-2px, -4px, -7px, -10px, -12px`) simulando la foliación y el grosor real de un volumen de más de 100 páginas.
4. **Marcos fotográficos de época:**
   - Montura con paspartú oscuro y **cuatro esquineros triangulares de fijación** en cartón troquelado (`clip-path: polygon(...)`), exactamente como los álbumes fotográficos de la década de 1920 a 1940.

---

## 5. Componentes e Interacciones

### A. Botones de Navegación (`.btn-nav`)
- **Estética:** Medallas circulares metálicas en latón bruñido con gradiente (`#d4a962` a `#aa803c`) y bisel dorado.
- **Microinteracción:** Al pasar el cursor, se elevan 1px y amplían su sombra; al pulsar, se comprimen sutilmente. Al llegar a los límites (portada o contratapa), se opacan a un 45% y deshabilitan el puntero.

### B. Esquinas Interactivas de Hojear (`.page-turn-trigger`)
- **Ubicación:** Las 4 esquinas exteriores del libro (75px $\times$ 75px con recorte diagonal).
- **Efecto de levantamiento (*Peel hint*):** Al posar el mouse sobre la esquina, aparece un pliegue triangular en degradé con sombra arrojada que se despega 3px del bloque de hojas, indicando que se puede pasar de página.

### C. Contenedor de Arrastre de Mesa (`.book-pan-container`)
- **Cursor de affordance:** `cursor: grab` en reposo; conmuta inmediatamente a `cursor: grabbing` al presionar.
- **Restricción de desplazamiento:** Margen elástico con retorno suave mediante `resetPan()`.

### D. Modal de Transcripción Accesible (`.modal-overlay`)
- Fondo con desenfoque suave (`backdrop-filter: blur(6px)`) y tarjeta en papel marfil claro de alto contraste tipográfico (`#211c18` sobre `#fdfbf7`). Cierre mediante botón `✕`, clic exterior o tecla `Escape`.

---

## 6. Reglas Responsive

| Parámetro | Escritorio ($\gt 900\text{px}$) | Tablet ($721\text{px} – 900\text{px}$) | Móvil ($\le 720\text{px}$) |
| :--- | :--- | :--- | :--- |
| **Disposición** | Pliego doble abierto (2 páginas) | Pliego doble escalado proporcionalmente | Página individual (1 página a la vez) |
| **Ancho del libro** | Fijo a 980px | 92vw | 92vw |
| **Lomo central** | Visible con canal de costura | Visible con canal de costura | Oculto (no corresponde en hoja única) |
| **Interacción principal** | Clic en esquinas, flechas, teclado | Clic en esquinas o toque | Gesto táctil de deslizamiento (*swipe*) |
| **Arrastre de mesa** | Activo (`Desk Pan`) | Activo | Desactivado (prioridad al scroll nativo) |

---

## 7. Decisiones de diseño pendientes de validación
1. ¿El tamaño de la tipografía en móvil (0.9rem) resulta legible para usuarios de la tercera edad sin necesidad de abrir la transcripción?
2. ¿Es conveniente añadir una animación de despegue de esquinas automática durante 1 segundo al cargar la página por primera vez a modo de tutorial no invasivo?
