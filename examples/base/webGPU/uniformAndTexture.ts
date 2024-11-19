import { Scene, sceneInputJson } from "../../../src/we/base/scene/scene"
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

      @group(0) @binding(13) var ourSampler: sampler;
      @group(0) @binding(14) var ourTexture: texture_2d<f32>;

      struct OurVertexShaderOutput {
        @builtin(position) position: vec4f,
        @location(0) color: vec4f,
        @location(1) uv: vec2f,
      };

      @vertex fn vs(
         @location(0) position : vec3f,
         @location(1) color : vec4f,
         @location(2) uv : vec2f
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


        var vsOutput: OurVertexShaderOutput;
        vsOutput.position = vec4f(position,  1.0);
        vsOutput.color = color;
        vsOutput.uv = uv;
        return vsOutput;
      }
      
      @fragment fn fs(fsInput: OurVertexShaderOutput) -> @location(0) vec4f {
        // return u_color;
        let abc=u_color;
        return textureSample(ourTexture, ourSampler, fsInput.uv);
      }
`;
const oneTriangleVertexArray = [
  0.0, 0.5, 0, 1, 0, 0, 1, 0.5, 0,
  -0.5, -0.5, 0, 0, 1, 0, 1, 0, 1,
  0.5, -0.5, 0, 0, 0, 1, 1, 1, 1
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
/////////////////////////////////////////////////////////////////
//sampler ,texture
const sampler = scene.device.createSampler();

const kTextureWidth = 5;
const kTextureHeight = 7;
const _ = [255, 0, 0, 255];  // red
const y = [255, 255, 0, 255];  // yellow
const b = [0, 0, 255, 255];  // blue
const textureData = new Uint8Array([
  b, _, _, _, _,
  _, y, y, y, _,
  _, y, _, _, _,
  _, y, y, _, _,
  _, y, _, _, _,
  _, y, _, _, _,
  _, _, _, _, _,
].flat());

const texture = scene.device.createTexture({
  label: 'yellow F on red',
  size: [kTextureWidth, kTextureHeight],
  format: 'rgba8unorm',
  usage:
    GPUTextureUsage.TEXTURE_BINDING |
    GPUTextureUsage.COPY_DST,
});
scene.device.queue.writeTexture(
  { texture },
  textureData,
  { bytesPerRow: kTextureWidth * 4 },
  { width: kTextureWidth, height: kTextureHeight },
);


///////////////////////////
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
        arrayStride: 4 * 9,
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
          {
            shaderLocation: 2,
            offset: 28,
            format: 'float32x2',
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
        },
        { binding: 13, resource: sampler ,label:"sampler=============="},
        { binding: 14, resource: texture.createView() ,label:"textureView==========="},
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
