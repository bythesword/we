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
import { SpotLight } from "../../../../src/we/base/light/SpotLight"
import { BoxGeometry } from "../../../../src/we/base/geometry/boxGeometry"
import { vec3 } from "wgpu-matrix"
import { ColorMaterial } from "../../../../src/we/base/material/Standard/colorMaterial"

declare global {
  interface Window {
    scene: any
    DC: any
  }
}
let input: sceneInputJson = {
  canvas: "render",
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
  stageSetting: "world",
  // reversedZ:true,

}
let scene = await initScene(input);
window.scene = scene;

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

let spotLight = new SpotLight(
  {
    direction: [-1.0, -1.0, -1.0],
    position: [3, 3, 3],
    intensity: 2.0,
    // angle: 25 / 180 * Math.PI,
    // angleOut: 30 / 180 * Math.PI,
    angle: 20 * (Math.PI) / 180,
    angleOut: 20 * (Math.PI) / 180,
    shadow: true,
  }
);
scene.addLight(spotLight);

//摄像机初始化参数
const cameraOption: optionPerspProjection = {
  fov: 2 * 20 * (Math.PI) / 180,
  aspect: scene.aspect,
  near: 1,
  far: 60,
  position:  [3, 3, 3],
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
let sphereGeometry = new SphereGeometry({
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
let sphereEntity = new Mesh(
  {
    geometry: sphereGeometry,
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
scene.add(sphereEntity)

//box
let boxGeometry = new BoxGeometry({
  width: 1,
  height: 1,
  depth: 1
});



//box实体
let boxEntity = new Mesh(
  {
    geometry: boxGeometry,
    material: redMaterial,
    // wireFrameColor: { red: 1, green: 1, blue: 1, alpha: 1 }
    wireFrame: false,
    position: vec3.create(0, 1, -2),
    // scale:[0.5,0.5,0.5],
    // rotate: {
    //   axis: [1, 1, 1],
    //   angleInRadians: 0.15 * Math.PI
    // },
  }
);
//增加实体到scene
scene.add(boxEntity)

let planeGeometry = new PlaneGeometry({
  width: 20,
  height: 20
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

scene.add(planeEntity);


let lightMaterial = new ColorMaterial(
  {
    color: { red: 1, green: 1, blue: 1, alpha: 1 }, 
  });
//box实体
let light1Entity = new Mesh(
  {
    geometry: sphereGeometry,
    material: lightMaterial,
    // wireFrameColor: { red: 1, green: 1, blue: 1, alpha: 1 }
    wireFrame: false,
    position:vec3.create(3,3,3),
    scale:[0.1,0.1,0.1],
    // rotate:{
    //   axis:[1,0,0],
    //   angleInRadians:0.15*Math.PI
    // },
  }
);
//增加实体到scene
scene.add(light1Entity)