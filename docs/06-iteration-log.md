# 06 — Iteration Log (Historial Cronológico de Iteraciones)

> **Estado:** Registro de cambios de producto y ciclo de vida de diseño  
> **Metodología:** Cada ciclo documenta hipótesis, cambios implementados, pruebas técnicas ejecutadas, feedback real del Product Owner y estado de validación.  

---

## 📅 Ciclo 1: Primer Prototipo Funcional (MVP Base)

### 1.1 Objetivo del ciclo
Construir una primera prueba de concepto interactiva y responsive que permitiera abrir un libro digital con portada y páginas interiores de prueba, desacoplando los datos del código y validando la viabilidad técnica con tecnologías web nativas.

### 1.2 Implementación realizada
- Creación de la arquitectura estática modular (HTML5, CSS3, ES Modules).
- Creación de la estructura de datos `book-data.js` con 10 páginas (portadas, prólogo, relatos y páginas fotográficas ficticias de prueba).
- Implementación de un pliego de dos páginas en escritorio y página simple en móvil.
- Navegación inicial mediante:
  - Botones visibles anterior / siguiente (`‹` y `›`).
  - Barra deslizadora (*range slider*) para saltar entre páginas.
  - Flechas del teclado (`←` y `→`).
  - Clic en cualquier punto de la página derecha para avanzar o izquierda para retroceder.
- Rotación básica en 3D de hoja con CSS (`rotateY(-180deg)`).
- Modal de transcripción accesible para personas con dificultades visuales.
- Servidor local autónomo en Node.js (`serve.js`) y script lanzador de un clic para Windows (`run.bat`).

### 1.3 Pruebas técnicas ejecutadas por el equipo de desarrollo
- Verificación sintáctica con Node.js (`--check`): 0 errores.
- Verificación de entrega HTTP local: Códigos `200 OK` en todos los archivos.
- Verificación de integridad de datos: Comprobación de que las 10 páginas cuentan con metadatos y transcripción accesible.

### 1.4 Feedback real del Product Owner (Evaluación de Iteración 1)
> *"Funciona como visor de páginas, pero visualmente se siente como una presentación de diapositivas. Quiero cambiar ese enfoque: el protagonista debe ser un libro físico que podamos explorar, no una interfaz que muestra páginas."*

**Hallazgos concretos del Product Owner:**
1. **Sensación estática y plana:** Las páginas se percibían como rectángulos suspendidos en un lienzo digital abstracto, carentes de presencia física.
2. **Rechazo del slider:** La barra de progreso de páginas incrementaba la sensación artificial de "reproductor multimedia" o "presentación de diapositivas".
3. **Aceptación de controles clásicos:** Las flechas visibles (`‹` y `›`) y los atajos de teclado resultaron cómodos y fueron explícitamente aprobados para conservarse.
4. **Necesidad de volumen:** Exigencia de incorporar tapas duras, lomo tridimensional, grosor visible del papel apilado, sombras arrojadas y una superficie real de apoyo.
5. **Manipulación física:** Deseo de poder agarrar y reacomodar el libro completo sobre la mesa con el mouse.
6. **Paso de página natural:** El gesto debía poder iniciarse desde los márgenes o esquinas del papel con una cinemática creíble.

---

## 📅 Ciclo 2: Rediseño hacia el Realismo Físico

### 2.1 Objetivo del ciclo
Transformar el visor de páginas en un objeto volumétrico tangible que repose sobre una mesa de lectura de madera, dotándolo de peso, sombras físicas, manipulación controlada (*Desk Pan*) y esquinas interactivas de hojear, eliminando elementos artificiales.

### 2.2 Implementación realizada
- **Superficie de apoyo ambiental:** Se reemplazó el fondo digital abstracto por una mesa de madera de nogal con textura de vetas e iluminación cenital proveniente de una lámpara de lectura cálida.
- **Volumen y tapas duras:**
  - Encuadernación en cuero borgoña con **ceja perimetral** que sobresale del canto del papel.
  - Sombra física proyectada con oclusión de contacto y difusión direccional sobre la mesa.
  - Canto lateral con estratificación visible de grosor de papel apilado.
  - Lomo central con canal de costura y sombreado profundo de 7 paradas.
  - Curvatura parabólica de las hojas hacia el lomo.
- **Interacción de arrastre en mesa (*Desk Pan*):**
  - Contenedor con `cursor: grab / grabbing` que permite desplazar el libro con el mouse de forma contenida ($\pm 200\text{px}$ X, $\pm 100\text{px}$ Y).
  - Botón discreto en el encabezado (`⌖ Centrar`) para recentrar el libro con retorno suave.
  - Discriminador de eventos para evitar que arrastrar el libro dispare por error un cambio de página.
- **Navegación física y esquinas interactivas:**
  - **Eliminación total del slider de páginas.**
  - Incorporación de 4 esquinas interactivas con señal visual de elevación (*dog-ear peel hint*) al pasar el cursor.
  - Cinemática de volteo con elevación cenital (35% del arco), arqueo no lineal (`skewY`) y caída con sombreado dinámico de oclusión.
  - Conservación de flechas visibles (`‹` y `›`) en formato de medallas clásicas de latón.
- **Subordinación de la interfaz:** Encabezado y pie de página transparentes y reducidos, dejando el protagonismo al libro.

### 2.3 Pruebas técnicas ejecutadas por el equipo de desarrollo
- Comprobación de sintaxis Node.js (`verify-v2.mjs`): 0 errores.
- Comprobación de respuestas HTTP en servidor local: Códigos `200 OK` en todas las rutas.
- Comprobación de DOM: Confirmada la supresión del elemento `#pageProgress` y la existencia de los nuevos controladores de pan y esquinas.
- Apertura automatizada del entorno en el navegador predeterminado para inspección local.

### 2.4 Feedback del Product Owner sobre la Iteración 2
> *"La Iteración 2 mejoró la apariencia visual, pero el resultado todavía no cumple el objetivo central: el libro permanece siempre abierto, se desplaza como un objeto rígido y sus animaciones no transmiten una interacción física convincente."*

**Problemas concretos identificados:**
1. **Ausencia de libro cerrado:** El libro permanece permanentemente abierto; no existe el acto físico de encontrar el volumen cerrado sobre la mesa y abrirlo.
2. **Desplazamiento rígido:** El arrastre del libro actúa como una traslación 2D plana, sin considerar el punto exacto donde comienza el agarre, saltando o moviéndose sin torque ni sensación de peso.
3. **Paso de página predeterminado (no progresivo):** La página responde principalmente al clic disparando una animación prefijada en lugar de seguir de forma continua y proporcional la posición del cursor, impidiendo sostener la hoja a medio camino o cancelarla.
4. **Falta de diferenciación de agarre:** No existe distinción entre mover el objeto con una mano o manipularlo con dos manos de forma más estable.

---

## 📅 Ciclo 3: Experiencia Física y Mecánica del Libro (En curso)

### 3.1 Hipótesis de diseño de la Iteración 3
*Si iniciamos la experiencia con el libro cerrado sobre un escritorio de roble oscuro (~1970) con perspectiva e iluminación direccional coherente, y permitimos: (1) una apertura física interactiva de la tapa, (2) arrastre de libro con una mano que considere el punto exacto de agarre e inclinación natural, (3) agarre con dos manos simulado con `CTRL`, y (4) paso de página progresivo donde la hoja sigue el puntero en tiempo real con captura de eventos y finalización continua al soltar, el usuario experimentará una manipulación mecánica coherente y no un visor estático con animaciones automáticas.*

