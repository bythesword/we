import { PerspectiveCamera, optionPerspProjection } from "../../../../src/we/base/camera/perspectiveCamera"
import { ArcballCameraControl } from "../../../../src/we/base/control/arcballCameraControl"
import { optionCamreaControl } from "../../../../src/we/base/control/cameracCntrol"
import { CameraActor, optionCameraActor } from "../../../../src/we/base/actor/cameraActor"

import { Scene, sceneInputJson } from "../../../../src/we/base/scene/scene"
import { BoxGeometry } from "../../../../src/we/base/geometry/boxGeometry"
import { Mesh } from "../../../../src/we/base/entity/mesh/mesh"
 
import { PhongMaterial } from "../../../../src/we/base/material/Standard/phongMaterial"
import { PointLight } from "../../../../src/we/base/light/pointLight"
import { mat4, vec3 } from "wgpu-matrix"
import { initScene } from "../../../../src/we/base/scene/initScene"
import { Blur3x3 } from "../../../../src/we/base/postprocess/blur3x3"

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
  ambientLight: {
    color: {
      red: 1,
      green: 1,
      blue: 1
    },
    intensity: 0.13
  }
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
let boxGeometry = new BoxGeometry();
//极简测试材质，red
let redMaterial = new PhongMaterial({
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
    geometry: boxGeometry,
    material: redMaterial,
    wireFrame: false,
    // dynamicPostion: true,
    update: (scope, deltaTime, startTime, lastTime) => {
      // console.log("12");
      scope.matrix = mat4.identity(); 
      const now = Date.now() / 1000;    
      scope.rotate(vec3.fromValues(Math.cos(now), Math.sin(now), 0), 1);      
      return true;
    },
  }
);
//增加实体到scene
await scene.add(boxEntity)
let light1= new PointLight(
  {
    position: [0.0, 0.0, 8.0],
    intensity: 12.0,

  }
);

scene.addLight(light1);



let blur3x3 = new Blur3x3();
scene.addPostProcess(blur3x3)