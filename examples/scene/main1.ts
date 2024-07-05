import { Scene, sceneInputJson } from "../../src/we/base/scene/scene"

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
