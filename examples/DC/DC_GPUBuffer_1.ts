import { Scene, sceneInputJson } from "../../src/we/base/scene/scene"
import {
  DrawCommand,
  drawOptionOfCommand,
  drawModeIndexed,
  drawMode,
  indexBuffer,
  unifromGroup,
  uniformEntries,
  uniformBufferPart,
  fsPart,
  vsPart,
  vsAttributes
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
      struct OurVertexShaderOutput {
        @builtin(position) position: vec4f,
        @location(0) color: vec4f,
      };

      @vertex fn vs(
         @location(0) position : vec3f,
         @location(1) color : vec4f
      ) -> OurVertexShaderOutput {


        var vsOutput: OurVertexShaderOutput;
        vsOutput.position = vec4f(position,  1.0);
        vsOutput.color = color;
        return vsOutput;
      }

      @fragment fn fs(@location(0) color: vec4f) -> @location(0) vec4f {
        return color*0.6;
      }
`;
const oneTriangleVertexArray = [
  0.0, 0.5, 0, 1, 0, 0, 1,
  -0.5, -0.5, 0, 1, 0, 0, 1,
  0.5, -0.5, 0, 0, 0, 1, 1
];
const oneTriangleVertexF32A = new Float32Array(oneTriangleVertexArray);


const verticesBuffer = scene.device.createBuffer({
  label: "vertex buffer for GPU",
  size: oneTriangleVertexF32A.byteLength,
  usage: GPUBufferUsage.VERTEX,
  mappedAtCreation: true,
});

new Float32Array(verticesBuffer.getMappedRange()).set(oneTriangleVertexF32A);
verticesBuffer.unmap();


let options: drawOptionOfCommand ={
  label: "a triangle",
  scene: scene,
  vertex: {
    code: shader,
    entryPoint: "vs",
    buffers: [
      {
        vertexArray: verticesBuffer,
        type: "GPUBuffer",
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
  uniforms: [  ],
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
