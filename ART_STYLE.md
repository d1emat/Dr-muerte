# Dr. Muerte — Biblia de Arte v1
### Estilo oficial: "Pastel Malpractice"

> **UNA sola identidad visual para TODO el juego.**
> Cualquier sprite, tile, icono o pantalla que no cumpla estas reglas se rehace.

**Resumen en una frase:** juego de gestión de hospital adorable y pastel
(estilo *Theme Hospital* + *Stardew Valley* + tamagotchi), donde el humor
negro vive en las *animaciones y situaciones*, nunca en el gore.

- ✅ Limpio, luminoso, redondeado, cuco, cómico
- ❌ NO horror, NO realismo, NO RPG medieval, NO sangre, NO grimdark

---

## 1. Especificaciones técnicas base

| Parámetro | Valor | Regla |
|---|---|---|
| Resolución lógica | **320 × 180 px** | Todo se dibuja aquí y se escala |
| Escalado | **Entero (×4 → 1280×720)** | `image-rendering: pixelated`, nunca escalado fraccional |
| Tile | **16 × 16 px** | Toda la arquitectura encaja en grid de 16 |
| Habitación | **20 × 11 tiles** (320×176) + 4px para HUD | Una pantalla = una sala, sin scroll |
| Perspectiva | **Top-down 3/4** (vista RPG clásica) | Suelo visto desde arriba, paredes frontales de 2 tiles de alto, personajes de frente/espalda/perfil |
| Grid de píxel | 1 píxel lógico = 1 píxel | Prohibido mezclar tamaños de píxel en pantalla (no "pixel art HD" junto a pixel art 16px) |
| Anti-aliasing | **Ninguno** | Bordes duros siempre |
| Rotación de sprites | **Prohibida en runtime** | Las rotaciones se dibujan a mano como frames |

---

## 2. Paleta de colores — "Pastel Malpractice" (24 colores)

Paleta CERRADA. Todo asset usa SOLO estos colores. Si falta un color, se
elige el más cercano de la lista — no se inventan colores nuevos.

### Núcleo (línea + neutros)
| Uso | Hex | Nota |
|---|---|---|
| **Línea / outline universal** | `#4a3b5c` | Morado oscuro. NUNCA negro puro |
| Sombra interior genérica | `#7a6890` | Morado medio, para sombras sobre cualquier color |
| Blanco cálido (batas, sábanas) | `#fff6ee` | NUNCA blanco puro #ffffff |
| Gris pastel (metal, camillas) | `#cfc6d9` | |

### Hospital (entornos)
| Uso | Hex | Nota |
|---|---|---|
| Pared menta clara | `#c9f0dd` | Color firma del juego |
| Pared menta sombra | `#9bdbc1` | |
| Suelo crema | `#fdf2e0` | Damero con el siguiente |
| Suelo crema 2 | `#f6e2c8` | |
| Zócalo / mobiliario madera | `#e0b184` | |
| Madera sombra | `#b8835c` | |
| Azul bebé (cortinas, puertas) | `#a8d8f5` | |
| Azul bebé sombra | `#7db3dd` | |
| Lavanda (camas, detalles) | `#dcc8f2` | |
| Lavanda sombra | `#b49adf` | |

### Personajes
| Uso | Hex | Nota |
|---|---|---|
| Piel clara | `#ffd9b8` | |
| Piel clara sombra | `#efb28c` | |
| Piel oscura | `#c68a5c` | |
| Piel oscura sombra | `#9c6843` | |
| Rosa (enfermera, mejillas) | `#ffb3c6` | Coloretes en TODOS los personajes |
| Rosa sombra | `#ef8aa8` | |

### Señales y UI
| Uso | Hex | Nota |
|---|---|---|
| Rojo suave (sospechas, cruz) | `#ef5d6f` | Único rojo permitido. NO sangre |
| Verde (salud, XP, éxito) | `#6fd293` | |
| Amarillo (avisos, brillos) | `#ffd970` | |
| Morado fantasma (almas, Muerte) | `#b9a8e8` | Color del "lado oculto" del juego |

