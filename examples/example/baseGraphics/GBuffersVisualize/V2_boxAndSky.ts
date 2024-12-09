import { PerspectiveCamera, optionPerspProjection } from "../../../../src/we/base/camera/perspectiveCamera"
import { optionCamreaControl } from "../../../../src/we/base/control/cameracCntrol"
import { CameraActor, optionCameraActor } from "../../../../src/we/base/actor/cameraActor"

import { Scene, sceneInputJson } from "../../../../src/we/base/scene/scene"
import { Mesh } from "../../../../src/we/base/entity/mesh/mesh"
import { OneColorCube } from "../../../../src/we/base/geometry/oneColorCube"
import { vec3 } from "wgpu-matrix"
import { CubeSkyMaterial } from "../../../../src/we/base/material/sky/cubeSkyMaterial"
import { WASDCameraControl } from "../../../../src/we/base/control/wasdCameraControl"
import { PhongMaterial } from "../../../../src/we/base/material/Standard/phongMaterial"
import { SpotLight } from "../../../../src/we/base/light/SpotLight"
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
    red: 0.5,
    green: 0.5,
    blue: 0.5,
    alpha: 1
  },
  // reversedZ: true,
}


let scene = await initScene(input);
window.scene = scene;
scene.setGBuffersVisualize({
  enable: true,
  layout: {
    name: "depth",
    single: true,
  }
});
// scene.setGBuffersVisualize({
//   enable: true,
//   layout: {
//     name: "default",
//     single: false,
//   }
// });

//摄像机初始化参数
const cameraOption: optionPerspProjection = {
  fov: (2 * Math.PI) / 5,
  aspect: scene.aspect,
  near: 0.1,
  far: 2000,
  position: [0, 0, 3.],
  lookAt: [0, 0, 10.]
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


////sky 初始化
let skyGeometry = new OneColorCube();
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
let sky = new Mesh(
  {
    name: "sky",
    scale: [100, 100, 100],
    geometry: skyGeometry,
    material: cubeMaterial,
    wireFrame: false,
    dynamicPostion: true,
    cullmode: "front",

  }
);
scene.add(sky, "Sky")


////enities 初始化
//box
let boxGeometry = new OneColorCube();
//极简测试材质，red
// let material = new VertexColorMaterial();
let material = new PhongMaterial({
  color: { red: 0, green: 1, blue: 0, alpha: 1 },
  metalness: 1,
  texture: {
    texture: "/examples/resource/images/box/container2.png",
    specularTexture: "/examples/resource/images/box/container2_specular.png",
  }
});
//box实体
let boxEntity = new Mesh(
  {
    name: "box",
    geometry: boxGeometry,
    material: material,
    wireFrame: false,
    dynamicPostion: true,
    position: [0, 0, 0],
    update: (scope, deltaTime, startTime, lastTime) => {
      const now = Date.now() / 1000;
      scope.rotate(vec3.fromValues(Math.sin(now), Math.cos(now), 0), 1);
      return true;
    },
  }
);
//增加实体到scene
scene.add(boxEntity)
let spotLight = new SpotLight(
  {
    direction: [0.0, 0.0, -1.0],
    position: [0, 0, 12],
    intensity: 22.0,
    angle: 29 / 180 * Math.PI,//12.5
    angleOut: 38 / 180 * Math.PI //17.5
  }
);

scene.addLight(spotLight);
//运行场景
