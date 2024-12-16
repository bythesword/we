
import { AmbientLight, optionAmbientLight } from '../light/ambientLight';
import { BaseLight } from '../light/baseLight';
import * as coreConst from "../const/coreConst"
import { DrawCommand } from '../command/DrawCommand';
import { ComputeCommand } from '../command/ComputeCommand';
import { CopyCommandT2T } from '../command/copyCommandT2T';

export type commmandType = DrawCommand | ComputeCommand | CopyCommandT2T;
export declare interface sceneJson {
    /**canvas id */
    name?: string,
    /**渲染的输出目标 */
    renderTo?: HTMLCanvasElement | GPUTexture,
    /**深度与模拟 */
    depthStencil?: GPUDepthStencilState,

    /**环境光 */
    ambientLight?: optionAmbientLight,
    /**是否开启 Reversed Z，默认=false，为了开发简单些（避免debug的复杂度增加），release后，切换为默认=true */
    reversedZ?: boolean,
    /** 纹理深度格式，默认="depth32float" */
    depthDefaultFormat?: GPUTextureFormat,
    /**是否使用延迟渲染,
     * 
     * 202411月,现阶段是:默认=false,为了开发测试方便
     */
    deferRender?: {
        enable: boolean
        type: "depth" | "color"
    }
    /**backgroudColor ,默认是[0,0,0,0]*/
    color?: coreConst.color4F,
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

    /** 渲染对象: 默认的渲染对象输出：GPUCanvasContext;    */
    context!: GPUCanvasContext | GPUTexture;

    backgroudColor: number[];
    /**每帧的webGPU的command集合   
     * 每个stage的command集合 
    * 一个实体可以由多个command，分布在不同的stage，比如透明，不透明
    */
    commands: commmandType[];
    commandsDepth: commmandType[];
    commandsColor: commmandType[];
    /////////////////////////////////////////////////////////////
    // about lights
    /** lights array */
    lights: BaseLight[];
    ambientLight!: AmbientLight;
    /**当前scene|stage中起作用的光源索引 */
    lightsIndex!: [];
    /***上一帧光源数量，动态增减光源，uniform的光源的GPUBuffer大小会变化，这个值如果与this.lights.length相同，不更新；不同，怎更新GPUBuffer */
    _lastNumberOfLights!: number;
    /**最大光源数量 */
    _maxlightNumber!: number;

    /////////////////////////////////////////////////////////////
    //about Z and reversed Z
    /**深度输出的纹理格式 */
    depthDefaultFormat!: GPUTextureFormat;
    /**正常Z的清除值 */
    depthClearValueOfZ = 1.0;
    /**反向Z的清除值 */
    depthClearValueOfReveredZ = 0.0;
    /**正常Z的深度模板设置 */
    depthStencilOfZ: GPUDepthStencilState = {
        depthWriteEnabled: true,
        depthCompare: 'less',
        format: 'depth32float',
    };
    /**反向Z的深度模板设置 */
    depthStencilOfReveredZ: GPUDepthStencilState = {
        depthWriteEnabled: true,
        depthCompare: 'greater',
        format: 'depth32float',
    }
    /**是否使用反向Z的标志位 */
    _isReversedZ!: boolean;

    deferRender!: boolean;
    deferRenderDepth: boolean;
    deferRenderColor: boolean;

    //////////////////////////////////////////////////////////
    //基础 render Pass Descriptor 和about GBuffer 

    /**颜色通道输出的纹理格式
     *  presentationFormat*/
    presentationFormat!: GPUTextureFormat;
    /** pipeline fragment 中的target 与 GPURenderPassDescriptor中的colorAttachment的数组的内容一一对应*/
    colorAttachmentTargets!: GPUColorTargetState[];
    /**depthStencil 模板参数 */
    depthStencil!: GPUDepthStencilState
    //  {
    //     depthWriteEnabled: true,
    //     depthCompare: 'less',
    //     format: 'depth24plus',
    // };
    renderPassDescriptor!: GPURenderPassDescriptor
    /**GBuffer 收集器*/
    GBuffers!: coreConst.GBuffers;

