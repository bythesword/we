import { PerspectiveCamera, optionPerspProjection } from "../../../../src/we/base/camera/perspectiveCamera"
import { ArcballCameraControl } from "../../../../src/we/base/control/arcballCameraControl"
import { optionCamreaControl } from "../../../../src/we/base/control/cameracCntrol"
import { CameraActor, optionCameraActor } from "../../../../src/we/base/actor/cameraActor"

import { Scene, sceneInputJson } from "../../../../src/we/base/scene/scene"
import { SphereGeometry } from "../../../../src/we/base/geometry/sphereGeometry"
import { Mesh } from "../../../../src/we/base/entity/mesh/mesh"

import { PhongLightsMaterial } from "../../../../src/we/base/material/Standard/lightsphongMaterial"
import { PointLight, optionPointLight } from "../../../../src/we/base/light/pointLight"
import { initScene } from "../../../../src/we/base/scene/initScene"
import { optionPBRMaterial, PBRMaterial, valuesOfPBR } from "../../../../src/we/base/material/PBR/PBR"
import { ColorMaterial } from "../../../../src/we/base/material/Standard/colorMaterial"
import { vec3 } from "wgpu-matrix"
import { DirectionalLight } from "../../../../src/we/base/light/DirectionalLight"

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
    blue: 0.,
    alpha: 0
  },
  ambientLight: {
    color: {
      red: 1,
      green: 1,
      blue: 1
    },
    intensity: 0.01
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
let Geometry = new SphereGeometry({
  radius: 1,
  widthSegments: 128,
  heightSegments: 128
});


let inputPBR: valuesOfPBR = {
     color: {
        // value: {  red: 0, green: 0.9, blue: 1, alpha: 1  }
        value: {  red: 0.77, green: 0.78, blue: 0.78, alpha: 1  }

      },
  metallic: {
    texture: {
      name: "metallic",
      texture: "/examples/resource/images/rustediron/rustediron2_metallic.png"
    }
  },
  roughness: {
    texture: {
      name: "roughness",
      texture: "/examples/resource/images/rustediron/rustediron2_roughness.png"
    }
  },
  normal: {
    texture: {
      name: "roughness",
      texture: "/examples/resource/images/rustediron/rustediron2_normal.png"
    }
  },
  albedo: {
    // value: [1,1,1],
    // value: [0.56, 0.57, 0.58],
    texture: {
      name: "albedo",
      texture: "/examples/resource/images/rustediron/rustediron2_basecolor.png"
    }
  }
}
let PBRM1 = new PBRMaterial(
  {
    PBR: inputPBR

  }
)
//box实体
let boxEntity = new Mesh(
  {
    geometry: Geometry,
    material: PBRM1,
    // wireFrameColor: { red: 1, green: 1, blue: 1, alpha: 1 }
    wireFrame: false,
    // position:vec3.create(1,0,0),
    // scale:[2,2,1],
    // rotate:{
    //   axis:[0,1,0],
    //   angleInRadians:0.5*Math.PI
    // },
  }
);
//增加实体到scene
await scene.add(boxEntity)

let light1: PointLight = new PointLight(
  {
    position: [2.0, 0.0, 0.0],
    intensity: 3.0,
    color: { red: 1.0, green: 1.0, blue: 1.0 },
    update: (scope: any ) => {
      let dir = scope.getDirection();
      const now = Date.now() / 1000;
      scope.values.position = vec3.fromValues(Math.sin(now) * 2, 0, Math.cos(now) * 2);
      return true
    },
  }
);
scene.addLight(light1);


let lightMaterial = new ColorMaterial(
  {
    color: { red: 1, green: 1, blue: 1, alpha: 1 },
  });

//light实体
let light1Entity1 = new Mesh(
  {
    geometry: Geometry,
    material: lightMaterial,
    // wireFrameColor: { red: 1, green: 1, blue: 1, alpha: 1 }
    wireFrame: false,
    position: vec3.create(2, 0, 0),
    scale: [0.1, 0.1, 0.1],
    dynamicPostion: true,
    rotate:{
      axis:[1,0,0],
      angleInRadians:0.15*Math.PI
    },
    update: (scope: any) => {
      // let dir = scope.getDirection();
      const now = Date.now() / 1000;
      scope.position = vec3.fromValues(Math.sin(now) * 2, 0, Math.cos(now) * 2);
      scope.updateMatrix();
      return true
    },
  }
);
//增加实体到scene
await scene.add(light1Entity1)

let dirL = new DirectionalLight({
  intensity: 2,
  direction: vec3.create(0, 0, 1)
})
scene.addLight(dirL)