# 04 — Product & Design Decisions (Registro de Decisiones)

> **Estado:** Documento de registro arquitectónico y de diseño (ADR)  
> **Alcance:** Decisiones adoptadas desde la concepción hasta la Iteración 2  
> **Objetivo:** Justificar el porqué de cada solución adoptada, las alternativas descartadas y sus implicancias técnicas y de UX.  

---

## Matriz de Decisiones Arquitectónicas y de Diseño

### Decisión D01: Adopción de Frontend Estático Modular sin Frameworks
- **Problema:** ¿Qué stack tecnológico garantiza la máxima portabilidad, costo cero y longevidad del proyecto?
- **Alternativas consideradas:**
  1. *Single Page Application con React / Next.js:* Ecosistema rico, pero introduce dependencias masivas de paquetes (node_modules), compilación compleja (*build steps*) y obsolescencia potencial a mediano plazo.
  2. *Librería pesada de 3D WebGL (Three.js):* Permite deformar mallas complejas de papel en tiempo real, pero eleva drásticamente el peso de carga, el consumo de batería y la complejidad matemática.
  3. **Solución adoptada: Vanilla HTML5 + CSS3 3D Moderno + ES Modules nativos.**
  - Objetivo de durabilidad y longevidad: al emplear estándares web abiertos (HTML5, CSS3, ES Modules) sin frameworks dependientes de ecosistemas cambiantes, se busca como meta de diseño que el proyecto permanezca ejecutable a largo plazo (proyección a 10 o 20 años) sin requerir refactorizaciones obligatorias por obsolescencia de paquetes.
  - Cero dependencias externas y cero costo de mantenimiento.
  - Ejecución instantánea en local mediante un mini-servidor nativo de 40 líneas (`serve.js`).
- **Consecuencias y compromisos:** No disponemos de deformación de papel en tiempo real por vértices (malla WebGL), por lo que el realismo cinemático se logra mediante fotogramas clave con arqueo no lineal, sombreados dinámicos y esquinas levantadas.

---

### Decisión D02: Desacoplamiento total del modelo de datos (`book-data.js`)
- **Problema:** ¿Cómo permitir el desarrollo y validación interactiva cuando los escaneos originales del abuelo todavía no están disponibles físicamente?
- **Alternativas consideradas:**
  1. *Codificar las páginas directamente en el HTML:* Rápido de maquetar inicialmente, pero obligaría a reescribir la estructura completa del DOM cuando lleguen los escaneos reales.
  2. *Consumir una base de datos o CMS headless (ej. Strapi, Contentful):* Sobrecarga de infraestructura innecesaria, costes de hosting y dependencia de conexión a internet.
  3. **Solución adoptada: Contrato de datos en módulo JavaScript desacoplado (`js/data/book-data.js`).**
- **Motivos de la decisión:**
  - Cada página se define como un objeto estructurado con metadatos: `id`, `type`, `pageNumber`, `title`, `badge`, `photoData`, `body` y `transcription`.
  - Permite inyectar imágenes vectoriales SVG ficticias claramente rotuladas para esta etapa de pruebas.
- **Consecuencias y compromisos:** En la fase final, incorporar el libro real consistirá únicamente en colocar los archivos `.jpg` o `.webp` en la carpeta `assets/` y actualizar el array de datos, sin tocar la lógica de interfaz ni los estilos CSS.

---

### Decisión D03: Eliminación del Slider de Navegación tras Iteración 1
- **Problema:** En la primera iteración, la barra deslizadora (*range slider*) provocaba que el usuario percibiera la web como una presentación de diapositivas multimedia o un reproductor de video.
- **Alternativas consideradas:**
  1. *Mantener el slider con estilo de barra de progreso fina.*
  2. *Reemplazar el slider por una cinta de miniaturas visibles en la parte inferior.* (Descartado: satura la pantalla y distrae del libro).
  3. **Solución adoptada: Eliminación total del slider y priorización del contacto directo con el objeto.**
- **Motivos de la decisión:**
  - En un libro físico real, el lector no tiene una barra deslizadora; navega por el canto de hojas, por la cubierta o pasando página por página.
  - El Product Owner solicitó explícitamente subordinar la interfaz para que el protagonista visual absoluto sea el libro sobre la mesa.