### 3.2 Cambios previstos
1. **Dirección artística del escritorio:** Mesa de roble oscuro, marrón profundo con vetas añejas, iluminación cálida direccional y sombras de contacto que integran el fondo a la escena.
2. **Estado inicial (Libro cerrado):** Visualización del tomo cerrado con lomo izquierdo, canto de páginas, tapa de cuero borgoña con detalles dorados y apertura interactiva de la cubierta hacia la posición de lectura.
3. **Manipulación con una mano y dos manos:**
   - **Una mano:** Agarre desde el punto exacto (sin saltos al centro), inercia moderada, inclinación/torque según la distancia al centro de masa y desaceleración natural.
   - **Dos manos (`CTRL` + arrastre):** Control estabilizado con inclinación contenida que simula sujetar el volumen con ambas manos.
4. **Paso de página interactivo y progresivo:**
   - Arrastre continuo de la hoja desde esquina/borde siguiendo el cursor.
   - Cálculo dinámico de ángulo, curvatura y sombras según posición $X/Y$ del puntero.
   - Captura de puntero (`setPointerCapture`) para evitar pérdidas de foco al salir de la hoja.
   - Decisión de completar o cancelar el giro al soltar con animación continuada desde la posición real de liberación.
5. **Compatibilidad:** Mantenimiento intacto de flechas visibles, atajos de teclado, responsive y `prefers-reduced-motion`.

### 3.3 Criterios de aceptación (Comprobación técnica)
- [x] 1. La experiencia inicia con el libro cerrado sobre el escritorio de roble.
- [x] 2. La apertura es gradual e interactiva al arrastrar la tapa o hacer clic en ella.
- [x] 3. El arrastre del libro considera el punto exacto de agarre sin saltos y transmite peso/inclinación.
- [x] 4. Presionar `CTRL` activa un modo de agarre con dos manos estabilizado y diferenciado.
- [x] 5. La hoja sigue el puntero en tiempo real y puede soltarse a medio camino para completar o cancelar el giro.
- [x] 6. La animación de soltado continúa suavemente desde el ángulo exacto donde se soltó.
- [x] 7. Las flechas visibles y teclado continúan funcionando normalmente.
- [x] 8. No hay conflictos entre arrastrar el libro y pasar de página (discriminación de puntero y captura de eventos).
- [x] 9. Soporte responsive y respeto a `prefers-reduced-motion`.
- [x] 10. Documentación actualizada con pruebas técnicas y estado de evaluación del PO.

### 3.4 Pruebas técnicas ejecutadas en desarrollo
1. **Comprobación sintáctica:** `app.js` y `book-engine.js` superaron la validación de sintaxis de Node.js con 0 errores.
2. **Entrega HTTP:** Códigos `200 OK` verificados en `/`, `/css/main.css`, `/css/book.css`, `/js/app.js` y `/js/book-engine.js`.
3. **Simulación cinemática (`verify-iteration3.mjs`):**
   - Se verificó que el mapeo de desplazamiento del puntero genera ángulos continuos de $0^\circ$ a $-180^\circ$ con flexión de papel (`skewY` dinámico hasta $3.5^\circ$), elevación vertical de hasta $22\text{px}$ y atenuación de sombra.
   - Se comprobó que con progreso $\le 42\%$ la hoja retorna a su posición inicial y con $> 42\%$ completa el giro.
   - Se validó matemáticamente la diferenciación entre el modo 1 mano (torque variable según distancia al centro de masa) y el modo 2 manos (`CTRL`, rotación contenida y cabeceo estabilizado).

### 3.5 Estado de validación (Técnica vs. Humana)
> ⚠️ **AVISO METODOLÓGICO DE RIGOR:**  
> Las pruebas anteriores corresponden estrictamente a **verificaciones técnicas de desarrollo en entorno local**.  
> **La evaluación visual, táctil y de experiencia por parte del Product Owner permanece PENDIENTE.**  
> No se declara que la experiencia sea definitivamente realista ni que esté formalmente validada hasta que el Product Owner evalúe la interacción en su monitor y emita su juicio.

### 3.6 Limitaciones de realismo identificadas en esta iteración
1. **Deformación geométrica de papel sin mallas WebGL:**  
   Al emplear CSS 3D nativo sin librerías pesadas de mallas tridimensionales (como Three.js), la hoja se flexiona mediante una combinación de rotación angular en el eje del lomo, inclinación de sesgo (`skewY`) y elevación en el eje Z (`translateZ`), complementada con gradientes reactivos. Si bien esto logra que la hoja siga al puntero de forma continua y transmita flexibilidad, no constituye una deformación de tela o papel calculada vértice por vértice.
2. **Simulación de dos manos con un único puntero:**  
   Dado que el hardware estándar solo dispone de un cursor de mouse, el agarre con dos manos es una simulación basada en la tecla `CTRL` que estabiliza el cabeceo e inhibe el balanceo lateral. No permite tirar de dos extremos del libro en direcciones opuestas.

### 3.7 Prueba de Concepto WebGL (Exploración descartada y retirada)
- **Objetivo de la exploración:** Evaluar si WebGL aportaba suficiente valor sensorial a la experiencia de lectura como para justificar una migración técnica.
- **Resultado:** Tras construir y evaluar una prueba de concepto puntual con Three.js local, se determinó que el valor adicional de iluminación por fotones no compensaba la sobrecarga de dependencias (más de 600 KB), el mayor consumo de recursos y la complejidad innecesaria para un libro familiar íntimo.
- **Resolución:** La exploración WebGL fue definitivamente descartada y sus archivos temporales (`poc-webgl.html`, `js/poc-webgl.js`, `assets/three.min.js`) fueron eliminados del proyecto, consolidando CSS 3D como la única arquitectura técnica.

---

## 📅 Ciclo 4: Refinamiento de la Experiencia 3D del Libro (Versión Web Actual, CSS 3D)

### 4.1 Feedback real del Product Owner (Evaluación de Iteración 3)
El Product Owner evaluó la Iteración 3 e identificó 7 problemas concretos que impedían alcanzar el objetivo de realismo físico:
1. **Apertura rígida:** El libro parecía permanecer completamente abierto sin permitir sostenerlo o dejarlo en una posición parcialmente abierta.
2. **Animaciones poco naturales:** La apertura y el cierre se percibían como movimientos prefijados; faltaba percibir el desplazamiento progresivo controlado por el usuario.
3. **Perspectiva demasiado vertical:** La cámara se ubicaba en un ángulo cenital plano en lugar de aproximarse a la perspectiva humana oblicua de una persona sentada frente al escritorio.
4. **Escritorio poco visible:** La mesa se percibía como un fondo decorativo plano y no como una superficie tridimensional con profundidad y presencia.
5. **Conflicto entre gestos:** El sistema confundía ocasionalmente el arrastre de una página con el desplazamiento del libro sobre la mesa.
6. **Deformación defectuosa de las hojas:** Al pasar una página hacia la izquierda, la hoja se doblaba diagonalmente de forma artificial (`skewY`) y no cubría correctamente la página izquierda al asentarse.
7. **Manipulación inconsistente:** Aunque la diferenciación entre 1 mano y 2 manos (`CTRL`) era perceptible, requería consolidar su estabilidad y respuesta física.

### 4.2 Decisiones de diseño e implementación técnica
Para resolver los problemas sin abandonar la arquitectura liviana nativa (HTML, CSS 3D y JS modular):

