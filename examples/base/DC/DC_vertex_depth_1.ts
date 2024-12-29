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
let input: sceneInputJson = {
  canvas: "render",
  depthStencil: {
    depthWriteEnabled: true,
    depthCompare: 'less',
    format: 'depth24plus',
  }
}
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
        offset: vec2f,
        depth:f32
      };
 
      @group(0) @binding(0) var<uniform> ourStruct: UniOurStruct;

      @vertex fn vs(
         @location(0) position : vec3f,
         @location(1) color : vec4f,
         @builtin(vertex_index) vertexIndex : u32
      ) -> OurVertexShaderOutput {
        let a =vertexIndex;
        var  n =   f32(a);
        var vsOutput: OurVertexShaderOutput;
        vsOutput.position = vec4f(position.xy-ourStruct.offset,ourStruct.depth,  1.0);
        // vsOutput.position = vec4f(position.xy-ourStruct.offset,(10.0-n)/10.0,  1.0);

        vsOutput.color = ourStruct.color;
        return vsOutput;
      }

      @fragment fn fs(@location(0) color: vec4f) -> @location(0) vec4f {
        return color;
      }
`;
const oneTriangleVertexArray = [
  0.0, 0.5, 1, 1, 0, 0, 1,
  -0.5, -0.5, 1, 0, 1, 0, 1,
  0.5, -0.5, 1, 0, 0, 1, 1
];
const oneTriangleVertexF32A = new Float32Array(oneTriangleVertexArray);


// instance color + offset
const uniformOneColor = new Float32Array([
  1, 0, 0, 1, 0.5, 0.5, 0,

]);

const rand = (min: number = 0, max: number = 1) => {
  if (min === undefined) {
    min = 0;
    max = 1;
  } else if (max === undefined) {
    max = min;
    min = 0;
  }
  return min + Math.random() * (max - min);
};


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
          size: 4 * 8,//uniformOneColor.byteLength,
          get: () => {
            const uniformOneColor =
              new Float32Array([
                0, 1, 0, 1,
                rand(-0.51, 0.51), rand(-0.51, 0.51), 0.1,
              ]);
            return uniformOneColor
          },
          // update: false,
        }
      ]
    }
  ],
  draw: {
    mode: "draw",
    values: {
      vertexCount: 3,
      instanceCount: 2
    }
  },
  rawUniform: true,
  // }
}

let DC = new DrawCommand(options);

window.DC = DC;
DC.submit()


///////////////////////////////////////////////////////////////////////
let shader1 = `
      struct OurVertexShaderOutput {
        @builtin(position) position: vec4f,
        @location(0) color: vec4f,
      };

     struct UniOurStruct {
        color: vec4f,
        offset: vec2f,
        depth:f32
      };
 
    @group(0) @binding(0) var<uniform> ourStruct: UniOurStruct;
    @group(0) @binding(1) var mySampler: sampler;
    // @group(0) @binding(2) var myTexture: texture_2d<f32>;

      @vertex fn vs(
         @location(0) position : vec3f,
         @location(1) color : vec4f,
         @builtin(vertex_index) vertexIndex : u32
      ) -> OurVertexShaderOutput {
        let a =vertexIndex;
        var  n =   f32(a);
        var vsOutput: OurVertexShaderOutput;
        vsOutput.position = vec4f(position.xy-ourStruct.offset,ourStruct.depth,  1.0);
        // vsOutput.position = vec4f(position.xy-ourStruct.offset,(10.0-n)/10.0,  1.0);

        vsOutput.color = ourStruct.color;
        return vsOutput;
      }

      @fragment fn fs(@location(0) color: vec4f) -> @location(0) vec4f {
        return color;
      }
`;
const sampler = scene.device.createSampler({
  magFilter: "nearest",
  minFilter: "nearest",
});

let options1: DrawOptionOfCommand ={
  label: "a triangle",
  scene: scene,
  vertex: {
    code: shader1,
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
    code: shader1,
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
          size: 4 * 8,//uniformOneColor.byteLength,
          get: () => {
            const uniformOneColor =
              new Float32Array([
                1, 0, 0, 1,
                rand(-0.31, 0.31), rand(-0.51, 0.51), 0.80,
              ]);
            return uniformOneColor
          },
          // update: false,
        },
        {
          binding: 1,
          // label: "sssssss===========",
          resource: sampler,
        },
        // {
        //   binding: 2,
        //   // label: "tttt===========",
        //   resource: scene.depthStencilAttachment,
        // },
      ]
    }
  ],
  draw: {
    mode: "draw",
    values: {
      vertexCount: 3,
      instanceCount: 2
    }
  },
  rawUniform: true,
  // }
}
let DC1 = new DrawCommand(options1);
// await DC.init();
// window.DC1 = DC1;
DC1.submit()
scene.postProcess();