import { PerspectiveCamera, optionPerspProjection } from "../../../../src/we/base/camera/perspectiveCamera"
import { ArcballCameraControl } from "../../../../src/we/base/control/arcballCameraControl"
import { optionCamreaControl } from "../../../../src/we/base/control/cameracCntrol"
import { CameraActor, optionCameraActor } from "../../../../src/we/base/actor/cameraActor"

import { sceneInputJson } from "../../../../src/we/base/scene/scene"
import { Mesh } from "../../../../src/we/base/entity/mesh/mesh"

import { PointLight } from "../../../../src/we/base/light/pointLight"
import { initScene } from "../../../../src/we/base/scene/initScene"
import { PlaneGeometry } from "../../../../src/we/base/geometry/planeGeomertry"
import { TextureMaterial } from "../../../../src/we/base/material/Standard/textureMaterial"

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
    blue: 0,
    alpha: 0.5
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
  near: 0.01,
  far: 100,
  position: [0, 0, 11],
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
  width: 1,
  height: 20
});



for (let i = 0; i < 8; i++) {
  let groundMaterial = new TextureMaterial({
    textures: {
      texture: {
        premultipliedAlpha: false,
        name: "we logo",
        texture: "/examples/resource/images/mipmap/blended.png",
        samplerDescriptor: {
          magFilter: (i & 1) ? 'linear' : 'nearest',
          minFilter: (i & 2) ? 'linear' : 'nearest',
          addressModeU: "repeat",
          addressModeV: "repeat",
          mipmapFilter: (i & 4) ? 'linear' : 'nearest'
        },
        mipmap: true
      },
    }
  });
  let Y = i < 4 ? 1 : -1;
  let X = i < 4 ? -1.7 + i * 0.1 + i : -1.7 + (i - 4) * 0.1 + (i - 4);
  let rotate = i < 4 ? Math.PI / 2.1 : - Math.PI / 2.1
  let top = new Mesh({
    name: "Plane" + i,
    geometry: planeGeometry,
    material: groundMaterial,
    position: [X, Y, 0],
    rotate: {
      axis: [1, 0, 0],
      angleInRadians: rotate,
    },
    wireFrame: false,
    cullmode: "none",
    UV: {
      uvScale: {
        u: 1,
        v: 20
      },

    }
  });
  scene.add(top);
}



