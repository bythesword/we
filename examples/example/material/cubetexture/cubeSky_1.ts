import { PerspectiveCamera, optionPerspProjection } from "../../../../src/we/base/camera/perspectiveCamera"
import { ArcballCameraControl } from "../../../../src/we/base/control/arcballCameraControl"
import { optionCamreaControl } from "../../../../src/we/base/control/cameracCntrol"
import { CameraActor, optionCameraActor } from "../../../../src/we/base/actor/cameraActor"

import { Scene, sceneInputJson } from "../../../../src/we/base/scene/scene"
import { Mesh } from "../../../../src/we/base/entity/mesh/mesh"
import { OneColorCube } from "../../../../src/we/base/geometry/oneColorCube"
import { VertexColorMaterial } from "../../../../src/we/base/material/Standard/vertexColorMatrial"
import { mat4, vec3 } from "wgpu-matrix"
import { CubeSkyMaterial } from "../../../../src/we/base/material/sky/cubeSkyMaterial"
import { WASDCameraControl } from "../../../../src/we/base/control/wasdCameraControl"



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
    red: 0.5,
    green: 0.5,
    blue: 0.5,
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
  near: 0.1,
  far: 2000,
  position: [0, 0, 10.],
  lookAt: [0, 0, 0.]
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
let control = new WASDCameraControl(controlOption);
// let control = new ArcballCameraControl(controlOption);

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

let cubeMaterial = new CubeSkyMaterial({
  cubeTexture: {
    texture: [
      '/examples/resource/images/cubemap/posx.jpg',
      '/examples/resource/images/cubemap/negx.jpg',
      '/examples/resource/images/cubemap/posy.jpg',
      '/examples/resource/images/cubemap/negy.jpg',
      '/examples/resource/images/cubemap/posz.jpg',
      '/examples/resource/images/cubemap/negz.jpg',
    ],
  }
})
//box实体
let boxEntity = new Mesh(
  {
    scale: [100, 100, 100],
    geometry: boxGeometry,
    material: cubeMaterial,
    wireFrame: false,
    dynamicPostion: true,
    cullmode: "front",
    name: "sky"
  }
);
//增加实体到scene
await scene.add(boxEntity)


//运行场景
scene.run()
