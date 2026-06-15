# Paquete de envío — Didáctico Jam 2026

Todo listo para copiar/pegar en la página de la jam (formato pensado para
itch.io, válido para cualquier plataforma).

---

## 1. Título
**Dr. Muerte**

## 2. Frase corta / tagline (para la tarjeta del juego)
> Eres la Muerte disfrazada de médico. "Trata" a tus pacientes… hasta el final, sin que nadie sospeche.

Alternativas:
- *Sigilo médico con humor negro. Receta el fármaco equivocado y que parezca natural.*
- *Un juego de hospital donde, en vez de curar, haces lo contrario.*

## 3. Tipo de proyecto
- **Plataforma:** Navegador (**HTML5 / WebGL**, motor Phaser 3, sin instalación).
- **En itch.io:** *Kind of project* → **HTML**. Sube el `.zip`, marca `index.html`
  como "This file will be played in the browser".
- **Resolución del visor:** **1280 × 720**, con botón de **pantalla completa** activado.
- **Etiqueta de orientación:** horizontal (landscape).
- También se puede ofrecer como **descarga** (el mismo zip) para jugar en local.

## 4. Clasificación de edad
- **Recomendada: +12 (PEGI 12 / Teen 13+).**
- **Contenido para adultos:** **No.** Sin sangre, sin gore, sin contenido explícito.
- **Aviso de contenido (ponlo en la descripción):**
  > Humor negro y temática de muerte/negligencia médica de forma satírica y
  > caricaturesca (estética pastel, sin sangre). Apto a partir de ~12 años.

## 5. Tema de la jam — "Al Revés"
> En un hospital normal el médico **cura**. Aquí encarnas a la **Muerte**, que se
> ha disfrazado de doctor para hacer justo **lo contrario**: que cada paciente
> fallezca "de forma natural" sin levantar sospechas. La medicina, del revés.

## 6. Ángulo didáctico (clave para esta jam)
> El juego enseña **farmacología real al revés**: contraindicaciones, alergias e
> interacciones peligrosas de medicamentos de verdad (p. ej. potasio IV en
> cardiópatas, insulina en no diabéticos, anticoagulante + aspirina). Para
> "actuar" tienes que **diagnosticar** primero y leer qué le haría cada fármaco a
> ese paciente — aprendiendo, sin querer, por qué un buen médico nunca los daría.

## 7. Descripción larga (cuerpo de la página)

**Dr. Muerte**

Durante milenios la Muerte llegaba al final. Entonces los humanos inventaron los
hospitales y empezaron a robarle almas. Su solución: ponerse una bata, colgarse
un fonendo y firmar como **Dr. Mortis**. Ahora trabaja desde dentro.

Eres la Muerte de incógnito en un hospital pastel. Tu turno: **"tratar" a los
pacientes hasta el final sin que nadie sospeche**. El reto no es matar — es
hacerlo **parecer natural**.

**Cómo se juega**
- **Diagnostica** al paciente: revela su enfermedad y lo que cada fármaco le haría
  (✚ cura · ✗/☠ daña · ⚠ = cuánta sospecha levanta).
- Elige una opción **letal pero discreta**: categoría → medicina → dosis.
- **Mezcla fármacos** para descubrir combinaciones mortales; se guardan solas en
  tu **cuaderno**.
- Cuidado con quién te ve: enfermeras e inspectores tienen **campo de visión**
  (el cono amarillo se pone rojo si te pillan). Las **paredes los ciegan**: úsalas.
- **Muerte limpia + racha:** matar sin que vean el acto da bonus y encadena racha;
  si te ven, se rompe. El arte está en el **posicionamiento**.
- Si la **sospecha llega a 100** o el inspector te alcanza → fin del turno.

**Contenido**
- **Sistema médico real**: 9 enfermedades, 15 medicinas (pastillas / inyecciones /
  vía IV), 3 dosis, alergias y 14 combinaciones letales por descubrir.
- **8 hospitales** cada vez más grandes y vigilados (el final, dos plantas con
  ascensor) con **historia animada** por capítulos y un giro final.
- **Sigilo** con conos de visión, paredes que bloquean la vista e inspector que
  te persigue rodeando paredes.
- **Tienda de mejoras** entre niveles, **cuaderno** persistente, **tutorial**
  guiado con flechas y **Modo Turno Infinito** (arcade con récord).

> ⚠️ Humor negro sobre la muerte de forma caricaturesca (estética pastel "Theme
> Hospital", sin sangre). +12.

## 8. Controles
| Tecla | Acción |
|-------|--------|
| `WASD` | Moverse |
| `E` | Interactuar / atender paciente |
| `W` `S` · `E` · `Q` | Menú de tratamiento: elegir · confirmar · atrás |
| `1`–`4` | Usar mejoras activas |
| `J` | Cuaderno de combinaciones |
| `ESC` | Pausa |
| `M` · `,` `.` | Silenciar música · bajar/subir volumen |
| Flechas · `Enter` · `Espacio` | Navegar menús y cinemáticas |

## 9. Etiquetas (tags) sugeridas
`stealth`, `pixel-art`, `dark-humor`, `medical`, `educational`, `top-down`,
`singleplayer`, `phaser`, `html5`, `comedy`

## 10. Imágenes
- **Portada (cover):** `assets/cover_630.png` (630×500, formato de itch).
- **Banner / imagen grande:** `assets/cover.png` (1280×720).
- **Capturas:** lo ideal es **capturar 3-4 pantallas jugando** en el navegador
  (menú, diagnóstico de un paciente, un cono de visión rojo, la cinemática de
  intro). Como apoyo, `assets/characters/cast_in_room_x4.png` muestra el reparto
  en una sala.

## 11. Tecnología y créditos
- **Motor:** Phaser 3 (vendido en local, sin conexión).
- **Arte:** pixel art original "Pastel Malpractice", **generado por scripts en
  Python/PIL** (personajes, tileset, niveles y portada). 24 colores cerrados.
- **Fuentes:** *Press Start 2P* y *VT323*.
- **Audio:** música y efectos.
- **Código, diseño y arte:** [tu nombre/alias].

## 12. Cómo ejecutarlo (incluir en la página de descarga)
El juego usa módulos JS, así que para jugarlo en local necesita un **servidor
local**:
```
# dentro de la carpeta del juego
python3 -m http.server 8000
# abre http://localhost:8000
```
En itch.io subido como HTML no hace falta nada de esto: se juega en el navegador.

---

### Checklist de subida (itch.io)
- [ ] Kind of project = **HTML**, subir el `.zip` y marcar `index.html` como jugable.
- [ ] Viewport **1280×720**, **Fullscreen** activado, **mobile** desactivado.
- [ ] Cover image = `cover_630.png`.
- [ ] Pegar descripción larga + aviso de contenido (+12).
- [ ] Añadir 3-4 capturas de pantalla.
- [ ] Tags + plataforma (Web).
- [ ] Enlazar a la jam y confirmar el envío.
