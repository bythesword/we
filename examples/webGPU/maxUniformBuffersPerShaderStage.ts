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
      @group(0) @binding(0) var<uniform> u_color : vec4f;
      @group(0) @binding(1) var<uniform> u_color1 : vec4f;
      @group(0) @binding(2) var<uniform> u_color2 : vec4f;
      @group(0) @binding(3) var<uniform> u_color3 : vec4f;
      @group(0) @binding(4) var<uniform> u_color4 : vec4f;
      @group(0) @binding(5) var<uniform> u_color5 : vec4f;
      @group(0) @binding(6) var<uniform> u_color6 : vec4f;
      @group(0) @binding(7) var<uniform> u_color7 : vec4f;
      @group(0) @binding(8) var<uniform> u_color8 : vec4f;
      @group(0) @binding(9) var<uniform> u_color9 : vec4f;
      @group(0) @binding(10) var<uniform> u_color10 : vec4f;
      @group(0) @binding(11) var<uniform> u_color11 : vec4f;
      @group(0) @binding(12) var<uniform> u_color12 : vec4f;


      // @group(1) @binding(0) var<uniform> u_color100 : vec4f;
      // @group(2) @binding(0) var<uniform> u_color200 : vec4f;
      // @group(3) @binding(0) var<uniform> u_color300 : vec4f;


      struct OurVertexShaderOutput {
        @builtin(position) position: vec4f,
        @location(0) color: vec4f,
      };

      @vertex fn vs(
         @location(0) position : vec3f,
         @location(1) color : vec4f
      ) -> OurVertexShaderOutput {

      let color1=u_color1;
      let color2=u_color2;
      let color3=u_color3;
      let color4=u_color4;
      let color5=u_color5;
      let color6=u_color6;
      let color7=u_color7;
      let color8=u_color8;
      let color9=u_color9;
      let color10=u_color10;
      let color11=u_color11;
      let color12=u_color12;

      // let color100=u_color100;
      // let color200=u_color200;
      // let color300=u_color300;


        var vsOutput: OurVertexShaderOutput;
        vsOutput.position = vec4f(position,  1.0);
        vsOutput.color = color;
        return vsOutput;
      }

      @fragment fn fs(@location(0) color: vec4f) -> @location(0) vec4f {
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

const uniformBuffer = scene.device.createBuffer({
  size: 4 * 4,
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});
scene.device.queue.writeBuffer(
  uniformBuffer,
  0,
  uniformOneColor.buffer,
  uniformOneColor.byteOffset,
  uniformOneColor.byteLength
);

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
          label: "test color",
          binding: 1,
          size: 4 * 4,
          get: () => { return uniformOneColor },
        },
        {
          label: "test color",
          binding: 2,
          size: 4 * 4,
          get: () => { return uniformOneColor },
        },
        {
          label: "test color",
          binding: 3,
          size: 4 * 4,
          get: () => { return uniformOneColor },
        },
        {
          label: "test color",
          binding: 4,
          size: 4 * 4,
          get: () => { return uniformOneColor },
        },
        {
          label: "test color",
          binding: 5,
          size: 4 * 4,
          get: () => { return uniformOneColor },
        },
        {
          label: "test color",
          binding: 6,
          size: 4 * 4,
          get: () => { return uniformOneColor },
        },
        {
          label: "test color",
          binding: 7,
          size: 4 * 4,
          get: () => { return uniformOneColor },
        },
        {
          label: "test color",
          binding: 8,
          size: 4 * 4,
          get: () => { return uniformOneColor },
        },
        {
          label: "test color",
          binding: 9,
          size: 4 * 4,
          get: () => { return uniformOneColor },
        },
        {
          label: "test color",
          binding: 10,
          size: 4 * 4,
          get: () => { return uniformOneColor },
        },
        {
          label: "test color",
          binding: 11,
          size: 4 * 4,
          get: () => { return uniformOneColor },
        },
        {
          label: "test color",
          binding: 12,
          size: 4 * 4,
          get: () => { return uniformOneColor },
        }

      ]
    },
    // {
    //   layout: 1,
    //   entries: [
    //     {
    //       label: "test color",
    //       binding: 0,
    //       size: 4 * 4,
    //       get: () => { return uniformOneColor },
    //     },
    //   ]
    // },


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