- **Consecuencias y compromisos:** La navegación a páginas muy distantes requiere múltiples clics o el uso del teclado (`Home` / `End`). En futuras iteraciones se evaluará si es necesario un índice de capítulos discreto en el encabezado.

---

### Decisión D04: Incorporación del arrastre del libro sobre la mesa (Desk Pan)
- **Problema:** El libro se percibía como un elemento estático pegado al fondo de la pantalla.
- **Alternativas consideradas:**
  1. *Mantener el libro fijo y centrado en todo momento.*
  2. *Permitir paneo infinito o zoom libre en cualquier dirección.* (Riesgo: el usuario puede perder el libro fuera de la pantalla).
  3. **Solución adoptada: Arrastre acotado por márgenes elásticos ($\pm 200\text{px}$ X, $\pm 100\text{px}$ Y) con cursor táctil (`grab/grabbing`) y botón de recentrado.**
- **Motivos de la decisión:**
  - Permite al lector acomodar el libro físicamente sobre su mesa de trabajo imaginaria según su ángulo de visión o tamaño de pantalla.
  - Refuerza contundentemente el modelo mental de "objeto tangible con peso".
- **Consecuencias y compromisos:** Exigió implementar un discriminador de eventos en JavaScript: si el puntero se mueve menos de 5 píxeles se considera un clic para hojear; si se mueve más de 5 píxeles se interpreta como arrastre de mesa, evitando activaciones accidentales.

---

### Decisión D05: Esquinas interactivas (*Dog-ear Peel*) en reemplazo de zonas de clic invisibles
- **Problema:** En la iteración 1, hacer clic en cualquier lugar de la hoja pasaba de página, lo que generaba frustración si el usuario intentaba seleccionar texto o inspeccionar una foto.
- **Alternativas consideradas:**
  1. *Obligar a usar exclusivamente las flechas flotantes de la pantalla.* (Resta naturalidad física).
  2. *Arrastre de hoja simulado con el cursor (Page drag & drop).* (Complejo de implementar con CSS puro sin introducir artefactos visuales o deformaciones grotescas).
  3. **Solución adoptada: Zonas interactivas en las cuatro esquinas exteriores con elevación visual al pasar el cursor (*dog-ear peel hint*).**
- **Motivos de la decisión:**
  - Emula el gesto instintivo humano de tomar una hoja por la esquina para levantarla.
  - Ofrece un affordance visible y elegante antes de ejecutar la acción.
- **Consecuencias y compromisos:** Requiere validar en pruebas de usabilidad si los usuarios descubren espontáneamente las esquinas o si recurren predominantemente a las flechas visibles.

---

### Decisión D06: Modal de Transcripción Accesible y Respeto a `prefers-reduced-motion`
- **Problema:** La fidelidad física facsimilar puede atentar contra la accesibilidad de personas con baja visión, usuarios de lectores de pantalla o personas sensibles a mareos por movimiento 3D.
- **Alternativas consideradas:**
  1. *Superponer texto plano directamente sobre las hojas.* (Destruye la estética del facsímil histórico).
  2. *Ofrecer una versión web completamente separada en texto plano.* (Duplica el costo de mantenimiento).
  3. **Solución adoptada: Botón discreto en el encabezado que despliega un modal accesible con el texto transcripto de las páginas activas, junto con soporte nativo para `prefers-reduced-motion`.**
- **Motivos de la decisión:**
  - Cumple con pautas de inclusión universal sin comprometer la pureza visual de la obra.
  - Si el sistema operativo del usuario tiene activada la reducción de movimiento, las rotaciones 3D se omiten de forma transparente.

---