### Regla de oro de color
**Ambientes = pastel desaturado. Señales de gameplay = saturado.**
Lo único que "grita" en pantalla es lo que el jugador debe mirar
(barra de sospechas, objeto interactuable, alma del paciente).

---

## 3. Línea (outline)

- Outline de **1 px** en `#4a3b5c` alrededor de TODOS los sprites
  (personajes, muebles, objetos, iconos).
- **Los tiles de suelo y pared NO llevan outline exterior** — solo los
  bordes donde la pared se encuentra con el suelo.
- Líneas interiores (separar brazo de torso, etc.): versión oscura del
  color local, NO el morado de outline, para que no se "embarre".
- Esquinas siempre redondeadas: en cualquier silueta, las esquinas de
  90° se rompen con 1 píxel. Nada termina en punta afilada
  (excepto la guadaña, que es el chiste).

---

## 4. Sombreado

- **Cel-shading plano: base + 1 sombra. Máximo 1 brillo en materiales
  brillantes** (metal, cristal, jeringuilla, suelo encerado).
- Luz **cenital ligeramente desde arriba-izquierda**, igual en todas las salas.
- **Prohibido:** dithering, degradados, texturas de ruido, pillow shading
  (sombra en anillo alrededor del borde).
- Sombra de contacto: elipse de 1-2 px de alto en `#7a6890` al 100%
  (sin transparencia) bajo cada personaje y mueble. Es lo que "pega"
  los sprites al suelo.
- Las sombras NUNCA son negras: siempre tiran a morado (la sombra de
  un color = ese color desplazado hacia `#7a6890`).

---

## 5. Proporciones de personajes — "chibi hospital"

| Parámetro | Valor |
|---|---|
| Canvas del sprite | **16 × 24 px** (frame), el cuerpo ocupa ~14×20 |
| Proporción | **2 cabezas de alto**: cabeza ≈ 10px, cuerpo ≈ 10px |
| Cabeza | Redonda, enorme, 60% del encanto está aquí |
| Ojos | 2×2 px negros-morados con brillo de 1px. La Muerte: cuencas `#4a3b5c` sin brillo (único personaje sin brillo en los ojos) |
| Mejillas | Colorete rosa `#ffb3c6` de 1-2px en TODOS los humanos |
| Brazos/piernas | Muñones cortos sin dedos, estilo peluche |
| Direcciones | 4 (abajo/arriba/izq/dcha) — izq = dcha espejada |

### Identidad de cada personaje (lectura a 3 metros)
- **Dr. Muerte (jugador):** bata blanca impecable + piel gris-lavanda
  `#cfc6d9`, cuencas oscuras, sonrisa fija de 3px. Bajo la bata asoman
  2px de túnica negra-morada. Cuando nadie le ve (estado "unseen"),
  flota 1px sobre el suelo y la sombra se separa.
- **Pacientes:** bata de hospital azul bebé con lazada atrás. La edad se
  lee en silueta: niño = 16×18, adulto = 16×24, anciano = 16×22 encorvado + bastón.
- **Enfermera:** uniforme azul `#7db3dd`, cofia blanca con cruz roja,
  portapapeles en las manos.
- **Inspector:** traje gris, gafas oscuras (sin ojos visibles), portapapeles.
- **Almas:** fantasmita 8×10 px morado `#b9a8e8`, sonriente, sube
  flotando al morir el paciente. ESTE es el tono del juego: la muerte
  es un fantasmita mono, jamás un cadáver gráfico.

---

## 6. Tiles y entorno

- Tileset en grid de **16×16**, paredes de **2 tiles de alto** (32px) vistas de frente.
- Suelo: damero crema `#fdf2e0` / `#f6e2c8`. Salas especiales cambian
  el segundo color (quirófano → menta, pediatría → rosa).
