export default class AudioManager {
  constructor(game) {
    this.game = game;
    this.sound = game.sound;
    this.settingsKey = "ft_audio_settings";
    this.enabled = true;
    this.muted = false;
    this.volume = 0.6;
    this.sfxVolume = 0.8;
    this.currentKey = null;
    this.tracks = {};
    this.fadeJobs = [];
    this.fadeTicker = null;
    this.created = false;
    this.loadSettings();
  }

  preload(scene) {
    scene.load.audio("backgroundMusic", [
      { url: "Music/background-music.mp3", type: "mp3" },
    ]);
    scene.load.audio("idleMusic", [
      { url: "Music/idle.mp3", type: "mp3" },
    ]);
    scene.load.audio("chaseMusic", [
      { url: "Music/chase.mp3", type: "mp3" },
    ]);
  }

  create(scene) {
    if (this.created) return;
    this.scene = scene;
    this.tracks.menu = scene.sound.add("backgroundMusic", { loop: true, volume: 0 });
    this.tracks.idle = scene.sound.add("idleMusic", { loop: true, volume: 0 });
    this.tracks.chase = scene.sound.add("chaseMusic", { loop: true, volume: 0 });
    this.tracks.background = scene.sound.add("backgroundMusic", { loop: true, volume: 0 });
    this.created = true;
    this.applyVolume();
    this.installUnlock();
  }

  /**
   * Browsers block audio until the first user gesture, so a track started on
   * the boot/menu screen stays silent. On the first gesture (or Phaser's
   * 'unlocked' event) we resume the audio context and (re)start the wanted
   * track cleanly so the music actually plays.
   */
  installUnlock() {
    // Phaser's SoundManager emits 'unlocked' on the first user gesture once
    // the audio context is allowed to start. The per-scene fallback in
    // bindKeys() (scene.input) covers the rest. Note: game.input (the global
    // InputManager) is NOT an event emitter for pointer/keys, so don't use it.
    if (this.sound.locked) {
      this.sound.once("unlocked", () => this.resumePlayback());
    }
  }

  resumePlayback() {
    if (this._resumed) return;
    this._resumed = true;
    const ctx = this.sound && this.sound.context;
    if (ctx && ctx.state === "suspended") ctx.resume().catch(() => {});
    const key = this.currentKey || "menu";
    this.stopAllTweens();
    for (const t of Object.values(this.tracks)) {
      if (t && t.isPlaying) t.stop();
    }
    if (this.enabled && !this.muted) {
      const track = this.ensureTrack(key);
      const wanted = key === "menu" ? 0.55 : this.volume;
      if (track) track.play({ loop: true, volume: Math.min(this.volume, wanted) });
      this.currentKey = key;
    }
  }

  get effectiveVolume() {
    return this.enabled && !this.muted ? this.volume : 0;
  }

  saveSettings() {
    try {
      localStorage.setItem(this.settingsKey, JSON.stringify({
        volume: this.volume,
        sfxVolume: this.sfxVolume,
        enabled: this.enabled,
        muted: this.muted,
      }));
    } catch (e) {
      // ignore storage errors
    }
  }

  loadSettings() {
    try {
      const raw = localStorage.getItem(this.settingsKey);
      const data = raw ? JSON.parse(raw) : null;
      if (data) {
        this.volume = typeof data.volume === "number" ? data.volume : this.volume;
        this.sfxVolume = typeof data.sfxVolume === "number" ? data.sfxVolume : this.sfxVolume;
        this.enabled = typeof data.enabled === "boolean" ? data.enabled : this.enabled;
        this.muted = typeof data.muted === "boolean" ? data.muted : this.muted;
      }
    } catch (e) {
      // ignore parse errors
    }
  }

  stopAllTweens() {
    this.fadeJobs.length = 0;
    if (this.fadeTicker) {
      clearInterval(this.fadeTicker);
      this.fadeTicker = null;
    }
  }

  fadeTrack(sound, targetVolume, duration = 500, onComplete) {
    if (!sound) {
      if (onComplete) onComplete();
      return;
    }
    const startVolume = sound.volume || 0;
    const startTime = performance.now();
    const job = {
      sound,
      startVolume,
      targetVolume,
      duration,
      startTime,
      onComplete,
    };
    if (!sound.isPlaying) {
      sound.play({ loop: sound.loop ?? true, volume: 0 });
    }
    this.fadeJobs.push(job);
    if (!this.fadeTicker) {
      this.fadeTicker = setInterval(() => this.advanceFadeJobs(), 16);
    }
  }

  advanceFadeJobs() {
    const now = performance.now();
    for (let i = this.fadeJobs.length - 1; i >= 0; i--) {
      const job = this.fadeJobs[i];
      const elapsed = Math.min(now - job.startTime, job.duration);
      const progress = job.duration > 0 ? elapsed / job.duration : 1;
      const newVolume = job.startVolume + (job.targetVolume - job.startVolume) * progress;
      job.sound.setVolume(newVolume);
      if (progress >= 1) {
        if (job.targetVolume <= 0 && job.sound.isPlaying) {
          job.sound.stop();
        }
        if (job.onComplete) job.onComplete();
        this.fadeJobs.splice(i, 1);
      }
    }
    if (this.fadeJobs.length === 0 && this.fadeTicker) {
      clearInterval(this.fadeTicker);
      this.fadeTicker = null;
    }
  }

  ensureTrack(name) {
    if (!this.created) return null;
    return this.tracks[name] || null;
  }

