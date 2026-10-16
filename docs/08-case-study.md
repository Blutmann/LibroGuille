# 08 — Case Study: Preservación Digital de Patrimonio Familiar
## "Libro para mis hijos" — De un manuscrito íntimo a un objeto web tridimensional

> **Rol del autor:** Product Owner & Product Designer (participación activa en UX Research y UI Design)  
> **Implementación y consultoría técnica:** Asistente senior frontend & motion  
> **Disciplina:** Product Design · UX/UI Design · UX Research · Motion Design  
> **Duración:** En curso (Octubre 2026 – Presente)  
> **Estado del caso de estudio:** *Borrador vivo en desarrollo incremental*  

---

## 1. El desafío y el contexto

A principios del siglo XX, mi abuelo, **Guillermo Bautista Harispe**, comenzó a plasmar en un cuaderno único sus vivencias, reflexiones y fotografías familiares bajo el título **“Libro para mis hijos”**.

Con el paso de las décadas, este manuscrito se convirtió en un tesoro familiar irremplazable. Sin embargo, su propia singularidad planteaba un dilema ético y práctico de preservación:
- Consultarlo físicamente conlleva un riesgo de deterioro del papel y las fotos.
- Guardarlo en una caja fuerte lo vuelve inaccesible para los descendientes dispersos.
- Escanearlo en un PDF estático o una galería web plana destruye por completo el aura física del libro, su escala humana y la calidez emocional del acto de lectura.

**La pregunta central de diseño fue:**  
*¿Cómo podemos digitalizar un manuscrito familiar antiguo de modo que cualquier familiar pueda hojearlo a distancia sintiendo la presencia, el peso y la dignidad del objeto físico original, sin inventar artificios ni requerir infraestructura técnica costosa?*

---

## 2. Visión rectora del producto y principios emocionales

El propósito fundamental no es meramente digitalizar un libro ni construir un visor con efectos 3D, sino **facilitar un acercamiento íntimo y auténtico a Guillermo Bautista Harispe a través de sus escritos y documentos**, permitiendo que sus descendientes y lectores sientan la cercanía de entrar a su estudio privado y sentarse frente al escritorio donde reunió sus memorias.

### Principio Rector de Producto: Experiencia Familiar e Íntima

* **Público principal:** Hijos, nietos y familiares de Guillermo B. Harispe.
* **Objetivo emocional:** Facilitar un acercamiento íntimo y auténtico a Guillermo a través de sus escritos y documentos.

#### Pautas de UX
- **Priorizar la lectura, la exploración libre y las interacciones naturales.**
- **La tecnología debe acompañar la experiencia, nunca convertirse en el centro de atención.**
- **Evitar mecánicas de juego, recorridos obligatorios y efectos que interrumpan la lectura:** La entrada al estudio y la máquina de escribir son un prólogo visual y ambiental accesible, jamás un rompecabezas o una barrera forzada.
- **Garantizar que abrir el libro, pasar las páginas y acceder a las transcripciones sea sencillo e inmediato.**

#### Dirección de Arte
- **Estudio de escritor de época, íntimo y verosímil como ambientación:** Sin afirmar que reproduce el estudio histórico real de Guillermo.
- **Elementos de ambientación:** Escritorio de roble oscuro, máquina de escribir negra, papel marfil, libros y objetos de escritura con iluminación cálida.
- **Rigor material:** Materiales, sombras, proporciones y perspectiva coherentes. Evitar el exceso de ornamentación y el aspecto de decorado artificial.
- **Jerarquía visual:** El libro y sus documentos deben ser visualmente más importantes que la ambientación.

#### Contenido e Integridad Histórica
- **No inventar recuerdos, manuscritos, dedicatorias ni frases atribuidas a Guillermo.**
- **Diferenciar estrictamente** el material original, las transcripciones editoriales y cualquier contenido ficticio de demostración o maquetación.
- **Fuente primaria:** Cuando estén disponibles los documentos físicos, utilizarlos como fuente principal para refinar el diseño y el contenido.
- **Privacidad y respeto:** No publicar documentos familiares sensibles sin revisión y autorización apropiadas de los familiares.