1. **Apertura física variable de la tapa dura (0° a 180°):**
   - El libro inicia cerrado en reposo sobre el escritorio (`coverAngle = 0°`).
   - La tapa frontal de cuero borgoña rota alrededor del eje del lomo (`transform-origin: left center`) permitiendo cualquier ángulo intermedio estable elegido por el usuario (cerrado, entreabierto a 45°, 90°, 120°, o completamente abierto a 180°).
   - Centrado dinámico sin saltos: a 0°, el libro cerrado se centra en la mesa mediante `--closed-offset-x: calc(var(--page-width) / -2 * (1 - ratio))`; a 180°, se centra el pliego completo.
   - Asentamiento físico: si el usuario suelta con un movimiento rápido (*flick*), completa suavemente la apertura o cierre; si la suelta con baja velocidad en una posición intermedia, la tapa permanece estable en ese ángulo exacto.

2. **Eliminación del pliegue artificial y cobertura perfecta de la hoja:**
   - Se removió por completo la distorsión de corte diagonal (`skewY`), causante de la deformación angulosa y del desalineamiento al girar hacia la izquierda.
   - Se implementó rotación 3D pura (`rotateY`) con elevación vertical (`translateZ` hasta 24px) para evitar superposiciones (*z-fighting*).
   - Se añadió un sombreado dinámico cilíndrico (`leaf-shadow-overlay`) que simula la curvatura óptica de la hoja según el progreso de giro.
   - Dimensiones de la cara de la hoja fijadas a `width: 100% !important; height: 100% !important` con márgenes y radios de curvatura idénticos a las páginas estáticas, garantizando una cobertura del 100% al asentarse sobre la página opuesta, sin huecos ni asimetrías.

3. **Perspectiva humana oblicua y escritorio de roble profundo:**
   - Se ajustó la cámara a `perspective: 1300px` con `perspective-origin: 50% 28%` y un cabeceo de reposo de `rotateX(18deg)`. La parte superior del libro se aleja sutilmente y el borde frontal queda más cercano al lector, recreando la postura natural sentada ante una mesa.
   - Escritorio de roble oscuro enriquecido con vetas longitudinales, iluminación direccional cálida proveniente de una lámpara de quinqué/mesa en la esquina superior izquierda, viñeta íntima y sombra de oclusión volumétrica bajo el libro.

4. **Máquina de estados de gestos unificada con bloqueo de objetivo (*Target Locking*):**
   - **Sobre la tapa:** controla exclusivamente el ángulo de apertura/cierre de la tapa.
   - **Sobre las hojas (esquinas o cuerpo):** manipula exclusivamente el paso progresivo de página (avance o retroceso).
   - **Sobre la mesa, lomo o cuerpo libre del libro:** activa el desplazamiento del libro sobre el escritorio (*Desk Pan* con 1 mano o 2 manos con `CTRL`).
   - Una vez iniciado el gesto, el elemento captura el puntero (`setPointerCapture`) y el objetivo queda bloqueado hasta `pointerup`, impidiendo que un arrastre de página se convierta en un desplazamiento del libro a mitad del movimiento.

5. **Navegación accesible y continua:**
   - Animaciones cinemáticas suaves por interpolación en `nextPage()`, `prevPage()`, `openBook()` y `closeBook()` al usar botones o teclado (`ArrowRight`, `ArrowLeft`, `Space`, `Home`, `End`), eliminando retardos mudos.
   - Compatibilidad táctil con gestos de deslizamiento horizontal (*swipe*) en móvil y respeto absoluto a `prefers-reduced-motion`.

### 4.3 Archivos modificados
- `css/main.css`: Perspectiva oblicua (`1300px`), ángulo de reposo de mesa (`18deg`), sombras volumétricas y vetas de roble añejo.
- `css/book.css`: Componente `.book-front-cover`, eliminación de `skewY`, gradientes cilíndricos de flexión y cobertura milimétrica de hojas.
- `js/book-engine.js`: Controlador de apertura variable (`coverAngle`), máquina de estados de gestos unificada, bloqueo de puntero y cinemática continua.
- `js/app.js`: Manejo de estados de interfaz para libro entreabierto y actualización reactiva de indicadores.
- `index.html`: Indicadores de interacción física discretos en el pie de página.

### 4.4 Pruebas técnicas ejecutadas
1. **Comprobación sintáctica:** `agy-node --check` validó `js/book-engine.js` y `js/app.js` con 0 errores de sintaxis.
2. **Disponibilidad HTTP:** Códigos `200 OK` en todas las rutas locales (`/index.html`, `/css/main.css`, `/css/book.css`, `/js/app.js`, `/js/book-engine.js`).
3. **Mapeo de apertura variable:** Se verificó que `coverAngle` responde progresivamente entre 0° y 180° y mantiene estados intermedios estables.

### 4.5 Limitaciones que permanecen en CSS 3D (Rigor técnico)
1. **Ausencia de mallas poligonales continuas:** CSS 3D transforma elementos rectangulares mediante matrices afines; la curvatura del papel es una aproximación óptica lograda mediante rotación, elevación y gradientes móviles de sombra, no una deformación de tela con cálculo de tensiones mecánicas.
2. **Iluminación simulada vs física:** Las luces y sombras son gradientes declarativos y filtros CSS, no fuentes de luz física que proyectan penumbras dinámicas sobre geometría 3D como en WebGL.

### 4.6 Estado de validación
> ⚠️ **AVISO METODOLÓGICO:**  
> Las mejoras implementadas han sido comprobadas técnica y sintácticamente. La calidad del movimiento, el peso visual percibido y la naturalidad de la manipulación quedan **pendientes de la evaluación visual directa del Product Owner** en su navegador.

---

## 📅 Ciclo 5: Realismo Físico del Libro y Experiencia Narrativa de Entrada

### 5.1 Objetivos de la iteración
1. **Etapa A (Realismo físico del libro):**
   - Corregir el estado inicial del libro cerrado para que se perciba como un único volumen compacto centrado en el escritorio, sin hojas interiores visibles ni duplicación de tapas.
   - Implementar un grosor de lomo y taco de hojas dinámico que disminuye en el lado derecho y aumenta en el lado izquierdo a medida que se avanza en la lectura.
   - Habilitar el paso de página interactivo bidireccional (tanto hacia adelante como hacia atrás) arrastrando desde el borde exterior.
   - Enriquecer la curvatura visual de la hoja mediante elevación parabólica y resalte cilíndrico sin distorsiones geométricas extrañas.
   - Permitir ajustar el ángulo de inclinación de la vista mediante `SHIFT + arrastre vertical` o botón accesible de control.
2. **Etapa B (Experiencia narrativa de bienvenida):**
   - Incorporar una máquina de escribir de mediados del siglo XX sobre el mismo escritorio de roble oscuro antes de revelar el libro.
   - Interacción mecanográfica con teclado físico o virtual táctil para dispositivos móviles.
   - Validación de la palabra clave `HARISPE` (apellido del autor, insensible a mayúsculas/minúsculas).
   - Opciones accesibles de borrado y botón de omisión (*bypass*) para evitar bloqueos de usabilidad.
   - Transición fluida y cinematográfica entre la máquina de escribir y el libro físico.

### 5.2 Implementación técnica realizada

