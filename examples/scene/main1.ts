import { Scene, sceneInputJson } from "../../src/we/base/scene/scene"
import {
  DrawCommand,
  primitiveOption,
  drawModeIndexed,
  drawMode,
  indexBuffer,
  unifromGroup,
  uniformEntries,
  uniformBufferPart,
  fsPart,
  vsPart,
  vsAttributes
} from "../../src/we/base/command/DrawCommand"
declare global {
  interface Window {
    scene: any
  }
}
let input: sceneInputJson = { canvas: "render" }
let scene = new Scene(input);
scene.init();

window.scene = scene;

scene.requestAnimationFrame();
