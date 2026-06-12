# Dr. Muerte — Context de Desarrollo v2

## Concepto
Eres la Muerte disfrazada de doctor en un hospital. Tu objetivo es matar
pacientes sin levantar sospechas. El reto NO es matar — es PARECER
inocente mientras lo haces.

**Jam:** Didáctico Jam 2026 — Tema: "Al Revés"
**Plataforma:** Web (HTML + CSS + JavaScript puro, sin motores)
**Tono:** Oscuro pero cartoon, cómico, nunca perturbador

---

## Género y Vista
- Juego 2D con cámara FIJA por habitación
- Pixel art, vista top-down 3/4 (ver ART_STYLE.md)
- El jugador se mueve entre habitaciones (no hay scroll)
- SÍ se permiten librerías JS que no sean motores completos
  (p5.js, Howler.js, GSAP, Three.js...)
- NO se permiten motores de juego (Phaser, Unity, Godot...)
- Recomendado: p5.js para render + Howler.js para audio

---

## Estructura del Juego — Habitaciones

### Cámara fija
La cámara NO hace scroll. Cada habitación es una pantalla completa.
Al salir por una puerta → transición → nueva habitación.

### Mapa del hospital
El hospital es una serie de habitaciones conectadas por puertas:

```
[Recepción]
     ↓
[Habitación 1] → [Habitación 2] → [Habitación 3]
                                         ↓
                              [BOSS cada 3 habitaciones]
                                         ↓
                              [Habitación 4] → [Habitación 5]
                                                      ↓
                                              [BOSS FINAL]
```

Cada habitación tiene una puerta de entrada y una de salida.
La salida se DESBLOQUEA al eliminar al paciente de esa habitación.

---

## Loop de Gameplay

```
Entras en una habitación
        ↓
Aparece paciente aleatorio con edad aleatoria
        ↓
Decides qué método usar para eliminarlo
        ↓
Ejecutas la acción (menú de tratamientos / objetos de la sala)
        ↓
Si sospechas < 100 y paciente muere → XP + puerta abierta
        ↓
Eliges mejora (si tienes XP suficiente) o sigues
        ↓
Siguiente habitación
```

---

## Sistema de Pacientes Aleatorios

### Generación aleatoria
Al entrar en cada habitación se genera un paciente con:
- **Nombre** aleatorio
- **Edad** aleatoria (5-95 años)
- **Diagnóstico** aleatorio (de una lista)
- **Alergias** aleatorias (0-2 alergias)
- **Resistencia** basada en la edad

### La edad lo cambia todo

| Edad | Resistencia | Sospechas al morir | Dificultad |
|------|-------------|-------------------|------------|
| 0-10 (niño) | Muy baja | Muy altas | Difícil (muchas sospechas) |
| 11-25 (joven) | Alta | Bajas | Difícil (aguanta mucho) |
| 26-50 (adulto) | Media | Medias | Normal |
| 51-70 (mayor) | Baja | Bajas | Fácil |
| 71-95 (anciano) | Muy baja | Muy bajas | Muy fácil |

> Los niños son fáciles de matar pero generan muchas sospechas.
> Los jóvenes son difíciles de matar pero pasan desapercibidos.
> Los ancianos son los objetivos perfectos — nadie se sorprende.

### Diagnósticos posibles
- Lumbalgia, Resfriado común, Ansiedad leve, Dolor de cabeza,
  Esguince, Hipertensión, Colesterol alto, Diabetes tipo 2,
  Insomnio, Hipocondría, Apendicitis (urgente), Fractura

### Alergias posibles
- Penicilina, Ibuprofeno, Látex, Aspirina, Morfina, Sulfonamidas

---

## Sistema de XP y Mejoras

### Ganancia de XP
Cada paciente eliminado da XP según dificultad:

| Condición | XP ganada |
|-----------|-----------|
| Anciano eliminado | 10 XP |
| Adulto eliminado | 20 XP |
| Joven eliminado | 35 XP |
| Niño eliminado | 50 XP |
| Sin sospechas (< 20) | +10 XP bonus |
| Usando combinación peligrosa | +15 XP bonus |
| Usando alergia | +10 XP bonus |

### Tienda de mejoras
Aparece cada 3 habitaciones (antes del boss).
Se muestran 3 mejoras aleatorias, el jugador compra la que quiera:

