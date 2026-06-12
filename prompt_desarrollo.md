Eres un experto desarrollador de videojuegos web. Voy a darte el diseño
completo de un juego para una game jam. Lee TODO antes de escribir
una sola línea de código.

---

# REGLAS DE LA JAM
- HTML, CSS y JavaScript
- SÍ se permiten librerías JS que NO sean motores de juego completos
  (p5.js, Three.js, Howler.js, GSAP, etc. están permitidos)
- NO se permiten motores de juego completos (Phaser, Unity, Godot, etc.)
- Debe funcionar en navegador directamente, sin instalación
- Todas las librerías via CDN

## Librerías recomendadas para este juego
- **p5.js** → renderizado y game loop simplificado (muy recomendado)
- **Howler.js** → gestión de audio (música y SFX)
- **GSAP** → animaciones de UI (transiciones entre habitaciones)

Si usas p5.js: usa el modo instancia (new p5(sketch)) para evitar
contaminar el scope global. El loop de p5 (setup/draw) reemplaza
al requestAnimationFrame manual.

---

# EL JUEGO — Dr. Muerte

## Concepto
Eres la Muerte disfrazada de doctor en un hospital. Debes matar
pacientes sin levantar sospechas. El reto NO es matar — es PARECER
inocente mientras lo haces.

Tono: oscuro pero cartoon, cómico, nunca perturbador.
Jam: Didáctico Jam 2026. Tema: "Al Revés".

---

## Género y Vista
- Juego 2D pixel art con CÁMARA FIJA por habitación (sin scroll)
- Vista lateral, estilo Hollow Knight / Dead Cells
- El jugador se mueve entre habitaciones a través de puertas
- Resolución lógica: 320x180 escalada x3 o x4

---

## Loop de Gameplay

```
Entras en una habitación con cámara fija
        ↓
Aparece un paciente ALEATORIO con edad aleatoria
        ↓
Decides qué método usar (menú [E] u objetos de la sala)
        ↓
Ejecutas acciones por turnos manteniendo sospechas < 100
        ↓
Paciente muere → ganas XP → puerta de salida se abre
        ↓
Cada 3 habitaciones → tienda de mejoras con XP
        ↓
Cada 3 habitaciones → encuentro de BOSS
```

---

## Sistema de Pacientes Aleatorios

Cada habitación genera un paciente con:
- Nombre aleatorio de una lista
- Edad aleatoria entre 5 y 95 años
- Diagnóstico aleatorio (lumbalgia, resfriado, ansiedad, etc.)
- 0-2 alergias aleatorias (penicilina, ibuprofeno, aspirina, etc.)
- Resistencia (salud) basada en la edad:

| Edad | Resistencia | Sospechas al morir | Dificultad |
|------|-------------|-------------------|------------|
| 0-10 (niño) | 30 HP | Muy altas (+40) | Difícil |
| 11-25 (joven) | 100 HP | Bajas (+5) | Difícil |
| 26-50 (adulto) | 70 HP | Medias (+15) | Normal |
| 51-70 (mayor) | 45 HP | Bajas (+5) | Fácil |
| 71-95 (anciano) | 25 HP | Ninguna (+0) | Muy fácil |

---

## Sistema de XP y Mejoras

### Ganancia de XP al eliminar
- Anciano: 10 XP
- Mayor: 20 XP
- Adulto: 30 XP
- Joven: 40 XP
- Niño: 60 XP
- Bonus sin sospechas (< 20): +10 XP
- Bonus combinación peligrosa: +15 XP

### Tienda (cada 3 habitaciones, antes del boss)
Muestra 3 mejoras aleatorias. El jugador compra con XP:

Mejoras pasivas:
- "Cara de buena persona" (30 XP) → sospechas +20% más lento
- "Manos temblorosas" (25 XP) → acciones dañinas parecen accidentales
- "Bata nueva" (20 XP) → primera acción de cada sala sin sospechas
- "Historial falso" (40 XP) → 1x por sala ignora alergias sin sospechas
- "Estetoscopio de lujo" (35 XP) → ves el efecto real de tratamientos
- "Sonrisa ensayada" (30 XP) → sospechas bajan el doble de rápido

Mejoras activas (1 uso por sala):
- "Fuera todos" (25 XP) → echa observadores de la sala
- "Distracción" (20 XP) → resetea sospechas a 0
- "Llamada urgente" (15 XP) → el inspector sale de la sala
- "Inyección misteriosa" (35 XP) → daño masivo, sospechas aleatorias