### Decisión D07: Descarte de WebGL y Consolidación de CSS 3D Nativo
- **Problema:** Se evaluó si convenía migrar la aplicación a WebGL/Three.js para obtener sombras de fotones y flexión por mallas de vértices, o si convenía consolidar CSS 3D nativo.
- **Resultado de la exploración:** Se desarrolló una prueba de concepto puntual que demostró la viabilidad de WebGL, pero también evidenció un costo innecesario en dependencias (más de 600 KB adicionales), mayor complejidad de mantenimiento y consumo de recursos, sin aportar un valor crítico a la experiencia de lectura íntima que justifique abandonar la ligereza y accesibilidad nativa.
- **Decisión adoptada:** **Descartar definitivamente WebGL y consolidar CSS 3D como la única tecnología de representación tridimensional del producto.**
- **Dirección técnica consolidada:**
  1. HTML5, CSS 3D y JavaScript nativo modular (cero librerías externas).
  2. Diseño responsive y enfoque mobile-first.
  3. Prioridad en fluidez, accesibilidad universal, legibilidad y naturalidad de interacción.
  4. Realismo visual sobrio y proporcionado sin simulaciones físicas costosas.

---

### Decisión D08: Apertura Física Variable, Desambiguación de Gestos y Cobertura Plana en CSS 3D (Iteración 4)
- **Problema:** Tras la evaluación de la Iteración 3, el Product Owner identificó: apertura rígida sin estados intermedios, perspectiva cenital poco humana, escritorio plano, conflictos entre arrastrar el libro y pasar páginas, y un pliegue diagonal artificial (`skewY`) que dejaba huecos sobre la página izquierda.
- **Alternativas consideradas:**
  1. *Forzar la migración inmediata a WebGL.* (Descartado: el PO solicitó expresamente resolverlo en la versión web CSS 3D existente para mantener la arquitectura nativa liviana y portable).
  2. *Mantener solo dos estados prefijados (abierto/cerrado) con animaciones CSS más lentas.* (Descartado: no cumple con la necesidad de manipulación física progresiva).
  3. **Solución adoptada:**
     - **Apertura variable continua (0° a 180°):** Componente `.book-front-cover` articulado en el lomo con centrado dinámico sobre la mesa (`--closed-offset-x`) y asentamiento físico condicional (flick suave hacia extremos o permanencia estable en ángulos elegidos por el usuario).
     - **Perspectiva humana oblicua:** `perspective: 1300px`, `perspective-origin: 50% 28%` y ángulo de reposo de `18deg` sobre un escritorio de roble oscuro enriquecido con vetas e iluminación localizada.
     - **Desambiguación estricta de gestos (*Target Locking*):** Discriminación por punto de contacto inicial (tapa -> apertura; hoja -> pase de página; mesa/cuerpo -> desplazamiento del libro). Captura de puntero permanente durante todo el gesto.
     - **Rotación 3D pura sin sesgo:** Eliminación de `skewY` para evitar el pliegue diagonal; uso de rotación angular (`rotateY`), elevación vertical (`translateZ`) y gradientes cilíndricos reactivos, logrando una cobertura del 100% sobre la página opuesta.
- **Motivos de la decisión:** Maximiza el realismo físico alcanzable dentro de las restricciones técnicas de CSS 3D, sin romper la portabilidad ni añadir dependencias externas.

---

### Decisión D09: Máquina de Escribir como Umbral Narrativo y Clave HARISPE (Iteración 5)
- **Problema:** El acceso directo e inmediato a la pantalla del libro generaba una sensación de visor web utilitario, perdiendo la oportunidad de situar al lector en la intimidad y la época del autor (mediados del siglo XX) antes de explorar el manuscrito familiar.
- **Alternativas consideradas:**
  1. *Formulario modal de contraseña con estilo moderno.* (Descartado: burocrático, distante y ajeno a la atmósfera histórica del proyecto).
  2. *Pantalla estática de portada o video introductorio.* (Descartado: pasivo, no participativo y aumentaba el peso del sitio).
  3. **Solución adoptada: Escena interactiva de máquina de escribir de época ubicada sobre el mismo escritorio de roble.**
     - El usuario teclea (físicamente o pulsando las teclas circulares en pantalla) la palabra clave **HARISPE**.
     - Acepta mayúsculas y minúsculas sin distinción.
     - Admite retroceso (`Backspace`), borrado completo y un botón de omisión accesible (*bypass*) para evitar cualquier barrera de entrada.
     - Al validar la clave, se activa una transición cinematográfica suave hacia el libro cerrado, sin cortes bruscos ni recarga de página.
