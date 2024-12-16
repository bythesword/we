import { Scene, sceneInputJson } from "../../../../src/we/base/scene/scene"
import {
  DrawCommand,
  drawOptionOfCommand,

} from "../../../../src/we/base/command/DrawCommand"
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





const oneTriangleVertexArray = [
  0.0, 0.5, 0, 1, 0, 0, 1,
  -0.5, -0.5, 0, 1, 1, 0, 1,
  0.5, -0.5, 1, 1, 0, 1, 1
];
const oneTriangleVertexF32A = new Float32Array(oneTriangleVertexArray);
const indexBuffer = new Uint32Array([0, 1, 2]);



let shader = `
      struct OurVertexShaderOutput {
        @builtin(position) position: vec4f,
        @location(0) color: vec4f,
      };
     struct UniOurStruct {
        color: vec4f,
        offset: vec3f,
      };
 

      @vertex fn vs(
         @location(0) position : vec3f,
         @location(1) color : vec4f,
         @builtin(instance_index) instanceIndex : u32
      ) -> OurVertexShaderOutput {
        let a =instanceIndex;
        var  n =   f32(a);
        
        var vsOutput: OurVertexShaderOutput;
        vsOutput.position = vec4f(position+vec3f((n)*0.25),  1.0);
        
        vsOutput.color = vec4f((n+1.)*0.15);
        return vsOutput;
      }

      @fragment fn fs( @builtin(position) position: vec4f) -> @location(0)  vec4f{
         var color=vec4f(position.z,position.z,position.z,1);
        return color;
      }
`;

let rawColorTextureDepth = scene.device.createTexture({
  size: [scene.canvas.width, scene.canvas.height],
  format: scene.presentationFormat,
  usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC | GPUTextureUsage.COPY_DST | GPUTextureUsage.TEXTURE_BINDING,
});
let rawDepthTextureDepth = scene.device.createTexture({
  size: [scene.canvas.width, scene.canvas.height],
  format: scene.depthDefaultFormat,
  usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC | GPUTextureUsage.COPY_DST | GPUTextureUsage.TEXTURE_BINDING,
});
scene.rawColorAttachmentTargets = [
  // color
  { format: scene.presentationFormat },
];
let renderPassDescriptorDepth: GPURenderPassDescriptor = {
  label: "stage:forward render pass descriptor",
  // colorAttachments: [],
  colorAttachments: [
    // {
    //   view: rawColorTextureDepth.createView(),
    //   clearValue: [0, 0, 0, 0],
    //   loadOp: 'clear',
    //   storeOp: "store"
    // }
  ],
  depthStencilAttachment: {
    view: rawDepthTextureDepth.createView(),
    depthClearValue: 1,
    // depthLoadOp: 'load',
    depthLoadOp: 'clear',
    depthStoreOp: 'store',
  },
};

let options: drawOptionOfCommand = {
  renderPassDescriptor: renderPassDescriptorDepth,
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
  // fragment: {
  //   code: shader,
  //   entryPoint: "fs",
  //   targets: [
  //     { format: scene.presentationFormat },
  //   ]
  // },
  uniforms: [],
  indexBuffer: {
    buffer: indexBuffer,
    // size: 2 * 3
  },
  draw: {
    mode: "index",
    values: {
      indexCount: 3,
      instanceCount: 3
    }
  },
  rawUniform: true,
  // }
}
let DC = new DrawCommand(options);
DC.submit()



let rawColorTexture = scene.device.createTexture({
  size: [scene.canvas.width, scene.canvas.height],
  format: scene.presentationFormat,
  usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC | GPUTextureUsage.COPY_DST | GPUTextureUsage.TEXTURE_BINDING,
});
let rawDepthTexture = scene.device.createTexture({
  size: [scene.canvas.width, scene.canvas.height],
  format: scene.depthDefaultFormat,
  usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC | GPUTextureUsage.COPY_DST | GPUTextureUsage.TEXTURE_BINDING,
});
scene.rawColorAttachmentTargets = [
  // color
  { format: scene.presentationFormat },
];
let renderPassDescriptorColor: GPURenderPassDescriptor = {
  label: "stage:forward render pass descriptor",
  colorAttachments: [
    {
      view: rawColorTexture.createView(),
      clearValue: [0, 0, 0, 0],
      loadOp: 'clear',
      storeOp: "store"
    }
  ],
  depthStencilAttachment: {
    view: rawDepthTexture.createView(),
    depthClearValue: 1,
    // depthLoadOp: 'load',
    depthLoadOp: 'clear',
    depthStoreOp: 'store',
  },
};
let shaderColor = `
      struct OurVertexShaderOutput {
        @builtin(position) position: vec4f,
        @location(0) color: vec4f,
      };
     struct UniOurStruct {
        color: vec4f,
        offset: vec3f,
      };
  

      @vertex fn vs(
         @location(0) position : vec3f,
         @location(1) color : vec4f,
         @builtin(instance_index) instanceIndex : u32
      ) -> OurVertexShaderOutput {
        let a =instanceIndex;
        var  n =   f32(a);
        
        var vsOutput: OurVertexShaderOutput;
        vsOutput.position = vec4f(position+vec3f((n)*0.25),  1.0);
        
        vsOutput.color = vec4f((n+1.)*0.15);
        return vsOutput;
      }

 
      
      @group(0) @binding(0) var u_DeferDepth : texture_depth_2d;

      @fragment fn fs( @builtin(position) position: vec4f) -> @location(0)  vec4f{
        let depth0 = textureLoad(u_DeferDepth, vec2i(floor(position.xy)), 0);
        
        let uv = position.xy / vec2f(600.0, 600.0);
        var color=vec4f(position.z,position.z,position.z,1);

         if uv.y< 0.5  {
              color = vec4f(depth0, depth0, depth0, 1);
          }
        return color;
      }
`;
let optionsColor: drawOptionOfCommand = {
  renderPassDescriptor: renderPassDescriptorColor,
  label: "a triangle",
  scene: scene,
  vertex: {
    code: shaderColor,
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
    code: shaderColor,
    entryPoint: "fs",
    targets: [
      { format: scene.presentationFormat },
    ]
  },
  uniforms: [
    {
      layout: 0,
      entries: [
        {
          label: "depth texture",
          binding: 0,
          resource: rawDepthTextureDepth.createView()
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
      instanceCount: 3
    }
  },
  rawUniform: true,
  // }
}
let DCColor = new DrawCommand(optionsColor);
DCColor.submit()


// scene.copyRawToSurface();
scene.copyTextureToTexture(rawColorTexture, (scene.context as GPUCanvasContext).getCurrentTexture(), { width: scene.canvas.width, height: scene.canvas.height });