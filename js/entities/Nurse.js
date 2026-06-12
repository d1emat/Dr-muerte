import NPC from "./NPC.js";
import { NURSE_ROUTE } from "../world/blueprint.js";

export default class Nurse extends NPC {
  constructor(scene) {
    super(scene, NURSE_ROUTE[0][0], NURSE_ROUTE[0][1], "nurse", NURSE_ROUTE,
          { speed: 42, pauseMs: 1600 });
  }
}