- **Motivos de la decisión:** Combina evocación poética, rigor histórico y accesibilidad universal, estableciendo un ritual de entrada íntimo y respetuoso.

---

### Decisión D10: Geometría de Volumen Cerrado Real, Taco Dinámico y Manipulación Bidireccional (Iteración 5)
- **Problema:** 
  1. En reposo cerrado, la página izquierda blanca plana se asomaba incorrectamente bajo la tapa.
  2. El canto del libro mantenía un grosor invariable independientemente de cuántas páginas se hubieran leído.
  3. El arrastre interactivo de hojas solo admitía avance hacia adelante y no retroceso.
- **Solución adoptada:**
  - **Ocultamiento de pliego interior:** Se ocultó `#pageLeft` cuando el libro está cerrado y se reposicionó el lomo central al 50% con compensación de centrado visual, logrando un volumen cerrado compacto y realista.
  - **Grosor dinámico del papel:** A través de `--right-edge-shadow` y `--left-edge-shadow`, el taco de hojas derecho decrece progresivamente de $20\text{px}$ a $3\text{px}$ a medida que se avanza en la lectura, mientras que el taco izquierdo se expande de $3\text{px}$ a $20\text{px}$.
  - **Paso interactivo bidireccional:** Reconocimiento dinámico de agarre en el hemisferio derecho (avance) o izquierdo (retroceso), permitiendo ojear tanto hacia adelante como hacia atrás con cinemática continua.
  - **Inclinación de observación regulable:** Inclinación cenital-oblicua modificable entre $5^\circ$ y $45^\circ$ mediante `SHIFT + arrastre vertical` o botón en el encabezado.
- **Motivos de la decisión:** Resuelve las deficiencias de presencia física identificadas por el Product Owner dentro del paradigma ligero de CSS 3D sin añadir dependencias externas.

---

### Decisión D11: Separación de Modos LECTURA y ARRASTRE (Iteración 6)
- **Problema:** En la interacción previa, cualquier clic sobre las páginas o el escritorio intentaba iniciar un gesto de arrastre 3D, impidiendo la lectura tranquila, dificultando la selección de texto e introduciendo movimientos accidentales de la cámara o de las hojas.
- **Alternativas consideradas:**
  1. *Condicionar todo el arrastre a mantener presionada una tecla (`CTRL` o `ALT`).* (Descartado: excluye a usuarios de pantallas táctiles y celulares).
  2. *Detectar intención por umbral de movimiento del ratón.* (Descartado: impreciso, genera retrasos perceptibles y no evita tirones accidentales).
  3. **Solución adoptada: Botón explícito y persistente en el encabezado con dos modos diferenciados:**
     - **Modo LECTURA (predeterminado):** Los gestos de puntero sobre el libro están desactivados; el lector puede interactuar con el texto sin mover el objeto. La navegación se realiza de manera cómoda mediante botones visibles y atajos de teclado. `CTRL + arrastrar` continúa permitiendo manipulación temporal sin alterar el botón persistente.
     - **Modo ARRASTRE:** Habilita la manipulación física completa: arrastre de tapa (apertura/cierre), paso interactivo de hojas (avance/retroceso) y desplazamiento del libro sobre el escritorio (*Desk Pan*).
- **Motivos de la decisión:** Prioriza la comodidad de lectura sin sacrificar la tangibilidad del objeto 3D, con compatibilidad total en escritorio y pantallas táctiles.

---