#### Mejoras pasivas
| Mejora | Coste | Efecto |
|--------|-------|--------|
| "Cara de buena persona" | 30 XP | Sospechas suben 20% más lento |
| "Manos temblorosas" | 25 XP | Acciones dañinas parecen accidentales |
| "Bata nueva" | 20 XP | Primera acción de cada sala sin sospechas |
| "Historial falso" | 40 XP | Ignora alergias sin sospechas 1x por sala |
| "Estetoscopio de lujo" | 35 XP | Ves el efecto real de los tratamientos |
| "Sonrisa ensayada" | 30 XP | Sospechas bajan el doble de rápido |

#### Mejoras activas (1 uso)
| Mejora | Coste | Efecto |
|--------|-------|--------|
| "Fuera todos" | 25 XP | Echa observadores de la sala |
| "Distracción" | 20 XP | Resetea sospechas a 0 |
| "Llamada urgente" | 15 XP | El inspector sale de la sala |
| "Inyección misteriosa" | 35 XP | Daño masivo, sospechas aleatorias |

---

## Métodos para Matar

### Menú de tratamientos
Al interactuar con el paciente (tecla E) se abre el menú:

```
┌─────────────────────────────────┐
│ 🩺 Ernesto, 74 años              │
│ Dx: Lumbalgia | Alergia: Ninguna│
│ Salud: ████████░░  80/100       │
├─────────────────────────────────┤
│ [1] Vitamina C          +15 sal │
│ [2] Ibuprofeno 200mg    neutral  │
│ [3] Ibuprofeno 600mg    -10 sal  │
│ [4] Ibuprofeno 2400mg   -35 sal  │
│ [5] Anticoagulante      -20 sal  │
│ [6] Alta médica         -25 sal  │
└─────────────────────────────────┘
```
(Los efectos reales solo se ven si tienes "Estetoscopio de lujo")

### Sobredosis gradual
- Dosis normal → sin daño
- Dosis alta → daño leve, pocas sospechas
- Dosis brutal → daño alto, muchas sospechas
- Subir dosis de golpe levanta más sospechas

### Medicación incorrecta
- Recetar algo que no corresponde al diagnóstico
- Si suena médicamente plausible → pocas sospechas
- Si es muy obvio → muchas sospechas

### Alergias ignoradas
- Historial muestra alergias del paciente
- Recetar alérgeno = daño masivo + sospechas muy altas
- Solo viable sin observadores o con "Historial falso"

### Combinaciones peligrosas
- Dos medicamentos inocentes que juntos son letales
- Warfarina + Aspirina = letal, sin sospechas
- El jugador descubre combinaciones entre runs
- Se guardan en el Cuaderno de Notas

### Diagnóstico incorrecto
- Diagnosticar mal = tratar enfermedad equivocada
- La enfermedad real empeora sola por turnos
- Muy lento pero indetectable

### Objetos de la sala
Cada habitación tiene 1-3 objetos interactuables:

| Objeto | Efecto | Sospechas |
|--------|--------|-----------|
| 💊 Pastillas | Daño medio | Pocas |
| 💉 Jeringuilla | Daño alto | Medias |
| ☕ Café | Envenenable, sin sospechas si nadie mira | Ninguna |
| 📋 Historial | Cambiar diagnóstico | Ninguna |
| 🔌 Cable | Daño alto (accidente) | Altas |
| 🧪 Limpiador | Envenenamiento | Altas si inspector |
| ❄️ Termostato | Hipotermia lenta | Ninguna |
| 🪟 Ventana | Empujar (solo plantas altas) | Muy altas |

---

## Sistema de Sospechas

- Barra visible en UI (0-100), color rojo
- Sube al realizar acciones sospechosas
- Modificada por presencia de observadores en la sala
- Baja lentamente con el tiempo (+2 seg sin hacer nada)
- Si llega a 100 → inspector entra en la sala → game over

### Observadores en sala
Cada sala puede tener observadores que multiplican las sospechas:

| Observador | Multiplicador sospechas |
|------------|------------------------|
| Nadie | x0.5 |
| Enfermera | x1.0 |
| Inspector | x2.0 |
| Paciente desconfiado | x1.5 |
| Familiar del paciente | x1.3 |

