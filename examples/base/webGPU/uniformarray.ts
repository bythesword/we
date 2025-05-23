import { Scene, sceneInputJson } from "../../../src/we/base/scene/scene"
import {
  DrawCommand,
  DrawOptionOfCommand} from "../../../src/we/base/command/DrawCommand"
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
      @group(0) @binding(0) var<uniform> u_color :array< vec4f,3>;
      @group(0) @binding(1) var<uniform> u_color1 :array< vec4f,3>;

      struct OurVertexShaderOutput {
        @builtin(position) position: vec4f,
        @location(0) color: vec4f,
      };

      @vertex fn vs(
         @location(0) position : vec3f,
         @location(1) color : vec4f
      ) -> OurVertexShaderOutput {

  let color0:vec4f= u_color[2];
        let abc=u_color1;
        var vsOutput: OurVertexShaderOutput;
        vsOutput.position = vec4f(position,  1.0);
        vsOutput.color = color0;
        return vsOutput;
      }

      @fragment fn fs(@location(0) color: vec4f) -> @location(0) vec4f {
        return color;
      }
`;
const oneTriangleVertexArray = [
  0.0, 0.5, 0, 1, 0, 0, 1,
  -0.5, -0.5, 0, 0, 1, 0, 1,
  0.5, -0.5, 0, 0, 0, 1, 1
];
const oneTriangleVertexF32A = new Float32Array(oneTriangleVertexArray);

const uniformOneColor = new Float32Array([1, 0, 0, 1,
  0, 1, 0, 1,
  0, 0, 1, 1,]);

const uniformBuffer = scene.device.createBuffer({
  size: 4 * 4 * 3,
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});
scene.device.queue.writeBuffer(
  uniformBuffer,
  0,
  uniformOneColor.buffer,
  uniformOneColor.byteOffset,
  uniformOneColor.byteLength
);

let options: DrawOptionOfCommand = {
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
          size: 4 * 4 * 3,
          get: () => { return uniformOneColor },
        },
        {
          label: "test color",
          binding: 1,
          size: 4 * 4 * 3,
          get: () => { return uniformOneColor },
        },

      ]
    },



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
