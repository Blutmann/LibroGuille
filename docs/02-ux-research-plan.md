# 02 — UX Research Plan: "Libro para mis hijos"

> **Estado:** Plan metodológico propuesto  
> **Fase:** Planificación de investigación y protocolo de pruebas  
> **Objetivo:** Definir cómo validaremos las decisiones de diseño con usuarios representativos reales.  

---

## 1. Preguntas de investigación clave

Para evitar diseñar basándonos exclusivamente en intuiciones técnicas o estéticas, planteamos las siguientes preguntas de investigación:

### Sobre la experiencia y el modelo mental
1. ¿El usuario interpreta espontáneamente la interfaz como un **libro físico apoyado en una mesa**, o sigue percibiéndola como un visor de documentos web?
2. ¿Qué señales visuales o affordances comunican de forma más clara que las páginas se pueden hojear desde las esquinas?
3. ¿La interacción de arrastrar el libro sobre la mesa aporta valor o genera fricción/confusión con el paso de páginas?

### Sobre la legibilidad y el ritmo de lectura
4. ¿En qué momentos los lectores prefieren contemplar el facsímil visual versus acudir a la transcripción textual accesible?
5. ¿El ritmo de la animación de volteo (0.9s con curvas no lineales) resulta placentero o se percibe como una barrera que ralentiza la lectura continuada?

### Sobre el uso en dispositivos móviles
6. ¿La vista de página individual en móvil transmite suficiente dignidad editorial frente al pliego doble de escritorio?
7. ¿El gesto táctil de deslizamiento (*swipe*) horizontal convive de manera armónica con el desplazamiento vertical de la pantalla en dispositivos táctiles reales?

---

## 2. Supuestos e hipótesis de diseño

| # | Supuesto / Creencia de partida | Hipótesis de diseño a contrastar | Cómo se validará |
| :--- | :--- | :--- | :--- |
| **H1** | Los usuarios valoran más la sensación física de un libro que la inmediatez de un visor PDF plano. | Si recreamos lomo, cantos, ceja de tapas y sombras, la conexión emocional y el tiempo de permanencia aumentarán. | Pruebas cualitativas comparativas y entrevistas de cierre. |
| **H2** | Un control tipo "slider" rompe la metáfora del libro. | Eliminar el slider y mantener flechas + esquinas reducirá la percepción de "presentación de diapositivas". | Observación de navegación espontánea en pruebas de usabilidad. |
| **H3** | Las esquinas levantadas (*dog-ear peel hint*) son suficientes para indicar interactividad. | Al ver la esquina reaccionar al cursor, el usuario hará clic sobre ella sin necesidad de tutoriales ni carteles explicativos. | Medición de primera interacción en la tarea de paso de página. |
| **H4** | El arrastre del libro (Desk Pan) enriquece la experiencia física. | Permitir mover el libro refuerza la noción de objeto físico sobre una mesa sin estorbar la lectura. | Observar si los usuarios usan el pan deliberadamente o de forma accidental. |
| **H5** | La transcripción en modal resuelve la dificultad de leer caligrafía histórica. | Los usuarios con dificultades visuales o en pantallas pequeñas utilizarán el botón de transcripción como apoyo habitual. | Frecuencia de uso del botón en tareas de lectura de contenido. |

---

## 3. Perfiles de participantes a reclutar

Para las pruebas formales futuras, se propone reclutar participantes representativos divididos en tres segmentos:

1. **Grupo Generación Senior (60+ años, n=3 a 5):**  
   - Criterio: Familiaridad variable con tecnología; lectores habituales en soporte físico; interés en memoria familiar o historia.
2. **Grupo Generación Intermedia (35 a 59 años, n=3 a 5):**  
   - Criterio: Usuarios cotidianos de computadoras y móviles; interés en preservación del patrimonio familiar.
3. **Grupo Generación Joven (18 a 34 años, n=3 a 5):**  
   - Criterio: Uso intensivo de dispositivos táctiles móviles; expectativa de inmediatez y fluidez gestual.

> *Nota: Ningún participante ha sido entrevistado aún. Los datos de prueba se registrarán en el documento 03 una vez ejecutadas las sesiones.*

---

## 4. Métodos de investigación propuestos

### A. Prueba de usabilidad moderada remota / presencial (Think Aloud)
- **Modalidad:** 1 a 1, con observación en tiempo real y protocolo de pensamiento en voz alta (*Think Aloud*).
- **Herramientas:** Grabación de pantalla y audio con consentimiento previo informado.
- **Enfoque:** Evaluar la facilidad de uso y modelo mental sin guiar al usuario.

### B. Entrevista semiestructurada post-tarea
- **Duración:** 15 minutos tras la prueba interactiva.
- **Ejes temáticos:** Percepción estética, sensación de "libro físico", evocación afectiva, preferencias de dispositivo y puntos de fricción.

### C. Evaluación heurística y de accesibilidad técnica
- **Normativa:** Pautas WCAG 2.1 nivel AA.
- **Herramientas de auditoría:** Navegación exclusiva por teclado, lector de pantalla (NVDA / VoiceOver), emulador de preferencias de movimiento reducido y analizador de contraste de color.

---

## 5. Guía de tareas para la prueba de usabilidad

El moderador planteará situaciones de uso sin mencionar elementos específicos de la interfaz (evitar decir "hacé clic en la flecha"):

- **Tarea 1 (Exploración inicial):** *"Imaginate que acabás de recibir este enlace de un familiar. Tómate un minuto para mirar la pantalla y contame qué tenés enfrente y qué creés que podés hacer."*
- **Tarea 2 (Paso de página inicial):** *"Quisiera que comiences a leer el contenido del libro. ¿Cómo avanzarías a la siguiente página?"*
- **Tarea 3 (Lectura de contenido fotográfico):** *"Avanzá hasta encontrar una fotografía. ¿Qué información podés observar sobre ella?"*
- **Tarea 4 (Uso de transcripción accesible):** *"Si tuvieras dificultad para leer la letra o quisieras ver el texto de forma más clara, ¿qué harías?"*
- **Tarea 5 (Navegación libre y regreso):** *"Hojéalo un par de páginas más y luego intentá volver a la portada inicial."*

---

## 6. Métricas y criterios de evaluación

| Métrica | Definición | Criterio de éxito propuesto |
| :--- | :--- | :--- |
| **Eficacia en navegación** | Porcentaje de participantes que logran avanzar y retroceder sin ayuda del facilitador. | $\ge 90\%$ de éxito sin asistencia. |
| **Afinidad con la metáfora física** | Proporción de participantes que identifican espontáneamente un "libro sobre una mesa" en los primeros 10 segundos. | $\ge 80\%$ de descripciones cualitativas orientadas al objeto físico. |
| **Uso de esquinas vs controles** | Registro de método elegido para pasar página (esquinas interactivas, botones `‹ ›` o teclado). | Mapeo comparativo de preferencias según dispositivo. |
| **Tasa de error en Desk Pan** | Frecuencia con la que un intento de pasar página activa un arrastre no deseado del libro (o viceversa). | $\le 5\%$ de acciones accidentales de paneo. |
| **Confort visual** | Evaluación en escala Likert (1 a 5) sobre el ritmo y suavidad de las animaciones. | Puntuación media $\ge 4.2 / 5$. |
