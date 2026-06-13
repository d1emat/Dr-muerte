// Procedural chiptune music + SFX via WebAudio (no external files).
// Tracks: menu (dark-comedy waltz), gameplay (light suspense),
// alert (tense, suspicion > 70), victory, gameover.

const NOTE = {};
{
  const names = ["C", "CS", "D", "DS", "E", "F", "FS", "G", "GS", "A", "AS", "B"];
  for (let oct = 1; oct <= 6; oct++) {
    names.forEach((nm, i) => {
      NOTE[nm + oct] = 440 * Math.pow(2, oct - 4 + (i - 9) / 12);
    });
  }
}

const VOICES = {
  lead:  { type: "triangle", vol: 0.16, dur: 0.20 },
  bass:  { type: "sine",     vol: 0.22, dur: 0.50 },
  pulse: { type: "square",   vol: 0.06, dur: 0.09 },
  tense: { type: "sawtooth", vol: 0.07, dur: 0.12 },
};

// [step, note, voice]
const TRACKS = {
  menu: { stepDur: 0.21, steps: 24, notes: [
    [0, "C3", "bass"], [8, "G2", "bass"], [16, "A2", "bass"],
    [0, "E4", "lead"], [2, "G4", "lead"], [4, "C5", "lead"],
    [8, "D4", "lead"], [10, "G4", "lead"], [12, "B4", "lead"],
    [16, "C4", "lead"], [18, "E4", "lead"], [20, "A4", "lead"], [22, "B4", "lead"],
  ]},
  gameplay: { stepDur: 0.26, steps: 32, notes: [
    [0, "A2", "bass"], [16, "E2", "bass"], [24, "F2", "bass"],
    [0, "A4", "lead"], [6, "C5", "lead"], [10, "E5", "lead"],
    [16, "D5", "lead"], [22, "C5", "lead"], [26, "B4", "lead"],
    [4, "A3", "pulse"], [12, "A3", "pulse"], [20, "A3", "pulse"], [28, "A3", "pulse"],
  ]},
  alert: { stepDur: 0.13, steps: 16, notes: [
    [0, "A2", "pulse"], [2, "A2", "pulse"], [4, "A2", "pulse"], [6, "A2", "pulse"],
    [8, "AS2", "pulse"], [10, "AS2", "pulse"], [12, "AS2", "pulse"], [14, "AS2", "pulse"],
    [3, "DS5", "tense"], [7, "E5", "tense"], [11, "DS5", "tense"], [15, "D5", "tense"],
    [0, "A1", "bass"], [8, "AS1", "bass"],
  ]},
  victory: { stepDur: 0.17, steps: 16, notes: [
    [0, "C3", "bass"], [8, "G2", "bass"],
    [0, "C4", "lead"], [2, "E4", "lead"], [4, "G4", "lead"], [6, "C5", "lead"],
    [8, "G4", "lead"], [10, "E5", "lead"], [12, "C5", "lead"],
  ]},
  gameover: { stepDur: 0.42, steps: 8, notes: [
    [0, "A2", "bass"], [2, "F2", "bass"], [4, "E2", "bass"], [6, "E2", "bass"],
    [0, "C4", "lead"], [4, "B3", "lead"],
  ]},
};

export default class Music {
  constructor(game) {
    this.game = game;
    this.ctx = null;
    this.master = null;
    this.volume = 0.5;
    this.muted = false;
    this.trackName = null;
    this.stepIdx = 0;
    this.nextTime = 0;
    this.interval = null;
    this.disabled = false;
  }

  ensure() {
    if (this.disabled) return false;
    try {
      if (!this.ctx) {
        const sm = this.game.sound;
        if (!sm || !sm.context) { this.disabled = true; return false; }
        this.ctx = sm.context;
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : this.volume;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === "suspended") this.ctx.resume();
      return true;
    } catch (e) {
      this.disabled = true;
      return false;
    }
  }

  tone(freq, when, { type, vol, dur }) {
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(vol, when + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    o.connect(g);
    g.connect(this.master);
    o.start(when);
    o.stop(when + dur + 0.05);
  }

  /** Switch track with a short cross-fade. */
  play(name) {
    if (!this.ensure() || this.trackName === name) return;
    const g = this.master.gain;
    const t = this.ctx.currentTime;
    const target = this.muted ? 0.0001 : this.volume;
    g.cancelScheduledValues(t);
    g.setValueAtTime(Math.max(g.value, 0.0001), t);
    g.linearRampToValueAtTime(0.0001, t + 0.3);
    setTimeout(() => {
      if (this.disabled) return;
      this.trackName = name;
      this.stepIdx = 0;
      this.nextTime = this.ctx.currentTime + 0.06;
      const t2 = this.ctx.currentTime;
      g.cancelScheduledValues(t2);
      g.setValueAtTime(0.0001, t2);
      g.linearRampToValueAtTime(target, t2 + 0.5);
    }, 310);
    if (!this.interval) this.interval = setInterval(() => this.tick(), 50);
  }

  tick() {
    if (!this.trackName || this.disabled) return;
    const tr = TRACKS[this.trackName];
    while (this.nextTime < this.ctx.currentTime + 0.16) {
      const s = this.stepIdx % tr.steps;
      for (const [st, note, voice] of tr.notes) {
        if (st === s) this.tone(NOTE[note], this.nextTime, VOICES[voice]);
      }
      this.nextTime += tr.stepDur;
      this.stepIdx++;
    }
  }

  applyVolume() {
    if (!this.master) return;
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.linearRampToValueAtTime(
      this.muted ? 0.0001 : this.volume, t + 0.1);
  }

  setVolume(v) {
    this.volume = Phaser.Math.Clamp(v, 0, 1);
    this.applyVolume();
    return this.volume;
  }

  toggleMute() {
    this.muted = !this.muted;
    this.applyVolume();
    return this.muted;
  }

  /** Tiny UI / feedback blips. */
  sfx(kind) {
    if (!this.ensure() || this.muted) return;
    const t = this.ctx.currentTime;
    const T = (f, dt, d, type = "triangle", v = 0.12) =>
      this.tone(f, t + dt, { type, vol: v, dur: d });
    switch (kind) {
      case "tick":    T(660, 0, 0.04); break;
      case "confirm": T(523, 0, 0.06); T(784, 0.07, 0.08); break;
      case "damage":  T(110, 0, 0.2, "sawtooth", 0.18); break;
      case "heal":    T(784, 0, 0.07); T(988, 0.08, 0.1); break;
      case "alarm":   T(988, 0, 0.09, "square", 0.1); T(660, 0.11, 0.09, "square", 0.1); break;
      case "repair":  T(523, 0, 0.06); T(659, 0.07, 0.06); T(784, 0.14, 0.09); break;
      case "death":   T(220, 0, 0.3, "sine", 0.2); T(147, 0.15, 0.45, "sine", 0.18); break;
    }
  }

  /** M = mute, "," / "." = volume. Call from each scene's create(). */
  bindKeys(scene) {
    const msg = (text) => scene.game.events.emit("message", text);
    scene.input.keyboard.on("keydown-M", () => {
      msg(this.toggleMute() ? "Música: silenciada" : "Música: activada");
    });
    scene.input.keyboard.on("keydown-COMMA", () => {
      msg(`Volumen: ${Math.round(this.setVolume(this.volume - 0.1) * 100)}%`);
    });
    scene.input.keyboard.on("keydown-PERIOD", () => {
      msg(`Volumen: ${Math.round(this.setVolume(this.volume + 0.1) * 100)}%`);
    });
  }
}
