import { PerspectiveCamera, optionPerspProjection } from "../../../../src/we/base/camera/perspectiveCamera"
import { ArcballCameraControl } from "../../../../src/we/base/control/arcballCameraControl"
import { optionCamreaControl } from "../../../../src/we/base/control/cameracCntrol"
import { CameraActor, optionCameraActor } from "../../../../src/we/base/actor/cameraActor"

import { sceneInputJson } from "../../../../src/we/base/scene/scene"
import { SphereGeometry } from "../../../../src/we/base/geometry/sphereGeometry"
import { Mesh } from "../../../../src/we/base/entity/mesh/mesh"

import { PointLight } from "../../../../src/we/base/light/pointLight"
import { initScene } from "../../../../src/we/base/scene/initScene"
import { ColorMaterial } from "../../../../src/we/base/material/Standard/colorMaterial"
import { PlaneGeometry } from "../../../../src/we/base/geometry/planeGeomertry"
import { TextureMaterial } from "../../../../src/we/base/material/Standard/textureMaterial"

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
    red: 0,
    green: 0,
    blue: 0,
    alpha: 0
  },
  ambientLight: {
    color: {
      red: 1,
      green: 1,
      blue: 1
    },
    intensity: 0.13
  },
  reversedZ: true,
  stageSetting: "world"
}

let scene = await initScene(input)
window.scene = scene;


//摄像机初始化参数
const cameraOption: optionPerspProjection = {
  fov: (2 * Math.PI) / 5,
  aspect: scene.aspect,
  near: 0.0001,
  far: 100,
  position: [9, 3, 9],
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

let planeGeometry = new PlaneGeometry({
  width: 10,
  height: 10
});

let groundMaterial = new TextureMaterial({
  transparent: {
    alphaTest: 0.59,
  },
  textures: {
    texture: {
      name: "we logo",
      texture: "/examples/resource/images/we/logo.png"
    },
  }
});

let colorMaterial_0 = new ColorMaterial(
  {
    color: { red: 1, green: 0.3, blue: 0.5, alpha: 0.31 },
  });

let skyforceMaterial = new TextureMaterial({
  transparent: {
    opacity: 0.50,
  },
  textures: {
    texture: {
      premultipliedAlpha: true,
      name: "skyforce",
      texture: "/examples/resource/images/img/skyforce.png"
    },
  }
});


let bottomPlane = new Mesh({
  name: "bottomPlane",
  geometry: planeGeometry,
  material: skyforceMaterial,
  position: [0, -1, 0],
  rotate: {
    axis: [1, 0, 0],
    angleInRadians: -Math.PI / 2,
  },
  wireFrame: false,
  cullmode: "none"
});
await scene.add(bottomPlane);
let skyforce = new Mesh(
  {
    name: "skyforce",
    geometry: planeGeometry,
    material: skyforceMaterial,
    // wireFrameColor: { red: 1, green: 1, blue: 1, alpha: 1 }
    wireFrame: false,
    // position:vec3.create(1,0,0),
    // scale:[2,2,1],
    rotate: {
      axis: [0, 1, 0],
      angleInRadians: 0.5 * Math.PI
    },
  }
);
//增加实体到scene
await scene.add(skyforce)

let light1 = new PointLight(
  {
    position: [0.0, 0.0, 8.0],
    intensity: 2.0,

  }
);

scene.addLight(light1);