> **Criterio de aceptación:** Cada decisión visual o funcional debe contribuir a la intimidad, la legibilidad, la autenticidad o la conservación del legado. Si un efecto solo agrega espectacularidad y distrae de esos objetivos, no debe priorizarse.

---

## 3. Metodología de trabajo e iteraciones

Adoptamos un enfoque de desarrollo ágil centrado en el usuario, guiado por hipótesis y ciclos de retroalimentación cortos:

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│   Ciclo 1: MVP  │ ────> │ Feedback del PO │ ────> │   Ciclo 2:      │
│  Visor inicial  │       │ "Se siente como │       │ Realismo Físico │
│  funcional web  │       │  diapositivas"  │       │ Volumen y Mesa  │
└─────────────────┘       └─────────────────┘       └─────────────────┘
                                                             │
                                                             ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│   Ciclo 4:      │ <──── │ Feedback del PO │ <──── │   Ciclo 3:      │
│ Refinamiento 3D │       │ "Apertura fija, │       │ Experiencia     │
│ Apertura libre  │       │ pliegue y mesa" │       │ Mecánica y PoC  │
└─────────────────┘       └─────────────────┘       └─────────────────┘
```

### Ciclo 1: El primer prototipo y su aprendizaje crítico
- **Qué hicimos:** Levantamos una web responsive capaz de abrir un pliego doble, pasar páginas con animación 3D básica y navegar mediante controles, teclado y un control deslizante (*slider*).
- **El aprendizaje del Product Owner:** Al interactuar con el prototipo, detectamos que aunque funcionaba técnicamente, **emocionalmente fallaba**: el libro parecía una tarjeta plana flotando en un vacío oscuro y el slider reforzaba la sensación de estar ante un reproductor de video o una presentación de diapositivas.

### Ciclo 2: Pivot hacia el Realismo Físico
A partir de este diagnóstico, rediseñamos los pilares sensoriales:
1. **La superficie de apoyo:** Situamos el libro sobre una mesa de madera de nogal con textura de vetas y luz cenital de lámpara.
2. **Volumen de encuadernación:** Incorporamos tapas duras con ceja perimetral sobresaliente, lomo con canal de costura y cantos con el espesor físico de decenas de hojas apiladas.
3. **Curvatura de papel:** Modelamos una curvatura parabólica de las páginas hacia el lomo central.
4. **Interacción con el objeto (*Desk Pan*):** El usuario ahora puede agarrar y desplazar el libro con el mouse por la mesa con límites elásticos.
5. **Esquinas interactivas (*Dog-ear peel*):** Suprimimos el slider y creamos esquinas que se levantan ligeramente al pasar el cursor para invitar a hojear de forma táctil.

### Ciclos 3 y 4: De la animación prefijada a la manipulación mecánica continua
- **Evaluación del Product Owner sobre Ciclo 3:** La experiencia visual mejoró, pero el libro seguía abriéndose mediante secuencias prefijadas, la perspectiva era excesivamente cenital, el escritorio tenía poca presencia, los gestos de arrastre entraban en conflicto con el paso de hoja y la hoja al avanzar hacia la izquierda sufría un pliegue artificial oblicuo (`skewY`) que dejaba huecos sobre la página opuesta.
- **Soluciones de diseño implementadas en Ciclo 4:**
  1. **Apertura variable de la tapa (0° a 180°):** La tapa frontal permite control continuo de ángulo y permanencia en posiciones intermedias estables elegidas por el usuario, con centrado dinámico sobre la mesa.
  2. **Perspectiva oblicua humana:** Encuadre visual con ángulo de reposo de 18° y cámara a la altura de una persona sentada frente a un escritorio de roble oscuro con iluminación localizada.
  3. **Desambiguación estricta de gestos:** Bloqueo de puntero (*Target Locking*) según la zona de inicio (tapa, hoja o cuerpo/mesa) para evitar interferencias.
  4. **Eliminación del pliegue de sesgo y cobertura perfecta:** Supresión de `skewY` en favor de rotación pura en el lomo, elevación en Z y gradientes cilíndricos, logrando una cobertura al 100% al asentarse.

- **Iteración 5: Realismo físico perfeccionado y experiencia narrativa de entrada:**
  1. **Volumen cerrado auténtico y centrado:** Ocultamiento total de páginas interiores bajo la tapa cerrada y centrado del lomo a 50%, eliminando la superficie blanca plana inferior.
  2. **Taco de páginas dinámico y decreciente:** Disminución progresiva del grosor del canto derecho (20px a 3px) y crecimiento correlativo del izquierdo según el avance de lectura.
  3. **Manipulación bidireccional de hojas:** Capacidad de arrastrar e hojear interactivamente tanto hacia adelante como hacia atrás, con cresta cilíndrica de iluminación móvil.
  4. **Perspectiva de observación regulable:** Inclinación del ángulo visual (5° a 45°) mediante `SHIFT + arrastre vertical` o control accesible.
  5. **Máquina de escribir como umbral narrativo:** Escena de bienvenida con máquina mecánica de época de 1958 sobre el mismo escritorio de roble, validación interactiva de la clave `HARISPE`, opciones de accesibilidad (borrado y botón de bypass) y transición cinematográfica hacia el libro.

- **Iteración 6: Corrección de interacciones y realismo mecánico:**
  1. **Retroceso por arrastre robusto y sin bloqueos:** Diagnóstico y corrección de la causa raíz que impedía retroceder hojas; animación directa en `transform` con temporizadores de seguridad que eliminan congelamientos de estado y actualización dinámica del contenido de fondo.
  2. **Apertura progresiva continua sin salto visual:** Eliminación del salto de opacidad de la página izquierda; en el pliego inicial la tapa frontal en rotación 3D actúa como la única superficie visible, subordinando el fondo de cuero y el lomo al ángulo real de apertura.
  3. **Separación de modos LECTURA y ARRASTRE:** Establecimiento del modo LECTURA como predeterminado (protegiendo la lectura y selección de texto) y adición de un botón accesible y persistente en el encabezado para activar la manipulación física tridimensional.
  4. **Rediseño escultórico 3D de la máquina de escribir y audio local:** Chasis en perspectiva con biseles, riel de carro, rodillo de goma con perillas moleteadas, martillo mecánico animado que impacta el papel en cada pulsación, micro-avance del carro y síntesis sonora local mediante Web Audio API (cero dependencias externas ni archivos de audio).

- **Iteración 7: Separación definitiva de gestos, estudio de época e integridad histórica:**
  1. **Desacoplamiento definitivo de los tres gestos físicos:** Hojear y pasar páginas se mantiene activo de manera fluida y permanente (clic o arrastre natural hacia izquierda/derecha); la tapa frontal se abre y cierra de 0° a 180° con cobertura perfecta en el lomo; y el desplazamiento general del libro sobre el escritorio (*Desk Pan*) queda estrictamente restringido a `CTRL + arrastre` o al botón accesible `#btnToggleDragMode`, eliminando tirones accidentales.
  2. **Estudio de escritor de época con máquina en esmalte negro:** Rediseño estético integral de la máquina de escribir abandonando tonos oliváceos por una laca negra de época con reflejos satinados y teclas con aros cromados. Ambientación arquitectónica del estudio mediante boiserie de roble/nogal, iluminación cálida de lámpara vintage y atrezzo tridimensional modelado en CSS puro.
  3. **Principio rector de intimidad familiar y erradicación de gamificación:** Purga categórica de cualquier recuerdo, dedicatoria o firma apócrifa atribuida a Guillermo Bautista Harispe en los datos de prueba (`book-data.js`), sustituyéndolos por avisos transparentes de archivo. Reconfiguración de la máquina de escribir para que nunca actúe como una barrera de tipo *escape room*, destacando el enlace de acceso directo y prioritario al libro (`#btnBypassTypewriter`).

