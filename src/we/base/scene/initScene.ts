////////////////////////////////////////////////////////////////////////////////////////
//scen的语法糖
import { userFN, userPromiseFN } from "../const/coreConst";
import { Scene, sceneInputJson } from "./scene";
export async function initScene(input: sceneInputJson, userRun: userPromiseFN = async function () { }) {
    let scene = new Scene(input);
    await scene.init();
    scene.run(userRun);
    return scene;
}