    constructor(input: sceneJson) {
        this.input = input;
        this.commands = [];
        this.commandsDepth = [];
        this.commandsColor = [];
        this.depthDefaultFormat = 'depth32float';
        if (input.depthDefaultFormat) {
            this.depthDefaultFormat = input.depthDefaultFormat;
        }
        this.backgroudColor = [0, 0, 0, 0];
        // if (input.color) {
        //     this.backgroudColor = [input.color.red, input.color.green, input.color.blue, input.color.alpha];
        // }
        this.deferRenderDepth = false;//为了测试方便,后期更改为:true,20241128
        this.deferRenderColor = false;//为了测试方便,后期更改为:true,20241128
        if (input.deferRender && input.deferRender.enable == true) {
            this.deferRender = true;
            if (input.deferRender.type == "depth")
                this.deferRenderDepth = true;
            else if (input.deferRender.type == "color")
                this.deferRenderColor = true;
        }



        this._maxlightNumber = coreConst.lightNumber;
        this._lastNumberOfLights = 0;

        this._isReversedZ = false;//20241125,release 后更改为 true
        if (input.reversedZ) {
            this._isReversedZ = input.reversedZ;
        }
        this.depthStencil = {
            depthWriteEnabled: true,
            depthCompare: this._isReversedZ ? "greater" : 'less',
            format: this.depthDefaultFormat//'depth32float',
        };
        if ("depthStencil" in input) {
            this.depthStencil = input.depthStencil as GPUDepthStencilState;
            if (input.reversedZ) {
                this.depthStencil.depthCompare = "greater";
            }
        }
        this.lights = [];
    }

    //异步执行，需要单独调用
    abstract init(): any

