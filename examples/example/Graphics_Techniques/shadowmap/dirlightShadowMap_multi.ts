import { PerspectiveCamera, optionPerspProjection } from "../../../../src/we/base/camera/perspectiveCamera"
import { ArcballCameraControl } from "../../../../src/we/base/control/arcballCameraControl"
import { optionCamreaControl } from "../../../../src/we/base/control/cameracCntrol"
import { CameraActor, optionCameraActor } from "../../../../src/we/base/actor/cameraActor"

import { sceneInputJson } from "../../../../src/we/base/scene/scene"
import { SphereGeometry } from "../../../../src/we/base/geometry/sphereGeometry"
import { Mesh } from "../../../../src/we/base/entity/mesh/mesh"

import { PhongLightsMaterial } from "../../../../src/we/base/material/Standard/lightsphongMaterial"
import { DirectionalLight } from "../../../../src/we/base/light/DirectionalLight"
import { initScene } from "../../../../src/we/base/scene/initScene"
import { PlaneGeometry } from "../../../../src/we/base/geometry/planeGeomertry"
import { vec3 } from "wgpu-matrix"

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
  ambientLight: {
    color: {
      red: 1,
      green: 1,
      blue: 1
    },
    intensity: 0.13
  },
  stageSetting: "world"

}
let scene = await initScene(input);
window.scene = scene;


//摄像机初始化参数
const cameraOption: optionPerspProjection = {
  fov: (2 * Math.PI) / 5,
  aspect: scene.aspect,
  near: 0.1,
  far: 30,
  position: [0, 10, 10],
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
let Geometry = new SphereGeometry({
  radius: 1,
  widthSegments: 128,
  heightSegments: 128
});
//极简测试材质，red
let redMaterial = new PhongLightsMaterial(
  {
    color: { red: 0, green: 0.9, blue: 1, alpha: 1 },
    Shininess: 32,
    metalness: 0.1,
    roughness: 1,
  });
//box实体
let boxEntity = new Mesh(
  {
    geometry: Geometry,
    material: redMaterial,
    // wireFrameColor: { red: 1, green: 1, blue: 1, alpha: 1 }
    wireFrame: false,
    // position:vec3.create(1,0,0),
    // scale:[2,2,1],
    // rotate:{
    //   axis:[1,0,0],
    //   angleInRadians:0.15*Math.PI
    // },
  }
);
//增加实体到scene
await scene.add(boxEntity)



let planeGeometry = new PlaneGeometry({
  width: 10,
  height: 10
});
let groundMaterial = new PhongLightsMaterial(
  {
    color: { red: 0.85, green: 0.85, blue: 0.85, alpha: 1 },
    Shininess: 32,
    metalness: 0.10,
    roughness: 1,
  });

let planeEntity = new Mesh({
  geometry: planeGeometry,
  material: groundMaterial,
  position: [0, -1, 0],
  rotate: {
    axis: [1, 0, 0],
    angleInRadians: -Math.PI / 2,
  },
  wireFrame: false,
  cullmode: "none"
});
await scene.add(planeEntity);


let dirLight: DirectionalLight = new DirectionalLight(
  {
    intensity: .520,
    direction: [1.0, 1.0, -1.0],
    shadow: true,
    update: (scope: any, deltaTime: number, startTime: number, lastTime: number, data?: any) => {
      let dir = scope.getDirection();
      const now = Date.now() / 2000; 
      scope.values.direction=vec3.fromValues(Math.sin(now), 1,Math.cos(now));
      return true
    },
  }
);

scene.addLight(dirLight);

let dirLight2: DirectionalLight = new DirectionalLight(
  {
    intensity: .520,
    direction: [0.0, 0.50, 1.0],
    shadow: true,
    update: (scope: any, deltaTime: number, startTime: number, lastTime: number, data?: any) => {
      let dir = scope.getDirection();
      const now = Date.now() / 1000; 
      scope.values.direction=vec3.fromValues(Math.sin(now), 1,Math.cos(now));
      return true
    },
  }
);
scene.addLight(dirLight2);







// scene.setGBuffersVisualize({
//   enable: true,
//   forOtherDepth: {
//     depthTextureView: scene.lightsManagement.shadowMapTexture.createView(
//       {
//         label: "lights management shadowMapTexture array 可视化",
//         dimension: "2d",
//         //  dimension:  "2d-array",
//         baseArrayLayer: 1,
//       }
//     ),
//   }
// });