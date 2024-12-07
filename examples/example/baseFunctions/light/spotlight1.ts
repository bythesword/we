import { PerspectiveCamera, optionPerspProjection } from "../../../../src/we/base/camera/perspectiveCamera"
import { ArcballCameraControl } from "../../../../src/we/base/control/arcballCameraControl"
import { optionCamreaControl } from "../../../../src/we/base/control/cameracCntrol"
import { CameraActor, optionCameraActor } from "../../../../src/we/base/actor/cameraActor"

import { Scene, sceneInputJson } from "../../../../src/we/base/scene/scene" 
import { Mesh } from "../../../../src/we/base/entity/mesh/mesh"
 
import { PhongLightsMaterial } from "../../../../src/we/base/material/Standard/lightsphongMaterial"
import { DirectionalLight } from "../../../../src/we/base/light/DirectionalLight"
import { SpotLight } from "../../../../src/we/base/light/SpotLight"
import { PlaneGeometry } from "../../../../src/we/base/geometry/planeGeomertry"

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
    red: 0.51,
    green: 0.51,
    blue: 0.51,
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
  // reversedZ:true,
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
  position: [0, -3, 5],
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
// let Geometry = new SphereGeometry({
//   radius: 1,
//   widthSegments: 128,
//   heightSegments: 128
// });
let Geometry = new PlaneGeometry({
  width: 5,
  height: 5
});

//极简测试材质，red
let redMaterial = new PhongLightsMaterial(
  {
    color: { red: 0, green: 0.9, blue: 1, alpha: 1 },
    Shininess: 16,
    metalness: 1.,
    roughness: .510,
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
scene.add(boxEntity)

let dirLight: DirectionalLight = new SpotLight(
  {
    direction: [0.0, 0.0, -1.0],
    position: [0,0, 3],
    intensity: 2.0,
    angle: 25/180*Math.PI, 
    angleOut: 30/180*Math.PI  
  }
);

scene.addLight(dirLight);

//运行场景
scene.run()