- **Iteración 8: Recuperación de la experiencia y realismo fotográfico (Estrategia Híbrida):**
  1. **Diagnóstico y recuperación P0 de la máquina:** Resolución de una excepción de sintaxis (`SyntaxError`) en `js/book-engine.js` introducida por duplicación huérfana de listeners que abortaba la carga de módulos ES y congelaba la entrada de texto; sincronización síncrona del ingreso de texto en `js/typewriter.js` para asegurar que el tecleo rápido no pierda ni desincronice caracteres con Backspace.
  2. **Verificación funcional automatizada en navegador real:** Pruebas de extremo a extremo mediante Chrome DevTools Protocol en Microsoft Edge headless validando teclado físico, teclas virtuales, borrado, acceso por palabra clave `HARISPE` y botón de bypass directo con 0 errores de consola.
  3. **Salto de calidad hacia el fotorrealismo (Estrategia Híbrida):** Sustitución del decorado geométrico plano por una arquitectura visual híbrida que mantiene la máquina de escribir y el libro como objetos 100% interactivos y manipulables en CSS 3D, pero incorpora texturas fotográficas de archivo de alta resolución:
     - Fondo ambiental de biblioteca privada con lámpara de banquero vintage y luz cálida direccional (`antique-study-backdrop.jpg`).
     - Escritorio de roble oscuro real con grano irregular y desgaste en bordes (`dark-oak-desk.jpg`).
     - Encuadernación en cuero borgoña de época con pliegues naturales y pan de oro en relieve (`vintage-leather-cover.jpg`).
     - Papel marfil de trapo de 1950 con fibras de algodón y envejecimiento de bordes (`vintage-paper-texture.jpg`).
  4. **Encuadre físico sin scrollbars:** Escalado armónico a 0.9 de la máquina y rediseño de sombras de oclusión ambiental en 3 capas que apoyan físicamente la máquina y el tomo sobre la madera del escritorio, garantizando que el acceso directo permanezca siempre visible.

