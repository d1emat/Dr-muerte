# Dr. Muerte

> Eres la **Muerte disfrazada de doctor** en un hospital pastel. Tu trabajo:
> "tratar" a los pacientes… hasta el final, sin que nadie sospeche.

Juego de **sigilo y gestión médica con vista cenital**, en pixel art y con
humor negro. Hecho para el **Didáctico Jam 2026** (tema: *Al Revés* — en vez de
curar, lo contrario).

![pixel art](assets/levels/level1.png)

---

## 🎯 Cómo se juega

Entras en un hospital, atiendes a los pacientes y los eliminas haciéndolo
**parecer natural**. El reto no es matar: es **no levantar sospechas**.

- Diagnostica al paciente y elige un tratamiento (categoría → medicina → dosis).
- La medicina **correcta** lo cura; la **equivocada** lo daña y sube sospechas.
- **Mezclar fármacos** puede ser letal: descubre combinaciones y se guardan en
  tu **cuaderno**.
- Cuidado con quién te ve: la enfermera y el inspector tienen **campo de visión**
  (el cono amarillo). Si te pillan, se pone rojo.
- Si la sospecha llega a 100 o el inspector te alcanza → game over.

## ✨ Características

- **Sistema médico**: 9 enfermedades, 15 medicinas (pastillas / inyecciones /
  vía IV), 3 dosis, alergias y **14 combinaciones letales** por descubrir.
- **Sigilo**: conos de visión visibles, las paredes bloquean la vista, aviso de
  detección `?` → `!`, inspector que te persigue rodeando paredes.
- **Sospecha**: sube al hacer cosas turbias (más si te ven); baja si ayudas
  (reparar máquinas, ordenar historiales, echar una mano a la enfermera).
- **5 niveles** de hospitales cada vez más grandes (el último con dos plantas y
  ascensor) + objetivos que cambian cada partida (contrarreloj, cero testigos,
  paciente VIP…).
- **Complicaciones** aleatorias: código azul, apagón.
- **Encubrir el cadáver** antes de que lo descubran.
- **Progresión**: XP, tienda de mejoras y portada de periódico entre niveles.
- **Cuaderno de combinaciones** persistente.
- **Modo Turno Infinito** (arcade): oleadas sin fin, marcador y récord.
- **Tutorial** interactivo y menús navegables con teclado.

## 🎮 Controles

| Tecla | Acción |
|-------|--------|
| `WASD` | Moverse |
| `E` | Interactuar / atender paciente |
| `W` `S` · `E` · `Q` | Menú de tratamiento: elegir · confirmar · atrás |
| `1`–`4` | Usar mejoras activas |
| `J` | Cuaderno de combinaciones |
| `ESC` | Pausa |
| `M` · `,` `.` | Silenciar música · bajar/subir volumen |
| Flechas · `Enter` | Navegar los menús |

## ▶️ Cómo ejecutarlo

El juego usa módulos de JavaScript, así que **necesita un servidor local**
(no vale abrir `index.html` directamente con doble clic).

Desde la carpeta del proyecto:

```bash
python3 -m http.server 8080
```

Y abre **http://localhost:8080** en el navegador.

> ¿No tienes Python? Vale cualquier servidor estático (la extensión
> *Live Server* de VS Code, `npx serve`, etc.).

## 🛠️ Tecnología

- HTML + CSS + JavaScript puro (módulos ES), sin paso de compilación.
- [Phaser 3](https://phaser.io/) (incluido en `js/lib/`, no requiere internet).
- Tilesets, personajes e iconos generados con scripts de Python en `tools/`.

## 📁 Estructura

```
index.html          punto de entrada
css/                estilos
js/
  scenes/           menú, juego, tutorial, tienda, fin de partida…
  systems/          sospecha, sigilo, tratamiento, audio, progreso…
  entities/         jugador, paciente, enfermera, inspector
  data/             medicinas, niveles, pacientes
  ui/               tema, menús, cuaderno
  world/            generación del mapa
assets/             tileset, personajes, iconos
Music/              pistas de música
tools/              generadores de arte/niveles (Python)
```

---

*Dr. Muerte — Didáctico Jam 2026 · Tema: Al Revés*