- Muebles: footprint en múltiplos de 16 (cama = 16×32, camilla = 32×16).
  Pueden sobresalir hacia ARRIBA del grid (respaldos, lámparas), nunca a los lados.
- Objetos interactuables: brillo parpadeante de 2px `#ffd970` en una
  esquina. Es la ÚNICA animación de los objetos en reposo.
- Cada sala incluye 1 detalle de humor negro sutil reusable: póster
  "WASH YOUR HANDS 🦴", maceta marchita, reloj sin manecillas…
  Máximo 1 por sala — es un huevo de pascua, no decoración principal.

---

## 7. UI

- Paneles: rectángulos `#fff6ee` con borde de 1px `#4a3b5c`, esquinas
  redondeadas de 2px, sombra dura de 2px en `#7a6890` abajo-derecha.
- Estética de **portapapeles médico**: el menú de tratamientos es una
  tabla sujetapapeles con clip metálico arriba.
- Texto: fuente pixel de 8px de alto (estilo *Press Start* condensada o
  similar), color `#4a3b5c` sobre claro / `#fff6ee` sobre oscuro.
- Barra de sospechas: corazón-monitor que pasa de verde `#6fd293` a
  rojo `#ef5d6f`; al 100% hace línea plana (chiste visual del ECG).
- Iconos: 16×16, mismas reglas de outline y paleta que los sprites.

---

## 8. Animación

| Animación | Frames | FPS |
|---|---|---|
| Idle | 4 | 6 |
| Walk | 4 por dirección | 8 |
| Acción (inyectar, dar pastilla) | 4 | 8 |
| Muerte de paciente | 6 (desmayo cómico + alma sale) | 8 |
| UI (parpadeos, brillos) | 2 | 4 |

- Idle = respiración: el sprite se aplasta 1px cada 2 frames (squash).
- Nada de interpolación suave del motor: las animaciones son frame a frame.
- Movimiento del jugador: libre en píxeles, pero el render se redondea
  a píxel entero (sin posiciones sub-píxel).

## 9. Checklist de consistencia (pasar a TODO asset antes de aceptarlo)

1. ¿Usa SOLO los 24 colores de la paleta?
2. ¿Outline morado `#4a3b5c` de 1px (y nunca negro puro)?
3. ¿Base + 1 sombra, sin dithering ni degradados?
4. ¿Encaja en el grid de 16px y en las proporciones 2-cabezas?
5. ¿Luz desde arriba-izquierda y sombra de contacto morada?
6. ¿Esquinas redondeadas, cero puntas afiladas?
7. ¿Es mono y luminoso a primera vista, y el chiste oscuro está en el
   detalle, no en el gore?
8. ¿Se lee perfectamente al tamaño real (320×180) sin hacer zoom?

---

## 10. Prompt maestro (para generar cualquier asset con IA)

Anteponer SIEMPRE este bloque al pedir un asset nuevo:

```
16-bit pixel art, top-down 3/4 RPG perspective, cute hospital management
game style (Theme Hospital meets Stardew Valley), bright pastel palette
(mint #c9f0dd walls, cream #fdf2e0 checkered floor, baby blue #a8d8f5,
lavender #dcc8f2, soft pink #ffb3c6), 1px dark purple outlines (#4a3b5c,
never pure black), flat cel shading with single shadow tone, no dithering,
no anti-aliasing, no gradients, rounded corners, chibi 2-heads-tall
characters 16x24px, 16x16 tile grid, top-left lighting, purple-tinted
shadows, wholesome and clean look with subtle dark comedy details,
NOT horror, NOT realistic, NOT gritty, no blood, no gore.
```

---

*Dr. Muerte — Didáctico Jam 2026 — Biblia de Arte v1 — sustituye a la
sección "Estilo Visual" anterior de context.md*
