import { ITEM_DATA } from "../config.js";

export default class Inventory {
  constructor(scene) {
    this.scene = scene;
    this.slots = [null, null, null, null];
    this.selected = 0;
  }

  emit() {
    this.scene.game.events.emit("inventory", this.slots.slice(), this.selected);
  }

  add(itemId) {
    const i = this.slots.indexOf(null);
    if (i < 0) return false;
    this.slots[i] = itemId;
    this.emit();
    return true;
  }

  select(i) {
    this.selected = i;
    this.emit();
  }

  selectedItem() {
    return this.slots[this.selected];
  }

  consumeSelected() {
    this.slots[this.selected] = null;
    this.emit();
  }

  static nameOf(itemId) {
    return ITEM_DATA[itemId] ? ITEM_DATA[itemId].name : itemId;
  }
}