---

## Bosses

Aparecen cada 3 habitaciones. Son encuentros especiales:

### Boss 1 — La Revisión Médica
**Situación:** Una sala con 3 pacientes a la vez y una enfermera jefe
que no se mueve. Hay que eliminar a los 3 sin que la enfermera
levante sospechas. Solo puedes usar tratamientos de apariencia inocente.

### Boss 2 — El Inspector Sanitario
**Situación:** El inspector está EN la sala todo el tiempo.
Sospechas suben x3. Hay que ser muy sutil — solo combinaciones
peligrosas o diagnóstico incorrecto funcionan sin ser pillado.

### Boss 3 — La Visita del Periodista
**Situación:** Un periodista con cámara está entrevistando al paciente.
Todo lo que hagas puede aparecer en las noticias. Las sospechas
se acumulan globalmente (afectan a las siguientes salas también).

### Boss Final — El Paciente Inmortal
**Situación:** Un paciente que no muere con nada convencional.
Hay que descubrir su debilidad oculta (combinación específica
que cambia en cada run) probando combinaciones.
Revive con 10 de salud cada vez que llegas a 0.

---

## Cuaderno de Notas (persistente entre runs)

Accesible pulsando TAB en cualquier momento:
- Combinaciones letales descubiertas
- Alergias que has explotado
- Diagnósticos que has falsificado con éxito
- Récords por tipo de paciente

---

## Condiciones de Victoria y Derrota

| Condición | Resultado |
|-----------|-----------|
| Salud paciente = 0, sospechas < 100 | ✅ XP + siguiente sala |
| Sospechas = 100 | 💀 Game Over |
| Inspector te alcanza | 💀 Game Over |
| Completas las 3 plantas | 🏆 Victoria |

---

## Mensajes y Tono

- **Éxito:** "Muerte natural. Nadie sospecha. ⭐⭐⭐"
- **Paciente sobrevive:** "Se ha curado. Inaceptable."
- **Game Over:** "Te han descubierto. Tu carrera como médico
  ha terminado. Y también la otra."
- **Victoria:** "El hospital tiene la tasa de mortalidad más alta
  del país. Misión cumplida."
- **Paciente al acercarse:** "¡Qué doctor tan majo!"
- **Anciano fácil:** "Este ya tenía un pie dentro."
- **Niño difícil:** "Esto va a levantar preguntas."

---

## Pantallas

1. **MenuState** → título pixel art, botón jugar, cuaderno de notas
2. **GameState** → habitación actual, gameplay principal
3. **UpgradeState** → tienda de mejoras con XP (cada 3 salas)
4. **BossState** → encuentro especial con mecánica única
5. **GameOverState** → pantalla de game over + estadísticas
6. **VictoryState** → victoria + estadísticas finales

---

## Estilo Visual — "Pastel Malpractice"

> **La fuente de verdad del arte es `ART_STYLE.md`.** Esta sección es solo
> el resumen; ante cualquier conflicto, manda la biblia de arte.

- **Pixel art top-down 3/4**, resolución lógica 320×180 escalada ×4
  (1280×720), `image-rendering: pixelated`, tiles de 16×16
- Estética de juego de gestión hospitalaria mono y pastel
  (Theme Hospital + Stardew Valley), humor negro en situaciones, no en gore
- Personajes chibi 16×24 (2 cabezas de alto), outline 1px morado `#4a3b5c`
- Cel-shading plano (base + 1 sombra), sin dithering ni degradados
- La muerte se representa con un fantasmita morado sonriente, nunca cadáveres gráficos

### Paleta (resumen — completa en ART_STYLE.md)
```
Outline:         #4a3b5c (morado oscuro, nunca negro puro)
Pared menta:     #c9f0dd
Suelo crema:     #fdf2e0 / #f6e2c8 (damero)
Azul bebé:       #a8d8f5
Lavanda:         #dcc8f2
Rosa:            #ffb3c6
Blanco cálido:   #fff6ee
Barra sospechas: #ef5d6f
Barra XP/salud:  #6fd293
Avisos:          #ffd970
Almas/Muerte:    #b9a8e8
```

---

## Assets Disponibles

> ⚠️ Los assets listados abajo son de la dirección de arte ANTIGUA
> (vista lateral, fondo negro). NO encajan con "Pastel Malpractice" y
> deben regenerarse siguiendo ART_STYLE.md antes de usarse.

