import { PerspectiveCamera, optionPerspProjection } from "../../../../src/we/base/camera/perspectiveCamera"
import { optionCamreaControl } from "../../../../src/we/base/control/cameracCntrol"
import { CameraActor, optionCameraActor } from "../../../../src/we/base/actor/cameraActor"

import { Scene, sceneInputJson } from "../../../../src/we/base/scene/scene"
import { Mesh } from "../../../../src/we/base/entity/mesh/mesh"
import { OneColorCube } from "../../../../src/we/base/geometry/oneColorCube"
import { mat4, vec3 } from "wgpu-matrix"
import { CubeSkyMaterial } from "../../../../src/we/base/material/sky/cubeSkyMaterial"
import { WASDCameraControl } from "../../../../src/we/base/control/wasdCameraControl"
import { PhongMaterial } from "../../../../src/we/base/material/Standard/phongMaterial"
import { SpotLight } from "../../../../src/we/base/light/SpotLight"
import { initScene } from "../../../../src/we/base/scene/initScene"
import { VertexColorMaterial } from "../../../../src/we/base/material/Standard/vertexColorMatrial"
 


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
let outputDIV = document.getElementById("output")
let pickup = async function (scope: any) {
  let pickupInfo = await scope.getPickup();
  if (pickupInfo) {
    outputDIV!.innerHTML = `
  stageName:${pickupInfo.stage.name};<br>
  entityID:${pickupInfo.entity};<br>
  intanceID:${pickupInfo.instance}
  `;
  }

};
let scene = await initScene(input, pickup);
window.scene = scene;

window.scene = scene;


//摄像机初始化参数
const cameraOption: optionPerspProjection = {
  fov: (2 * Math.PI) / 5,
  aspect: scene.aspect,
  near: 0.1,
  far: 2000,
  position: [0, 0, 10.],
  lookAt: [0, 0, 10.]
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
let control = new WASDCameraControl(controlOption);
// let control = new ArcballCameraControl(controlOption);

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


/////////////////////////////////////////////////////////////////////////////////////
//sky 初始化
let skyGeometry = new OneColorCube();
let cubeMaterial = new CubeSkyMaterial({
  cubeTexture: {
    texture: [
      '/examples/resource/images/cubemap/posx.jpg',
      '/examples/resource/images/cubemap/negx.jpg',
      '/examples/resource/images/cubemap/posy.jpg',
      '/examples/resource/images/cubemap/negy.jpg',
      '/examples/resource/images/cubemap/posz.jpg',
      '/examples/resource/images/cubemap/negz.jpg',
    ],
  }
})
let sky = new Mesh(
  {
    name:"sky",
    scale:[100,100,100],
    geometry: skyGeometry,
    material: cubeMaterial,
    wireFrame: false,
    dynamicPostion: true,
    cullmode: "front",

  }
);
scene.add(sky,"Sky")


/////////////////////////////////////////////////////////////////////////
//world

let woodBoxGeometry = new OneColorCube();
//极简测试材质，red
// let material = new VertexColorMaterial();
let woodMaterial = new PhongMaterial({
  color: { red: 0, green: 1, blue: 0, alpha: 1 },
  metalness: 1,
  texture: {
    texture: "/examples/resource/images/box/container2.png",
    specularTexture: "/examples/resource/images/box/container2_specular.png",
  }
});
//box实体
let woodBoxEntity = new Mesh(
  {
    name:"box",
    geometry: woodBoxGeometry,
    material: woodMaterial,
    wireFrame: false,
    dynamicPostion: true,
    position:[0,-3,0],
    update: (scope, deltaTime, startTime, lastTime) => {
      const now = Date.now() / 1000;
      scope.rotate(vec3.fromValues(Math.sin(now), Math.cos(now), 0), 1);
      return true;
    },
  }
);
//增加实体到scene
scene.add(woodBoxEntity)
let spotLight= new SpotLight(
  {
    direction: [0.0, 0.0, -1.0],
    position: [0,0, 12],
    intensity: 22.0,
    angle: 29/180*Math.PI,//12.5
    angleOut: 38/180*Math.PI //17.5
  }
);


/////////////////////////////////////////////////////////////////////
//actor
scene.addLight(spotLight);
let actorBoxGeometry = new OneColorCube();
//极简测试材质，red
let redMaterial = new VertexColorMaterial();
//box实体
let actorBoxEntity = new Mesh(
  {
    geometry: actorBoxGeometry,
    material: redMaterial,
    wireFrame: false,
    position:[-6,3,0],
    // dynamicPostion: true,
    // update: (scope, deltaTime, startTime, lastTime) => {
    //   // console.log("12");
    //   scope.matrix = mat4.identity();
    //   // mat4.translate(scope.matrix, vec3.fromValues(0, 0, 0), scope.matrix);
    //   const now = Date.now() / 1000;
    //   // mat4.rotate(
    //   //   scope.matrix,
    //   //   vec3.fromValues(Math.sin(now), Math.cos(now), 0),
    //   //   1,
    //   //   scope.matrix
    //   // );
    //   scope.rotate(vec3.fromValues(Math.sin(now), Math.cos(now), 0), 1);
    //   return true;
    // },
  }
);
//增加实体到scene
scene.add(actorBoxEntity,"Actor")


//////////////////////////////////////////////////////////////////////////////
//DynamicEntities
let colorBoxGeometry = new OneColorCube();
//极简测试材质，red
let positionMaterial = new VertexColorMaterial();

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
        -20
      ));

  }
}
let colorBoxEntity = new Mesh(
  {
    geometry: colorBoxGeometry,
    material: positionMaterial,
    wireFrame: false,
    dynamicPostion: true,
    numInstances: 16,
    position:[0,0,-8],
    instancesPosition: positiones,
    update: (scope, deltaTime, startTime, lastTime) => {
      scope.matrix = mat4.identity();
      const now = Date.now() / 1000;
      //每个状态不同
      let m = 0, i = 0, count = 4;
      for (let x = 0; x < count; x++) {
        for (let y = 0; y < count; y++) {
          let m4 = mat4.identity();
          mat4.rotate(
            m4,
            vec3.fromValues(
              Math.sin((x + 0.5) * now),
              Math.cos((y + 0.5) * now),
              0
            ),
            1,
            m4
          );

          scope.matrixWorldBuffer.set(m4,  i * 16);
          i++;
        }
      }

      return true;
    },
  }
);
colorBoxEntity.flagUpdateForPerInstance = true;//如果单独更新每个instance，这个是必须的，否则更新的是mesh的矩阵
//增加实体到scene
scene.add(colorBoxEntity,"DynamicEntities")