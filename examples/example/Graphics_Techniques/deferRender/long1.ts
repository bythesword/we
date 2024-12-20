import { PerspectiveCamera, optionPerspProjection } from "../../../../src/we/base/camera/perspectiveCamera"
import { ArcballCameraControl } from "../../../../src/we/base/control/arcballCameraControl"
import { optionCamreaControl } from "../../../../src/we/base/control/cameracCntrol"
import { CameraActor, optionCameraActor } from "../../../../src/we/base/actor/cameraActor"

import { sceneInputJson } from "../../../../src/we/base/scene/scene"
import { Mesh } from "../../../../src/we/base/entity/mesh/mesh"
import { OneColorCube } from "../../../../src/we/base/geometry/oneColorCube"
import { VertexColorMaterial } from "../../../../src/we/base/material/Standard/vertexColorMatrial"
import { mat4, vec3, vec4 } from "wgpu-matrix"
import { initScene } from "../../../../src/we/base/scene/initScene"

import { mesh } from "../../../../src/we/model/simple/stanfordDragon.ts"
import { SimpleModel } from "../../../../src/we/base/entity/simple/SimpleModel.ts"
import { ColorMaterial } from "../../../../src/we/base/material/Standard/colorMaterial.ts"
import { simpleModelData } from "../../../../src/we/base/entity/simple/simpleData.ts"
import { ShaderMaterial } from "../../../../src/we/base/material/code/shaderMaterial.ts"
import { ComputeCommand, computeOptionOfCommand } from "../../../../src/we/base/command/ComputeCommand.ts"
import { uniformEntries, unifromGroup } from "../../../../src/we/base/command/baseCommand.ts"
import { commmandType } from "../../../../src/we/base/scene/baseScene.ts"

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
    red: 1.0,
    green: 1.0,
    blue: 1.0,
    alpha: 1
  },
  deferRender: {
    enable: true,
    type: "depth"
  }

}

let scene = await initScene(input);
window.scene = scene;


