import { mat4, vec3 } from 'wgpu-matrix';
import { GUI } from 'dat.gui';
import {
  cubeVertexArray,
  cubeVertexSize,
  cubeUVOffset,
  cubePositionOffset,
  cubeVertexCount,
} from '../meshes/cube';
import cubeWGSL from "./cube.wgsl?raw";
import { ArcballCamera, WASDCamera } from './camera';
import { createInputHandler } from './input';

//获取canvas
const canvas = document.querySelector('canvas') as HTMLCanvasElement;

//输入的句柄 The input handler
const inputHandler = createInputHandler(window, canvas);

// The camera types  摄像机参数
const initialCameraPosition = vec3.create(0, 0, 5);//位置
const cameras = {
  arcball: new ArcballCamera({ position: initialCameraPosition }),
  WASD: new WASDCamera({ position: initialCameraPosition }),
};

//初始化新的GUI
const gui = new GUI();

// GUI parameters
const params: { type: 'arcball' | 'WASD' } = {
  type: 'arcball',
};

// Callback handler for camera mode,
let oldCameraType = params.type;
gui.add(params, 'type', ['arcball', 'WASD']).onChange(() => {
  // Copy the camera matrix from old to new,同步与复制两种摄像机的矩阵
  const newCameraType = params.type;
  cameras[newCameraType].matrix = cameras[oldCameraType].matrix;
  oldCameraType = newCameraType;
});

const adapter = await navigator.gpu.requestAdapter();
const device = await adapter.requestDevice();
const context = canvas.getContext('webgpu') as GPUCanvasContext;

const devicePixelRatio = window.devicePixelRatio;//设备像素比
canvas.width = canvas.clientWidth * devicePixelRatio;
canvas.height = canvas.clientHeight * devicePixelRatio;
const presentationFormat = navigator.gpu.getPreferredCanvasFormat();

context.configure({
  device,
  format: presentationFormat,
  alphaMode: 'premultiplied',//预乘透明度
});

//创建 顶点buffer Create a vertex buffer from the cube data.
const verticesBuffer = device.createBuffer({
  size: cubeVertexArray.byteLength,
  usage: GPUBufferUsage.VERTEX,
  mappedAtCreation: true,
});
//设置顶点数据，然后unmap（将访问权返回GPU）
new Float32Array(verticesBuffer.getMappedRange()).set(cubeVertexArray);
verticesBuffer.unmap();

const pipeline = device.createRenderPipeline({
  layout: 'auto',
  vertex: {
    module: device.createShaderModule({
      code: cubeWGSL,
    }),
    entryPoint: "vertex_main",
    buffers: [
      {
        arrayStride: cubeVertexSize,
        attributes: [
          {
            // position
            shaderLocation: 0,
            offset: cubePositionOffset,
            format: 'float32x4',
          },
          {
            // uv
            shaderLocation: 1,
            offset: cubeUVOffset,
            format: 'float32x2',
          },
        ],
      },
    ],
  },
  fragment: {
    module: device.createShaderModule({
      code: cubeWGSL,
    }),
    entryPoint: "fragment_main",
    targets: [
      {
        format: presentationFormat,
      },
    ],
  },
  primitive: {
    topology: 'triangle-list',
    cullMode: 'back',
  },
  depthStencil: {
    depthWriteEnabled: true,
    depthCompare: 'less',
    format: 'depth24plus',
  },
});

//深度buffer
const depthTexture = device.createTexture({
  size: [canvas.width, canvas.height],
  format: 'depth24plus',
  usage: GPUTextureUsage.RENDER_ATTACHMENT,
});

//uniform  矩阵
const uniformBufferSize = 4 * 16; // 4x4 matrix
const uniformBuffer = device.createBuffer({
  size: uniformBufferSize,
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});

//创建GPU纹理，并copy png 到纹理
// Fetch the image and upload it into a GPUTexture.
let cubeTexture: GPUTexture;
{
  const response = await fetch('../image/webgpu.png');
  const imageBitmap = await createImageBitmap(await response.blob());
  console.log(typeof(imageBitmap));
  cubeTexture = device.createTexture({
    size: [imageBitmap.width, imageBitmap.height, 1],
    format: 'rgba8unorm',
    usage:
      GPUTextureUsage.TEXTURE_BINDING |
      GPUTextureUsage.COPY_DST |
      GPUTextureUsage.RENDER_ATTACHMENT,
  });
  console.log(typeof(cubeTexture),"usage" in cubeTexture);
  device.queue.copyExternalImageToTexture(
    { source: imageBitmap },
    { texture: cubeTexture },
    [imageBitmap.width, imageBitmap.height]
  );
}

//创建采样
// Create a sampler with linear filtering for smooth interpolation.
const sampler = device.createSampler({
  magFilter: 'linear',
  minFilter: 'linear',
});


//创建bindgroup，以后到group 0的位置
const uniformBindGroup = device.createBindGroup({
  layout: pipeline.getBindGroupLayout(0),
  entries: [
    {
      binding: 0,
      resource: {
        buffer: uniformBuffer,
      },
    },
    {
      binding: 1,
      resource: sampler,
    },
    {
      binding: 2,
      resource: cubeTexture.createView(),
    },
  ],
});

//创建渲染通道描述
const renderPassDescriptor: GPURenderPassDescriptor = {
  colorAttachments: [
    {
      view: context
      .getCurrentTexture()
      .createView(), // Assigned later
      clearValue: [0.5, 0.5, 0.5, 1.0],
      loadOp: 'clear',
      storeOp: 'store',
    },
  ],
  depthStencilAttachment: {
    view: depthTexture.createView(),

    depthClearValue: 1.0,
    depthLoadOp: 'clear',
    depthStoreOp: 'store',
  },
};

//scene 基础部分
const aspect = canvas.width / canvas.height;
const projectionMatrix = mat4.perspective((2 * Math.PI) / 5, aspect, 1, 100.0);
const modelViewProjectionMatrix = mat4.create();
console.log(projectionMatrix)

//获取更新后的摄像机矩阵
function getModelViewProjectionMatrix( deltaTime: number,startTime:number,lastTime:number) {
  const camera = cameras[params.type];
  const viewMatrix = camera.update(deltaTime, inputHandler());
  mat4.multiply(projectionMatrix, viewMatrix, modelViewProjectionMatrix);
  return modelViewProjectionMatrix as Float32Array;
}

let lastFrameMS = Date.now();


function frame() {
  const now = Date.now();
  const deltaTime = (now - lastFrameMS) / 1000;
  lastFrameMS = now;

  const modelViewProjection = getModelViewProjectionMatrix(deltaTime,startTime,lastTime);

  //每次写摄像机的矩阵
  device.queue.writeBuffer(
    uniformBuffer,
    0,
    modelViewProjection.buffer,
    modelViewProjection.byteOffset,
    modelViewProjection.byteLength
  );
 
  renderPassDescriptor.colorAttachments[0].view = context
    .getCurrentTexture()
    .createView();

  const commandEncoder = device.createCommandEncoder();
  const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
  passEncoder.setPipeline(pipeline);
  passEncoder.setBindGroup(0, uniformBindGroup); //每次绑定group，buffer已经在GPU memory 中
  passEncoder.setVertexBuffer(0, verticesBuffer);
  passEncoder.draw(cubeVertexCount);
  passEncoder.end();
  device.queue.submit([commandEncoder.finish()]);

  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