  playMenuMusic() {
    if (!this.created) return;
    this.transitionTo("menu", { loop: true, targetVolume: 0.55 });
  }

  playIdleMusic() {
    if (!this.created) return;
    this.transitionTo("idle", { loop: true, targetVolume: this.volume });
  }

  playChaseMusic() {
    if (!this.created) return;
    this.transitionTo("chase", { loop: true, targetVolume: this.volume });
  }

  playBackgroundMusic(loop = false, volume = 0.35) {
    if (!this.created) return;
    const track = this.ensureTrack("background");
    if (!track) return;
    this.stopMusic();
    track.stop();
    track.play({ loop, volume: 0 });
    this.currentKey = "background";
    this.fadeTrack(track, this.enabled && !this.muted ? Math.min(volume, this.volume) : 0, 600);
  }

  stopMusic() {
    if (!this.created) return;
    this.stopAllTweens();
    for (const track of Object.values(this.tracks)) {
      if (track && track.isPlaying) track.stop();
    }
    this.currentKey = null;
  }

  fadeOut(duration = 500) {
    if (!this.created) return;
    const current = this.ensureTrack(this.currentKey);
    if (!current || !current.isPlaying) return;
    this.fadeTrack(current, 0, duration, () => current.stop());
  }

  fadeIn(duration = 500) {
    if (!this.created) return;
    const current = this.ensureTrack(this.currentKey);
    if (!current) return;
    if (!current.isPlaying) current.play({ loop: current.loop ?? true, volume: 0 });
    this.fadeTrack(current, this.effectiveVolume, duration);
  }

  transitionTo(key, { loop = true, targetVolume = this.volume } = {}) {
    if (!this.enabled) {
      this.stopMusic();
      return;
    }
    if (this.currentKey === key) return;
    const next = this.ensureTrack(key);
    if (!next) return;
    this.stopAllTweens();
    const fromTrack = this.ensureTrack(this.currentKey);
    const effective = this.enabled && !this.muted ? Math.min(this.volume, targetVolume) : 0;
    if (fromTrack && fromTrack.isPlaying && fromTrack !== next) {
      this.fadeTrack(fromTrack, 0, 400, () => {
        if (fromTrack.isPlaying) fromTrack.stop();
      });
    }
    if (next.isPlaying) {
      next.setVolume(0);
    } else {
      next.play({ loop, volume: 0 });
    }
    this.currentKey = key;
    this.fadeTrack(next, effective, 600);
  }

  setVolume(value) {
    this.volume = Phaser.Math.Clamp(value, 0, 1);
    this.applyVolume();
    this.saveSettings();
    return this.volume;
  }

  applyVolume() {
    const effective = this.effectiveVolume;
    for (const track of Object.values(this.tracks)) {
      if (track && track.isPlaying) {
        track.setVolume(effective);
      }
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    this.applyVolume();
    this.saveSettings();
    return this.muted;
  }

  toggleEnabled() {
    this.enabled = !this.enabled;
    if (!this.enabled) {
      this.stopMusic();
    } else if (this.currentKey) {
      const current = this.ensureTrack(this.currentKey);
      if (current) {
        current.play({ loop: current.loop, volume: 0 });
        this.fadeTrack(current, this.effectiveVolume, 600);
      }
    }
    this.saveSettings();
    return this.enabled;
  }

  sfx(kind) {
    if (!this.sound || this.muted) return;
    const ctx = this.sound.context;
    if (!ctx) return;
    const now = ctx.currentTime;
    const tone = (freq, dt, dur, type = "triangle", vol = 0.12) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now + dt);
      gain.gain.exponentialRampToValueAtTime(vol * this.sfxVolume, now + dt + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + dt + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + dt);
      osc.stop(now + dt + dur + 0.05);
    };
    switch (kind) {
      case "tick":    tone(660, 0, 0.04); break;
      case "confirm": tone(523, 0, 0.06); tone(784, 0.07, 0.08); break;
      case "damage":  tone(110, 0, 0.2, "sawtooth", 0.18); break;
      case "heal":    tone(784, 0, 0.07); tone(988, 0.08, 0.1); break;
      case "alarm":   tone(988, 0, 0.09, "square", 0.1); tone(660, 0.11, 0.09, "square", 0.1); break;
      case "repair":  tone(523, 0, 0.06); tone(659, 0.07, 0.06); tone(784, 0.14, 0.09); break;
      case "death":   tone(220, 0, 0.3, "sine", 0.2); tone(147, 0.15, 0.45, "sine", 0.18); break;
    }
  }

  bindKeys(scene) {
    // first interaction in any scene resumes the audio context + (re)starts
    // the wanted track, so the music actually plays despite autoplay policy.
    scene.input.once("pointerdown", () => this.resumePlayback());
    if (scene.input.keyboard) {
      scene.input.keyboard.once("keydown", () => this.resumePlayback());
    }
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

  setSfxVolume(value) {
    this.sfxVolume = Phaser.Math.Clamp(value, 0, 1);
    this.saveSettings();
    return this.sfxVolume;
  }

  play(name) {
    switch (name) {
      case "menu": return this.playMenuMusic();
      case "gameplay": return this.playIdleMusic();
      case "alert": return this.playChaseMusic();
      case "gameover": return this.playBackgroundMusic(false, 0.25);
      case "victory": return this.playBackgroundMusic(false, 0.25);
      default: return null;
    }
  }
}
