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


    /**webgpu adapter 
       * 派生的Scene获取GPU相关参数；
       * 其他的非Scene的派生可以通过set设置，使用Scene的GPU相关参数
      */
    adapter!: GPUAdapter;

    /**webgpu device 
       * 派生的Scene获取GPU相关参数；
       * 其他的非Scene的派生可以通过set设置，使用Scene的GPU相关参数
      */
    device!: GPUDevice;

    /**
     * 渲染对象
     * 默认的渲染对象输出：GPUCanvasContext;
     * 
    */
    context!: GPUCanvasContext | GPUTexture;

    /**todo */
    depthTexture!: GPUTexture;

    /** presentationFormat*/
    presentationFormat!: GPUTextureFormat;

    /**depthStencil 模板参数 */
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
    abstract updateSystemUniformBuffer(): any

    /**
     * uniform of system  bindGroup to  group  0 for pershader
     */
    abstract createSystemUnifromGroupForPerShader(pipeline: GPURenderPipeline): GPUBindGroup
    abstract getMVP(): GPUBuffer

    fatal(msg: string | undefined) {
        document.body.innerHTML += `<pre>${msg}</pre>`;
        throw Error(msg);
    }
    abstract update(deltaTime: number): any
}