#### Etapa A: Mecánica y apariencia del libro
1. **Volumen cerrado auténtico:**
   - En `css/book.css`, se ocultó completamente la página izquierda (`#pageLeft`) cuando el libro está cerrado (`is-closed`), eliminando la superficie blanca plana errónea.
   - El lomo cerrado (`#closedSpine`) se ancló exactamente al 50% horizontal con compensación centrada de $-245\text{px}$, logrando que el libro cerrado repose en el centro visual de la mesa como un tomo individual de cuero borgoña.
2. **Taco de hojas dinámico según avance de lectura:**
   - Se crearon variables CSS `--right-edge-shadow` y `--left-edge-shadow` administradas por `updateDynamicThickness()` en `js/book-engine.js`.
   - A medida que se pasa de la página 0 a las páginas finales, el grosor visible de páginas a la derecha decrece suavemente de $20\text{px}$ a $3\text{px}$, mientras que el taco de hojas a la izquierda crece correspondientemente de $3\text{px}$ a $20\text{px}$.
3. **Paso de página interactivo bidireccional:**
   - La máquina de estados de gestos unificada reconoce si el puntero se inicia en la mitad derecha (avance, $0^\circ \to -180^\circ$) o en la mitad izquierda (retroceso, $-180^\circ \to 0^\circ$).
   - El arrastre interactivo actualiza la hoja en tiempo real con elevación `translateZ` para evitar *z-fighting* y sombra proyectada reactiva.
4. **Curvatura cilíndrica y ajuste de inclinación visual:**
   - Se agregó el resalte óptico `--leaf-crest` que se desplaza transversalmente por la superficie del papel, emulando la cresta de curvatura sin requerir `skewY`.
   - Soporte para modificar el cabeceo de observación con `SHIFT + arrastre vertical` (rango $5^\circ$ a $45^\circ$) y botón táctil `#btnToggleTilt` que conmuta ángulos de perspectiva predefinidos.

#### Etapa B: Máquina de escribir narrativa y transición
1. **Escena y estética de época (`css/typewriter.css`):**
   - Chasis metálico verde oliva oscuro con esquinas redondeadas, tornillería vintage, placa dorada de fabricante (*Continental Standard*), rodillo negro de goma con perillas moleteadas y guía de tipos.
   - Hoja de papel marfil mecanografiada con textura sutil, marca de agua y cursor de cinta roja intermitente.
   - Teclado clásico con teclas circulares convexas con aro cromado exterior, respuesta táctil al presionar y barra espaciadora ancha.
2. **Controlador interactivo (`js/typewriter.js`):**
   - Escucha pulsaciones físicas del teclado y toques en las teclas virtuales de la pantalla.
   - Dispone de un `<input>` invisible para sincronización con teclados virtuales en pantallas móviles.
   - Valida la palabra `HARISPE` normalizando espacios y mayúsculas/minúsculas.
   - Mecanismos de recuperación: tecla `Backspace` física, tecla en pantalla `⌫`, botón `Borrar` y botón `Omitir e ingresar directamente al libro →`.
3. **Transición cinematográfica coordinada (`js/app.js`):**
   - Al completar la clave, la máquina de escribir se eleva y desvanece suavemente mediante transiciones CSS aceleradas por GPU, mientras la escena del libro aparece en el mismo escritorio de roble iluminado.

### 5.3 Archivos modificados y creados
- `css/main.css`: Variables de inclinación (`--view-pitch`), escena dual (`.scene-typewriter` y `.scene-book`) y corrección de sintaxis de contenedores.
- `css/book.css`: Ocultamiento estricto de pliego interior en estado cerrado, anclaje de lomo central, sombreado multicapa de grosor de hojas dinámico y resalte de cresta cilíndrica.
- `css/typewriter.css` *(nuevo)*: Estilos completos del chasis de máquina de escribir, carro porta-papel, teclas circulares, tipografía de máquina y adaptación responsive móvil.
- `js/typewriter.js` *(nuevo)*: Lógica de mecanografiado, teclado físico/virtual, validación `HARISPE` y callback de desbloqueo.
- `js/book-engine.js`: Grosor de taco de páginas decreciente/creciente dinámico, arrastre bidireccional adelante/atrás, control de inclinación vertical por gesto (`SHIFT`).
- `js/app.js`: Coordinación de escenas (máquina $\to$ libro), atajos de inclinación y aislamiento de eventos de teclado.
- `index.html`: Estructura semántica de la escena de máquina de escribir, integración de estilos y controles de inclinación.
- `docs/04-product-decisions.md`: Decisión D09 (Máquina de escribir como umbral narrativo) y D10 (Física de grosor y cierre de libro).
- `docs/06-iteration-log.md`: Registro exhaustivo del ciclo 5.

### 5.4 Pruebas técnicas ejecutadas
1. **Comprobación sintáctica con Node.js:**  
   `agy-node --check` validó `js/typewriter.js`, `js/app.js` y `js/book-engine.js` con código de salida `0` (0 errores).
2. **Disponibilidad HTTP de recursos locales:**  
   Verificación exitosa con código `200 OK` para `http://localhost:3000/index.html`, `/css/typewriter.css` y `/js/typewriter.js`.
3. **Validación de responsividad móvil:**  
   Verificación de clases y media queries para $360\times 800\text{px}$, asegurando que el teclado y la máquina se escalen sin desbordar el viewport.

### 5.5 Estado de validación
> ⚠️ **AVISO METODOLÓGICO DE RIGOR:**  
> Las pruebas ejecutadas garantizan la corrección sintáctica del código, la entrega de archivos vía HTTP y la coherencia lógica de las funciones.  
> **La evaluación de la atmósfera emocional, la satisfacción del mecanografiado, la naturalidad de la transición y el realismo del libro físico permanecen PENDIENTES de la inspección manual directa por parte del Product Owner en su navegador.**

---

## 📅 Ciclo 6: Corrección de Interacciones y Realismo Mecánico

### 6.1 Diagnóstico de causas raíz y problemas detectados por el PO
1. **Falla en el retroceso de páginas por arrastre (A1):**
   - *Causa raíz 1:* En el pliego inicial (`currentIndex = 1`), la tapa frontal abierta a 180° reposaba sobre el hemisferio izquierdo con `z-index: 70`. El puntero impactaba sobre `#frontCover`, pero la regla en `handlePointerDown` exigía `coverAngle < 170`, bloqueando el evento y derivándolo erróneamente a mover la mesa completa (*Desk Pan*).
   - *Causa raíz 2:* En pliegos interiores (`currentIndex > 1`), `startPageDragGesture('prev')` animaba custom properties CSS sin asignar directamente la propiedad `transform`, provocando que en ciertos navegadores no se disparara el evento `transitionend`, dejando `this.isAnimating = true` de forma permanente y congelando cualquier interacción posterior.
   - *Causa raíz 3:* Al levantar la hoja hacia la derecha, no se actualizaba temporalmente el contenido del pliego base, causando duplicación visual del texto durante el arrastre.
2. **Aparición abrupta de la página izquierda al abrir (A2):**
   - *Causa raíz:* La visibilidad de la página izquierda `#pageLeft` dependía de la remoción binaria de la clase `.book-container.is-closed` al superar los 15° de apertura. Físicamente, en el pliego 1 la contratapa frontal en rotación 3D *es* la propia página izquierda; `#pageLeft` era un rectángulo estático redundante que aparecía flotando en el escritorio cuando la tapa apenas despegaba en el lado derecho.
