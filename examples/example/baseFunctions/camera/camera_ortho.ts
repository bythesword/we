import { PerspectiveCamera, optionPerspProjection } from "../../../../src/we/base/camera/perspectiveCamera"
import { ArcballCameraControl } from "../../../../src/we/base/control/arcballCameraControl"
import { optionCamreaControl } from "../../../../src/we/base/control/cameracCntrol"
import { CameraActor, optionCameraActor } from "../../../../src/we/base/actor/cameraActor"

import { Scene, sceneInputJson } from "../../../../src/we/base/scene/scene"
import { ColorMaterial } from "../../../../src/we/base/material/simple/colorMaterial"
import { Mesh } from "../../../../src/we/base/entity/mesh/mesh"
import { OneColorCube } from "../../../../src/we/base/geometry/oneColorCube"
import { VertexColorMaterial } from "../../../../src/we/base/material/simple/vertexColorMatrial"
import { OrthographicCamera, optionOrthProjection } from "../../../../src/we/base/camera/orthographicCamera"


declare global {
  interface Window {
    scene: any
    DC: any
  }
}
let input: sceneInputJson = {
  canvas: "render",
  // renderPassSetting:{color:{clearValue:[0.5,0.5,0.5,1]}}//ok
  color: {
    red: 0.1,
    green: 0.1,
    blue: 0.1,
    alpha: 1
  }
}
let scene = new Scene(input);
await scene.init();

window.scene = scene;


const cameraOption: optionOrthProjection = {
  left: -2,
  right: 2,
  top: 2,
  bottom: -2,
  near: 0.1,
  far: 100,
  position: [0, 0, 5],
  lookAt: [0, 0, 0]
}
let camera = new OrthographicCamera(cameraOption);


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


////enities 初始化
//box
let boxGeometry = new OneColorCube();
//极简测试材质，red
let redMaterial = new VertexColorMaterial;
//box实体
let boxEntity = new Mesh(
  {
    geometry: boxGeometry,
    material: redMaterial,
    wireFrame: false,
  }
);
//增加实体到scene
scene.add(boxEntity)


//运行场景
scene.run()