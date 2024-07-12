import { Mat4, mat4, vec3 } from 'wgpu-matrix';
import { Clock } from '../scene/clock';

export declare interface sceneJson {
    /**canvas id */
    renderTo?: HTMLCanvasElement | GPUTexture,
    depthStencil?: GPUDepthStencilState,

}
declare interface cameras {

}



export abstract class BaseScene {
    /** scene 的初始化参数 */
    input: sceneJson;
    adapter!: GPUAdapter;
    /**webgpu device */
    device!: GPUDevice;
    /**默认的渲染对象输出*/
    // context!: GPUCanvasContext;
    context!: GPUCanvasContext | GPUTexture;
    depthTexture!: GPUTexture;
    /** presentationFormat*/
    presentationFormat!: GPUTextureFormat;

    depthStencil!: GPUDepthStencilState
    //  {
    //     depthWriteEnabled: true,
    //     depthCompare: 'less',
    //     format: 'depth24plus',
    // };
    renderPassDescriptor!: GPURenderPassDescriptor

    constructor(input: sceneJson) {
        this.input = input;
        if ("depthStencil" in input) {
            this.depthStencil = input.depthStencil as GPUDepthStencilState;
        }
        else {
            this.depthStencil = {
                depthWriteEnabled: true,
                depthCompare: 'less',
                format: 'depth24plus',
            };
        }
    }
    abstract init(): any

    //创建GPURenderPassDescriptor
    abstract createRenderPassDescriptor(): GPURenderPassDescriptor
    // renderPassDescriptor= {
    //     colorAttachments: [
    //         {
    //             view: context
    //                 .getCurrentTexture()
    //                 .createView(), // Assigned later
    //             clearValue: [0.5, 0.5, 0.5, 1.0],
    //             loadOp: 'clear',
    //             storeOp: 'store',
    //         },
    //     ],
    //     depthStencilAttachment: {
    //         view: depthTexture.createView(),
    //         depthClearValue: 1.0,
    //         depthLoadOp: 'clear',
    //         depthStoreOp: 'store',
    //     },
    // };

    abstract getRenderPassDescriptor(): GPURenderPassDescriptor
    /**
    * 每个shader/DraeCommand/ComputeCommand为自己的uniform调用更新uniform group 0 
    * 这个需要确保每帧只更新一次
    */
    abstract updateUnifrombuffer(): any
    /**
 * uniform of system  bindGroup to  group  0 for pershader
 */
    abstract updateUnifrombufferForPerShader(): any
    abstract getMVP(): any
    abstract getProjectionOfMatrix(): Mat4
    fatal(msg: string | undefined) {
        document.body.innerHTML += `<pre>${msg}</pre>`;
        throw Error(msg);
    }
    abstract update(): any
}