---

## Métodos para Matar

### Menú de tratamientos [E]
Al pulsar E cerca del paciente se abre un menú con 4-6 opciones.
Cada opción tiene nombre inocente y efecto real oculto.
El efecto real solo se ve si tienes "Estetoscopio de lujo".

### Sobredosis gradual
- Misma medicina en dosis crecientes
- Dosis normal → neutral / Dosis alta → daño leve, pocas sospechas
- Dosis brutal → daño alto, muchas sospechas
- Subir de golpe genera más sospechas que gradualmente

### Medicación incorrecta
- Recetar algo que no corresponde al diagnóstico
- Plausible médicamente → pocas sospechas
- Obviamente incorrecto → muchas sospechas

### Alergias ignoradas
- Recetar el alérgeno del paciente = daño masivo + sospechas muy altas
- Solo viable sin observadores o con "Historial falso"

### Combinaciones peligrosas
- Dos medicamentos inocentes por separado, letales juntos
- Ejemplo: Warfarina + Aspirina = letal, sospechas = 0
- El jugador descubre combinaciones por ensayo y error entre runs
- Se guardan en el Cuaderno de Notas (TAB)

### Diagnóstico incorrecto
- Tratar enfermedad equivocada → la real empeora sola por turnos
- Muy lento pero completamente indetectable

### Objetos de la sala
1-3 objetos interactuables en cada habitación:
- Pastillas (daño medio, pocas sospechas)
- Jeringuilla (daño alto, sospechas medias)
- Café (envenenable, sin sospechas si nadie mira)
- Historial médico (cambiar diagnóstico, sin sospechas)
- Cable eléctrico (daño alto, sospechas altas)
- Producto limpieza (daño, sospechas si hay inspector)
- Termostato (hipotermia lenta, indetectable)

---

## Sistema de Sospechas

- Barra en UI (0-100), color rojo
- Sube al hacer acciones sospechosas
- Baja lentamente con el tiempo (sin hacer nada)
- Multiplicada por observadores presentes en sala:
  - Nadie → x0.5 / Enfermera → x1.0 / Inspector → x2.0
  - Paciente desconfiado → x1.5 / Familiar → x1.3
- Si llega a 100 → game over

---

## Bosses (cada 3 habitaciones)

Boss 1 — La Revisión Médica:
3 pacientes a la vez + enfermera jefe siempre presente.
Solo tratamientos de apariencia inocente. Sospechas x2.

Boss 2 — El Inspector Sanitario:
El inspector está EN la sala todo el tiempo (sospechas x3).
Solo combinaciones peligrosas o diagnóstico incorrecto funcionan.

Boss 3 — La Visita del Periodista:
Periodista con cámara entrevistando al paciente.
Las sospechas acumuladas aquí persisten a las siguientes salas.

Boss Final — El Paciente Inmortal:
No muere con nada convencional. Revive con 10 HP al llegar a 0.
Hay que descubrir su combinación letal secreta (cambia cada run).

---

## Assets Disponibles

### doctor.png — Sprite sheet, 5 filas de animaciones:
- Fila 0: IDLE (5 frames)
- Fila 1: DIALOGUE (8 frames)
- Fila 2: WALK (8 frames)
- Fila 3: RUN (8 frames)
- Fila 4: DEFENSE (4 frames)

### Paciente 1 — naranja (fondo negro):
patient1/Idle.png (5f), Walk.png (9f), Run.png (9f), Dead.png (5f)

### Paciente 2 — mochila (fondo negro):
patient2/Idle.png (5f), Walk.png (9f), Run.png (9f), Dead.png

### Inspector — gafas oscuras (fondo negro):
inspector/Idle.png (5f), Walk.png (8f), Run.png (8f), Dead.png (5f)

### Encubridor — máscara roja (fondo negro):
accomplice/Walk.png (7f), Run.png (8f)

### Fondo: City_background.png → parallax en menú

