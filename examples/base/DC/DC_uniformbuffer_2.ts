import { Scene, sceneInputJson } from "../../../src/we/base/scene/scene"
import {
  DrawCommand,
  DrawOptionOfCommand,
  drawModeIndexed,
  drawMode,
  indexBuffer,
  unifromGroup,
  uniformEntries,
  uniformBufferPart,
  fsPart,
  vsPart,
  vsAttributes
} from "../../../src/we/base/command/DrawCommand"
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
      @group(0) @binding(0) var<uniform> u_color : vec4f;
      @group(0) @binding(1) var<uniform> u_uv : vec4f;//定义了,就必须用，不用报错

      struct OurVertexShaderOutput {
        @builtin(position) position: vec4f,
        @location(0) color: vec4f,
      };
      var<private > a:vec4f;
      fn test(){
             a=u_uv;//定义了,就必须用，不用报错
      }
      @vertex fn vs(
         @location(0) position : vec3f,
         @location(1) color : vec4f
      ) -> OurVertexShaderOutput {
        test();//这个也可以

        var vsOutput: OurVertexShaderOutput;
        vsOutput.position = vec4f(position,  1.0);
        vsOutput.color = color;
        return vsOutput;
      }

      @fragment fn fs(@location(0) color: vec4f) -> @location(0) vec4f {
      // let uv=u_uv;//定义了,就必须用，不用报错
        return u_color;
      }
`;
const oneTriangleVertexArray = [
  0.0, 0.5, 0, 1, 0, 0, 1,
  -0.5, -0.5, 0, 0, 1, 0, 1,
  0.5, -0.5, 0, 0, 0, 1, 1
];
const oneTriangleVertexF32A = new Float32Array(oneTriangleVertexArray);

const uniformOneColor = new Float32Array([1, 0, 0, 1]);
const uniformOneUV = new Float32Array([1, 0, 0, 1]);

// const uniformBuffer = scene.device.createBuffer({
//   size: 4 * 4,
//   usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
// });
// scene.device.queue.writeBuffer(
//   uniformBuffer,
//   0,
//   uniformOneColor.buffer,
//   uniformOneColor.byteOffset,
//   uniformOneColor.byteLength
// );

let options: DrawOptionOfCommand ={
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
      layout: 0,
      entries: [
        {
          label: "test color",
          binding: 0,
          size: 4 * 4,
          get: () => { return uniformOneColor },
        },
        {
          label: "test UV",
          binding: 1,
          size: 4 * 4,
          get: () => { return uniformOneUV },
        }
      ]
    }
  ],
  draw: {
    mode: "draw",
    values: {
      vertexCount: 3
    }
  },
  rawUniform: true,
}

let DC = new DrawCommand(options);
// await DC.init();
window.DC = DC;
DC.submit()
scene.postProcess();