3. **Conflicto entre lectura y manipulación física (B1):**
   - La captura incondicional de puntero sobre las páginas impedía la lectura sosegada y la selección de texto, provocando desplazamientos no deseados del libro ante cualquier interacción ordinaria.
4. **Falta de volumen y materialidad en la máquina de escribir (C1):**
   - La versión previa utilizaba un chasis plano sin perspectiva 3D, teclas sin vástago ni recorrido perceptible, y carecía de movimiento mecánico de tipos y de respuesta sonora física.

### 6.2 Soluciones de diseño e ingeniería implementadas

#### Etapa A: Navegación robusta y geometría continua del libro
1. **Retroceso por arrastre 100% operativo:**
   - Se reestructuró la máquina de estados de gestos: tocar el hemisferio izquierdo cuando `currentIndex <= 1` inicia el arrastre de cierre de la tapa hacia la derecha; cuando `currentIndex > 1`, inicia `startPageDragGesture('prev')`.
   - Se incorporó rotación tridimensional en el lomo con transformaciones directas en `leafEl.style.transform = 'rotateY(...) translateZ(...)'`, garantizando interpolación continua y eventos `transitionend` confiables, respaldados por un temporizador de seguridad de 540 ms que previene bloqueos de estado.
   - Actualización dinámica del contenido subyacente durante el arrastre: al levantarse la hoja hacia la derecha, se revela la página anterior real sin duplicados.
2. **Apertura progresiva y eliminación del salto visual:**
   - Se eliminó la dependencia de clases binarias para la geometría: las variables `--open-ratio`, `--backing-left` y `--backing-width` se calculan matemáticamente en función del ángulo exacto del puntero (`coverAngle / 180`).
   - `#pageLeft` permanece con opacidad 0 cuando `currentIndex <= 1`, permitiendo que la cara interior de la tapa frontal (`#frontCover .back-face`) sea la única superficie visible que rota progresivamente desde 0° hasta 180°, eliminando cualquier superficie blanca flotante.
   - El lomo cerrado y el lomo abierto se atenúan e intensifican suavemente mediante gradientes proporcionales al ángulo de apertura.

#### Etapa B: Modos LECTURA y ARRASTRE
1. **Modo LECTURA como predeterminado:**
   - Al abrir el libro, el usuario ingresa en modo LECTURA: los gestos de arrastre físico quedan inactivos, permitiendo leer, seleccionar texto y navegar de forma segura mediante botones y teclado.
2. **Botón persistente de alternancia:**
   - Se incorporó el control `#btnToggleDragMode` en el encabezado (`[📖 Arrastre: Desactivado]` $\leftrightarrow$ `[🖐️ Arrastre: Activado]`), con retroalimentación visual en dorado y actualización de pistas contextuales en el pie de página.
   - En modo ARRASTRE, se habilita la manipulación táctil/mouse de tapa, páginas y mesa. `CTRL + arrastrar` continúa funcionando como atajo temporal sin desconfigurar el botón persistente.

#### Etapa C: Rediseño 3D de la máquina de escribir y Web Audio API
1. **Presencia escultórica e histórica (1950–1980):**
   - Viewport con `perspective: 1100px` y chasis metálico pesado inclinado a 10° con biseles, tornillería cromada y placa de fabricante *Continental Standard · 1958*.
   - Riel cromado de carro, rodillo cilíndrico de goma negra con perillas laterales moleteadas y regleta de escala.
   - Cesta semicircular de tipos con horquilla guía y **martillo mecánico animado (`#typebarStriker`)** que se proyecta contra el papel en cada pulsación.
   - Micro-avance del carro (*escapement*) que desplaza el conjunto a medida que se mecanografía.
2. **Teclado vintage 3D escalonado:**
   - Cuatro filas escalonadas con relieve en Z. Teclas circulares con aro cromado exterior, cara cóncava y descenso físico de 4 px al presionarse. Barra espaciadora ancha con volumen.
3. **Síntesis sonora local (Web Audio API):**
   - Módulo `TypewriterAudio` sin archivos externos ni descargas de red: sintetiza en tiempo real el impacto de tipo contra papel, el click de palanca, el trinquete del carro y la campana de carro al completar la clave.
   - Control `#btnToggleSound` (`🔊 Sonido ON` / `🔇 Silencio`) para activar o silenciar con un clic. Cumplimiento estricto de políticas de audio del navegador (activación tras el primer gesto de usuario).

### 6.3 Archivos modificados y creados
- `css/book.css`: Reglas de visibilidad continua para `#pageLeft`, dimensiones adaptativas del backing de cuero (`--backing-left/width`) y gradientes corregidos para `.flip-left-to-right`.
- `css/typewriter.css`: Rediseño tridimensional completo, carro, rodillo con perillas moleteadas, martillo mecánico animado, teclado escalonado y control de sonido.
- `css/main.css`: Estilo activo para botones del encabezado (`.btn-header.is-active`).
- `js/book-engine.js`: Corrección integral del retroceso por arrastre, apertura progresiva, modos LECTURA/ARRASTRE y temporizadores de seguridad.
- `js/typewriter.js`: Síntesis de sonido Web Audio API, sincronización de martillo mecánico y avance de carro.
- `js/app.js`: Integración del botón de modo de arrastre, pistas contextuales y coordinación de audio.
- `index.html`: Estructura 3D de la máquina de escribir, controles de sonido y botón de modo de arrastre.
- `docs/04-product-decisions.md`: Decisiones D11 (Modos Lectura y Arrastre) y D12 (Mecánica 3D y Web Audio API).
- `docs/06-iteration-log.md`: Registro completo del ciclo 6.

### 6.4 Pruebas técnicas ejecutadas
1. **Validación sintáctica en Node.js:**  
   `agy-node --check` validó `typewriter.js`, `app.js` y `book-engine.js` con código de salida `0` (0 errores).
2. **Comprobación de entrega HTTP local:**  
   Códigos `200 OK` verificados en todas las rutas locales (`/index.html`, `/css/book.css`, `/css/typewriter.css`, `/js/book-engine.js`, `/js/typewriter.js`, `/js/app.js`).
3. **Soporte de audio sin dependencias:**  
   Verificación del ciclo de vida de `AudioContext` con manejo de estados suspendidos y degradación silenciosa si el usuario silencia o si la API no está disponible.

### 6.5 Limitaciones que persisten en CSS 3D
1. **Deformación por matrices afines vs. simulación elástica:** La flexión de la hoja sigue siendo una aproximación geométrica rígida con elevación parabólica y resalte óptico de cresta, no una malla elástica calculada por elementos finitos.
2. **Oclusión de sombras estáticas vs. luz dinámica:** Las sombras proyectadas se calculan mediante gradientes y transformaciones CSS, no mediante fuentes de luz volumétricas en tiempo real.

### 6.6 Estado de validación
> ⚠️ **AVISO METODOLÓGICO DE RIGOR:**  
> Las comprobaciones de código confirman la ausencia de errores sintácticos y la correcta arquitectura de eventos.  
> **La evaluación de la fluidez del retroceso, la comodidad de los modos LECTURA/ARRASTRE, la naturalidad de la apertura y el impacto sensorial de la máquina de escribir corresponden exclusivamente a la revisión manual directa del Product Owner en su navegador.**

---

## 📅 Ciclo 7: Corrección de Interacciones del Libro y Estudio de Escritor de Época

