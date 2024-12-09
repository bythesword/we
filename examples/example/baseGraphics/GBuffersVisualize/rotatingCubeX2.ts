import { PerspectiveCamera, optionPerspProjection } from "../../../../src/we/base/camera/perspectiveCamera"
import { ArcballCameraControl } from "../../../../src/we/base/control/arcballCameraControl"
import { optionCamreaControl } from "../../../../src/we/base/control/cameracCntrol"
import { CameraActor, optionCameraActor } from "../../../../src/we/base/actor/cameraActor"

import { Scene, sceneInputJson } from "../../../../src/we/base/scene/scene" 
import { Mesh } from "../../../../src/we/base/entity/mesh/mesh"
import { OneColorCube } from "../../../../src/we/base/geometry/oneColorCube"
import { VertexColorMaterial } from "../../../../src/we/base/material/Standard/vertexColorMatrial"
import { mat4, vec3 } from "wgpu-matrix"


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
    red: 0.0,
    green: 0.0,
    blue: 1.0,
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
  near: 1,
  far: 10,
  position: [0, 0, 3],
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


////enities 初始化
//box
let boxGeometry = new OneColorCube();
//极简测试材质，
let redMaterial = new VertexColorMaterial( );
//box实体
let boxEntity1 = new Mesh(
  {
    geometry: boxGeometry,
    material: redMaterial,
    wireFrame: false,
    dynamicPostion: true,
    position:[-2,0,-3],
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
      scope.translation(scope.input.position);
      scope.rotate(vec3.fromValues(Math.sin(now), Math.cos(now), 0), 1);
      
      return true;
    },
  }
);
let boxEntity2 = new Mesh(
  {
    geometry: boxGeometry,
    material: redMaterial,
    wireFrame: false,
    dynamicPostion: true,
    position:[2,0,-3],
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
      scope.rotate(vec3.fromValues(Math.cos(now), Math.sin(now), 0), 1);
      scope.translation(scope.input.position);      
      
      return true;
    },
  }
);
//增加实体到scene
scene.add(boxEntity1)
scene.add(boxEntity2)


//运行场景
scene.run()
scene.setGBuffersVisualize({
  enable: true,
  layout: {
    name: "depth",
    single: true,
  }
});