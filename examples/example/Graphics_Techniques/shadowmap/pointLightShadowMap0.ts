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
import { PointLight } from "../../../../src/we/base/light/pointLight"
import { vec3 } from "wgpu-matrix"
import { ColorMaterial } from "../../../../src/we/base/material/Standard/colorMaterial"
import { OneColorCube } from "../../../../src/we/base/geometry/oneColorCube"
import { BoxGeometry } from "../../../../src/we/base/geometry/boxGeometry"

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
  far: 60,
  position: [0, 0, 10],
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
 
////////////////////////////////////////////////
////6个实体 enities 初始化
//box
let sphereGeometry = new SphereGeometry({
  radius: 1,
  widthSegments: 128,
  heightSegments: 128
});
let boxGeometry = new BoxGeometry({
  width: 2,
  height: 2,
  depth: 2
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
let sphereEntityNegZ = new Mesh(
  {
    geometry: sphereGeometry,
    material: redMaterial,
    // wireFrameColor: { red: 1, green: 1, blue: 1, alpha: 1 }
    wireFrame: false,
    position: vec3.create(0, 0, -3),
  }
);
//增加实体到scene
await scene.add(sphereEntityNegZ)

let sphereEntityNegY = new Mesh(
  {
    geometry: sphereGeometry,
    material: redMaterial,
    wireFrame: false,
    position: vec3.create(0, -3, 0),
  }
);
//增加实体到scene
await scene.add(sphereEntityNegY)

let sphereEntityNegX = new Mesh(
  {
    geometry: sphereGeometry,
    material: redMaterial,
    wireFrame: false,
    position: vec3.create(-3, 0, 0),
  }
);
//增加实体到scene
await scene.add(sphereEntityNegX)
let sphereEntityPosY = new Mesh(
  {
    geometry: boxGeometry,
    material: redMaterial,
    wireFrame: false,
    position: vec3.create(0, 3, 0),
    scale: [0.5, 0.5, 0.5],
  }
);
//增加实体到scene
await scene.add(sphereEntityPosY)

let sphereEntityPosX = new Mesh(
  {
    geometry: boxGeometry,
    material: redMaterial,
    wireFrame: false,
    position: vec3.create(3, 0, 0),
    scale: [0.5, 0.5, 0.5],
  }
);
//增加实体到scene
await scene.add(sphereEntityPosX)

let sphereEntityPosZ = new Mesh(
  {
    geometry: boxGeometry,
    material: redMaterial,
    wireFrame: false,
    position: vec3.create(0, 0, 3),
    scale: [0.5, 0.5, 0.5],
  }
);
//增加实体到scene
await scene.add(sphereEntityPosZ)


////////////////////////////////////////////////////
//实体光源
let light1: PointLight = new PointLight(
  {
    position: [0.0, 0.0, 0.0],
    intensity: 3.0,
    shadow: true,
  }
);
scene.addLight(light1);

let lightMaterial = new ColorMaterial(
  {
    color: { red: 1, green: 1, blue: 1, alpha: 1 },
  });
//light实体
let light1Entity = new Mesh(
  {
    geometry: sphereGeometry,
    material: lightMaterial,
    // wireFrameColor: { red: 1, green: 1, blue: 1, alpha: 1 }
    wireFrame: false,
    position: vec3.create(0, 0, 0),
    scale: [0.1, 0.1, 0.1],
    // rotate:{
    //   axis:[1,0,0],
    //   angleInRadians:0.15*Math.PI
    // },
  }
);
//增加实体到scene
await scene.add(light1Entity)

/////////////////////////////////////////////////////////
// 6个plane

// let boxGeometry = new OneColorCube();
// let cubeMaterial = new PhongLightsMaterial(
//   {
//     color: { red: 0.5, green: 0.5, blue: 0.5, alpha: 1 },
//     Shininess: 1,
//     metalness: 0.0,
//     roughness: 1,
//   });
// let skyEntity = new Mesh(
//   {
//     scale: [4, 4, 4],
//     geometry: boxGeometry,
//     material: cubeMaterial,
//     wireFrame: false,
//     dynamicPostion: true,
//     name: "sky",
//     cullmode: "front"
//   }
// );
// await scene.add(skyEntity)
let planeGeometry = new PlaneGeometry({
  width: 10,
  height: 10
});
let groundMaterial = new PhongLightsMaterial(
  {
    color: { red: 1, green: 1, blue: 1, alpha: 1 },
    Shininess: 1,
    metalness: 0.0,
    roughness: 1,
  });

let bottomPlane = new Mesh({
  geometry: planeGeometry,
  material: groundMaterial,
  position: [0, -5, 0],
  rotate: {
    axis: [1, 0, 0],
    angleInRadians: -Math.PI / 2,
  },
  wireFrame: false,
  cullmode: "back"
});
await scene.add(bottomPlane);

let topPlane = new Mesh({
  geometry: planeGeometry,
  material: groundMaterial,
  position: [0, 5, 0],
  rotate: {
    axis: [1, 0, 0],
    angleInRadians: Math.PI / 2,
  },
  wireFrame: false,
  cullmode: "back"
});
await scene.add(topPlane);

let backPlane = new Mesh({
  geometry: planeGeometry,
  material: groundMaterial,
  position: [0, 0, -5],
  // rotate: {
  //   axis: [1, 0, 0],
  //   angleInRadians: -Math.PI / 2,
  // },
  wireFrame: false,
  cullmode: "back"
});
await scene.add(backPlane);

let frontPlane = new Mesh({
  geometry: planeGeometry,
  material: groundMaterial,
  position: [0, 0, 5],
  rotate: {
    axis: [1, 0, 0],
    angleInRadians: Math.PI,//180度,normal 相关
  },
  wireFrame: false,
  cullmode: "back"
});
await scene.add(frontPlane);

let leftPlane = new Mesh({
  geometry: planeGeometry,
  material: groundMaterial,
  position: [-5, 0, 0],
  rotate: {
    axis: [0, 1, 0],
    angleInRadians: Math.PI / 2,//正的,normal 相关
  },
  wireFrame: false,
  cullmode: "back"
});
await scene.add(leftPlane);

let rightPlane = new Mesh({
  geometry: planeGeometry,
  material: groundMaterial,
  position: [5, 0, 0],
  rotate: {
    axis: [0, 1, 0],
    angleInRadians: -Math.PI / 2,//负的,normal 相关
  },
  wireFrame: false,
  cullmode: "back"
});
await scene.add(rightPlane);

/////////////////////////////////////////////////////////
// depth buffer 可视化

// scene.setGBuffersVisualize({
//   enable: true,
//   layout: {
//     name: "depth",
//     single: true,
//   }
// });
// scene.setGBuffersVisualize({
//   enable: true,
//   forOtherDepth: {
//     depthTextureView: scene.lightsManagement.shadowMapTexture.createView(
//       {
//         label: "lights management shadowMapTexture array 可视化",
//         dimension: "2d",
//         //  dimension:  "2d-array",
//         baseArrayLayer: 0,
//       }
//     ),
//   }
// });