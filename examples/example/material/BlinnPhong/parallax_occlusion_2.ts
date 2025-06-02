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
import { PlaneGeometry } from "../../../../src/we/base/geometry/planeGeomertry"
import { DirectionalLight } from "../../../../src/we/base/light/DirectionalLight"
import { ColorMaterial } from "../../../../src/we/base/material/Standard/colorMaterial"
import { SphereGeometry } from "../../../../src/we/base/geometry/sphereGeometry"
import { initScene } from "../../../../src/we/base/scene/initScene"

declare global {
  interface Window {
    scene: any
    DC: any
    lightRadius: any
    lightRadiusFlag: boolean
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
    intensity: 0.5
  }
}
let scene = await initScene(input);
window.scene = scene;
 



//摄像机初始化参数
const cameraOption: optionPerspProjection = {
  fov: (2 * Math.PI) / 5,
  aspect: scene.aspect,
  near: 0.0001,
  far: 100,
  position: [0, 0, 2.3],
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
let planeGeometry = new PlaneGeometry({
  width: 2,
  height: 2
});
let boxGeometry = new BoxGeometry();
//极简测试材质，red
let redMaterial = new PhongMaterial({
  color: { red: 0, green: 1, blue: 0, alpha: 1 },
  metalness: 0.01,
  roughness: 0.5,
  Shininess: 32,
  texture: {
    texture: {
      // texture: "/examples/resource/images/img/toy_box_diffuse.png",
      texture: "/examples/resource/images/img/wood.png",
      // upsideDownY:false,
    },
    normalTexture: {
      texture: "/examples/resource/images/img/toy_box_normal.png",
      // upsideDownY:false,

    },
    parallaxTexture: {
      texture: "/examples/resource/images/img/toy_box_disp.png",
      // upsideDownY:false,
      scale:   0.1,
      layers: 10,
    }
  }
});
//box实体
let boxEntity = new Mesh(
  {
    geometry: planeGeometry,
    material: redMaterial,
    wireFrame: false,
    // rotate: {
    //   axis: [0, 1, 0],
    //   angleInRadians:  Math.PI
    // },
    //  position: [0,0, 1],

    // dynamicPostion: true,
    // update: (scope, deltaTime, startTime, lastTime) => {
    //   // console.log("12");
    //   scope.matrix = mat4.identity();
    //   const now = Date.now() / 1000;
    //   scope.rotate(vec3.fromValues(Math.cos(now), Math.sin(now), 0), 1);
    //   return true;
    // },
    // cullmode: "none"
  }
);
//增加实体到scene
await scene.add(boxEntity)



window.lightRadius =0.65;
window.lightRadiusFlag = true;
// let lightRadius=
let lightZ = 0.35

let pointLight_1 = new PointLight({
  intensity: 1.0,
  position: [1, 1, 1],
  color: { red: 1, green: 1, blue: 1 },
  update: (scope: any) => {
    let dir = scope.getDirection();
    const now = Date.now() /2000;
    scope.values.position = vec3.fromValues(Math.sin(now)* window.lightRadius, Math.cos(now)  * window.lightRadius, lightZ);
    return true
  },
})

scene.addLight(pointLight_1)

let light1 = new DirectionalLight(
  {
    intensity: 2.0,
    direction: [1, 1, 1],
  }
);
// scene.addLight(light1);

let ballGeometry = new SphereGeometry({
  radius: 0.1,
  widthSegments: 8,
  heightSegments: 8
});
let lightMaterial = new ColorMaterial(
  {
    color: { red: 1, green: 1, blue: 1, alpha: 1 },
  });

//light实体
let light1Entity1 = new Mesh(
  {
    geometry: ballGeometry,
    material: lightMaterial,
    // wireFrameColor: { red: 1, green: 1, blue: 1, alpha: 1 }
    wireFrame: false,
    position: vec3.create(2, 0, 0),
    scale: [0.1, 0.1, 0.1],
    dynamicPostion: true,
    rotate: {
      axis: [1, 0, 0],
      angleInRadians: 0.15 * Math.PI
    },
    update: (scope: any) => {
      // let dir = scope.getDirection();
      const now = Date.now() / 2000;
      scope.position = vec3.fromValues(Math.sin(now) * window.lightRadius, Math.cos(now)  * window.lightRadius, lightZ);
      // if (window.lightRadius >= 1.2) {
      //   window.lightRadiusFlag = false;
      // }
      // if (window.lightRadius <=0.20) {
      //   window.lightRadiusFlag = true;
      // }
      // if(window.lightRadiusFlag){
      //    window.lightRadius+=0.001
      // }
      // else{
      //   window.lightRadius-=0.001
      // }

      scope.updateMatrix();
      return true
    },
  }
);
//增加实体到scene
await scene.add(light1Entity1)
 