---

## 4. Decisiones clave de diseño y compromisos técnicos

- **Por qué consolidamos CSS 3D nativo y descartamos WebGL:**  
  Aunque se realizó una exploración técnica en WebGL para evaluar iluminación física por fotones y mallas paramétricas de Three.js, se comprobó que el valor adicional no justificaba la sobrecarga de más de 600 KB en dependencias ni la pérdida de simplicidad. Se consolidó CSS 3D modular nativo (cero dependencias externas, cero costos de mantenimiento y máxima compatibilidad y accesibilidad en cualquier dispositivo).
- **La Estrategia Híbrida para alcanzar el fotorrealismo (Decisión D16 y D17):**  
  Modelar materiales complejos con degradados CSS puros genera una estética simplificada y geométrica. En lugar de regresar a WebGL, se combinó el motor interactivo CSS 3D nativo con activos fotográficos auténticos generados con MODA AI: tela azul marino de época, refuerzos y lomo de cuero tostado, etiqueta original con caligrafía manuscrita ("Libro para mis hijos — Guillermo B. Harispe"), papel de trapo con costura artesanal en el lomo y la escena completa del estudio con lámpara y escritorio, alcanzando una atmósfera íntima y fotorrealista sin añadir dependencias JavaScript ni sacrificar rendimiento.
- **El umbral de entrada como conector afectivo, no como barrera de juego:**  
  La máquina de escribir no es un acertijo obligatorio ni una barrera artificial de autenticación. Diseñada como un artefacto sensorial de época, convive con un acceso directo y visible (*`Abrir directamente el libro de Guillermo →`*) para que ningún familiar o lector encuentre fricción innecesaria.
