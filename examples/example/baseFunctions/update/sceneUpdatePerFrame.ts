import { PerspectiveCamera, optionPerspProjection } from "../../../../src/we/base/camera/perspectiveCamera"
import { ArcballCameraControl } from "../../../../src/we/base/control/arcballCameraControl"
import { optionCamreaControl } from "../../../../src/we/base/control/cameracCntrol"
import { CameraActor, optionCameraActor } from "../../../../src/we/base/actor/cameraActor"

import { Scene, sceneInputJson } from "../../../../src/we/base/scene/scene"
import { Mesh } from "../../../../src/we/base/entity/mesh/mesh"
import { OneColorCube } from "../../../../src/we/base/geometry/oneColorCube"
import { VertexColorMaterial } from "../../../../src/we/base/material/Standard/vertexColorMatrial"
import { mat4, vec3 } from "wgpu-matrix"
import { DrawCommand, DrawOptionOfCommand } from "../../../../src/we/base/command/DrawCommand"


declare global {
  interface Window {
    scene: any
    DC: any
  }
}

const backgroudColor = 0.5;
let input: sceneInputJson = {
  canvas: "render",
  // renderPassSetting:{color:{clearValue:[0.5,0.5,0.5,1]}}//ok
  color: {
    red: backgroudColor,
    green: backgroudColor,
    blue: backgroudColor,
    alpha: 1
  }
}
let scene = new Scene(input);
await scene.init();

window.scene = scene;


//摄像机初始化参数
const cameraOption: optionPerspProjection = {
  fov: (2 * Math.PI) / 5,
  aspect: scene.aspect,
  near: 0.0001,
  far: 100,
  position: [0, 0, 5],
  lookAt: [0, 0, 0]
}
//实例化摄像机
let camera = new PerspectiveCamera(cameraOption);


//摄像机控制器
const controlOption: optionCamreaControl = {
  window: window,
  canvas: scene.canvas,
  camera: camera,
};
//实例化摄像机控制器
let control = new ArcballCameraControl(controlOption);

//摄像机角色参数
const ccOption: optionCameraActor = {
  camera: camera,
  control: control,
  name: "camera_1"
}
//实例化摄像机角色
let actor = new CameraActor(ccOption)
//增加摄像机角色到scene
scene.addCameraActor(actor, true)

 //用户自定义更新（每帧）
scene.addUserDefine({
  call: function (scope: any): any {
    console.log(scope.clock.last);
    return true;
  },
  name: "console print time",
  state: true
});




//运行场景
scene.run()
