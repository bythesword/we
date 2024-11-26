import { PerspectiveCamera, optionPerspProjection } from "../../../../src/we/base/camera/perspectiveCamera"
import { ArcballCameraControl } from "../../../../src/we/base/control/arcballCameraControl"
import { optionCamreaControl } from "../../../../src/we/base/control/cameracCntrol"
import { CameraActor, optionCameraActor } from "../../../../src/we/base/actor/cameraActor"

import { Scene, sceneInputJson } from "../../../../src/we/base/scene/scene"
import { BoxGeometry } from "../../../../src/we/base/geometry/boxGeometry"
import { ColorMaterial } from "../../../../src/we/base/material/simple/colorMaterial"
import { Mesh } from "../../../../src/we/base/entity/mesh/mesh"
import { PlaneGeometry } from "../../../../src/we/base/geometry/planeGeomertry"


declare global {
  interface Window {
    scene2: any
    DC: any
  }
}
let input: sceneInputJson = {
  canvas: "renderZ",
  // renderPassSetting:{color:{clearValue:[0.5,0.5,0.5,1]}}//ok
  color: {
    red: 1,
    green: 1,
    blue: 1,
    alpha: 1
  },
  reversedZ: true,

}
let scene = new Scene(input);
await scene.init();

window.scene2 = scene;


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
let Geometry = new PlaneGeometry({
  width: 2,
  height: 0.5
});
//极简测试材质，red
let redMaterial = new ColorMaterial({ color: { red: 1, green: 0, blue: 0, alpha: 1 } });

let redEntity = new Mesh(
  {
    position: [0.5, 0, 0.00003],
    geometry: Geometry,
    material: redMaterial,
    wireFrame: false,
    cullmode:"none"
  }
);
//增加实体到scene
scene.add(redEntity)


let greenMaterial = new ColorMaterial({ color: { red: 0, green: 1, blue: 0, alpha: 1 } });
let greenEntity = new Mesh(
  {
    position: [-0.5, 0, 0.00001],
    geometry: Geometry,
    material: greenMaterial,
    // dynamicPostion: true,
    wireFrame: false,
    cullmode:"none"
  }
);
//增加实体到scene
scene.add(greenEntity)

//运行场景
scene.run()