//摄像机初始化参数
const cameraOption: optionPerspProjection = {
  fov: (2 * Math.PI) / 5,
  aspect: scene.aspect,
  near: 0.1,
  far: 500,
  position: [0, 150, 200],
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



// scene.setGBuffersVisualize({
//   enable: true,
//   layout: {
//     name: "depth",
//     single: true,
//   }
// });

const kMaxNumLights = 1024;
const lightExtentMin = vec3.fromValues(-100, -30, -100);
const lightExtentMax = vec3.fromValues(100, 100, 100);
const extent = vec3.sub(lightExtentMax, lightExtentMin);
const lightDataStride = 8;//wgsl struct lightDate's size

const bufferSizeInByte = Float32Array.BYTES_PER_ELEMENT * lightDataStride * kMaxNumLights;
const lightsBuffer = scene.device.createBuffer({
  size: bufferSizeInByte,
  usage: GPUBufferUsage.STORAGE,
  mappedAtCreation: true,
});
//初始化光源：mapping
const lightData = new Float32Array(lightsBuffer.getMappedRange());
const tmpVec4 = vec4.create();
let offset = 0;
for (let i = 0; i < kMaxNumLights; i++) {
  offset = lightDataStride * i;
  // position
  for (let i = 0; i < 3; i++) {
    tmpVec4[i] = Math.random() * extent[i] + lightExtentMin[i];
  }
  tmpVec4[3] = 1;
  lightData.set(tmpVec4, offset);
  // color
  tmpVec4[0] = Math.random() * 2;
  tmpVec4[1] = Math.random() * 2;
  tmpVec4[2] = Math.random() * 2;
  // radius
  tmpVec4[3] = 20.0;
  lightData.set(tmpVec4, offset + 4);
}
lightsBuffer.unmap();
///////////////////////////////////////////////////////////////
//动态光源的position的AABB ，uniform 
const lightExtentBuffer = scene.device.createBuffer({
  size: 4 * 8,
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});
const lightExtentData = new Float32Array(8);
lightExtentData.set(lightExtentMin, 0);
lightExtentData.set(lightExtentMax, 4);
scene.device.queue.writeBuffer(
  lightExtentBuffer,
  0,
  lightExtentData.buffer,
  lightExtentData.byteOffset,
  lightExtentData.byteLength
);
const settings = {
  mode: 'rendering',
  numLights: 1024,
};
///////////////////////////////////////////////////////////////
//光源数量 uniform
const configUniformBuffer = (() => {
  const buffer = scene.device.createBuffer({
    size: Uint32Array.BYTES_PER_ELEMENT,
    mappedAtCreation: true,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
  new Uint32Array(buffer.getMappedRange())[0] = settings.numLights;
  buffer.unmap();
  return buffer;
})();

///////////////////////////////////////////////////////////////
//CC
let uniforms: unifromGroup[] = [
  {
    layout: 0,
    entries: [
      {
        binding: 0,
        resource: {
          buffer: lightsBuffer
        },
      },
      {
        binding: 1,
        resource: {
          buffer: configUniformBuffer
        },
      },
      {
        binding: 2,
        resource: {
          buffer: lightExtentBuffer
        },
      },
    ]
  }
];


let LightCC = new class {
  computeshader = /* wgsl */ `
  struct LightData {
    position : vec4f,
    color : vec3f,
    radius : f32,
  }
  struct LightsBuffer {
    lights: array<LightData>,
  }
  @group(0) @binding(0) var<storage, read_write> lightsBuffer: LightsBuffer;
  
  struct Config {
    numLights : u32,
  }
  @group(0) @binding(1) var<uniform> config: Config;
  
  struct LightExtent {
    min : vec4f,
    max : vec4f,
  }
  @group(0) @binding(2) var<uniform> lightExtent: LightExtent;
  
  @compute @workgroup_size(64, 1, 1)
  fn main(@builtin(global_invocation_id) GlobalInvocationID : vec3u) {
    var index = GlobalInvocationID.x;
    if (index >= config.numLights) {
      return;
    }
  
    lightsBuffer.lights[index].position.y = lightsBuffer.lights[index].position.y - 0.5 - 0.003 * (f32(index) - 64.0 * floor(f32(index) / 64.0));
  
    if (lightsBuffer.lights[index].position.y < lightExtent.min.y) {
      lightsBuffer.lights[index].position.y = lightExtent.max.y;
    }
  }  `;
  commands: commmandType[];
  constructor() {
    this.commands = [];
    this.init();
  }
  init() {

    // Lights data are uploaded in a storage buffer
    // which could be updated/culled/etc. with a compute shader
    // const kMaxNumLights = 1024;
    // const lightExtentMin = vec3.fromValues(-50, -30, -50);
    // const lightExtentMax = vec3.fromValues(50, 50, 50);
    // const extent = vec3.sub(lightExtentMax, lightExtentMin);
    // const lightDataStride = 8;//wgsl struct lightDate's size

    // const bufferSizeInByte = Float32Array.BYTES_PER_ELEMENT * lightDataStride * kMaxNumLights;
    ///////////////////////////////////////////////////////////////
    //光源GPUBUffer ,storage 
    // const lightsBuffer = scene.device.createBuffer({
    //   size: bufferSizeInByte,
    //   usage: GPUBufferUsage.STORAGE,
    //   mappedAtCreation: true,
    // });
    // //初始化光源：mapping
    // const lightData = new Float32Array(lightsBuffer.getMappedRange());
    // const tmpVec4 = vec4.create();
    // let offset = 0;
    // for (let i = 0; i < kMaxNumLights; i++) {
    //   offset = lightDataStride * i;
    //   // position
    //   for (let i = 0; i < 3; i++) {
    //     tmpVec4[i] = Math.random() * extent[i] + lightExtentMin[i];
    //   }
    //   tmpVec4[3] = 1;
    //   lightData.set(tmpVec4, offset);
    //   // color
    //   tmpVec4[0] = Math.random() * 2;
    //   tmpVec4[1] = Math.random() * 2;
    //   tmpVec4[2] = Math.random() * 2;
    //   // radius
    //   tmpVec4[3] = 20.0;
    //   lightData.set(tmpVec4, offset + 4);
    // }
    // lightsBuffer.unmap();
    // ///////////////////////////////////////////////////////////////
    // //动态光源的position的AABB ，uniform 
    // const lightExtentBuffer = scene.device.createBuffer({
    //   size: 4 * 8,
    //   usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    // });
    // const lightExtentData = new Float32Array(8);
    // lightExtentData.set(lightExtentMin, 0);
    // lightExtentData.set(lightExtentMax, 4);
    // scene.device.queue.writeBuffer(
    //   lightExtentBuffer,
    //   0,
    //   lightExtentData.buffer,
    //   lightExtentData.byteOffset,
    //   lightExtentData.byteLength
    // );
    // const settings = {
    //   mode: 'rendering',
    //   numLights: 128,
    // };
    // ///////////////////////////////////////////////////////////////
    // //光源数量 uniform
    // const configUniformBuffer = (() => {
    //   const buffer = scene.device.createBuffer({
    //     size: Uint32Array.BYTES_PER_ELEMENT,
    //     mappedAtCreation: true,
    //     usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    //   });
    //   new Uint32Array(buffer.getMappedRange())[0] = settings.numLights;
    //   buffer.unmap();
    //   return buffer;
    // })();


    // let uniforms: unifromGroup[] = [
    //   {
    //     layout: 0,
    //     entries: [
    //       {
    //         binding: 0,
    //         resource: {
    //           buffer: lightsBuffer
    //         },
    //       },
    //       {
    //         binding: 1,
    //         resource: {
    //           buffer: configUniformBuffer
    //         },
    //       },
    //       {
    //         binding: 2,
    //         resource: {
    //           buffer: lightExtentBuffer
    //         },
    //       },
    //     ]
    //   }
    // ];

    let lightsComputeOption: computeOptionOfCommand = {
      label: "dragon compute shader",
      compute: {
        code: this.computeshader,
        entryPoint: "main"
      },
      dispatchCount: [Math.ceil(kMaxNumLights / 64)],
      parent: scene,
      rawUniform: true,
      uniforms: uniforms,
    }
    let CC = new ComputeCommand(lightsComputeOption);
    this.commands.push(CC);
  }
  update() {
    return this.commands
  }
}


scene.addToScene(LightCC);

let uniformsDefer:uniformEntries[]=[
  {
     binding: 2,
     resource: {
       buffer: lightsBuffer
     },
   },
   {
     binding: 3,
     resource: {
       buffer: configUniformBuffer
     },
   },
]
let shaderMaterial = new ShaderMaterial({
   unifroms:uniformsDefer
});

let material = new ColorMaterial({
  color: {
    red: 0.5, green: 0.5, blue: 0.5, alpha: 1
  }
});
let model = new SimpleModel({
  data: simpleModelData.dragon,
  material:shaderMaterial,
  
})

scene.add(model)