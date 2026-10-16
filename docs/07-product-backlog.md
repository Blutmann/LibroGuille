# 07 — Product Backlog Priorizado

> **Estado:** Tablero vivo de producto  
> **Criterios de clasificación:**  
> - **Prioridad:** Muy Alta (P0), Alta (P1), Media (P2), Baja (P3).  
> - **Estado:** `Pendiente`, `En curso`, `Implementado (Pendiente de validación PO)`, `Validado`.  

---

## 📌 ÉPICA 1: MVP — Fidelidad Física y Experiencia Esencial

| ID | Ítem / Historia de Usuario | Prioridad | Dependencias | Estado actual | Valor esperado / Justificación |
| :--- | :--- | :---: | :--- | :---: | :--- |
| **MVP-01** | **Estructura base de pliego y datos**<br>Como lector, quiero abrir un libro digital con páginas interiores y portadas para explorar su contenido inicial. | P0 | Ninguna | `Validado` (Ciclo 1) | Arquitectura fundacional del proyecto. |
| **MVP-02** | **Desacoplamiento de fotos y textos**<br>Como PO, quiero que los datos residan en un archivo independiente para incorporar escaneos reales sin tocar código. | P0 | MVP-01 | `Validado` (Ciclo 1) | Escalabilidad y preservación sin rehacer la interfaz. |
| **MVP-03** | **Volumen y tapas de encuadernación**<br>Como lector, quiero ver tapas duras con ceja, lomo y espesor de hojas para sentir la presencia física del libro. | P0 | MVP-01 | `Implementado (Pendiente PO)` | Reemplaza la sensación de visor plano por un objeto real. |
| **MVP-04** | **Superficie de mesa e iluminación**<br>Como lector, quiero ver el libro apoyado en una mesa cálida para reforzar la inmersión íntima. | P1 | MVP-03 | `Implementado (Pendiente PO)` | Contexto espacial y sensorial creíble. |
| **MVP-05** | **Navegación por esquinas y flechas**<br>Como lector, quiero hojear desde las esquinas del papel o mediante flechas visibles para avanzar de forma natural. | P0 | MVP-03 | `Implementado (Pendiente PO)` | Affordance físico inmediato. |
| **MVP-06** | **Arrastre del libro (Desk Pan)**<br>Como lector en escritorio, quiero mover el libro con el mouse de forma contenida para acomodarlo a mi gusto. | P1 | MVP-04 | `Implementado (Pendiente PO)` | Refuerza la tangibilidad del objeto sobre la mesa. |
| **MVP-07** | **Eliminación del slider artificial**<br>Como PO, quiero suprimir el slider para evitar la percepción de "presentación de diapositivas". | P0 | MVP-05 | `Implementado (Pendiente PO)` | Purificación del modelo mental de lectura física. |
| **MVP-08** | **Modal de transcripción accesible**<br>Como usuario con dificultad visual, quiero leer el texto en tipografía limpia y alto contraste. | P0 | MVP-01 | `Validado` (Ciclo 1) | Inclusión y cumplimiento de accesibilidad universal. |
| **MVP-09** | **Diseño responsive y swipe móvil**<br>Como lector en teléfono, quiero ver una página por vez y hojear con gestos táctiles sin trabas. | P0 | MVP-01 | `Implementado (Pendiente PO)` | Acceso universal desde cualquier dispositivo familiar. |
| **MVP-10** | **Evaluación PO Iteración 2**<br>El PO evaluó que el libro sigue pareciendo rígido y permanentemente abierto. | P0 | MVP-03 a 07 | `Evaluado (Generó Ciclo 3)` | Identificación del problema de interacción mecánica. |
| **MVP-11** | **Libro cerrado inicial y apertura física**<br>Como lector, quiero encontrar el libro cerrado en el escritorio y abrirlo de forma gradual. | P0 | MVP-10 | `Implementado (Pendiente PO)` | Metáfora espacial y física completa. |
| **MVP-12** | **Agarre con una mano e inercia**<br>Como lector, quiero arrastrar el libro desde el punto exacto de agarre con inclinación natural. | P0 | MVP-10 | `Implementado (Pendiente PO)` | Manipulación creíble con peso y torque. |
| **MVP-13** | **Agarre con dos manos simulado (`CTRL`)**<br>Como lector, quiero presionar `CTRL` para sujetar el libro de forma más estable y controlada. | P1 | MVP-12 | `Implementado (Pendiente PO)` | Diferenciación de agarre sin cursores ficticios. |
| **MVP-14** | **Paso de página progresivo y continuo**<br>Como lector, quiero agarrar la hoja y que siga al cursor en tiempo real con deformación dinámica. | P0 | MVP-10 | `Implementado (Pendiente PO)` | Fin de la animación predeterminada por clic. |
| **MVP-15** | **Soltado y finalización suave de hoja**<br>Como lector, quiero soltar la página a medio camino y que complete o cancele el giro suavemente. | P0 | MVP-14 | `Implementado (Pendiente PO)` | Continuidad temporal y física sin saltos. |
| **MVP-16** | **Apertura física variable de tapa dura (0° a 180°)**<br>Como lector, quiero abrir la tapa a cualquier ángulo y poder dejarla entreabierta de forma estable. | P0 | MVP-11 | `Implementado (Pendiente PO)` | Realismo físico continuo sin saltos de layout. |
| **MVP-17** | **Desambiguación estricta de gestos (*Target Locking*)**<br>Como lector, quiero que el sistema no confunda mover el libro con pasar una página o abrir la tapa. | P0 | MVP-12, 14 | `Implementado (Pendiente PO)` | Foco ininterrumpido en la intención del usuario. |
| **MVP-18** | **Giro sin sesgo y cobertura plana total**<br>Como lector, quiero que la hoja gire sin pliegues angulares extraños y cubra al 100% la página izquierda. | P0 | MVP-14 | `Implementado (Pendiente PO)` | Geometría editorial pura sin distorsión de corte. |
| **MVP-19** | **Perspectiva oblicua humana y mesa de roble profunda**<br>Como lector, quiero percibir el libro desde la altura de una persona sentada ante el escritorio. | P0 | MVP-06 | `Implementado (Pendiente PO)` | Encuadre visual humano e inmersión ambiental. |
| **MVP-20** | **Volumen cerrado auténtico y centrado**<br>Como lector, quiero que el libro cerrado se muestre como un solo tomo compacto sin páginas blancas asomando. | P0 | MVP-11 | `Implementado (Pendiente PO)` | Rigor geométrico del objeto encuadernado. |
| **MVP-21** | **Taco de páginas dinámico según lectura**<br>Como lector, quiero que el grosor visible de hojas disminuya a la derecha y aumente a la izquierda al avanzar. | P0 | MVP-03 | `Implementado (Pendiente PO)` | Percepción física del avance de lectura. |
| **MVP-22** | **Arrastre bidireccional y curvatura de cresta**<br>Como lector, quiero hojear tanto hacia adelante como hacia atrás arrastrando las hojas interactivamente. | P0 | MVP-14 | `Implementado (Pendiente PO)` | Libertad cinemática completa en ambas direcciones. |
| **MVP-23** | **Máquina de escribir de entrada y clave HARISPE**<br>Como lector, quiero ser recibido por una máquina de escribir de época para entrar a su estudio. | P0 | MVP-04 | `Implementado (Pendiente PO)` | Ritual de entrada inmersivo y emocional. |
| **MVP-24** | **Inclinación de perspectiva regulable**<br>Como lector, quiero ajustar el ángulo cenital-oblicuo con SHIFT+arrastre o botón de inclinación. | P1 | MVP-19 | `Implementado (Pendiente PO)` | Ergonomía visual personalizada en escritorio y móvil. |
| **MVP-25** | **Retroceso por arrastre funcional y sin congelamientos**<br>Como lector, quiero retroceder hojas mediante arrastre hacia la derecha sin que la animación se trabe. | P0 | MVP-22 | `Implementado (Pendiente PO)` | Navegación bidireccional continua y fluida. |
| **MVP-26** | **Apertura progresiva y eliminación del salto visual izquierdo**<br>Como lector, quiero que la tapa abra sin que aparezca de golpe una página blanca flotante. | P0 | MVP-20 | `Implementado (Pendiente PO)` | Continuidad geométrica auténtica en 3D. |
| **MVP-27** | **Modos LECTURA y ARRASTRE con botón persistente**<br>Como lector, quiero leer sin mover accidentalmente el libro y activar el arrastre cuando desee manipularlo. | P0 | MVP-12, 14 | `Implementado (Pendiente PO)` | Convivencia armónica entre lectura y tangibilidad física. |
| **MVP-28** | **Máquina de escribir 3D con martillo mecánico y audio local**<br>Como lector, quiero sentir el volumen de la máquina, ver el golpe del tipo y escuchar el sonido mecánico. | P1 | MVP-23 | `Implementado (Pendiente PO)` | Inmersión sensorial histórica y háptica. |
| **MVP-29** | **Separación definitiva de los 3 gestos**<br>Como lector, quiero hojear hojas siempre libremente y mover el libro en la mesa solo con CTRL. | P0 | MVP-25, 27 | `Implementado (Pendiente PO)` | Elimina bloqueos de lectura y desplazamientos accidentales. |
| **MVP-30** | **Máquina de escribir negra y estudio de época pre-1970**<br>Como lector, quiero ver una máquina de laca negra brillante y un estudio con boiserie y atrezzo clásico. | P1 | MVP-28 | `Implementado (Pendiente PO)` | Rigor estético y profundidad sensorial histórica. |
| **MVP-31** | **Recuperación P0 de la máquina y robustez síncrona**<br>Como lector, quiero teclear sin fallos por teclado físico y virtual, borrar con Backspace y omitir con acceso directo sin bloqueos de sintaxis. | P0 | MVP-29, 30 | `Implementado y Verificado (Edge/CDP)` | Garantiza la funcionalidad ininterrumpida de entrada. |
| **MVP-32** | **Estrategia Híbrida: Texturas Fotográficas de Estudio, Cuero y Papel**<br>Como lector, quiero que la escena se aproxime a una fotografía real mediante texturas de archivo y luz cálida de lámpara de época sin perder interactividad. | P1 | MVP-30, 31 | `Implementado y Verificado (CDP)` | Salto de calidad hacia el fotorrealismo sin dependencias externas. |
| **MVP-33** | **Corrección P0 de navegación reversa y glitch de páginas blancas**<br>Como lector, quiero arrastrar hacia atrás en cualquier página interior sin que el libro se cierre ni pierda la tapa, y sin destellos blancos. | P0 | MVP-31, 32 | `Implementado y Verificado (CDP)` | Integridad física y visual de la lectura en ambas direcciones. |
| **MVP-34** | **Pacing físico pausado (750ms) y rango ergonómico de inclinación (-55° a +55°)**<br>Como lector, quiero que las hojas giren de manera pausada y natural, y poder colocar el libro casi vertical para lectura relajada. | P1 | MVP-33 | `Implementado y Verificado (CDP)` | Confort visual y cadencia orgánica no apresurada. |
| **MVP-35** | **Integración de los 5 activos auténticos de MODA AI**<br>Como familiar, quiero ver la portada azul real con esquinas de cuero y etiqueta manuscrita de Guillermo, papel con costura y el estudio completo. | P0 | MVP-32, 33 | `Implementado y Verificado (CDP)` | Autenticidad histórica y afectiva fotorrealista. |

