/**
 * step
 * 1、合批shader，const
 * 2、shader MVP + 调用原来shader的entryPoint
 * 3、Camera Actor ，
 *  bind camera
 *  bind control
 * 
 * demo
 * 1、shader const + 合批 + 单位矩阵的MVP  
 *V  A、MVP单位矩阵  
 *V  B、uniform bind group  0，JS
 *V  C、system WGSL string  group 0  (预定各种变量名称)
 *V不适用  D、const WGSL测试   :这个只能是数值
 *V  E、合并WGSL，增加entryPoint的新入口的调用
 * 
 * 
* 
 * 
 * 2、绑定Actor ，绑定camera，绑定control，生成MVP（一次） 
 * A、CameraActor 绑定cemera，init or bind
 *    * 生成CameraActor的 camera的MVP，指定位置的，比如（0,0,5)
 * B、CameraActor bind camearControl ,init or bind
 * C、Scene 的Actor 逻辑，顶级数组 以及 defaultActor
 * D、Scene 绑定 Actor
 * 
 * 
 * 
 * （本页面）
 *  
 * 3、帧循环+ control交互=>摄像机MVP
 */
import { PerspectiveCamera, optionPerspProjection } from "../../src/we/base/camera/perspectiveCamera"
import { ArcballCameraControl } from "../../src/we/base/control/arcballCameraControl"
import { CamreaControl, optionCamreaControl } from "../../src/we/base/control/cameracCntrol"
import { CameraActor, optionCameraActor } from "../../src/we/base/actor/cameraActor"

import { Scene, sceneInputJson } from "../../src/we/base/scene/scene"
import { DrawCommand, drawOptionOfCommand } from "../../src/we/base/command/DrawCommand"
import { OrthographicCamera, optionOrthProjection } from "../../src/we/base/camera/orthographicCamera"
// import { stageOne } from "../../src/we/base/stage/baseStage"
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


const cameraOption: optionOrthProjection = {
  left: -1,
  right: 1,
  top: 1,
  bottom: -1,
  near: 0.0001,
  far: 100,
  position: [0, 0, 5],
  lookAt: [0, 0, 0]
}
let camera = new OrthographicCamera(cameraOption);

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
// console.log(actor)
scene.addCameraActor(actor, true)
// scene.updateSystemUniformBuffer();

// scene.requestAnimationFrame();
//这里color输出乘以了0.16,为了区别表现
let shader = `
      @group(1) @binding(0) var<uniform> u_c : vec4f;
      @group(2) @binding(0) var<uniform> u_color : vec4f;

      struct OurVertexShaderOutput {
        @builtin(position) position: vec4f,
        @location(0) color: vec4f,
      };

      @vertex fn vs(
         @location(0) position : vec3f,
         @location(1) color : vec4f
      ) -> OurVertexShaderOutput {
        var vsOutput: OurVertexShaderOutput;

        vsOutput.position = projectionMatrix *viewMatrix * modelMatrix *     vec4f(position,  1.0);
        // vsOutput.position = U_MVP.model * U_MVP.view * U_MVP.projection * vec4f(position,  1.0);

        vsOutput.color = color;
        return vsOutput;
      }

      @fragment fn fs(@location(0) color: vec4f) -> @location(0) vec4f {
       let abc=u_c;
        return u_color;
      }
`;
const oneTriangleVertexArray = [
  0.0, 0.5, 1.1, 1, 0, 0, 1,
  -0.5, -0.5, 0, 0, 1, 0, 1,
  0.5, -0.5, 0, 0, 0, 1, 1
];
const oneTriangleVertexF32A = new Float32Array(oneTriangleVertexArray);

const uniformOneColor = new Float32Array([1, 0, 1, 1]);


let options: drawOptionOfCommand = {
  label: "a triangle",
  scene: scene,
  vertex: {
    code: shader,
    entryPoint: "vs",
    buffers: [
      {
        vertexArray: oneTriangleVertexF32A,
        type: "Float32Array",
        arrayStride: 4 * 7,
        attributes: [
          {
            shaderLocation: 0,
            offset: 0,
            format: 'float32x3',
          },
          {
            shaderLocation: 1,
            offset: 12,
            format: 'float32x4',
          },
        ]
      }
    ]
  },
  fragment: {
    code: shader,
    entryPoint: "fs",
    targets: [{ format: scene.presentationFormat }]
  },
  primitive: {
    topology: 'triangle-list',
    cullMode: 'none',
  },
  // uniforms: [],
  uniforms: [
    {
      layout: 1,
      entries: [
        {
          label: "test color",
          binding: 0,
          size: 4 * 4,
          get: () => { return uniformOneColor },
        }
      ]
    },
    {
      layout: 2,
      entries: [
        {
          label: "test color",
          binding: 0,
          size: 4 * 4,
          get: () => { return uniformOneColor },
        }
      ]
    }
  ],
  // rawUniform: true,
  draw: {
    mode: "draw",
    values: {
      vertexCount: 3
    }
  },
}

let DC = new DrawCommand(options);
window.DC = DC;
/**
 * //20240905这里暂时不能用了，应用stage的update清空了command[],,这个参见red box吧
 * 20240906,完善了stage的cache，可以正常工作了
 */
scene.stages["World"].opaque!.command.push(DC);
scene.stages["World"].opaque!.cache = true;
scene.run()
