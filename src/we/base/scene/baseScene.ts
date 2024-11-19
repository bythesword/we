
import { AmbientLight, optionAmbientLight } from '../light/ambientLight';
import { BaseLight } from '../light/baseLight';
import * as coreConst from "../const/coreConst"

export declare interface sceneJson {
    /**canvas id */
    name?: string,
    /**渲染的输出目标 */
    renderTo?: HTMLCanvasElement | GPUTexture,
    /**深度与模拟 */
    depthStencil?: GPUDepthStencilState,
    /** renderpass 设置 */
    renderPassSetting?: renderPassSetting,
    /**环境光 */
    ambientLight?: optionAmbientLight
}

/**scene 的默认renderPassSetting 
 * 有color和depth ，分别有2组
 * 第一组是每一帧初始化时，clear的配置
 * 第二组是load同一帧的之前内容，而不是采用clear的方式
*/
export interface renderPassSetting {
    /**一帧的第一次color的设置 */
    color?: {
        clearValue?: GPUColor,
        loadOp?: GPULoadOp,
        storeOp?: GPUStoreOp,
        depthSlice?: GPUIntegerCoordinate,
    },
    /**一帧的第一次depth的设置 */
    depth?: {
        depthClearValue?: number,
        depthLoadOp?: GPULoadOp,
        depthStoreOp?: GPUStoreOp,
    },
    /**一帧的第二次color的设置 */
    colorSecond?: {
        // clearValue?: GPUColor,
        loadOp?: GPULoadOp,
        storeOp?: GPUStoreOp,
        depthSlice?: GPUIntegerCoordinate,
    },
    /**一帧的第二次depth的设置 */
    depthSecond?: {
        // depthClearValue?: number,
        depthLoadOp?: GPULoadOp,
        depthStoreOp?: GPUStoreOp,
    }
}

export abstract class BaseScene {
    name!: string;
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


    /**
     * 必须
     * 充分应用webGPU的texture的理念
     * 每个stage都是一个texture
     * scene，合并stage的texture，可以对stage进行缓存，即不变，就用上一张texture
     * 缓存用（比如world的缓存，镜头不动）
     * */
    colorTexture!: GPUTexture;
    /**renderPassDescriptor 需要 */
    colorAttachment!: GPUTextureView;

    /**
     * 深度缓存,stage必须
     * 与其他stage合并texture或shader使用
     * 透明和不透明都需要；
     */
    depthTexture!: GPUTexture;
    /**renderPassDescriptor 需要 */
    depthStencilAttachment!: GPUTextureView;

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


    /** lights array */
    lights!: BaseLight[];
    ambientLight!: AmbientLight;
    /**当前scene|stage中起作用的光源索引 */
    lightsIndex!: [];
    /***上一帧光源数量，动态增减光源，uniform的光源的GPUBuffer大小会变化，这个值如果与this.lights.length相同，不更新；不同，怎更新GPUBuffer */
    _lastNumberOfLights!: number;

    /**最大光源数量 */
    _maxlightNumber!: number;

    constructor(input: sceneJson) {
        this.input = input;
        this._maxlightNumber = coreConst.lightNumber;
        this._lastNumberOfLights = 0;
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
        this.lights = [];
    }
    //异步执行，需要单独调用
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
     * 每个shader绑定system的group0；
     * 
     * scene以及实现；
     * 
     * 
     * stage的可以通过全局变量scene进行调用scene的
     * 
     * uniform of system  bindGroup to  group  0 for pershader
     */
    abstract createSystemUnifromGroupForPerShader(pipeline: GPURenderPipeline): GPUBindGroup
    abstract getMVP(): GPUBuffer

    fatal(msg: string | undefined) {
        document.body.innerHTML += `<pre>${msg}</pre>`;
        throw Error(msg);
    }

    /**每个继承类的更新入口 */
    abstract update(deltaTime: number,startTime:number,lastTime:number): any

    /***     作废，20241022，由于稀疏map和结构的问题，不在进行全局的uniform排列，而采用原来的layout bindGroup0 ，产生12个巨大的buffer*/
    abstract getSystemUnifromGroupForPerShader(): GPUBindGroupEntry[]
    /**scene 、stage都是从baseScene基础，其核心渲染的全局wgsl可能不同 */
    abstract getWGSLOfSystemShader(): string

    /**
     * 环境光设置，更新环境光
     * @param values : optionAmbientLight,默认强度=0，即不存在环境光
     */
    setAmbientLight(values: optionAmbientLight = {
        color: {
            red: 1,
            green: 1,
            blue: 1
        }, intensity: 0
    }) {
        // if (this.ambientLight.length == 0) {
        //     this.ambientLightIndex = 0;
        // }
        let light = new AmbientLight(values)
        // light.id = this.ambientLight.length;
        this.ambientLight = light;
    }


}