# 01 — Product Brief: "Libro para mis hijos"

> **Estado:** Documento base vivo  
> **Roles:** Product Owner & Product Designer (Usuario, con participación en UX Research y UI Design) / Implementación técnica y soporte de diseño (Asistente)  
> **Fecha de creación:** Octubre 2026  
> **Proyecto:** Digitalización y preservación interactiva de patrimonio familiar  

---

## 1. Contexto y origen del proyecto

El proyecto surge a partir de la necesidad de preservar y difundir un manuscrito y álbum familiar único titulado **“Libro para mis hijos”**, escrito y compilado por **Guillermo Bautista Harispe** en la primera mitad del siglo XX.

El artefacto original es un volumen físico que contiene textos manuscritos, memorias personales, reflexiones para sus descendientes, fotografías originales de época adheridas al soporte y recortes de prensa doblados e insertados en las páginas. Al tratarse de una pieza única, frágil y de alto valor histórico y afectivo, su consulta física cotidiana no es viable sin comprometer su conservación material.

---

## 2. Problema identificado

1. **Riesgo de preservación material:** El libro físico original sufre desgaste natural por manipulación y paso del tiempo.
2. **Acceso restringido y centralizado:** Al existir un único ejemplar físico, los miembros de la familia extendida dispersos geográficamente no pueden acceder a su contenido.
3. **Pérdida de la experiencia sensible en digitalizaciones convencionales:** Los formatos digitales estándar (archivos PDF escaneados, galerías de fotos planas o visores de diapositivas) despojan a la obra de su presencia volumétrica, su escala humana, la dignidad del papel y la intimidad del acto de lectura física.
4. **Falta de disponibilidad actual de los escaneos definitivos:** El libro original no se encuentra físicamente accesible en esta fase inicial, lo que exige diseñar una arquitectura técnica y visual que permita validar la experiencia interactiva mediante material ficticio de prueba sin condicionar el montaje final de los documentos reales.

---

## 3. Visión y propuesta de valor

### Visión
Transformar un manuscrito familiar privado en un **objeto digital patrimonial de alta fidelidad**, permitiendo que cualquier descendiente —independientemente de su dispositivo o destreza técnica— experimente el acto íntimo de abrir, hojear y explorar el libro como si estuviera apoyado sobre su propia mesa de lectura.

### Principio Rector de Producto: Experiencia Familiar e Íntima

* **Público principal:** Hijos, nietos y familiares de Guillermo B. Harispe.
* **Objetivo emocional:** Facilitar un acercamiento íntimo y auténtico a Guillermo a través de sus escritos y documentos.

#### Pautas de UX
- **Priorizar la lectura, la exploración libre y las interacciones naturales:** El usuario debe poder sumergirse en los folios sin fricción cognitiva.
- **La tecnología debe acompañar la experiencia, nunca convertirse en el centro de atención:** Las animaciones y cálculos tridimensionales existen exclusivamente para otorgar tangibilidad, no como demostración pirotécnica.
- **Evitar mecánicas de juego, recorridos obligatorios y efectos que interrumpan la lectura:** La aplicación no es un videojuego ni un escape room; la entrada al estudio es una antesala poética y opcional, jamás un acertijo bloqueante.
- **Garantizar la sencillez de uso:** Abrir el libro, pasar las páginas y acceder a las transcripciones debe ser inmediato y accesible para cualquier miembro de la familia.

#### Dirección de Arte
- **Estudio de escritor de época, íntimo y verosímil como ambientación:** Sin afirmar que reproduce el estudio histórico real de Guillermo.
- **Elementos visuales clave:** Escritorio de roble oscuro, máquina de escribir negra, papel marfil, libros y objetos de escritura con iluminación cálida.
- **Rigor material:** Materiales, sombras, proporciones y perspectiva coherentes. Evitar el exceso de ornamentación y el aspecto de decorado artificial.
- **Jerarquía visual:** El libro y sus documentos deben ser visualmente más importantes que la ambientación.

#### Contenido e Integridad Histórica
- **No inventar recuerdos, manuscritos, dedicatorias ni frases atribuidas a Guillermo:** Rigor ético absoluto ante la memoria familiar.
- **Diferenciar estrictamente** el material original, las transcripciones editoriales y cualquier contenido ficticio de demostración o maquetación.
- **Fuente primaria:** Cuando estén disponibles los documentos físicos, utilizarlos como fuente principal para refinar el diseño y el contenido.
- **Privacidad y respeto:** No publicar documentos familiares sensibles sin revisión y autorización apropiadas de los familiares.

> **Criterio de aceptación transversal:** Cada decisión visual o funcional debe contribuir a la intimidad, la legibilidad, la autenticidad o la conservación del legado. Si un efecto solo agrega espectacularidad y distrae de esos objetivos, no debe priorizarse.

### Propuesta de valor
- **Para los descendientes:** Recrear la emoción y cercanía del objeto original, garantizando su permanencia para futuras generaciones sin deteriorar el libro físico.
- **Para la preservación archivística:** Mantener la integridad contextual y el orden original de los testimonios, ofreciendo simultáneamente transcripciones tipográficas accesibles para facilitar la legibilidad.
- **Para el caso de estudio profesional:** Demostrar cómo el diseño de producto y la ingeniería frontend resuelven un problema de preservación emocional mediante rigor metodológico, accesibilidad universal y economía técnica estricta.