### Decisión D12: Rediseño 3D de la Máquina de Escribir y Síntesis de Sonido Local (Iteración 6)
- **Problema:** La máquina de escribir inicial se percibía plana y decorativa, carente de la profundidad tridimensional de un artefacto mecánico de mediados del siglo XX y sin retroalimentación auditiva física en las pulsaciones.
- **Alternativas consideradas:**
  1. *Cargar archivos MP3/WAV externos de máquinas de escribir.* (Descartado: añade dependencias de red, latencia de descarga y posibles problemas de licencias o bloqueo de reproducción automática).
  2. *Mantener la máquina puramente muda.* (Descartado: pierde la riqueza sensorial del mecanografiado mecánico solicitado por el Product Owner).
  3. **Solución adoptada: Volumen CSS 3D completo + Web Audio API 100% sintetizado localmente:**
     - **Profundidad visual:** Chasis angulado con biseles metálicos, riel de carro, rodillo de goma negra con perillas moleteadas, cesta de tipos con horquilla guía y martillo mecánico (`#typebarStriker`) que se proyecta físicamente contra el papel en cada tecla.
     - **Teclado escalonado:** Teclas circulares elevadas con aro cromado, cara cóncava y recorrido vertical de 4px al pulsarse. Micro-avance del carro (*escapement*).
     - **Síntesis sonora offline:** Generación de tres componentes sonoros en tiempo real mediante osciladores y buffers de ruido blanco filtrado (impacto de tipo en papel, click de palanca y trinquete de carro; campanazo de campana al desbloquear).
     - **Control accesible:** Botón visible para silenciar/activar (`Sonido ON/OFF`), sin auto-play invasivo y degradación transparente ante navegadores sin soporte.
- **Motivos de la decisión:** Enriquece la inmersión histórica y sensorial sin romper el principio de cero dependencias externas ni aumentar el peso del sitio.

---

### Decisión D13: Separación Definitiva de los Tres Gestos del Libro (Iteración 7)
- **Problema:** En la iteración anterior, la protección del modo lectura introdujo un bloqueo no deseado sobre el paso interactivo de páginas, obligando al usuario a buscar y pulsar un botón previo en la barra superior. Además, arrastrar sobre las hojas o cerca de los bordes provocaba en ocasiones el desplazamiento involuntario de todo el volumen sobre el escritorio.
- **Solución adoptada: Desacoplamiento estricto de las tres intenciones de usuario:**
  1. **Pasar páginas (Hojear):** Permanece **siempre activo por defecto**. Cualquier arrastre sobre las hojas o triggers de esquina hacia la izquierda (avance) o hacia la derecha (retroceso), así como clics directos, pasan de página de inmediato sin depender de ningún botón previo.
  2. **Abrir / cerrar la tapa:** Interacción directa sobre la tapa frontal que regula el ángulo de $0^\circ$ a $180^\circ$ de forma continua y sin saltos, sin desplazar el libro en el plano horizontal. En el pliego 1, la base izquierda `#pageLeft` permanece estrictamente oculta (`visibility: hidden`) y la portada interior está precargada a la derecha, eliminando cualquier destello blanco a los 10-15°.
  3. **Desplazamiento del libro sobre la mesa (Desk Pan):** **SÓLO permitido manteniendo presionada la tecla `CTRL`** (o activando el botón accesible `#btnToggleDragMode`). Los clics o arrastres neutros en el escritorio sin `CTRL` quedan completamente deshabilitados.
- **Motivos de la decisión:** Garantiza la máxima libertad física para hojear el libro como un objeto real en las manos, al tiempo que elimina los desplazamientos accidentales sobre la mesa.

---

### Decisión D14: Estudio de Escritor de Época y Máquina de Escribir en Esmalte Negro (Iteración 7)
- **Problema:** El acabado verde oliva anterior de la máquina de escribir y la ausencia de un entorno arquitectónico definido debilitaban la inmersión de estudio privado anterior a 1970 requerida por la visión del producto.
- **Solución adoptada:**
  1. **Acabado estricto en esmalte negro profundo:** Sustitución total del verde por un degradado de laca negra brillante de época (`#26272a` a `#050607`), con reflejos especulares satinados, cesta de tipos en grafito oscuro y teclas circulares negras con aro exterior cromado brillante y caracteres marfil envejecidos.
  2. **Fondo de estudio de época:** Incorporación de una pared con boiserie de paneles de madera noble de roble/nogal (`.study-boiserie-wall`) y un cono de luz cálido de lámpara de escritorio vintage fuera de campo (`.study-ambient-lamp-beam`).
  3. **Atrezzo físico en CSS puro (cero dependencias ni emojis):**
     - Pila de 3 libros antiguos (cuero borgoña, tela verde bosque y becerro marrón con nervios repujados y letras doradas) más un volumen vertical apoyado contra un sujetalibros de bronce.
     - Tintero facetado de cristal ahumado/ámbar con cuello y tapa abatible de bronce.
     - Pluma estilográfica de ebonita negra con anillo dorado y plumín de 14k finamente biselado.
     - Hojas manuscritas sueltas de papel amarillento con líneas de caligrafía tenue bajo los libros.
