import { Scene, sceneInputJson } from "../../src/we/base/scene/scene"
import {
  computePart,
  ComputeCommand,
  computeOption,
} from "../../src/we/base/command/ComputeCommand"

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

const dispatchCount = [4, 3, 2];
const workgroupSize = [2, 3, 4];

// multiply all elements of an array
const arrayProd = (arr: any[]) => arr.reduce((a, b) => a * b);

const numThreadsPerWorkgroup = arrayProd(workgroupSize);
// scene.requestAnimationFrame();
//这里color输出乘以了0.16,为了区别表现
let shader = `
  // NOTE!: vec3u is padded to by 4 bytes
  @group(0) @binding(0) var<storage, read_write> workgroupResult: array<vec3u>;
  @group(0) @binding(1) var<storage, read_write> localResult: array<vec3u>;
  @group(0) @binding(2) var<storage, read_write> globalResult: array<vec3u>;

  @compute @workgroup_size(${workgroupSize}) fn computeSomething(
      @builtin(workgroup_id) workgroup_id : vec3<u32>,
      @builtin(local_invocation_id) local_invocation_id : vec3<u32>,
      @builtin(global_invocation_id) global_invocation_id : vec3<u32>,
      @builtin(local_invocation_index) local_invocation_index: u32,
      @builtin(num_workgroups) num_workgroups: vec3<u32>
  ) {
    // workgroup_index is similar to local_invocation_index except for
    // workgroups, not threads inside a workgroup.
    // It is not a builtin so we compute it ourselves.

    let workgroup_index =  
       workgroup_id.x +
       workgroup_id.y * num_workgroups.x +
       workgroup_id.z * num_workgroups.x * num_workgroups.y;

    // global_invocation_index is like local_invocation_index
    // except linear across all invocations across all dispatched
    // workgroups. It is not a builtin so we compute it ourselves.

    let global_invocation_index =
       workgroup_index * ${numThreadsPerWorkgroup} +
       local_invocation_index;

    // now we can write each of these builtins to our buffers.
    workgroupResult[global_invocation_index] = workgroup_id;
    localResult[global_invocation_index] = local_invocation_id;
    globalResult[global_invocation_index] = global_invocation_id;
  }
  `;

const numWorkgroups = arrayProd(dispatchCount);
const numResults = numWorkgroups * numThreadsPerWorkgroup;
const size = numResults * 4 * 4;  // vec3f * u32


let usage = GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC;
const workgroupBuffer = scene.device.createBuffer({ size, usage });
const localBuffer = scene.device.createBuffer({ size, usage });
const globalBuffer = scene.device.createBuffer({ size, usage });



usage = GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST;
const workgroupReadBuffer = scene.device.createBuffer({ size, usage });
const localReadBuffer = scene.device.createBuffer({ size, usage });
const globalReadBuffer = scene.device.createBuffer({ size, usage });



let options: computeOption = {
  label: "a compter test 1",
  scene: scene,
  dispatchCount: dispatchCount,
  // uniforms: [],
  uniforms: [
    {
      layout: 0,
      entries: [
        { binding: 0, resource: { buffer: workgroupBuffer } },
        { binding: 1, resource: { buffer: localBuffer } },
        { binding: 2, resource: { buffer: globalBuffer } },
      ]
    }
  ],
  afterUpdate: async () => {
    console.log("========================")
    await Promise.all([
      workgroupReadBuffer.mapAsync(GPUMapMode.READ),
      localReadBuffer.mapAsync(GPUMapMode.READ),
      globalReadBuffer.mapAsync(GPUMapMode.READ),
    ]);
    const workgroup = new Uint32Array(workgroupReadBuffer.getMappedRange());
    const local = new Uint32Array(localReadBuffer.getMappedRange());
    const global = new Uint32Array(globalReadBuffer.getMappedRange());

    const get3 = (arr: any[] | Uint32Array, i: number) => {
      const off = i * 4;
      return `${arr[off]}, ${arr[off + 1]}, ${arr[off + 2]}`;
    };
    for (let i = 0; i < numResults; ++i) {
      if (i % numThreadsPerWorkgroup === 0) {
        console.log(`\
  ---------------------------------------
  global                 local     global   dispatch: ${i / numThreadsPerWorkgroup}
  invoc.    workgroup    invoc.    invoc.
  index     id           id        id
  ---------------------------------------`);
      }
      console.log(`${i.toString().padStart(3)}:      ${get3(workgroup, i)}      ${get3(local, i)}   ${get3(global, i)}`);
    }

  },
  map: async (_scope: any, encoder: GPUCommandEncoder) => {
    encoder.copyBufferToBuffer!(workgroupBuffer, 0, workgroupReadBuffer, 0, size);
    encoder.copyBufferToBuffer!(localBuffer, 0, localReadBuffer, 0, size);
    encoder.copyBufferToBuffer!(globalBuffer, 0, globalReadBuffer, 0, size);
  },
  compute: {
    code: shader,
    entryPoint: "computeSomething"
  }
}

let DC = new ComputeCommand(options);
// await DC.init();
window.DC = DC;
DC.update()
