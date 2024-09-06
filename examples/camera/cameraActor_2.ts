/**
 * step
 * 1、合批shader，const
 * 2、shader MVP + 调用原来shader的entryPoint
 * 3、Camera Actor ，
 *  bind camera
 *  bind control
 * 
 * demo
 * 1、shader const + 合批 + 单位矩阵的MVP  （本页面）
 *V  A、MVP单位矩阵  
 *V  B、uniform bind group  0，JS
 *V  C、system WGSL string  group 0  (预定各种变量名称)
 *V不适用  D、const WGSL测试   :这个只能是数值
 *V  E、合并WGSL，增加entryPoint的新入口的调用
 * 
 * 2、绑定Actor ，绑定camera，绑定control，生成MVP（一次） 
 * 3、帧循环+ control交互=>摄像机MVP
 */
import { Scene, sceneInputJson } from "../../src/we/base/scene/scene"
import {
  DrawCommand,
  drawOptionOfCommand,
} from "../../src/we/base/command/DrawCommand"
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

        vsOutput.position = modelMatrix *  viewMatrix *   projectionMatrix * vec4f(position,  1.0);
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
  0.0, 0.5, 0, 1, 0, 0, 1,
  -0.5, -0.5, 0, 0, 1, 0, 1,
  0.5, -0.5, 0, 0, 0, 1, 1
];
const oneTriangleVertexF32A = new Float32Array(oneTriangleVertexArray);

const uniformOneColor = new Float32Array([1, 0, 1, 1]);


let options: drawOptionOfCommand ={
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
// await DC.init();
window.DC = DC;
DC.submit()