    /** 前向渲染renderPassDescriptor(GPURenderPassDescriptor) */
    async createRenderPassDescriptor() {
        let colorAttachments: GPURenderPassColorAttachment[] = [];
        this.colorAttachmentTargets = [];
        Object.entries(coreConst.GBuffersRPDAssemble).forEach(([key, value]) => {
            if (key != "depth") {
                let one: GPURenderPassColorAttachment;
                if (key == "color") {
                    one = {
                        view: this.GBuffers[key].createView(),
                        clearValue: this.backgroudColor,
                        loadOp: 'clear',
                        storeOp: "store"
                    };
                }
                else {
                    // if (key == "entityID")
                    //     one = {
                    //         view: this.GBuffers[key].createView(),
                    //         clearValue: [0, 0, 0, 0],
                    //         loadOp: 'clear',
                    //         storeOp: "store"
                    //     };
                    // else
                    one = {
                        view: this.GBuffers[key].createView(),
                        clearValue: [0, 0, 0, 0],
                        loadOp: 'clear',
                        storeOp: "store"
                    };
                }
                colorAttachments.push(one);
                let format: GPUTextureFormat;
                if (value.format == "WEsystem") {
                    format = this.presentationFormat;
                }
                else if (value.format == "WEdepth") {
                    format = this.depthDefaultFormat;
                }
                else {
                    format = value.format;
                }
                this.colorAttachmentTargets.push({ format });
            }
        });

        const renderPassDescriptor: GPURenderPassDescriptor = {
            colorAttachments: colorAttachments,
            depthStencilAttachment: {
                view: this.GBuffers["depth"].createView(),
                depthClearValue: this._isReversedZ ? this.depthClearValueOfReveredZ : this.depthClearValueOfZ,// 1.0,                
                depthLoadOp: 'clear',// depthLoadOp: 'load',
                depthStoreOp: 'store',
            },
        };

        // this.colorAttachmentTargets = [
        //     // color
        //     { format: this.GBuffers["color"].format },
        //     // id
        //     { format: this.GBuffers["entityID"].format },
        // ];
        // const renderPassDescriptor: GPURenderPassDescriptor = {
        //     label: "stage:forward render pass descriptor",
        //     colorAttachments: [
        //         {
        //             view: this.GBuffers["color"].createView(),
        //             clearValue: this.backgroudColor,
        //             loadOp: 'clear',
        //             storeOp: "store"
        //         },
        //         {
        //             view: this.GBuffers["entityID"].createView(),
        //             //clearValue: [0,0,0,0],//this.scene.renderPassSetting.color!.clearValue,//[0.0, 0.0, 0.0, 0.0],
        //             loadOp: 'clear',
        //             storeOp: "store"
        //         }
        //     ],
        //     depthStencilAttachment: {
        //         view: this.depthTexture.createView(),
        //         depthClearValue: this._isReversedZ ? this.depthClearValueOfReveredZ : this.depthClearValueOfZ,
        //         // depthLoadOp: 'load',
        //         depthLoadOp: 'clear',
        //         depthStoreOp: 'store',
        //     },
        // };
        return renderPassDescriptor;
    }
    fatal(msg: string | undefined) {
        document.body.innerHTML += `<pre>${msg}</pre>`;
        throw Error(msg);
    }
    /** 获取前向渲染的渲染通道描述: GPURenderPassDescriptor         */
    abstract getRenderPassDescriptor(): GPURenderPassDescriptor
    /**
    * 每个shader/DraeCommand/ComputeCommand为自己的uniform调用更新uniform group 0 
    * 
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
    /**每个继承类的更新入口 */
    abstract update(deltaTime: number, startTime: number, lastTime: number): any
    /**scene 、stage都是从baseScene基础，其核心渲染的全局wgsl可能不同 */
    abstract getWGSLOfSystemShader(): string
    /**初始化GBuffer
     * 
     * 在baseScene中没有调用,需要在scene或者stage进行显示初始化调用
     */
    async initGBuffers(width: number, height: number) {
        let localGBuffers: coreConst.GBuffers = {};
        Object.entries(coreConst.GBuffersRPDAssemble).forEach(([key, value]) => {
            // console.log(`Key: ${key}, Value: ${value}`);
            let format: GPUTextureFormat;
            if (value.format == "WEsystem") {
                format = this.presentationFormat;
            }
            else if (value.format == "WEdepth") {
                format = this.depthDefaultFormat;
            }
            else {
                format = value.format;
            }
            let gbuffer = this.device.createTexture({
                size: [width, height],
                format: format,
                usage: value.usage,
            });

            localGBuffers[key] = gbuffer;
            // if (key === "color") {
            //     this.colorTexture = gbuffer;
            // }
            // else if (key === "depth") {
            //     this.depthTexture = gbuffer;
            // }
        });

        // this.GBuffers = localGBuffers;
        return localGBuffers;
    }
    async reInitGBuffers(width: number, height: number) {

        let GBufferABC = this.GBuffers;
        this.GBuffers = await this.initGBuffers(width, height);

        this.renderPassDescriptor = await this.createRenderPassDescriptor();
        // this.destoryGBuffers(GBufferABC);
        return true;
    }
    destoryGBuffers(GBuffers: coreConst.GBuffers) {
        this.commands = [];
        for (let i in GBuffers) {
            this.GBuffers[i].destroy();
        }
    }
    /**
     * 环境光设置，更新环境光
     * @param values : optionAmbientLight,默认强度=0，即不存在环境光
     */
    setAmbientLight(values: optionAmbientLight = { color: { red: 1, green: 1, blue: 1 }, intensity: 0 }) {
        let light = new AmbientLight(values)
        this.ambientLight = light;
    }

    /**
     * GPUTexture 之间的copy
     * 
     * A、B这个两个GPUTexture在一个frame ，不能同时是GPUTextureUsage.COPY_DST | GPUTextureUsage.COPY_SRC，否则会产生同步错误
     * 
     * @param A :GPUTexture
     * @param B :GPUTexture
     * @param size :{ width: number, height: number }
     */
    copyTextureToTexture(A: GPUTexture, B: GPUTexture, size: { width: number, height: number }) {
        const commandEncoder = this.device.createCommandEncoder();

        commandEncoder.copyTextureToTexture(

            {
                texture: A
            },
            {
                texture: B,
            },
            [size.width, size.height]
        );
        const commandBuffer = commandEncoder.finish();
        this.device.queue.submit([commandBuffer]);
    }

}