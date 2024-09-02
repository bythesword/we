import { PerspectiveCamera, optionPerspProjection } from "../../src/we/base/camera/perspectiveCamera"
import { ArcballCameraControl } from "../../src/we/base/control/arcballCameraControl"
import { CamreaControl, optionCamreaControl } from "../../src/we/base/control/cameracCntrol"
import { CameraActor, optionCameraActor } from "../../src/we/base/actor/cameraActor"

import { Scene, sceneInputJson } from "../../src/we/base/scene/scene"
import { DrawCommand, drawOption } from "../../src/we/base/command/DrawCommand"
// import { stageOne } from "../../src/we/base/stage/baseStage"
import { BoxGeometry } from "../../src/we/base/geometry/boxGeometry"
import { SimpleMaterial } from "../../src/we/base/material/simple/simpleMaterial"
import { Mesh } from "../../src/we/base/entity/mesh/mesh"


declare global {
  interface Window {
    scene: any
    DC: any
  }
}
let input: sceneInputJson = { canvas: "render" }
let scene = new Scene(input);
await scene.init();

window.scene = scene;


const cameraOption: optionPerspProjection = {
  fov: (2 * Math.PI) / 5,
  aspect: scene.aspect,
  near: 0.0001,
  far: 100,
  position: [0, 0, 5],
  lookAt: [0, 0, 0]
}
let camera = new PerspectiveCamera(cameraOption);

const controlOption: optionCamreaControl = {
  window: window,
  canvas: scene.canvas,
  camera: camera,
};

let control = new ArcballCameraControl(controlOption);


const ccOption: optionCameraActor = {
  camera: camera,
  control: control,
  name: "camera_1"
}

let actor = new CameraActor(ccOption)
scene.addCameraActor(actor, true)



let boxGeometry = new BoxGeometry();
let redMaterial = new SimpleMaterial();

let boxEntity = new Mesh(
  {
    geometry: boxGeometry,
    material: redMaterial
  }
);

scene.add(boxEntity)
scene.run()
