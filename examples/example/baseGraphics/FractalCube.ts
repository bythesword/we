import { PerspectiveCamera, optionPerspProjection } from "../../../src/we/base/camera/perspectiveCamera"
import { ArcballCameraControl } from "../../../src/we/base/control/arcballCameraControl"
import { optionCamreaControl } from "../../../src/we/base/control/cameracCntrol"
import { CameraActor, optionCameraActor } from "../../../src/we/base/actor/cameraActor"

import { Scene, sceneInputJson } from "../../../src/we/base/scene/scene"
import { Mesh } from "../../../src/we/base/entity/mesh/mesh"
import { OneColorCube } from "../../../src/we/base/geometry/oneColorCube"
import { VertexColorMaterial } from "../../../src/we/base/material/Standard/vertexColorMatrial"
import { mat4, vec3 } from "wgpu-matrix"


declare global {
  interface Window {
    scene: any
    DC: any
  }
}

const backgroudColor = 0.5;
let input: sceneInputJson = {
  canvas: "render",
  // renderPassSetting:{color:{clearValue:[0.5,0.5,0.5,1]}}//ok
  color: {
    red: backgroudColor,
    green: backgroudColor,
    blue: backgroudColor,
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
  near: 0.0001,
  far: 100,
  position: [0, 0, 5],
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





let colorTexture = scene.device.createTexture({
  size: [scene.canvas.width, scene.canvas.height],
  format: scene.presentationFormat,
  usage: GPUTextureUsage.COPY_DST | GPUTextureUsage.TEXTURE_BINDING
});
scene.addUserDefine({
  call: function (scope: any): any {
    // scope.copyTextureToTexture(scene.colorTexture,colorTexture,{width:scope.canvas.width, height:scope.canvas.height});
    scope.copyTextureToTexture(scene.stages["World"].opaque!.colorTexture, colorTexture, { width: scope.canvas.width, height: scope.canvas.height });
    return true;
  },
  name: "copy",
  state: true
});

////enities 初始化
//box
let boxGeometry = new OneColorCube();
//极简测试材质，red
let redMaterial = new VertexColorMaterial({
  type: "position",
  textures: colorTexture,
  // textures: scene.colorTexture,
  code: `
  struct ST_GBuffer{
    @builtin(frag_depth) depth : f32,
    @location(0) color : vec4f,
    @location(1) id : u32,
    @location(2) normal : vec4f,
    @location(3) uv : vec4f,
}
  @group(1) @binding(1) var u_Sampler : sampler;
  @group(1) @binding(2) var u_Texture: texture_2d<f32>;
  @fragment fn fs(fsInput :  VertexShaderOutput_oneCube) -> ST_GBuffer {
    var output : ST_GBuffer;
    let texColor = textureSample(u_Texture, u_Sampler, fsInput.uv * 1.  ); 
    //stage的初始化颜色与scene不同,造成看不见,已经修正
    let f = select(1.0, 0.0, length(texColor.rgb - vec3(${backgroudColor})) < 0.01);
    output.color = f * texColor + (1.0 - f) * fsInput.fsPosition;
  
    output.depth = fsInput.position.z;
    output.uv = vec4f(fsInput.uv, 0, 1);
    output.normal = vec4f(fsInput.normal, 1);
    output.id = fsInput.entityID;
  return output;
  }          `
  // code: `
  // @group(1) @binding(1) var u_Sampler : sampler;
  // @group(1) @binding(2) var u_Texture: texture_2d<f32>;
  // @fragment fn fs( fsInput : VertexShaderOutput) -> @location(0) vec4f {

  //   let texColor = textureSample(u_Texture, u_Sampler, fsInput.uv * 1.  ); 
  //   let f = select(1.0, 0.0, length(texColor.rgb - vec3(${backgroudColor})) < 0.01);//stage的初始化颜色与scene不同,造成看不见,已经修正
  //   return f * texColor + (1.0 - f) * fsInput.fsPosition;

  //   //return vec4f(1);
  //   // return vec4f(f,0,0,1);
  //    //return texColor+0.5* fsInput.fsPosition;
  // }          `
});
//box实体
let boxEntity = new Mesh(
  {
    geometry: boxGeometry,
    material: redMaterial,
    wireFrame: false,
    dynamicPostion: true,
    update: (scope) => {
      // console.log("12");
      scope.matrix = mat4.identity();
      // mat4.translate(scope.matrix, vec3.fromValues(0, 0, 0), scope.matrix);
      const now = Date.now() / 1000;
      // mat4.rotate(
      //   scope.matrix,
      //   vec3.fromValues(Math.sin(now), Math.cos(now), 0),
      //   1,
      //   scope.matrix
      // );
      scope.rotate(vec3.fromValues(Math.sin(now), Math.cos(now), 0), 1);
      return true;
    },
  }
);
//增加实体到scene
scene.add(boxEntity)


//运行场景
scene.run()