IMPORTANTE: Los sprites tienen fondo negro (#000000).
Al renderizar en Canvas hay que tratar el negro como transparente.
Usa un offscreen canvas para reemplazar el negro antes de dibujar.

---

## Estilo Visual

- Resolución nativa del navegador, fullscreen
- Estilo cartoon 2D ilustrado, líneas limpias y suavizadas
- Sin aspecto pixel art — formas redondeadas, gradientes suaves
- Personajes expresivos con colores vivos sobre fondos oscuros
- UI moderna con tipografía limpia e iconos simples
- Iluminación suave, sombras difusas
- Colores base:
  - Fondo sala: #1a2a3a / Paredes: #243444 / Suelo: #16202c
  - Luces: #a0ffcc / UI texto: #f0f8ff
  - Barra sospechas: #e03333 / Barra XP: #33bb55

---

## Mensajes de Tono

- Éxito: "Muerte natural. Nadie sospecha. ⭐⭐⭐"
- Paciente sobrevive: "Se ha curado. Inaceptable."
- Game Over: "Te han descubierto. Tu carrera como médico
  ha terminado. Y también la otra."
- Victoria: "El hospital tiene la tasa de mortalidad más alta
  del país. Misión cumplida."
- Anciano fácil: "Este ya tenía un pie dentro."
- Niño difícil: "Esto va a levantar preguntas."

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
  animation.js     ← Animation + AnimationController
  entities/
    Entity.js      ← clase base (x,y,w,h,update,render)
    Doctor.js      ← personaje principal
    Patient.js     ← paciente aleatorio
    Inspector.js   ← NPC peligroso
    Item.js        ← objetos de la sala
  states/
    MenuState.js
    GameState.js   ← habitación actual + lógica
    UpgradeState.js
    BossState.js
    GameOverState.js
    VictoryState.js
  ui/
    HUD.js              ← sospechas, XP, turno
    TreatmentMenu.js    ← menú contextual [E]
    NoteBook.js         ← cuaderno (TAB)
```

### Clases clave del engine

```javascript
// Game loop
function gameLoop(ts) {
  const dt = (ts - lastTime) / 1000;
  lastTime = ts;
  currentState.update(dt);
  currentState.render(ctx);
  requestAnimationFrame(gameLoop);
}

// Transparencia de fondo negro en sprites
function makeTransparent(img) {
  const oc = document.createElement('canvas');
  oc.width = img.width; oc.height = img.height;
  const oc2 = oc.getContext('2d');
  oc2.drawImage(img, 0, 0);
  const d = oc2.getImageData(0,0,img.width,img.height);
  for(let i=0;i<d.data.length;i+=4)
    if(d.data[i]<10&&d.data[i+1]<10&&d.data[i+2]<10)
      d.data[i+3]=0;
  oc2.putImageData(d,0,0);
  return oc;
}

// Generación de paciente aleatorio
function generatePatient() {
  const age = Math.floor(Math.random()*91)+5;
  return {
    name: randomFrom(NAMES),
    age,
    hp: getHPByAge(age),
    diagnosis: randomFrom(DIAGNOSES),
    allergies: randomAllergies(),
  };
}

// Colisiones AABB
function collides(a,b) {
  return a.x<b.x+b.w && a.x+a.w>b.x &&
         a.y<b.y+b.h && a.y+a.h>b.y;
}
```

---

## LO QUE QUIERO QUE GENERES AHORA

Genera la base completa y funcional del juego:

1. index.html con canvas, escala correcta, fullscreen
2. loader.js que precarga todos los assets y aplica
   transparencia al negro de los sprites
3. input.js con InputManager completo
4. assets.js con todas las rutas y config de frames
5. data.js con:
   - Lista de nombres de pacientes
   - Lista de diagnósticos con sus tratamientos compatibles
   - Lista de medicamentos con efectos reales y aparentes
   - Combinaciones letales (pares de medicamentos)
   - Lista de mejoras con coste y efecto
   - Configuración de bosses
   - Textos de humor
6. animation.js con Animation y AnimationController completos
   incluyendo soporte para sprite sheets por filas (doctor)
   y por strips horizontales (el resto)
7. Todas las entidades en /entities/ con sus animaciones
8. GameState completamente jugable con:
   - Habitación con cámara fija (pixel art generado en Canvas)
   - Doctor controlable con animaciones correctas (WASD/flechas)
   - Generación aleatoria de paciente al entrar
   - Ficha del paciente visible (nombre, edad, diagnóstico, HP)
   - Menú de tratamientos al pulsar E
   - Sistema de sospechas funcional con barra en UI
   - Sistema de XP funcional
   - Puerta bloqueada hasta que el paciente muere
   - Transición a siguiente habitación
   - Game over si sospechas = 100
9. UpgradeState con tienda de mejoras
10. MenuState, GameOverState y VictoryState

El código debe ser:
- Limpio, modular y bien comentado
- Cada clase en su propio archivo
- Sin dependencias externas
- TODO vanilla JavaScript y Canvas API
- Genera TODOS los archivos completos,
  no pongas "// resto del código aquí"