---

## 🚀 ÉPICA 2: Post-MVP — Enriquecimiento Editorial y Archivístico

| ID | Ítem / Funcionalidad futura | Prioridad | Dependencias | Estado actual | Valor esperado / Justificación |
| :--- | :--- | :---: | :--- | :---: | :--- |
| **FUT-01** | **Recortes periodísticos desplegables (3D)**<br>Como lector, quiero hacer clic en un recorte adherido y ver cómo se desdobla en acordeón sobre la página. | P1 | MVP-10 | `Pendiente` | Fidelidad única a los recortes reales doblados en el original. |
| **FUT-02** | **Lupa / Zoom óptico para fotografías**<br>Como lector, quiero inspeccionar detalles de alta resolución de rostros y documentos con una lupa sin perder el contexto. | P1 | MVP-10, Escaneos | `Pendiente` | Apreciación de detalles caligráficos y retratos antiguos. |
| **FUT-03** | **Sustitución por escaneos reales**<br>Como familia, queremos cargar las fotografías escaneadas definitivas de Guillermo Bautista Harispe. | P0 | Escaneos originales | `Pendiente` | Propósito histórico y afectivo definitivo del proyecto. |
| **FUT-04** | **Índice temático / Tabla de capítulos discreta**<br>Como lector, quiero un menú plegable sutil para saltar directamente a un capítulo específico. | P2 | MVP-10 | `Pendiente` | Navegación a larga distancia sin reincorporar sliders. |
| **FUT-05** | **Audio narrado de memorias**<br>Como familiar, quiero escuchar pasajes del libro leídos por descendientes mientras hojeo el volumen. | P3 | FUT-03 | `Pendiente` | Experiencia sensorial multigeneracional inmersiva. |
| **FUT-06** | **Pruebas de usabilidad formales con usuarios**<br>Ejecutar el protocolo de pruebas de usabilidad con 6 a 9 participantes multigeneracionales. | P1 | MVP-10 | `Pendiente` | Validación empírica externa para el caso de estudio de UX. |

---

## Criterios de Aceptación para cerrar el MVP

1. [ ] Aprobación visual y sensorial formal del Product Owner sobre la Iteración 2.
2. [ ] Comprobación de ausencia de regresiones en móvil y escritorio.
3. [ ] Cero dependencias npm y ejecución autónoma con doble clic (`run.bat`).
4. [ ] Documentación completa del proceso lista para el portfolio profesional.