### Personaje principal — doctor.png
Sprite sheet con 5 animaciones en filas:
| Fila | Animación | Frames |
|------|-----------|--------|
| 0 | IDLE | 5 |
| 1 | DIALOGUE | 8 |
| 2 | WALK | 8 |
| 3 | RUN | 8 |
| 4 | DEFENSE | 4 |

### Paciente 1 — El Casual (naranja, fondo negro)
- Idle.png → 5 frames | Walk.png → 9 frames
- Run.png → 9 frames  | Dead.png → 5 frames

### Paciente 2 — El de la Mochila (fondo negro)
- Idle.png → 5 frames | Walk.png → 9 frames
- Run.png → 9 frames  | Dead.png → frames disponibles

### Inspector — gafas oscuras (fondo negro)
- Idle.png → 5 frames | Walk.png → 8 frames
- Run.png → 8 frames  | Dead.png → 5 frames

### Encubridor — máscara roja (fondo negro)
- Walk.png → 7 frames | Run.png → 8 frames

### Fondo
- City_background.png → parallax en menú y ventanas

> Sprites con fondo negro: tratar #000000 como transparente en Canvas.

---

## Arquitectura del Engine

```
/index.html
/css/style.css
/js/
  main.js          ← canvas, game loop, deltaTime, estados
  loader.js        ← precarga assets, pantalla de carga
  input.js         ← InputManager (keydown/keyup)
  assets.js        ← rutas y config de todos los assets
  data.js          ← tratamientos, pacientes, textos, niveles
  animation.js     ← clases Animation y AnimationController
  entities/
    Entity.js      ← clase base
    Doctor.js      ← personaje principal
    Patient.js     ← paciente aleatorio
    Inspector.js   ← NPC peligroso
    Item.js        ← objetos de la sala
  states/
    MenuState.js
    GameState.js   ← habitación actual + lógica de sala
    UpgradeState.js
    BossState.js
    GameOverState.js
    VictoryState.js
  ui/
    HUD.js         ← barra sospechas, XP, turno
    TreatmentMenu.js ← menú contextual de tratamientos
    NoteBook.js    ← cuaderno de notas (TAB)
/assets/
  doctor.png
  City_background.png
  patient1/ patient2/ inspector/ accomplice/
  backgrounds/ items/ ui/ audio/
```

### Engine — Clases clave

```javascript
// Game loop con deltaTime
function gameLoop(timestamp) {
  const dt = (timestamp - lastTime) / 1000;
  lastTime = timestamp;
  currentState.update(dt);
  currentState.render(ctx);
  requestAnimationFrame(gameLoop);
}

// Sistema de estados
const states = { menu, game, upgrade, boss, gameOver, victory };
function setState(name) { currentState = states[name]; }

// Animaciones — fondo negro como transparente
class Animation {
  render(ctx, x, y, flipped) {
    // offscreen canvas para reemplazar negro por transparente
    // ctx.drawImage con sx = frameIndex * frameWidth
  }
}

// Generación de paciente aleatorio
function generatePatient() {
  const age = Math.floor(Math.random() * 91) + 5;
  const resistance = getResistanceByAge(age);
  const diagnosis = randomFrom(DIAGNOSES);
  const allergies = randomAllergies();
  return new Patient({ age, resistance, diagnosis, allergies });
}

// Colisiones AABB
function collides(a, b) {
  return a.x < b.x+b.w && a.x+a.w > b.x &&
         a.y < b.y+b.h && a.y+a.h > b.y;
}
```

---

## Plan de Desarrollo (7 días)

| Día | Tarea |
|-----|-------|
| 1 | Engine base: game loop, estados, input, loader, canvas |
| 2 | Habitación con cámara fija, doctor controlable y animaciones |
| 3 | Generación aleatoria de pacientes, menú de tratamientos |
| 4 | Sistema de sospechas, XP, objetos de la sala |
| 5 | Bosses, tienda de mejoras, transición entre habitaciones |
| 6 | UI completa, cuaderno de notas, textos de humor |
| 7 | Arte pixel art, sonido, pulido, subida a itch.io |

---

*Didáctico Jam 2026 — Tema: Al Revés — v2*
