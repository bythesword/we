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
    red: 1,
    green: 0.5,
    blue: 0.,
    alpha: 0
  },
  ambientLight: {
    color: {
      red: 1,
      green: 1,
      blue: 1
    },
    intensity: 0.003
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
  // position: [0,0,15],
  position: [-8.63,0.0,13.065],
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
let radius = 1;
let Geometry = new SphereGeometry({
  radius: radius,
  widthSegments: 128,
  heightSegments: 128
});

let space = 1.5;
let n=7
let step = radius + space;
let x =  -n * space /2;

for (let i = 1; i < n; i++) {//X方向，roughness
  let y = - n * space /2;
  for (let j = 1; j < n; j++) { //Y方向，metallic
    let inputPBR: valuesOfPBR = {
      color: {
        value: {  red: 0, green: 0.9, blue: 1, alpha: 1  }
      },
      metallic: { value: j/n},
      roughness: { value: i/n },
      albedo: {
        value: [1.0, 0.71, 0.29],//金的反射率
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
        position:vec3.create(x,y,0),
        // scale:[2,2,1],
        // rotate:{
        //   axis:[1,0,0],
        //   angleInRadians:0.15*Math.PI
        // },
      }
    );
    await scene.add(boxEntity)
    y += step;
  }
  x += step;
}


let dirL=new DirectionalLight({
  intensity:3,
  direction:vec3.create(0,0,1)
})
scene.addLight(dirL)

// let light1: PointLight = new PointLight(
//   {
//     position: [0.0, 0.0, 15.0],
//     intensity: 15.0,
//     color: { red: 1.0, green: 1.0, blue: 1.0 },
//   }
// );

// scene.addLight(light1);

