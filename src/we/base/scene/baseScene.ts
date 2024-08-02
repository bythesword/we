import {
    Mat4,
    // mat4,
    // vec3
} from 'wgpu-matrix';
// import { Clock } from '../scene/clock';

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

    /**
     * 抽象function
     * 创建GPURenderPassDescriptor
     */
    abstract createRenderPassDescriptor(): GPURenderPassDescriptor

    /**
       * 抽象function
       *     abstract getRenderPassDescriptor(): GPURenderPassDescriptor  
       */
    abstract getRenderPassDescriptor(): GPURenderPassDescriptor


    /**
    * 每个shader/DraeCommand/ComputeCommand为自己的uniform调用更新uniform group 0 
    * 这个需要确保每帧只更新一次
    */
    abstract updateUnifrombuffer(): any

    /**
     * uniform of system  bindGroup to  group  0 for pershader
     */
    abstract updateUnifrombufferForPerShader(pipeline: GPURenderPipeline): GPUBindGroup 
    abstract getMVP(): any
    abstract getProjectionOfMatrix(): Mat4
    fatal(msg: string | undefined) {
        document.body.innerHTML += `<pre>${msg}</pre>`;
        throw Error(msg);
    }
    abstract update(): any
}