- **La separación de intenciones en la interacción física (Decisión D13 y D17):**  
  Desacoplar el hojear inmediato (siempre activo en ambas direcciones) del arrastre de la mesa (restringido a `CTRL`) resolvió el conflicto ergonómico de interfaces 3D sin obligar al usuario a descifrar modos complejos. En la Iteración 9 se corrigió de raíz la jerarquía de capas z-index para que arrastrar hacia atrás en páginas interiores nunca confunda el giro con el cierre de la tapa.
- **Accesibilidad universal como principio ético:**  
  Ningún efecto 3D debe excluir a personas con discapacidad. Diseñamos un modo de transcripción accesible en un clic, botón de omisión en la máquina de escribir, control de silencio de audio y soporte estricto de `prefers-reduced-motion`.
- **Integridad histórica y ética documental (Decisión D15):**  
  Bajo ningún concepto se redactan memorias o dedicatorias ficticias en nombre del autor. Los documentos físicos y escaneos reales son la única fuente de verdad; los pliegos en desarrollo se identifican con transparencia como espacios de custodia documental.
- **Privacidad y diferenciación de entornos:**  
  Este caso de estudio refleja el proceso de diseño y desarrollo sin divulgar datos personales, dedicatorias íntimas ni información innecesaria de familiares vivos. La publicación de cualquier escaneo o transcripción del libro original queda sujeta a una revisión previa de sensibilidad familiar.

---

## 5. Estado de validación actual y próximos pasos

- **Validación técnica de desarrollo (Iteración 9):**  
  Las correcciones de la Iteración 9 (solución definitiva del retroceso por arrastre, eliminación del destello blanco en hojas móviles, cadencia de giro física a 750ms, ampliación de inclinación a -55° / +55°, e integración de los 5 activos MODA AI) fueron verificadas de forma automatizada mediante Microsoft Edge headless vía CDP en `http://localhost:3000/index.html` con 0 errores de consola y capturas fotográficas de validación.
- **Validación de producto (Estado actual):** El prototipo con la encuadernación auténtica en tela azul, papel verjurado con costura de archivo y ambientación fotorrealista está desplegado en el entorno local, quedando su evaluación estética y sensorial por parte del Product Owner **PENDIENTE**.
- **Próximas etapas:**
  - Evaluación y feedback del Product Owner sobre el fotorrealismo y la ambientación de la Iteración 9.
  - Ejecutar el protocolo de pruebas de usabilidad con participantes multigeneracionales de la familia.
  - Implementar la interacción tridimensional de desdoble de recortes periodísticos de época.
  - Diseñar la lupa/zoom óptico de alta resolución para detalles fotográficos.
  - Montar los escaneos originales reales cuando estén digitalizados.

---

## 6. Aprendizajes preliminares para el rol de Product / UX Designer

1. **La tecnología debe estar subordinada a la emoción:** Un visor puede ser técnicamente impecable, pero si la metáfora mental no conecta con la memoria del usuario, el producto fracasa en su propósito.
2. **Saber qué eliminar es tan importante como saber qué añadir:** Quitar el slider fue la decisión que devolvió la dignidad física al libro; eliminar falsos recuerdos y barreras lúdicas devolvió el respeto al archivo familiar; y suprimir los adornos dorados CSS permitió que la auténtica caligrafía de la portada brillara con total autenticidad.
3. **Estrategia Híbrida: Pragmatismo sobre dogmatismo:** Cuando CSS puro encuentra su límite óptico frente a la fotografía real, no es necesario acudir a motores 3D pesados. Integrar texturas fotográficas auténticas sobre geometría interactiva ligera ofrece el equilibrio perfecto entre fotorrealismo, rendimiento y tangibilidad.
4. **La arquitectura invisible es diseño:** Desacoplar los datos en `book-data.js` permitió diseñar e iterar la experiencia sin estar bloqueados por la falta temporal de los documentos históricos físicos.
