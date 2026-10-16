# 03 — Research Findings & Estado de Evidencia

> **Estado:** Documento de hallazgos empíricos y estado de validación  
> **Última actualización:** Tras implementación de la Iteración 2  
> **Criterio metodológico:** Este documento diferencia estrictamente entre evidencia fáctica (comprobada técnicamente o expresada por el Product Owner), hipótesis de diseño y preguntas abiertas pendientes de investigación de campo.  

---

## 1. Evidencia disponible hasta la fecha

A la fecha actual, las fuentes de evidencia directas con las que cuenta el proyecto son:
1. **Requisitos fundacionales y evaluación directa del Product Owner (PO):** Criterios de producto, visión editorial y evaluación crítica tras probar la primera iteración.
2. **Pruebas técnicas automatizadas y de ejecución local:** Validación de rendimiento, sintaxis, respuesta HTTP y compatibilidad de eventos DOM en el entorno de desarrollo.
3. **Análisis heurístico de interacción preliminar:** Comprobación interna de tiempos de respuesta, renderizado 3D y comportamiento responsive.

> *Aviso de transparencia:* **Aún no se han conducido pruebas de usabilidad con usuarios finales externos.** Toda referencia a la aceptación final del usuario permanece catalogada como **hipótesis** o **pregunta abierta**.

---

## 2. Necesidades expresadas y feedback del Product Owner

A partir de la evaluación de la primera versión, el Product Owner aportó los siguientes hallazgos y directivas clave:

| Elemento evaluado | Observación del Product Owner | Necesidad / Decisión derivada |
| :--- | :--- | :--- |
| **Sensación general del visor** | *"Funciona como visor de páginas, pero visualmente se siente como una presentación de diapositivas."* | El protagonista debe ser el objeto libro físico tridimensional apoyado sobre una superficie real, no una interfaz que muestra páginas. |
| **Volumen y presencia física** | Las páginas se percibían como láminas planas suspendidas en un lienzo digital abstracto. | Requerimiento de tapas duras, lomo curvo, ceja perimetral de encuadernación, canto con espesor visible de hojas y superficie de mesa de madera. |
| **Slider de navegación** | La barra de desplazamiento (*range slider*) no resultaba adecuada; aumentaba la sensación de reproductor digital artificial. | **Eliminación total del slider.** |
| **Botones de flechas (`‹` y `›`)** | El Product Owner evaluó positivamente las flechas de navegación visibles. | **Conservar las flechas** visibles y la navegación por teclado (`←` y `→`). |
| **Hojear desde las hojas** | El paso de página debía poder iniciarse de forma física desde los extremos del papel. | Implementación de esquinas interactivas con señal visual de levantamiento (*peel hint*). |
| **Manipulación en escritorio** | Necesidad de poder interactuar con el libro completo sobre la mesa. | Implementación de arrastre controlado con mouse (*Desk Pan*), diferenciado del paso de página. |
| **Rigor documental** | Prohibición absoluta de inventar textos o fotos que simulen ser históricos; todo el material de prueba debe ser reconocible de inmediato como ficticio. | Mantenimiento riguroso de rótulos visibles de contenido ficticio. |

---

## 3. Hallazgos técnicos confirmados *(Verificados en ejecución)*

1. **Comportamiento técnico de CSS 3D nativo:**
   - La cinemática de volteo basada en transformaciones 3D (`transform-style: preserve-3d`, `rotateY`, `skewY`) y gradientes dinámicos ofrece una animación visualmente fluida en los navegadores evaluados sin requerir bibliotecas externas pesadas como Three.js (la tasa de cuadros por segundo no ha sido medida con instrumental formal de rendimiento).
2. **Sincronización de eventos de ratón (Arrastre vs. Clic):**
   - El umbral de movimiento de 5 píxeles en el controlador de puntero (`pointermove`) permite distinguir de manera confiable cuándo el usuario desea mover el libro sobre la mesa y cuándo está haciendo un clic intencionado en una esquina para pasar de hoja.
3. **Comportamiento responsive desacoplado:**
   - La regla `@media (max-width: 720px)` conmuta limpiamente de pliego doble a página simple (`page-right`), ocultando el lomo central y desactivando el arrastre de mesa para evitar interferencias en pantallas pequeñas.
4. **Respeto a preferencias de accesibilidad:**
   - La consulta `(prefers-reduced-motion: reduce)` suprime las rotaciones y sombras dinámicas al 100%, realizando cambios de página directos.

---

## 4. Hipótesis de diseño a validar *(Sin comprobar con usuarios finales)*

Las siguientes afirmaciones son suposiciones de diseño que deben ser testeadas formalmente durante el plan de investigación:

- [ ] **Hipótesis H1:** Los usuarios finales advertirán espontáneamente la señal de la esquina levantada (*dog-ear peel hint*) y la utilizarán antes que las flechas de navegación.
- [ ] **Hipótesis H2:** La superficie de mesa de nogal con iluminación cenital genera una percepción de "objeto valioso y acogedor" mayor que fondos neutros minimalistas.
- [ ] **Hipótesis H3:** El rango de movimiento de arrastre ($\pm 200\text{px}$ en X, $\pm 100\text{px}$ en Y) es suficiente para explorar cómodamente sin generar desorientación.
- [ ] **Hipótesis H4:** Los usuarios de edad avanzada no experimentarán rechazo al modal de transcripción y comprenderán el icono de página.

---

## 5. Preguntas abiertas pendientes de investigación

1. **¿Cómo percibe el Product Owner la segunda iteración visual y cinemática en su propio monitor?**  
   *(Estado: Pendiente de su sesión de evaluación visual y funcional).*
2. **¿Existe fatiga visual o lentitud percibida al leer 10 o más páginas consecutivas con la animación de 0.9 segundos?**  
   *(Requiere prueba con participantes en tareas de lectura continuada).*
3. **En dispositivos móviles reales, ¿qué porcentaje de usuarios intenta hacer zoom con dos dedos sobre las fotos en lugar de buscar un botón de aumento?**  
   *(Determinará la arquitectura del visor de fotos para la fase de escaneos reales).*