### 7.1 Feedback y diagnóstico de problemas previos
1. **Bloqueo del arrastre de páginas (A1 y A3):**  
   En la iteración anterior, la condición de protección del modo lectura bloqueaba el arrastre de páginas si no se activaba previamente un botón en el encabezado. El Product Owner solicitó que hojear y abrir la tapa estén **siempre disponibles**, reservando la restricción exclusivamente al desplazamiento del tomo sobre la mesa (Desk Pan).
2. **Aparición abrupta de la página izquierda a los 10-15° (A2):**  
   El método `getVisiblePages()` asignaba la página 1 al ala derecha cuando el libro estaba cerrado y cambiaba a la página 2 en cuanto el ángulo superaba los 5°, provocando un destello blanco. La corrección precarga la portada interior (página 2) en el ala derecha y oculta estrictamente la base izquierda (`#pageLeft`) durante el pliego 1 (`currentIndex <= 1`), donde la tapa frontal abierta rota como cara izquierda.
3. **Estética de la máquina de escribir (Etapa B):**  
   El tono verde oliva anterior no transmitía la austeridad histórica deseada. Se exigió que la máquina fuera **estrictamente negra** (esmalte/laca profunda), acompañada de un estudio de escritor de época anterior a 1970 con escritorio de roble, boiserie y objetos de época tangibles en CSS puro.

### 7.2 Decisiones de diseño e implementación técnica
1. **Separación definitiva de los 3 gestos (A3):**
   - **Gesto 1: Pasar páginas (Siempre activo):** El usuario puede arrastrar las hojas o hacer clic en triggers perimetrales en cualquier momento sin activar modos previos.
   - **Gesto 2: Abrir y cerrar la tapa (Siempre activo):** La interacción directa con la tapa frontal permite abrirla o cerrarla sin desplazar el libro en el espacio.
   - **Gesto 3: Mover el tomo en el escritorio (Desk Pan restringido):** SÓLO se ejecuta si se mantiene presionada la tecla `CTRL` (o se activa el botón accesible `#btnToggleDragMode`). Los clics o arrastres accidentales en el escritorio no mueven el libro.
2. **Corrección del retroceso de páginas (A1):**
   - El arrastre hacia la derecha activa la hoja dinámica `.flip-left-to-right`, calculando la rotación tridimensional en el lomo y revelando la página anterior. Si el movimiento es un clic rápido (< 320 ms, < 14 px), el giro se completa de forma instantánea.
3. **Apertura progresiva continua sin saltos (A2):**
   - Geometría continua del fondo de cuero (`--backing-left/width`), centrado progresivo (`--closed-offset-x`) y atenuación coordinada de lomos. En el pliego inicial, `#pageLeft` permanece en `opacity: 0; visibility: hidden; pointer-events: none;`.
4. **La máquina de escribir negra (B3 y B4):**
   - Chasis metálico acabado en esmalte negro profundo (`linear-gradient(175deg, #26272a, #161719, #0d0e10, #050607)`), con biseles de luz satinada y remaches oscuros.
   - Teclas circulares con cuerpo cilíndrico negro, aro cromado exterior brillante y tipografía marfil envejecida. Barra espaciadora negra con bisel de cromo. Cesta de tipos en gris grafito oscuro con martillo animado `#typebarStriker`.
5. **Estudio de época y escritorio de roble (B1 y B2):**
   - **Fondo arquitectónico:** Pared con boiserie de paneles de madera noble (`.study-boiserie-wall`) y haz de luz cálido de lámpara vintage (`.study-ambient-lamp-beam`).
   - **Objetos de escritorio en CSS puro:** Pila de 3 libros antiguos (cuero borgoña, tela verde bosque y becerro marrón con repujados dorados) más un volumen vertical apoyado contra un sujetalibros de bronce; tintero facetado de cristal oscuro/ámbar con cuello y tapa de bronce; pluma estilográfica de ebonita con plumín dorado; y hojas manuscritas con caligrafía tenue.

### 7.3 Archivos modificados
- `js/book-engine.js`: Separación estricta de gestos (hojear libre vs. CTRL para pan), captura de puntero en contenedor estable, eliminación del destello de página en apertura y corrección completa del retroceso.
- `js/app.js`: Reconfiguración del botón de desplazamiento del libro (`Mover libro (CTRL)`), actualización de pistas contextuales y coordinación de estado.
- `index.html`: Estructura del estudio de época (boiserie, atrezzo de libros, tintero, pluma y manuscritos), actualización de placa del fabricante y textos de asistencia.
- `css/book.css`: Regla estricta de ocultación de página izquierda en pliego 1 (`visibility: hidden !important;`) y estabilidad de backing de cuero.
- `css/typewriter.css`: Estilizado de la máquina en esmalte negro profundo, teclas con aro cromado, boiserie, lámpara y objetos de época en CSS puro sin dependencias.
- `docs/04-product-decisions.md`: Decisión D13 (Separación estricta de gestos) y D14 (Estudio de época y máquina de escribir negra).
- `docs/05-ui-design-system.md`: Especificación cromática de la laca negra y objetos de época.
- `docs/06-iteration-log.md`: Registro del ciclo 7.
- `docs/07-product-backlog.md`: Actualización del estado del backlog.

### 7.4 Pruebas técnicas ejecutadas
1. **Comprobación sintáctica Node.js:**  
   Ejecución de `agy-node --check` en `js/*.js` con código de salida `0` (sin advertencias ni errores).
2. **Entrega HTTP local:**  
   Respuesta `200 OK` en todas las rutas locales del servidor `serve.js`.
3. **Verificación de gestos y accesibilidad:**  
   Paso de página verificado por teclado (flechas), botones de interfaz y gestos de puntero.

---

## 📅 Ciclo 8: Recuperar la Experiencia y Alcanzar Realismo Fotográfico

### 8.1 Diagnóstico de causa raíz (Regresión P0 de la máquina de escribir)
1. **Causa raíz identificada:**  
   Durante la consolidación de gestos en la Iteración 7, se introdujo una duplicación accidental de listeners huérfanos dentro del cuerpo de la clase en `js/book-engine.js` (antiguas líneas 647-649: sentencias descontextualizadas `window.addEventListener(...)`).
2. **Mecanismo de fallo en tiempo de ejecución:**  
   Los navegadores modernos lanzaron `SyntaxError: Unexpected token '.'` al parsear la clase `BookEngine`. Dado que `js/app.js` comienza con `import { BookEngine } from './book-engine.js'`, la excepción bloqueó la ejecución de todo el árbol de módulos ES. Como resultado:
   - `TypewriterController` nunca llegó a instanciarse.
   - Ningún evento de teclado físico (`keydown`), tecla virtual (`click`) o botón de bypass quedó registrado en el DOM.
   - La máquina de escribir parecía completamente congelada e inerte.
3. **Mecanismo de registro y robustez ante tecleo rápido:**  
   Se identificó además que la asignación diferida mediante `setTimeout(..., 45)` en `executeKeystroke()` introducía condiciones de carrera con la tecla Backspace durante la escritura rápida. Se migró la actualización de estado a registro síncrono inmediato, preservando las animaciones mecánicas y de sonido en paralelo.

### 8.2 Solución y verificación de la Etapa P0
1. **Archivos reparados:**
   - `js/book-engine.js`: Eliminación de las líneas sintácticamente erróneas.
   - `js/typewriter.js`: Sincronización inmediata del texto ingresado sin retrasos de estado; preservación de síntesis sonora desacoplada y animación del carro.