---

## 4. Objetivos del producto

| Objetivo | Descripción | Criterio de éxito |
| :--- | :--- | :--- |
| **O1. Fidelidad física** | Recrear las propiedades materiales del libro (encuadernación, lomo, cantos, textura y sombras). | El usuario percibe un objeto tridimensional sobre una superficie, no un marco de pantalla o visor plano. |
| **O2. Navegación táctil y natural** | Permitir hojear desde esquinas, controles y teclado de manera intuitiva. | Tasa de éxito en tareas básicas de navegación sin curva de aprendizaje previa. |
| **O3. Accesibilidad universal** | Permitir lectura alternativa en texto plano y compatibilidad con movimiento reducido. | Cumplimiento de pautas WCAG 2.1 (AA) en contraste, estructura y transcripción textual. |
| **O4. Desacoplamiento de datos** | Separar completamente el contenido del código visual y de interacción. | Posibilidad de reemplazar muestras de prueba por fotografías reales modificando un único archivo de configuración. |
| **O5. Sostenibilidad y costo cero** | Cero dependencias de pago, servidores dinámicos o librerías externas de mantenimiento complejo. | Ejecución 100% estática local y portabilidad a hosting gratuito sin backend. |

---

## 5. Usuarios potenciales y contextos de uso *(Hipótesis de partida)*

> *Nota metodológica: Los siguientes perfiles representan hipótesis preliminares basadas en la naturaleza del proyecto. No constituyen personas validadas mediante investigación de campo.*

### Arquetipo A: Familiar mayor / Descendiente directo (Hipótesis)
- **Contexto:** Lectura pausada en tableta o computadora de escritorio, en un entorno doméstico.
- **Necesidades:** Alta legibilidad, controles evidentes, ausencia de distracciones o animaciones vertiginosas, facilidad para volver atrás.
- **Riesgo:** Frustración ante interfaces complejas o navegación poco convencional.

### Arquetipo B: Familiar joven / Nuevas generaciones (Hipótesis)
- **Contexto:** Acceso espontáneo desde teléfonos móviles a través de enlaces compartidos en mensajería familiar.
- **Necesidades:** Carga instantánea, gestos táctiles fluidos (swipe horizontal), formato adaptado a pantallas verticales.
- **Riesgo:** Abandono si la experiencia requiere descargas pesadas o no responde al tacto.

### Arquetipo C: Investigador / Lector externo (Hipótesis)
- **Contexto:** Consulta archivística o interés histórico en testimonios de época.
- **Necesidades:** Transcripciones textuales indexables, verificación de procedencia y lectura rápida de contenidos.

---

## 6. Alcance del proyecto

### Alcance del MVP (Fase actual e iteraciones inmediatas)
- Libro abierto tridimensional con tapas duras, lomo y espesor de páginas.
- Pliego doble en escritorio y página individual adaptada en móvil.
- Navegación por controles visibles (`‹` y `›`), esquinas interactivas, teclado y gestos táctiles.
- Desplazamiento controlado del libro sobre la mesa de lectura (*Desk Pan*).
- Modal de transcripción accesible para cada página.
- Estructura de datos desacoplada (`book-data.js`) con contenido de prueba claramente identificado.
- Mini-servidor local autónomo sin dependencias (`serve.js` / `run.bat`).

### Funcionalidades fuera del alcance actual (Post-MVP)
- Animación 3D compleja de desdoble de recortes periodísticos (*unfolding clippings*).
- Lupa / Zoom óptico de inspección de alta resolución.
- Búsqueda textual y tabla de contenidos con miniaturas.
- Cuentas de usuario, marcadores en la nube o bases de datos (no requeridas).
- Publicación web abierta o indexación pública (en reserva hasta validación familiar).

---

## 7. Restricciones del proyecto
1. **Restricción de contenido:** Únicamente contenido ficticio claramente rotulado durante la fase de prototipo; ninguna invención de hechos que comprometa el rigor histórico familiar.
2. **Restricción tecnológica:** HTML5, CSS3 y JavaScript nativo modular. Sin frameworks pesados (React, Vue, Angular) ni librerías de 3D invasivas (Three.js) a menos que se justifique formalmente una limitación insalvable.
3. **Restricción presupuestaria:** Costo \$0 en infraestructura, APIs o servicios licenciados.
4. **Restricción de privacidad y diferenciación de entornos:**
   - **Entorno de trabajo privado vs. Portfolio público:** La documentación interna del proyecto puede contener referencias de trabajo familiar, pero el material destinado a difusión pública o portfolio omitirá cualquier nombre, dedicatoria, fecha o dato personal innecesario de familiares o descendientes vivos.
   - **Revisión previa obligatoria:** Queda formalmente pendiente una revisión exhaustiva de sensibilidad familiar sobre las páginas originales antes de considerar la publicación de imágenes escaneadas o transcripciones definitivas.
