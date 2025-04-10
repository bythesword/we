import { PerspectiveCamera, optionPerspProjection } from "../../../../src/we/base/camera/perspectiveCamera"
import { ArcballCameraControl } from "../../../../src/we/base/control/arcballCameraControl"
import { optionCamreaControl } from "../../../../src/we/base/control/cameracCntrol"
import { CameraActor, optionCameraActor } from "../../../../src/we/base/actor/cameraActor"

import { Scene, sceneInputJson } from "../../../../src/we/base/scene/scene"
import { Mesh } from "../../../../src/we/base/entity/mesh/mesh"
import { OneColorCube } from "../../../../src/we/base/geometry/oneColorCube"
import { VertexColorMaterial } from "../../../../src/we/base/material/Standard/vertexColorMatrial"
import { mat4, vec3 } from "wgpu-matrix"
import { initScene } from "../../../../src/we/base/scene/initScene"


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
  },
  stageSetting:  "world",
  multiCameraViewport:[
    {
      cameraActorName: "camera_0",
      viewport: {
        x: 0,
        y: 0,
        width: 1,
        height: 1
      },
      // backgroudColor:{red:1,green:1,blue:1,alpha:1},
    },
    {
      cameraActorName: "camera_1",
      viewport: {
        x: 0.5,
        y: 0.5,
        width: 0.5,
        height: 0.5
      },
      // backgroudColor:{red:0,green:0,blue:1,alpha:1},
    },
  ]
}
let scene = await initScene(input);
window.scene = scene;


//摄像机初始化参数
const cameraOption0: optionPerspProjection = {
  fov: (2 * Math.PI) / 5,
  aspect: scene.aspect,
  near: 0.1,
  far: 100,
  position: [0, 0, 3],
  lookAt: [0, 0, 0]
}
//实例化摄像机
let camera0 = new PerspectiveCamera(cameraOption0);

const cameraOption1: optionPerspProjection = {
  fov: (2 * Math.PI) / 5,
  aspect: scene.aspect,
  near: 0.1,
  far: 100,
  position: [0, 0, -5],
  lookAt: [0, 0, 0]
}
//实例化摄像机
let camera1 = new PerspectiveCamera(cameraOption1);



//摄像机控制器
const controlOption: optionCamreaControl = {
  window: window,
  canvas: scene.canvas,
  camera: camera0,
};

//实例化摄像机控制器
let control = new ArcballCameraControl(controlOption);

//摄像机角色参数
const ccOption0: optionCameraActor = {
  camera: camera0,
  control: control,
  name: "camera_0"
}
const ccOption1: optionCameraActor = {
  camera: camera1,
  // control: control,
  name: "camera_1"
}
//实例化摄像机角色
let actor0 = new CameraActor(ccOption0)
let actor1 = new CameraActor(ccOption1)
//增加摄像机角色到scene
await scene.addCameraActor(actor0)
await scene.addCameraActor(actor1)


////enities 初始化
//box
let boxGeometry = new OneColorCube();
//极简测试材质，red
let redMaterial = new VertexColorMaterial();
//box实体
let boxEntity = new Mesh(
  {
    geometry: boxGeometry,
    material: redMaterial,
    wireFrame: false,
    dynamicPostion: true,
    update: (scope, deltaTime, startTime, lastTime) => {
      // console.log("12");
      scope.matrix = mat4.identity();
      // mat4.translate(scope.matrix, vec3.fromValues(0, 0, 0), scope.matrix);
      const now = Date.now() / 1000;
      // mat4.rotate(
      //   scope.matrix,
      //   vec3.fromValues(Math.sin(now), Math.cos(now), 0),
      //   1,
      //   scope.matrix
      // );
      scope.rotate(vec3.fromValues(Math.sin(now), Math.cos(now), 0), 1);
      return true;
    },
  }
);
//增加实体到scene
await scene.add(boxEntity)

