import NPC from "./NPC.js";
import { NURSE_ROUTE } from "../world/blueprint.js";

export default class Nurse extends NPC {
  constructor(scene, route = NURSE_ROUTE, opts = { speed: 42, pauseMs: 1600 }) {
    super(scene, route[0][0], route[0][1], "nurse", route, opts);
  }
}
