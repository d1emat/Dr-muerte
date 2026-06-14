/**
 * Keyboard navigation for menus. Register buttons made with makeButton();
 * arrows / WASD move a shared focus highlight, Enter/Space activate the
 * focused button. Mouse hover updates the same focus, so both work together.
 * Falls back gracefully: if anything here fails, mouse clicks still work.
 */
export default class MenuNav {
  constructor(scene) {
    this.scene = scene;
    this.buttons = [];
    this.index = -1;
    this.enabled = true;           // set false to suspend (e.g. modal open)
    this._handlers = [];

    const kb = scene.input.keyboard;
    const reg = (key, fn) => { kb.on(key, fn); this._handlers.push([key, fn]); };
    const prev = () => this.move(-1);
    const next = () => this.move(1);
    reg("keydown-UP", prev);
    reg("keydown-DOWN", next);
    reg("keydown-LEFT", prev);
    reg("keydown-RIGHT", next);
    reg("keydown-W", prev);
    reg("keydown-S", next);
    reg("keydown-A", prev);
    reg("keydown-D", next);
    reg("keydown-ENTER", () => this.activate());

    scene.events.once("shutdown", () => this.destroy());
    scene.events.once("destroy", () => this.destroy());
  }

  /** Register a button (or several). Returns the first for chaining. */
  add(btn) {
    if (!btn) return btn;
    btn._nav = this;
    this.buttons.push(btn);
    if (this.index < 0) this.setIndex(0);
    return btn;
  }

  setIndex(i) {
    if (!this.buttons.length) return;
    this.index = (i + this.buttons.length) % this.buttons.length;
    this.buttons.forEach((b, k) => b.setFocus(k === this.index));
  }

  move(d) {
    if (!this.enabled || !this.buttons.length) return;
    this.setIndex((this.index < 0 ? 0 : this.index) + d);
  }

  focus(btn) {
    if (!this.enabled) return;
    const i = this.buttons.indexOf(btn);
    if (i >= 0) this.setIndex(i);
  }

  activate() {
    if (!this.enabled) return;
    const b = this.buttons[this.index];
    if (b) b.activate();
  }

  destroy() {
    const kb = this.scene.input.keyboard;
    if (kb) for (const [key, fn] of this._handlers) kb.off(key, fn);
    this._handlers = [];
    this.buttons = [];
  }
}
