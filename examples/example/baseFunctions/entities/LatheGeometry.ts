import { PerspectiveCamera, optionPerspProjection } from "../../../../src/we/base/camera/perspectiveCamera"
import { ArcballCameraControl } from "../../../../src/we/base/control/arcballCameraControl"
import { optionCamreaControl } from "../../../../src/we/base/control/cameracCntrol"
import { CameraActor, optionCameraActor } from "../../../../src/we/base/actor/cameraActor"

import { Scene, sceneInputJson } from "../../../../src/we/base/scene/scene"
import { BoxGeometry } from "../../../../src/we/base/geometry/boxGeometry"
import { SphereGeometry } from "../../../../src/we/base/geometry/sphereGeometry"
import { ColorMaterial } from "../../../../src/we/base/material/Standard/colorMaterial"
import { Mesh } from "../../../../src/we/base/entity/mesh/mesh"
import { initScene } from "../../../../src/we/base/scene/initScene"
import { CircleGeometry } from "../../../../src/we/base/geometry/circleGeometry"
import { LatheGeometry } from "../../../../src/we/base/geometry/LatheGeometry"


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
    intensity: 0.3
  },
  stageSetting: "world"

}
let scene = await initScene(input);
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
const points = [];

for (let i = 0; i < 10; i++) {

  points.push([Math.sin(i * 0.2) * 10 + 5, (i - 5) * 2]);

}
console.log(points)
let Geometry = new LatheGeometry({
  points: points,
  segments: 12,
  phiStart: 0,
  phiLength: Math.PI * 2
});
//极简测试材质，red
let redMaterial = new ColorMaterial({ color: { red: 1, green: 0, blue: 0, alpha: 1 } });
//box实体
let Entity1 = new Mesh(
  {
    geometry: Geometry,
    material: redMaterial,
    wireFrameColor: { red: 1, green: 1, blue: 1, alpha: 1 }
  }
);
//增加实体到scene
await scene.add(Entity1)

