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
import { VideoTexture } from "../../../../src/we/base/texture/videoTexture"
import { VideoMaterial } from "../../../../src/we/base/material/Standard/videoMaterial"



declare global {
  interface Window {
    scene: any
    DC: any
    video_1: any
  }
}

let input: sceneInputJson = {
  canvas: "render",
  // renderPassSetting:{color:{clearValue:[0.5,0.5,0.5,1]}}//ok
  color: {
    red: 0,
    green: 0.51,
    blue: 1,
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
  position: [0, 0, 1],
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
  width: 0.544,
  height: 0.960
});

const video = document.createElement("video");
video.crossOrigin = "anonymous";
video.src = "/examples/resource/video/sea.mp4";
video.muted = true;
video.loop = true;
await video.play();

// video.autoplay =  true;  //这个必须
let videoFrame = new VideoFrame(video);

let groundMaterial = new VideoMaterial({
  textures: {
    video: {
      premultipliedAlpha: false,
      name: "sea video",
      texture: videoFrame,
      model: "External"
    },
  }
});

let plane = new Mesh({
  name: "Plane",
  geometry: planeGeometry,
  material: groundMaterial,
  // position: [0, -1, 0],
  // rotate: {
  //   axis: [1, 0, 0],
  //   angleInRadians: -Math.PI / 2,
  // },
  wireFrame: false,
  cullmode: "none"
});

scene.add(plane);




