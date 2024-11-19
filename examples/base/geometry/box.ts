/**
 * step
 * 1、合批shader，const
 * 2、shader MVP + 调用原来shader的entryPoint
 * 3、Camera Actor ，
 *  bind camera
 *  bind control
 * 
 * demo
 * 1、shader const + 合批 + 单位矩阵的MVP  
 *V  A、MVP单位矩阵  
 *V  B、uniform bind group  0，JS
 *V  C、system WGSL string  group 0  (预定各种变量名称)
 *V不适用  D、const WGSL测试   :这个只能是数值
 *V  E、合并WGSL，增加entryPoint的新入口的调用
 * 
 * 
* 
 * 
 * 2、绑定Actor ，绑定camera，绑定control，生成MVP（一次） 
 * A、CameraActor 绑定cemera，init or bind
 *    * 生成CameraActor的 camera的MVP，指定位置的，比如（0,0,5)
 * B、CameraActor bind camearControl ,init or bind
 * C、Scene 的Actor 逻辑，顶级数组 以及 defaultActor
 * D、Scene 绑定 Actor
 * 
 * 
 * 
 * （本页面）
 *  
 * 3、帧循环+ control交互=>摄像机MVP
 */
import { PerspectiveCamera, optionPerspProjection } from "../../../src/we/base/camera/perspectiveCamera"
import { ArcballCameraControl } from "../../../src/we/base/control/arcballCameraControl"
import { CamreaControl, optionCamreaControl } from "../../../src/we/base/control/cameracCntrol"
import { CameraActor, optionCameraActor } from "../../../src/we/base/actor/cameraActor"

import { Scene, sceneInputJson } from "../../../src/we/base/scene/scene"
import { DrawCommand, drawOption } from "../../../src/we/base/command/DrawCommand"
import { stageOne } from "../../../src/we/base/stage/baseStage"

import { BoxGeometry } from "../../../src/we/base/geometry/boxGeometry"

declare global {
  interface Window {
    scene: any
    DC: any
    box: any
  }
}
let input: sceneInputJson = { canvas: "render" }
let scene = new Scene(input);
await scene.init();

window.scene = scene;


const cameraOption: optionPerspProjection = {
  fov: (2 * Math.PI) / 5,
  aspect: scene.aspect,
  near: 0.0001,
  far: 100,
  position: [0, 0, 5],
  lookAt: [0, 0, 0]
}
let camera = new PerspectiveCamera(cameraOption);

const controlOption: optionCamreaControl = {
  window: window,
  canvas: scene.canvas,
  camera: camera,
};

let control = new ArcballCameraControl(controlOption);


const ccOption: optionCameraActor = {
  camera: camera,
  control: control,
  name: "camera_1"
}

let actor = new CameraActor(ccOption)
// console.log(actor)
scene.addCameraActor(actor, true)
// scene.updateSystemUniformBuffer();

let box = new BoxGeometry();
console.log(box)
window.box = box;
