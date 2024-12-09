////////////////////////////////////////////////////////////////////////////////////////
//scen的语法糖
import { Scene, sceneInputJson } from "./scene";
export async function initScene(input: sceneInputJson) {
    let scene = new Scene(input);
    await scene.init();
    scene.run();
    return scene;
}