2. **Pruebas funcionales automatizadas en navegador real (Edge headless vía CDP):**
   - **Teclado físico:** Ingreso de caracteres en minúsculas `harispe` registrado fielmente como `HARISPE` e invocación automática de la transición hacia el libro (`typewriterHidden: true, bookVisible: true`).
   - **Teclas virtuales:** Pulsación secuencial de botones `.type-key` verificada en el papel.
   - **Retroceso:** Funcionamiento de `Backspace` virtual y físico con recorte de caracteres y retroceso de carro.
   - **Borrado completo:** Botón `#btnClearTypewriter` resetea el texto y carro inmediatamente.
   - **Acceso directo (Bypass):** Clic en `#btnBypassTypewriter` transiciona de inmediato al libro sin requerir la palabra clave.
   - **Consola:** Cero excepciones no controladas y cero errores de sintaxis (`Runtime.exceptionThrown: []`).

### 8.3 Rediseño visual fotorrealista (Etapa P1 — Estrategia Híbrida)
1. **Justificación de la Estrategia Híbrida:**  
   Las superficies modeladas exclusivamente con degradados CSS y sombras cuadradas producen una apariencia sintética de "decorado 3D simplificado", carente de micro-poros, dispersión de luz subsuperficial y profundidad óptica. Para resolver esta limitación sin romper la ligereza del proyecto (cero WebGL, cero librerías externas), se adoptó una arquitectura híbrida:
   - **Geometría interactiva nativa:** La máquina de escribir y el libro continúan siendo objetos HTML / CSS 3D manipulables por el usuario.
   - **Activos fotográficos de época de alta resolución:**
     - `assets/textures/antique-study-backdrop.jpg`: Fondo auténtico de estudio privado con lámpara de banquero vintage en luz cálida, boiserie y estanterías en bokeh.
     - `assets/textures/dark-oak-desk.jpg`: Roble oscuro con grano irregular, textura de poros, pátina de uso y acabado satinado.
     - `assets/textures/vintage-leather-cover.jpg`: Encuadernación en cuero borgoña de los años 1930-1950 con pliegues naturales y grano fino.
     - `assets/textures/vintage-paper-texture.jpg`: Papel marfil de trapo de época con fibras de algodón y envejecimiento en los bordes.