- **Motivos de la decisión:** Construye una atmósfera íntima y tangible coherente con la memoria familiar de Guillermo Bautista Harispe, prescindiendo enteramente de WebGL, modelos 3D externos o imágenes rasterizadas pesadas.
### Decisión D15: Principio de Experiencia Familiar e Integridad Histórica: Eliminación de Falsos Recuerdos y Gamificación (Iteración 7)
- **Problema:** En prototipos iniciales se habían incluido textos apócrifos generados como relleno que simulaban recuerdos atribuidos a Guillermo B. Harispe (dedicatorias inventadas y firmas apócrifas). Asimismo, el acceso a través de la máquina de escribir corría el riesgo de percibirse como un acertijo obligatorio o una mecánica de videojuego (*escape room*), lo que contradecía el fin primordial del producto.
- **Alternativas consideradas:**
  1. *Conservar textos literarios de relleno que emulen la voz del autor.* (Descartado enérgicamente: vulnera la ética de preservación, falta el respeto a la memoria familiar y arriesga confundir ficción con testimonio histórico auténtico).
  2. *Mantener la máquina de escribir como barrera de entrada obligatoria con clave.* (Descartado: genera fricción, excluye a lectores mayores o con discapacidades y desvía la atención del objeto principal hacia un mini-juego).
- **Solución adoptada:**
  1. **Integridad documental absoluta:** Eliminación total de citas, dedicatorias o memorias inventadas en `book-data.js`. Los pliegos cuyos manuscritos físicos están en proceso de digitalización incorporan avisos explícitos de archivo y custodia: *"[Espacio reservado para la dedicatoria original... Compromiso de integridad histórica: no se redactan recuerdos ni frases inventadas en su nombre]"*.
  2. **Acceso directo y desmitificación de la entrada:** La máquina de escribir se consolida como un umbral atmosférico evocador, pero opcional. Se reformuló la instrucción para presentarla como un espacio íntimo y se jerarquizó un acceso prioritario sin obstáculos: *`Abrir directamente el libro de Guillermo →`* (`#btnBypassTypewriter`).
  3. **Subordinación del artificio a la memoria:** Ninguna animación, adorno tridimensional ni interacción debe interponerse entre los descendientes y la lectura clara del libro.
- **Motivos de la decisión:** Garantiza que el producto cumpla su propósito ético y emocional como archivo familiar vivo, riguroso y accesible para todas las generaciones de la familia.

---

### Decisión D16: Estrategia Híbrida: Texturas Fotográficas de Época y Entorno de Estudio con Modelo Interactivo CSS 3D (Iteración 8)
- **Problema:** El modelado puramente geométrico con degradados planos y sombras CSS cuadradas producía un aspecto artificial y caricaturesco de "decorado virtual 3D", que restaba autenticidad e intimidad al encuentro con los escritos de Guillermo.
- **Alternativas consideradas:**
  1. *Reintroducir WebGL/Three.js con motores de renderizado PBR (Physically Based Rendering).* (Descartado: descartado formalmente en el Ciclo 4 por sobrecarga de peso, fragilidad en dispositivos modestos y pérdida de accesibilidad).
  2. *Continuar exclusivamente con más degradados y sombras CSS.* (Descartado: los gradientes matemáticos carecen de microtexturas físicas, fibras orgánicas de papel, vetas reales de madera y dispersión subsuperficial).
  3. **Solución adoptada: Estrategia Híbrida de Realismo Documental:**
     - **Interacción nativa conservada:** La máquina de escribir y el libro se mantienen al 100% como estructuras interactivas HTML y CSS 3D (escritura mecánica reactiva, sonido sintetizado Web Audio API, paso bidireccional de páginas, apertura continua de tapa y omisión accesible).
     - **Activos fotográficos de archivo:**
       - Fondo de estudio fotográfico (`antique-study-backdrop.jpg`): recrea un estudio auténtico con luz cálida direccional de lámpara de banquero y biblioteca en bokeh suave.
       - Textura de escritorio de roble (`dark-oak-desk.jpg`): madera oscura real con grano irregular, desgaste en bordes y brillo satinado.
       - Textura de encuadernación en cuero (`vintage-leather-cover.jpg`): cuero borgoña de los años 30-50 con grano fino y pliegues naturales.
       - Textura de papel de archivo (`vintage-paper-texture.jpg`): papel de trapo marfil con fibras y envejecimiento perimetral para páginas y hoja de la máquina.
     - **Conexión física y oclusión ambiental:** Sombras de contacto de 3 capas que apoyan los objetos firmemente en el plano del escritorio, eliminando la sensación de flotación.
     - **Armonización de encuadre:** Escalado a 0.9 de la máquina para suprimir scrollbars y garantizar la visibilidad simultánea del botón de acceso directo sobre la mesa.
