import { Scene, sceneInputJson } from "../../../src/we/base/scene/scene"
import {
  DrawCommand,
  drawOptionOfCommand,
  drawModeIndexed,
  drawMode,
  indexBuffer,
  fsPart,
  vsPart,
  vsAttributes
} from "../../../src/we/base/command/DrawCommand"
// import { stageOne } from "../../../src/we/base/stage/baseStage"
declare global {
  interface Window {
    scene: any
    DC: any
  }
}
let input: sceneInputJson = {
  canvas: "render",
  renderPassSetting: {
    color: {
      clearValue: [0.5, 0.5, 0.5, 1]
    }
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
        offset: vec3f,
      };
 
      @group(0) @binding(0) var<uniform> ourStruct: UniOurStruct;

      @vertex fn vs(
         @location(0) position : vec3f,
         @builtin(vertex_index) vertexIndex : u32
      ) -> OurVertexShaderOutput {
        let a =vertexIndex;
        var  n =   f32(a);
        var vsOutput: OurVertexShaderOutput;
        vsOutput.position = vec4f(position-ourStruct.offset,  1.0);

        vsOutput.color = ourStruct.color;//uniform grouop

        return vsOutput;
      }

      struct FragmentOutput {
        @builtin(frag_depth) depth: f32,
        @location(0) color: vec4f
      }
      

        
      @fragment fn fs(
        @location(0) color: vec4f,
        @builtin(position) pos:vec4f,
      ) -> @location(0) vec4f {  return color;}
      // ) -> FragmentOutput   {    
      //   var output:FragmentOutput;
      //   output.color=color;
      //   output.depth=pos.z;
      //   return output;
      // }
`;
const oneTriangleVertexArray = [
  0.0, 0.5, 0., 
  -0.5, -0.5, 1, 
  0.5, -0.5, 0
];
const oneTriangleVertexF32A = new Float32Array(oneTriangleVertexArray);




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
        arrayStride: 4 * 3,
        attributes: [
          {
            shaderLocation: 0,
            offset: 0,
            format: 'float32x3',
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
                1, 0, 0, 1,
                0.1,0
                // rand(-0.51, 0.51), rand(-0.51, 0.51), 0,
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



const oneTriangleVertexArray_1 = [
  0.0, 0.5, 1, 
  -0.5, -0.5, 0, 
  0.5, -0.5, 0,
];
const oneTriangleVertexF32A_1 = new Float32Array(oneTriangleVertexArray_1);


let options1: drawOptionOfCommand = {
  label: "a triangle",
  scene: scene,
  vertex: {
    code: shader,
    entryPoint: "vs",
    buffers: [
      {
        vertexArray: oneTriangleVertexF32A_1,
        type: "Float32Array",
        arrayStride: 4 * 3,
        attributes: [
          {
            shaderLocation: 0,
            offset: 0,
            format: 'float32x3',
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
                0, 0, 1, 1,
                -0.1, 0
                // rand(-0.31, 0.31), rand(-0.51, 0.51), 0,
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



let red = new DrawCommand(options);

let blue = new DrawCommand(options1);
(<GPURenderPassColorAttachment[]>scene.renderPassDescriptor.colorAttachments)[0].loadOp = "clear";
red.update();

(<GPURenderPassColorAttachment[]>scene.renderPassDescriptor.colorAttachments)[0].loadOp = "load";
scene.renderPassDescriptor.depthStencilAttachment!.depthLoadOp = "load"
blue.update()

// scene.stages["World"].opaque!.command.push(DC);
// scene.stages["World"].opaque!.command.push(DC1);
// scene.run()

scene.postProcess();