2. **Integración ambiental y proporciones físicas:**
   - **Eliminación de scrollbars y ajuste de escala:** Se eliminó el `overflow-y: auto` de la escena de entrada; el chasis de la máquina se escaló a factor 0.9 para encajar con holgura en pantallas de laptop (800px de altura), permitiendo que el encabezado y el botón de omisión (#btnBypassTypewriter) queden visibles simultáneamente sobre el roble del escritorio.
   - **Conexión física y sombras de oclusión:** Se crearon sombras de contacto en capas (sombra de contacto apretada de 2px + penumbra suave de 28px + difusión ambiental de 55px) que apoyan la máquina de forma tangible sobre el escritorio.
   - **Teclas mecánicas de época:** Bisel perimetral de níquel/cromo satinado, interior cóncavo en laca oscura con tipografía serif marfil, y tacto mecánico reactivo.
   - **Hoja en el rodillo:** Papel de trapo con textura real de época y caracteres con densidad de cinta entintada.
   - **Libro encuadernado:** Portada y lomo con textura de cuero auténtico, estampación en pan de oro con bisel y relieve sutil, y pliegos interiores con papel de archivo y flexbox estructurado sin desbordamientos de texto.

### 8.4 Archivos modificados y creados
- `js/book-engine.js`: Corrección del error sintáctico P0 y ajuste de márgenes en guardas.
- `js/typewriter.js`: Registro inmediato de caracteres y armonización de escala en transición de apertura.
- `css/main.css`: Fondo fotorrealista del estudio con escritorio de roble y dimensiones responsivas del libro.
- `css/typewriter.css`: Integración del fondo fotográfico, eliminación de scrollbars, rediseño de chasis en laca negra, sombra de contacto física, teclas con bisel cromado y hoja con textura de papel de trapo.
- `css/book.css`: Portada y lomo con cuero auténtico, pan de oro, páginas interiores con textura de papel y flexbox en `.page-content-wrapper`.
- `assets/textures/*`: Cuatro texturas fotográficas de alta resolución (`antique-study-backdrop.jpg`, `dark-oak-desk.jpg`, `vintage-leather-cover.jpg`, `vintage-paper-texture.jpg`).
- `test-typewriter.mjs`: Suite de pruebas automatizadas P0 mediante Chrome DevTools Protocol.
- `docs/04-product-decisions.md`: Decisión D16 (Estrategia Híbrida).
- `docs/06-iteration-log.md`: Registro del ciclo 8.
- `docs/07-product-backlog.md`: Actualización de estado del backlog.
- `docs/08-case-study.md`: Inclusión de la resolución de la regresión y avance fotorrealista.

### 8.5 Estado de validación
> ⚠️ **AVISO METODOLÓGICO DE RIGOR:**  
> Las comprobaciones técnicas de la máquina (teclado físico, teclas virtuales, borrado, bypass, palabras clave) y el renderizado sin errores fueron verificadas exhaustivamente de manera automatizada en el navegador.  
> **La evaluación estética y la confirmación subjetiva del realismo fotográfico corresponden exclusivamente al Product Owner en su revisión manual.**

---

## 📅 Ciclo 9: Reconstrucción del Libro Interactivo, Integración de Assets MODA AI y Pacing Físico

### 9.1 Diagnóstico de causas raíz y problemas identificados
1. **Regresión en retroceso de páginas por arrastre:**
   - *Causa raíz:* En `js/book-engine.js`, el contenedor `.book-front-cover` mantenía `z-index: 70` en el DOM incluso tras avanzar a pliegos interiores (páginas 3, 5, etc.). Al estar rotado 180°, cubría físicamente el hemisferio izquierdo del libro. Cualquier interacción con puntero en el lado izquierdo disparaba la condición `touchedFrontCover && this.coverAngle >= 150`, invocando erróneamente `startCoverDragGesture()` (cierre del libro a página 0) en lugar de `startPageDragGesture('prev')`.
2. **Páginas que se ponían blancas durante el arrastre/sostenido:**
   - *Causa raíz:* Las reglas CSS de `.leaf-face.front`, `.leaf-face.back` y sus variantes de orientación no incluían ninguna imagen de textura de papel (`background-image: url(...)`) y utilizaban un degradado radial con núcleo blanco puro (`radial-gradient(..., #fff 0%, ...)`). Adicionalmente, el overlay dinámico `.leaf-shadow-overlay` aplicaba una franja de brillo blanco puro al 85% (`rgba(255, 255, 255, 0.85)`) en la cresta de la curvatura, lavando por completo el pliego durante el arrastre.
3. **Velocidad de giro excesivamente apresurada:**
   - *Causa raíz:* La transición de cierre de hoja estaba parametrizada en 0.5s con temporizadores de 540ms, generando un salto brusco poco realista. El Product Owner solicitó un pacing pausado y físico entre 650ms y 900ms.
4. **Rango de inclinación de lectura insuficiente:**
   - *Causa raíz:* El ángulo de inclinación (`viewPitch`) estaba restringido a un rango angosto (5° a 45°), impidiendo colocar el libro en un ángulo casi vertical/frontal (0° o negativo) para lectura relajada.
5. **Apariencia sintética de materiales y atrezzo:**
   - *Causa raíz:* La portada, páginas y escritorio dependían de texturas genéricas o sintéticas que no correspondían con el ejemplar físico real de Guillermo B. Harispe. El Product Owner proveyó 5 activos de alta resolución generados con MODA AI que reproducen la encuadernación auténtica en tela azul marino con esquinas de cuero y etiqueta manuscrita, el papel con costura de archivo y la ambientación completa del estudio.

### 9.2 Implementación técnica realizada

#### P0 — Correcciones funcionales del libro interactivo
- **Retroceso de páginas garantizado:**
  - En `js/book-engine.js`, se reestructuró la discriminación de gestos de puntero (`handlePointerDown`): cuando el lector se encuentra en pliegos interiores (`this.currentIndex > 1`), todo toque o arrastre en el hemisferio izquierdo delega estricta y exclusivamente a `startPageDragGesture(e, 'prev')`.
  - La tapa frontal (`#frontCover`) recibe dinámicamente `z-index: 1` y `pointer-events: none` cuando `this.currentIndex > 1`, colocándose físicamente por detrás del bloque de páginas izquierdas y evitando intercepciones de clic no deseadas.
- **Corrección del destello blanco en hojas móviles:**
  - En `css/book.css`, se dotó a `.leaf-face`, `.leaf-face.front`, `.leaf-face.back` y sus selectores invertidos de la textura auténtica `moda-page-gutter-paper.webp`.
  - Se eliminaron todos los núcleos `#fff` de los degradados radiales.
  - En `.leaf-shadow-overlay`, la franja blanca al 85% se sustituyó por una veladura satinada sutil de tono pergamino (`rgba(255, 250, 235, 0.25)`), preservando la legibilidad del texto en todo momento del giro.
- **Cadencia física de paso de página (750ms):**
  - Se actualizó `--flip-duration: 0.75s` en `css/main.css`.
  - `.flipping-leaf.is-finishing-turn` utiliza `transition: transform 0.75s cubic-bezier(0.25, 0.9, 0.35, 1)`.
  - Los temporizadores de seguridad en `finishLeafTurn()`, `nextPage()` y `prevPage()` se ajustaron sincronizadamente a 780ms.

#### P1 — Física de manipulación, inclinación y separación de gestos
- **Ampliación del rango de inclinación (-55° a +55°):**
  - `setPitch(pitch)` soporta ahora valores desde -55° hasta +55°.
  - Se definieron 4 niveles de inclinación ergonómica en `pitchLevels: [0, 15, 30, 48]`:
    - `0°`: Vista frontal/vertical perpendicular a la línea de visión (máxima comodidad de lectura).
    - `15°`: Posición de lectura inclinada sobre atril/escritorio.
    - `30°`: Apoyo estándar sobre mesa.
    - `48°`: Perspectiva cenital/oblicua de conjunto.
  - El gesto `Shift + arrastre vertical` permite ajuste analógico continuo en tiempo real con sensibilidad calibrada.
- **Separación de los 5 gestos:**
  1. *Avance de página:* Clic o arrastre en el hemisferio derecho del libro.
  2. *Retroceso de página:* Clic o arrastre en el hemisferio izquierdo (pliego > 1).
  3. *Apertura/Cierre de tapa:* Clic o arrastre en la tapa (pliego 0 y 1).
  4. *Inclinación (Tilt):* `Shift + arrastre vertical` o botón 📐 en cabecera.
  5. *Desplazamiento del libro (Desk Pan):* Estrictamente con tecla `Ctrl` o activando el botón ✋ (`#btnToggleDragMode`). Clics neutros en el escritorio sin `Ctrl` no desplazan el tomo.

#### Integración de los 5 activos MODA AI
1. **Portada frontal (`moda-book-front-cover.webp`):**
   - Integrada en `.book-cover-view`.
   - Muestra la textura original de tela azul marino con esquinas de cuero tostado y la etiqueta histórica manuscrita en caligrafía: *"Libro para mis hijos — Guillermo B. Harispe"*.
   - Se removieron los adornos falsos de pan de oro en CSS y textos duplicados, sustituyéndolos por un texto accesible oculto (`.sr-only`) y la píldora discreta de indicación física (`.cover-open-affordance`).
2. **Contratapa posterior y fondo (`moda-book-back-cover.webp`):**
   - Integrada en `.book-cover-backing` y en el cierre de contratapa, armonizada con reborde de cuero y oclusión ambiental.
3. **Lomo redondeado (`moda-book-front-cover.webp` / tono azul marino & cuero):**
   - Adaptado a la paleta azul noche y cuero tostado del ejemplar real.
4. **Páginas interiores (`moda-page-gutter-paper.webp`):**
   - Integrada en `.book-page`, `.book-page.page-left`, `.book-page.page-right`, `.cover-face.back-face` y `.leaf-face`.
   - Reproduce el tono marfil cálido, la textura de papel de trapo verjurado y el canal central con marcas de costura artesanal.
5. **Hoja de máquina de escribir (`moda-folded-rag-paper.webp`):**
   - Integrada en `.typewriter-paper-sheet`. Papel artesanal doblado que transmite autenticidad documental.
6. **Ambiente de estudio y escritorio (`moda-study-desk-scene.webp`):**
   - Integrada en `.desk-surface` y `.study-room-backdrop`.
   - Fotografía de alta resolución de un estudio de escritor clásico con lámpara de bronce, máquina de escribir, tintero, lentes y manuscritos con iluminación de claroscuro natural, eliminando el difuminado artificial excesivo y el efecto pegatina.

### 9.3 Pruebas técnicas y validación automatizada (CDP vía Microsoft Edge)
- **Suite ejecutada:** `tests/test-prompt9-verification.mjs`.
- **Resultados obtenidos:**
  - *Verificación de fondo de máquina:* PASS (`moda-study-desk-scene.webp` detectado).
  - *Verificación de papel de máquina:* PASS (`moda-folded-rag-paper.webp` detectado).
  - *Verificación de portada:* PASS (`moda-book-front-cover.webp` detectado).
  - *Verificación de pliego interior:* PASS (`moda-page-gutter-paper.webp` en páginas izquierda y derecha).
  - *Navegación secuencial adelante:* Spread 1 -> Spread 2 -> Spread 3 (Pág. 4 y 5): PASS.
  - *Retroceso por botón:* Spread 3 -> Spread 2: PASS.
  - *Retroceso por arrastre físico de puntero (Drag):* Arrastre de izquierda a derecha en Spread 2 completó el giro retornando a Spread 1 (Guarda y Pág. 1) sin cerrar el libro ni perder la tapa: PASS.
  - *Inclinación (Tilt):* Ciclos de 30° y 48° verificados en `--view-pitch`: PASS.
  - *Cero excepciones de consola:* `0 errors, 0 warnings`.
- **Evidencias visuales capturadas:**
  - `screenshot-p9-typewriter.png` (Escena de máquina de escribir con papel doblado y estudio fotorrealista).
  - `screenshot-p9-closed-book.png` (Libro cerrado con portada azul auténtica, esquinas de cuero y etiqueta caligráfica).
  - `screenshot-p9-open-book.png` (Libro abierto en pliego 1 con papel de archivo verjurado, costura central y atrezzo de estudio).

### 9.4 Estado de validación
> ✅ **ESTADO TÉCNICO:** Todos los requisitos funcionales, cinemáticos y de integración de assets fueron validados en navegador real sin dependencias externas ni WebGL.  
> ⚠️ **REVISIÓN DEL PRODUCT OWNER:** Se entregan las capturas y el entorno local para la valoración estética final del Product Owner.