- **Motivos de la decisión:** Eleva la atmósfera visual a un nivel casi fotográfico sin penalizar la velocidad de carga, sin añadir librerías externas y preservando la total tangibilidad interactiva del libro y la máquina.

---

### Decisión D17: Integración de Activos de MODA AI, Autenticidad Documental y Consolidación de Física de Lectura (Iteración 9)
- **Problema:** Tras la Iteración 8, el libro interactivo presentaba regresiones críticas en el retroceso de páginas por arrastre (el libro se cerraba a página 0 y perdía la tapa), las páginas se blanqueaban durante el giro debido a gradientes sintéticos `#fff`, la velocidad de animación era apresurada (0.5s) y las texturas simuladas de cuero borgoña y pan de oro no correspondían con el ejemplar físico real de Guillermo B. Harispe.
- **Alternativas consideradas:**
  1. *Aplanar la experiencia en imágenes estáticas.* (Descartado: anula la tridimensionalidad, el hojear interactivo y la accesibilidad del texto vivo).
  2. *Reintroducir WebGL.* (Descartado: viola la restricción arquitectónica innegociable de cero WebGL/Three.js).
  3. **Solución adoptada:**
     - **Integración de los 5 activos de MODA AI provistos por el Product Owner:**
       1. `moda-book-front-cover.webp`: Portada auténtica encuadernada en tela azul marino con esquinas y lomo de cuero tostado y etiqueta histórica manuscrita: *"Libro para mis hijos — Guillermo B. Harispe"*. Se retiraron todos los ornamentos dorados y textos falsos en CSS, dejando brillar la caligrafía real con un encabezado accesible oculto (`.sr-only`).
       2. `moda-book-back-cover.webp`: Contratapa de tela azul y esquinas de cuero para el reverso y backing del tomo.
       3. `moda-page-gutter-paper.webp`: Papel marfil de trapo con costura artesanal en el canal del lomo, aplicado a pliegos y hojas dinámicas.
       4. `moda-folded-rag-paper.webp`: Papel artesanal doblado con doblez central para la hoja de la máquina de escribir.
       5. `moda-study-desk-scene.webp`: Fotografía fotorrealista del estudio con lámpara de bronce encendida, atrezzo de época y escritorio de roble integrado.
     - **Corrección de causa raíz en navegación bidireccional:** Aislamiento del z-index y pointer-events de la tapa frontal en pliegos interiores (`currentIndex > 1`), garantizando que arrastrar hacia atrás ejecute inequívocamente `startPageDragGesture('prev')`.
     - **Eliminación del glitch de páginas blancas:** Supresión de reflejos `#fff` en `.leaf-face` y sustitución de la franja de brillo en `.leaf-shadow-overlay` por un velo satinado cálido al 25%.
     - **Pacing físico pausado:** Duración calibrada en 750ms con curva de aceleración física `cubic-bezier(0.25, 0.9, 0.35, 1)` y temporizadores de 780ms.
     - **Inclinación ergonómica (-55° a +55°):** Rango ampliado con 4 niveles preconfigurados (0° para lectura frontal/vertical y hasta 48° para vista cenital).
- **Motivos de la decisión:** Une la máxima fidelidad visual y emocional del objeto histórico real con un motor mecánico táctil robusto, accesible y ligero.


