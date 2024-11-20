import { PerspectiveCamera, optionPerspProjection } from "../../../src/we/base/camera/perspectiveCamera"
import { ArcballCameraControl } from "../../../src/we/base/control/arcballCameraControl"
import { optionCamreaControl } from "../../../src/we/base/control/cameracCntrol"
import { CameraActor, optionCameraActor } from "../../../src/we/base/actor/cameraActor"

import { Scene, sceneInputJson } from "../../../src/we/base/scene/scene"
import { Mesh } from "../../../src/we/base/entity/mesh/mesh"
import { OneColorCube } from "../../../src/we/base/geometry/oneColorCube"
import { VertexColorMaterial } from "../../../src/we/base/material/simple/vertexColorMatrial"
import { mat4, vec3 } from "wgpu-matrix"
import { PhongMaterial } from "../../../src/we/base/material/simple/phongMaterial"
import { PhongLightsMaterial } from "../../../src/we/base/material/simple/lightsphongMaterial"
import { DirectionalLight } from "../../../src/we/base/light/DirectionalLight"
import { SpotLight } from "../../../src/we/base/light/SpotLight"


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
  }
}
let scene = new Scene(input);
await scene.init();

window.scene = scene;


//摄像机初始化参数
const cameraOption: optionPerspProjection = {
  fov: (2 * Math.PI) / 5,
  aspect: scene.aspect,
  near: 0.1,
  far: 1000,
  position: [0, 0, 12],
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
let boxGeometry = new OneColorCube();
//极简测试材质，red
let redMaterial = new PhongLightsMaterial({
  color: { red: 0, green: 1, blue: 0, alpha: 1 },
  metalness: 1,
  texture: {
    texture: "/examples/resource/images/box/container2.png",
    specularTexture: "/examples/resource/images/box/container2_specular.png",
  }
});


const step = 4.0;

// Initialize the matrix data for every instance.
let count = 4;
let positiones = [];
for (let x = 0; x < count; x++) {
  for (let y = 0; y < count; y++) {
    positiones.push(
      vec3.fromValues(
        step * (x - count / 2 + 0.5),
        step * (y - count / 2 + 0.5),
        0
      ));

  }
}

//box实体
let boxEntity = new Mesh(
  {
    geometry: boxGeometry,
    material: redMaterial,
    wireFrame: false,
    dynamicPostion: true,
    numInstances: 16,
    instancesPosition: positiones,
    update: (scope, deltaTime, startTime, lastTime) => {
      scope.matrix = mat4.identity();
      const now = Date.now() / 2000;

      //每个状态相同
      // for (let i = 0; i < scope.numInstances; i++) {
      //   let m4 = mat4.identity();
      //   mat4.rotate(m4, vec3.fromValues(Math.sin(now), Math.cos(now), 0), 1, m4);
      //   scope.matrixWorldBuffer.set(m4, i * 16);
      // }

      //每个状态不同
      let m = 0, i = 0, count = 4;
      for (let x = 0; x < count; x++) {
        for (let y = 0; y < count; y++) {
          let m4 = mat4.identity();
          mat4.rotate(
            m4,
            vec3.fromValues(
              Math.sin((x + 0.01) * now),
              Math.cos((y + 0.01) * now),
              0
            ),
            1,
            m4
          );

          scope.matrixWorldBuffer.set(m4, i * 16);
          i++;
        }
      }

      return true;
    },
  }
);
boxEntity.flagUpdateForPerInstance = true;//如果单独更新每个instance，这个是必须的，否则更新的是mesh的矩阵
//增加实体到scene
scene.add(boxEntity)

let spotLight= new SpotLight(
  {
    direction: [0.0, 0.0, -1.0],
    position: [0,0, 11],
    intensity: 22.0,
    angle: 29/180*Math.PI,//12.5
    angleOut: 38/180*Math.PI //17.5
  }
);

scene.addLight(spotLight);
//运行场景
scene.run()
