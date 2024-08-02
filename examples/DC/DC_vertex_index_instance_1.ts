import { Scene, sceneInputJson } from "../../src/we/base/scene/scene"
import {
  DrawCommand,
  drawOption,
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
     struct UniOurStruct {
        color: vec4f,
        offset: vec3f,
      };
 
      @group(0) @binding(0) var<uniform> ourStruct: UniOurStruct;

      @vertex fn vs(
         @location(0) position : vec3f,
         @location(1) color : vec4f,
         @builtin(instance_index) instanceIndex : u32
      ) -> OurVertexShaderOutput {
        let a =instanceIndex;
        var  n =   f32(a);

        var vsOutput: OurVertexShaderOutput;
        vsOutput.position = vec4f(position-ourStruct.offset*vec3f((n+1)*0.5),  1.0);
        vsOutput.color = ourStruct.color+vec4f((n+1.)*0.15);
        return vsOutput;
      }

      @fragment fn fs(@location(0) color: vec4f) -> @location(0) vec4f {
        return color;
      }
`;
const oneTriangleVertexArray = [
  0.0, 0.5, 0, 1, 0, 0, 1,
  -0.5, -0.5, 0, 1, 1, 0, 1,
  0.5, -0.5, 0, 1, 0, 1, 1
];
const oneTriangleVertexF32A = new Float32Array(oneTriangleVertexArray);

const indexBuffer = new Uint32Array([0, 1, 2]);
const rand = (min:number=0, max:number=1) => {
  if (min === undefined) {
    min = 0;
    max = 1;
  } else if (max === undefined) {
    max = min;
    min = 0;
  }
  return min + Math.random() * (max - min);
};

let options: drawOption = {
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
  uniforms: [
    {
      layout: 0,
      entries: [
        {
          label: "test color",
          binding: 0,
          /** 这个需要数据对齐的 
           * 4+3=7，对齐=8
          */
          size: 4*8,//uniformOneColor.byteLength,
          get: () => { 
            const uniformOneColor=
            new Float32Array([
              rand(), rand(), rand(), 1,
              rand(-0.51,0.51), rand(-0.51,0.51), 0,
            ]);
            return             uniformOneColor
           },
          // update: false,
        }
      ]
    }
  ],
  indexBuffer: {
    buffer: indexBuffer,
    // size: 2 * 3
  },
  draw: {
    mode: "index",
    values: {
      indexCount: 3,
      instanceCount:3

    }
  },
  instanceCount: 3,
  rawUniform: true,
  // }
}

let DC = new DrawCommand(options);
await DC.init();
window.DC = DC;
DC.submit()
