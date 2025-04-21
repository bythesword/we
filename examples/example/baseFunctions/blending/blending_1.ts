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
import { GUI } from "muigui";
//////////////////////////////////////////////////////////////////////////////////////////////
//from webgpufundemental
const hsl = (h: number, s: number, l: number) => `hsl(${h * 360 | 0}, ${s * 100}%, ${l * 100 | 0}%)`;
const hsla = (h: number, s: number, l: number, a: any) => `hsla(${h * 360 | 0}, ${s * 100}%, ${l * 100 | 0}%, ${a})`;

function createSourceImage(size: number) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.translate(size / 2, size / 2);

  ctx.globalCompositeOperation = 'screen';
  const numCircles = 3;
  for (let i = 0; i < numCircles; ++i) {
    ctx.rotate(Math.PI * 2 / numCircles);
    ctx.save();
    ctx.translate(size / 6, 0);
    ctx.beginPath();

    const radius = size / 3;
    ctx.arc(0, 0, radius, 0, Math.PI * 2);

    const gradient = ctx.createRadialGradient(0, 0, radius / 2, 0, 0, radius);
    const h = i / numCircles;
    gradient.addColorStop(0.5, hsla(h, 1, 0.5, 1));
    gradient.addColorStop(1, hsla(h, 1, 0.5, 0));

    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.restore();
  }
  return canvas;
}
function createDestinationImage(size: number) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const gradient = ctx.createLinearGradient(0, 0, size, size);
  for (let i = 0; i <= 6; ++i) {
    gradient.addColorStop(i / 6, hsl(i / -6, 1, 0.5));
  }

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  ctx.fillStyle = 'rgba(0, 0, 0, 255)';
  ctx.globalCompositeOperation = 'destination-out';
  ctx.rotate(Math.PI / -4);
  for (let i = 0; i < size * 2; i += 32) {
    ctx.fillRect(-size, i, size * 2, 16);
  }

  return canvas;
}
const size = 300;
const srcCanvas = createSourceImage(size);
const dstCanvas = createDestinationImage(size);



///////////////////////////////////////////////////////////////////////////
//scene
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
    green: 0.1,
    blue: 0.2,
    alpha: 0.1
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
let groundMaterial = new ColorMaterial({
  color: { red: 1, green: 1, blue: 1, alpha: 1 },
});

let bottomPlane = new Mesh({
  name: "bottomPlane",
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
await scene.add(bottomPlane);



//box
// let Geometry = new SphereGeometry({
//   radius: 1,
//   widthSegments: 128,
//   heightSegments: 128
// });
//极简测试材质，red
let colorMaterial_1 = new ColorMaterial(
  {
    color: { red: 1, green: 0.3, blue: 0.5, alpha: 1 },
  });
//box实体
let boxEntity = new Mesh(
  {
    name: "透明plane",
    geometry: planeGeometry,
    material: colorMaterial_1,
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
await scene.add(boxEntity)

let light1 = new PointLight(
  {
    position: [0.0, 0.0, 8.0],
    intensity: 2.0,

  }
);

scene.addLight(light1);


