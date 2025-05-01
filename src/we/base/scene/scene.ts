// declare global { interface Window { scene: any } }
import wgsl_main from "../shader/system.wgsl?raw"
import wgsl_main_only_VS from "../shader/systemOnlyVS.wgsl?raw"
import wgsl_main_light from "../shader/shadow/systemForLight.wgsl?raw"
import * as coreConst from "../const/coreConst"
import { Mat4, mat4, } from 'wgpu-matrix';
import { Clock } from '../scene/clock';
import { BaseScene, commmandType, sceneJson } from './baseScene';
import { BaseCamera } from "../camera/baseCamera"
import { BaseActor } from '../actor/baseActor';
import { CameraActor } from '../actor/cameraActor';
import { BaseStage } from '../stage/baseStage';
import { BaseEntity } from "../entity/baseEntity";
import { BaseLight } from "../light/baseLight";
import { WeResource } from "../resource/weResource"
import { GBufferPostProcess, optionGBPP } from "../Gbuffers/GBufferPostProcess";
import { PostProcessMangement } from "../postprocess/postProcessMangement";
import { GBuffersVisualize, GBuffersVisualizeViewport } from "../Gbuffers/GBufferVisualize";
import { optionPickup, Pickup, pickupTargetOfIDs } from "../pickup/pickup";
import { InputControl, typeOfInputControl } from "../control/inputControl";
import { CamreaControl } from "../control/cameracCntrol";
import { PostProcessEffect } from "../postprocess/postProcessEffect";
import { MultiCameras, optionMulitCameras } from "./multiCameras";
import { boundingBox, generateBox3ByArrayBox3s } from "../math/Box";
import { boundingSphere, generateSphereFromBox3 } from "../math/sphere";
import { renderKindForDCCC } from "../const/coreConst";
import { LightsManagement } from "../light/lightsManagement";
import { TransparentRender } from "./transparentRender";
import { CopyCommandT2T } from "../command/copyCommandT2T";
import { uniformEntries } from "../command/commandDefine";


declare global {
    interface Window {
        WEConst: any
    }
}

/** camera 的viewport ,多cameras会用到布局，单camera默认100% */
export interface cameraViewport {
    cameraActorName: string,
    /**x,y,width,height都是百分比，0.0--1.0 */
    viewport: {
        x: number,
        y: number,
        width: number,
        height: number,
    },
    // backgroudColor: coreConst.color4F,
}



/** stage 数量
 * 
 * all: 全部stage
 *
 * world: 只有world stage
 */
type stageStatus = "all" | "world";// | "userdefine"

/**  scene中的root，特殊情况使用 */
interface updateObjectOfRootOfScene { update: coreConst.userFN }

/**
 * canvas: string, canvas id;
 * 
 * lightNumber?: number  最大光源数量(默认:32)
 * 
 * Debug?: WE_Debug,
 * 
 * stageSetting?: sceneStageInput;自定义stage
 */
export interface sceneInputJson extends sceneJson {
    /**canvas id */
    canvas: string,
    /**最大光源数量，默认= coreConst.lightNumber ，32个*/
    lightNumber?: number,

    /**自定义stage */
    stageSetting: stageStatus,
    /**出现的camera显示，没有的不显示，按照数组的先后顺序进行render，0=最底层，数组最后的在最上层 
     * 
     * multiCameraViewport 与GBuffer可视化不可同时使用，multiCameraViewport优先级高
    */
    multiCameraViewport?: cameraViewport[],
}

/** system uniform 的结构 ，都是GPUBuffer，为更新uniform使用，*/
export declare interface systemUniformBuffer {
    /**
     * size:3*4*4*4 byte 
     * 4*4 的matrix ，分别是model，view，projection
    */
    MVP?: { [name: string]: GPUBuffer },
    /** stroage buffer */
    lights?: GPUBuffer,
    shadowMapMatrix?: GPUBuffer,
    shdowMapDepthTexture?: GPUTexture,
    /**uint32 *2 */
    time?: GPUBuffer,
}
/**actor 收集器/集合 */
export interface actorGroup {
    [name: string]: BaseActor
    // [name in string]: BaseActor
}
/** stage 收集器/集合 */
export interface stagesCollection {
    [name: string]: BaseStage
    // [name: string]: stageGroup
}
/**用户自定义 update interface */
export interface userDefineUpdateCall {
    /**不可以使用异步方式，会影响性能 */
    call: (scope: any) => {},
    name: string,
    state: boolean;
}
export class Scene extends BaseScene {

    ////////////////////////////////////////////////////////////////////////////////
    /** scene 的初始化参数 */
    declare input: sceneInputJson;
    declare context: GPUCanvasContext;
    canvas!: HTMLCanvasElement;
    /**clock */
    clock: Clock;
    /** todo */
    MQ: any;
    /** todo */
    WW: any;

    ////////////////////////////////////////////////////////////////////////////////
    /** stage 收集器  */
    stages!: stagesCollection;
    // stages!: BaseStage[];
    /** 场景中的stage 名称列表 */
    stagesOfSystem: coreConst.stageName;
    /**默认stage（entity 被添加到的stage） 名称 */
    defaultStageName: string;
    /** stage 合并GBuffer的顺序，减少少over draw */
    stagesOrders!: coreConst.stagesOrderByRender// number[];
    // stageNameOfGroup!: coreConst.stageName;
    /** stage 状态 ：全部stage or only world*/
    stageStatus: stageStatus;

    ////////////////////////////////////////////////////////////////////////////////
    /**cameras 默认摄像机 */
    defaultCamera!: BaseCamera;
    defaultCameraActor!: CameraActor;
    /**多个摄像机队列 */
    cameraActors: CameraActor[];
    /**视场比例 */
    aspect!: number;
    /** system uniform buffer 结构体，参加 interfance systemUniformBuffer */
    systemUniformBuffers!: systemUniformBuffer;
    /**多摄像机属性，默认=false。
     * 
     * 来源：
     * 1、scene初始化参数指定
     * 2、通过function实现
     */
    multiCamera: boolean;
    multiCameraViewport: cameraViewport[];
    /**多摄像机管理 */
    multiCameras!: MultiCameras;

    ////////////////////////////////////////////////////////////////////////////////
    /** actor group */
    actors: actorGroup;
    /**单独更新的在root中的更新对象 */
    root: updateObjectOfRootOfScene[];
    /** default actor
     *  一般的场景是CameraActor
     *  也可以是人物Actor
     */
    defaultActor!: BaseActor;

    ////////////////////////////////////////////////////////////////////////////////
    //update 相关
    /** 是scene或全局的command执行function集合，非GPU的command
     * 目前只在onBeigin，onFinish中进行了调用，但是，未完成更加具体的外部调用
     * 
     * 主要是为了方便在其他地方调用，
     * 例如：在onBeigin中，调用了camera的update，
     * 在onFinish中，调用了GBuffer的update，
     */
    lastCommand: coreConst.SimpleFunction[];
    /**每帧循环用户自定义更新function */
    userDefineUpdateArray!: userDefineUpdateCall[];
    /**资源类 */
    resources!: WeResource;

    ////////////////////////////////////////////////////////////////////////////////
    /** 是否进行实时渲染*/
    _realTimeRender!: boolean;
    /**更改是否实时渲染设置 */
    set realTimeRender(value: boolean) { this._realTimeRender = value; }
    /**获取实时渲染状态 */
    get realTimeRender() { return this._realTimeRender }
    ////////////////////////////////////////////////////////////////////////////////
    /**控制器 */
    inputControl!: InputControl | CamreaControl;

    ////////////////////////////////////////////////////////////////////////////////
    /**resize Observer 标注位  */
    _reSize!: boolean;

    /**
     * todo:待定；20241204
     * 强制更新：默认=false
     * 
     * 1、在surface的resize之后，一次；
     * 
     * 2、其他
     * 
     */
    _updateForce!: boolean;
    surfaceSize!: {
        now: {
            width: number,
            height: number,
        },
        old: {
            width: number,
            height: number,
        },
    }
    /////////////////////////////////////////////////////////////////////////////////
    //

    /**每帧的webGPU的command集合   
     * 每个stage的command集合 
    * 一个实体可以由多个command，分布在不同的stage，比如透明，不透明
    */
    commands: commmandType[];//scene 在使用 for scene.root

    ////////////////////////////////////////////////////////////////////////////////
    /** 进行GBuffer合并的对象集合 */
    GBufferPostprocess!: { [name: string]: GBufferPostProcess };
    /**GBuffer 可视化对象 */
    GBuffersVisualize!: GBuffersVisualize;
    /**GBuffer 可视化的配置interface  */
    _GBuffersVisualize: GBuffersVisualizeViewport;

    /////////////////////////////////////////////////////////////////////////////////
    //camera
    /**最终copy到surface的最后一个GPUTexture (FrameBuffer)*/
    cameraFrameBuffer: { [name: string]: GPUTexture };

    /**摄像机透明渲染管理器的集合*/
    cameraTransparentRender: { [name: string]: TransparentRender };
    ////////////////////////////////////////////////////////////////////////////////
    /**GBuffer&GPU 的拾取管理器 */
    pickUp!: Pickup;

    ////////////////////////////////////////////////////////////////////////////////
    //后处理相关
    /**后处理管理器 */
    postProcessManagement!: PostProcessMangement;
    ////////////////////////////////////////////////////////////////////////////////
    //surface 相关
    /** for raw color texture ，是相当于最终的framebuffer，copy到canvas的current texture使用 */
    rawColorTexture!: GPUTexture;
    /** for raw
     * 20250405 ，未使用
    */
    rawDepthTexture!: GPUTexture;
    /** for raw
     * 20250405 ，未使用
    */
    rawColorAttachmentTargets!: GPUColorTargetState[];

    /**最后的各个功能输出的target texture ，这里是canva的   texture*/
    finalTarget!: GPUTexture;
    // /**system uniform（）的GPUBindGroupLayout */
    // layoutOfSystemUniform!: GPUBindGroupLayout;

    ////////////////////////////////////////////////////////////////////////////////
    //lights
    /**光源管理 
     * 管理MVP
     * shadow map
    */
    lightsManagement!: LightsManagement;

    /**最大光源数量 
     * 默认在coreConst.ts 中:lightNumber=8
     * 这个实际上是没有限制的，考虑两个因素
     *  1、渲染：
     *          A、前向渲染，不可能太多
     *          B、延迟渲染，基本不影响
     *  2、阴影
     *          A、这个是主要的影响，由于使用shadow map，还是需要进行一遍灯光视角的渲染，全向光/点光源/spot角度过大的会产生cube shadow map
     *          B、如果光源不产生阴影，就无所谓数量了
    */
    _maxlightNumber!: number;



    ////////////////////////////////////////////////////////////////////////////////
    // function
    ////////////////////////////////////////////////////////////////////////////////
    /**完成基础参数的初始化，不包括webGPU和依赖webGPU device的function */
    constructor(input: sceneInputJson) {
        super(input);

        ////////////////////////////////////////////////////////////////////////////////////////////////////////////
        //空值初始化
        this.lastCommand = [];
        this.commands = [];
        this.root = [];
        this.cameraActors = [];
        this.actors = {};
        this.cameraFrameBuffer = {}
        this.cameraTransparentRender = {};
        this.multiCameraViewport = [];
        ////////////////////////////////////////////////////////////////////////////////////////////////////////////
        //默认值初始化
        //start move from baseScene.ts 
        this.deferRenderDepth = false;//为了测试方便,后期更改为:true,20241128
        this.deferRenderColor = false;//为了测试方便,后期更改为:true,20241128
        this._isReversedZ = false;//20241125,release 后更改为 true
        this.depthDefaultFormat = 'depth32float';//depth texture 的默认格式 32bit

        //正向Z的深度模板的默认设置，未使用
        this.depthStencilOfZ = {
            depthWriteEnabled: true,
            depthCompare: 'less',
            format: this.depthDefaultFormat,
        };
        //深度模板的默认设置
        this.depthStencil = {
            depthWriteEnabled: true,
            depthCompare: this._isReversedZ ? "greater" : 'less',
            format: this.depthDefaultFormat//'depth32float',
        };
        this._maxlightNumber = coreConst.lightNumber;

        ///end move from baseScene.ts 

        this.stagesOfSystem = coreConst.stagesOfSystem;
        this.defaultStageName = coreConst.stagesOfSystem[coreConst.defaultStage];
        this.stagesOrders = coreConst.defaultStageList;
        this.stageStatus = "all";

        this._realTimeRender = true;
        this._reSize = false;
        this._updateForce = false;
        this.userDefineUpdateArray = [];

        this._GBuffersVisualize = {
            enable: false,
            layout: {
                //   layout:  "top",
                single: false,
                name: "default"
            },
            statueChange: true,//因为默认状态下，enable=false，如果使用（enable-->true），GBuffer开始时需要初始化，所以，statueChange=true
        }
        this.systemUniformBuffers = {
            MVP: {},
        };
        this.clock = new Clock();
        this.input = input;

        this.multiCamera = false;

        ////////////////////////////////////////////////////////////////////////////////////////////////////////////
        //input赋值
        //是否由指定深度纹理格式
        if (input.depthDefaultFormat) {
            this.depthDefaultFormat = input.depthDefaultFormat;
        }
        //是否由延迟渲染
        if (input.deferRender && input.deferRender.enable == true) {
            this.deferRender = true;
            if (input.deferRender.type == "depth")
                this.deferRenderDepth = true;
            else if (input.deferRender.type == "color")
                this.deferRenderColor = true;
        }
        //是否使用反向Z
        if (input.reversedZ) {
            this._isReversedZ = input.reversedZ;
        }
        //如果有深度模板输入
        if ("depthStencil" in input) {
            this.depthStencil = input.depthStencil as GPUDepthStencilState;

        }
        //如果由反向Z
        if (input.reversedZ) {
            this.depthStencil.depthCompare = "greater";
        }
        //是否使用多摄像机
        if (input.multiCameraViewport) {
            this.multiCameraViewport = input.multiCameraViewport;
            this.multiCamera = true;
        }
        //是否由自定义stage
        if (input.stageSetting) {
            this.stageStatus = input.stageSetting;
            if (this.stageStatus == "world") {
                this.stagesOfSystem = ["World"];
                this.defaultStageName = "World";
                this.stagesOrders = [0];
            }
        }
        //是否有背景色
        if (input.color) {
            this.backgroudColor = [input.color.red, input.color.green, input.color.blue, input.color.alpha];
        }
        //是否由自定义光源数量
        if (input.lightNumber) {
            this._maxlightNumber = input.lightNumber;
        }
        //是否由自定义名称
        if (input.name) {
            this.name = input.name;
        }
        else {
            this.name = "Scene";
        }
        ////////////////////////////////////////////////////////////////////////////////////////////////////////////
        //配置


        return this;
    }
    ////////////////////////////////////////////////////////////////////////////////
    //init
    /**完成 括webGPU和依赖webGPU device的function  
     
     * start：20241020  limits: must requsted
     *  todo：最大值的设定，并同步到全局的setting中；只是设定，不做限制，
     *  todo：最大限制的TS到WGSL的write部分的同步功能
     * end
     */
    async init() {
        if (!("gpu" in navigator)) this.fatal("WebGPU not supported.");

        const adapter = await navigator.gpu.requestAdapter();
        if (!adapter) throw new Error("Couldn't request WebGPU adapter.");
        this.adapter = adapter;

        const device = await adapter.requestDevice();
        if (!device) throw new Error("Couldn't request WebGPU device.");
        this.device = device;
        this.device = device;

        const canvas = document.getElementById(this.input.canvas) as HTMLCanvasElement;
        this.canvas = canvas;
        const context = canvas.getContext('webgpu') as GPUCanvasContext;
        this.context = context;
        const devicePixelRatio = window.devicePixelRatio;//设备像素比
        canvas.width = canvas.clientWidth * devicePixelRatio;
        canvas.height = canvas.clientHeight * devicePixelRatio;
        this.surfaceSize = {
            now: {
                width: canvas.width,
                height: canvas.height
            },
            old: {
                width: canvas.width,
                height: canvas.height
            }
        }
        const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
        // console.log("presentationFormat:", presentationFormat);
        this.presentationFormat = presentationFormat;

        context.configure({
            device,
            format: presentationFormat,
            alphaMode: 'premultiplied',//预乘透明度
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_DST | GPUTextureUsage.TEXTURE_BINDING
        });



        this.aspect = canvas.width / canvas.height;
        this.resources = new WeResource(this);
        this.finalTarget = this.device.createTexture({
            size: [this.canvas.width, this.canvas.height],
            format: this.presentationFormat,
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC | GPUTextureUsage.COPY_DST | GPUTextureUsage.TEXTURE_BINDING,
        });
        await this.initStages();
        this.lightsManagement = new LightsManagement({ scene: this });
        if (this.input.ambientLight) {
            this.lightsManagement.setAmbientLight(this.input.ambientLight);
        }
        else {
            this.lightsManagement.setAmbientLight();
        }
        this.initActors();
        this.initMultiCameras()
        this.initPostProcess();
        this.initPickup();
        this.observer();
    }
    /**创建 textture：为每个相机 */
    async createCameraFrameBufferForPerCamera(camera: string) {
        return this.device.createTexture({
            label: "CameraFrameBuffer of " + camera,
            size: [this.canvas.width, this.canvas.height],
            format: this.presentationFormat,
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC | GPUTextureUsage.COPY_DST | GPUTextureUsage.TEXTURE_BINDING,
        });
    }
    /**
     * 初始化多摄像机
     */
    initMultiCameras() {
        if (this.multiCamera) {
            const values: optionMulitCameras = {
                multiCameraViewport: this.multiCameraViewport,
                copyToTarget: this.finalTarget,
                device: this.device,
                surfaceSize: {
                    width: this.canvas.width,
                    height: this.canvas.height
                },
                parent: this,
                MultiGBuffers: this.GBuffers,
                CameraActors: this.cameraActors,
            };
            this.multiCameras = new MultiCameras(values);
        }
    }
    /**
     * 初始化pickup
     */
    initPickup() {
        let option: optionPickup = {
            device: this.device,
            parent: this
        };
        this.pickUp = new Pickup(option);
    }


    //GBuffer
    /**scene 初始化GBuffer:合并后的stages的GBuffer 的render attachment*/
    async initGBuffers(width: number, height: number) {
        let GBuffers = await super.initGBuffers(width, height);
        return GBuffers;
    }

    /**GBuffer的后处理，在scene中合并
     * 
     * 每个摄像机都有一组GBuffer 的后处理合并
     */
    async initGBuffersPostProcess(camera: string) {

        if (this.GBufferPostprocess == undefined) this.GBufferPostprocess = {};
        let option: optionGBPP = {
            GBuffers: this.GBuffers[camera],
            parent: this,
            device: this.device,
            surfaceSize: {
                width: this.canvas.width,
                height: this.canvas.height
            },
            copyToTarget: this.cameraFrameBuffer[camera],
            camera,
        }
        this.GBufferPostprocess[camera] = new GBufferPostProcess(option);
    }
    /**init post process management */
    initPostProcess() {
        this.postProcessManagement = new PostProcessMangement({
            parent: this,
            copyToTarget: this.cameraFrameBuffer,
        });
    }

    /**初始化 Actor 环境 
       * todo：20240809
      */
    initActors() {
        this.actors = {};
    }
    /**
     * demo only，todo，20240809
     * 初始化 stages  环境
     * depth buffer 在此初始化，todo
    */
    async initStages() {
        this.stages = {};
        for (let i of this.stagesOrders) {
            let name = this.stagesOfSystem[i];
            if (name != "UI" && name != "Sky") {
                let stage = new BaseStage({
                    name,
                    scene: this,
                    deferRender: {
                        enable: this.deferRender,
                        type: this.deferRenderDepth ? "depth" : "color"
                    }
                });
                await stage.init();
                this.stages[name] = stage;
            }
            else if (name == "Sky") {
                let stage = new BaseStage({
                    name,
                    scene: this,
                    deferRender: {
                        enable: this.deferRender,
                        type: this.deferRenderDepth ? "depth" : "color"
                    }
                });
                await stage.init();
                this.stages[name] = stage;
            }
            else if (name == "UI") {
                let stage = new BaseStage({
                    name,
                    scene: this,
                    deferRender: {
                        enable: this.deferRender,
                        type: this.deferRenderDepth ? "depth" : "color"
                    }
                });
                await stage.init();
                this.stages[name] = stage;
            }
        }
    }
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //GPU 
    /** 不透明的RPD*/
    getRenderPassDescriptor(camera: string, _kind?: string): GPURenderPassDescriptor {
        return this.renderPassDescriptor[camera];
    }
    /**  透明的RPD*/
    getRenderPassDescriptorOfTransparent(camera: string, _kind?: string): GPURenderPassDescriptor {
        return this.cameraTransparentRender[camera].renderPassDescriptor;
    }

    /**
     * 说明：20241128，这个是创建bindGroup，其中entries中的buffer是在scene中创建GPUBuffer（或者说是指向了GPUBuffer），
     * GPUBuffer在每帧的update()中已经更新，所以这里的buffer是不用进行更新。  
     *  
     * uniform of system  bindGroup to  group  0 for pershader
     */
    createSystemUnifromGroupForPerShader(pipeline: GPURenderPipeline, camera?: string, _kind?: renderKindForDCCC): GPUBindGroup {
        let groupDesc: GPUBindGroupDescriptor;
        const bindLayout = pipeline.getBindGroupLayout(0);


        let ID = this.defaultCameraActor.id.toString();
        if (camera != undefined) {
            ID = camera;
        }
        groupDesc = {
            label: "global Group bind to 0 , camera + lights",
            layout: bindLayout,
            entries:
                [
                    {
                        binding: 0,
                        resource: {
                            buffer: this.systemUniformBuffers["MVP"]![ID],
                        },
                    },
                    {
                        binding: 1,
                        resource: {
                            buffer: this.lightsManagement.lightsUniformGPUBuffer,
                            // buffer: this.systemUniformBuffers["lights"]!,
                        }
                    },
                    {
                        binding: 2,
                        resource: {
                            buffer: this.lightsManagement.ShadowMapUniformGPUBuffer,
                        }
                    },
                    {
                        binding: 3,
                        resource: this.lightsManagement.shadowMapTexture.createView(),

                    },
                    {
                        binding: 4,
                        resource: this.device.createSampler({
                            compare: 'less',
                        }),
                    },

                ],
        }
        const bindGroup: GPUBindGroup = this.device.createBindGroup(groupDesc);
        return bindGroup;
    }
    /**为只有VS的bindgroup使用，即：defer render的VS
     * 
     * @param pipeline GPURenderPipeline
     * @param camera ? string
     * @param _kind ? renderKindForDCCC
     * @returns GPUBindGroup
     */
    createSystemUnifromGroupForPerShaderForOnlyVS(pipeline: GPURenderPipeline, /*_scope?: BaseScene , */ camera?: string, _kind?: renderKindForDCCC): GPUBindGroup {
        let groupDesc: GPUBindGroupDescriptor;
        const bindLayout = pipeline.getBindGroupLayout(0);


        let ID = this.defaultCameraActor.id.toString();
        if (camera != undefined) {
            ID = camera;
        }
        groupDesc = {
            label: "global Group bind to 0 , camera Only VS(for defer render)",
            layout: bindLayout,
            entries:
                [
                    {
                        binding: 0,
                        resource: {
                            buffer: this.systemUniformBuffers["MVP"]![ID],
                        },
                    },
                ],
        }
        const bindGroup: GPUBindGroup = this.device.createBindGroup(groupDesc);
        return bindGroup;
    }
    /** shadow map 使用的light的 uniform
     * 
     * @param pipeline GPURenderPipeline 
     * @param id string 
     * @param matrixIndex number
     * @returns GPUBindGroup
     */
    createSystemUnifromGroupForPerShaderOfShadowMap(pipeline: GPURenderPipeline, id: string, matrixIndex: number): GPUBindGroup {
        let groupDesc: GPUBindGroupDescriptor;
        const bindLayout = pipeline.getBindGroupLayout(0);
        const buffer = this.lightsManagement.getOneLightsMVP(id, matrixIndex);
        if (buffer === false) {
            throw new Error("createSystemUnifromGroupForPerShaderOfShadowMap(),  call this.lightsManagement.getOneLightsMVP(id,matrixIndex) is false ");
        }
        groupDesc = {
            label: "global Group bind to 0 ,light MVP (for shadow map )",
            layout: bindLayout,
            entries:
                [
                    {
                        binding: 0,
                        resource: {
                            buffer: buffer as GPUBuffer,
                        },
                    }
                ],
        }

        const bindGroup: GPUBindGroup = this.device.createBindGroup(groupDesc);
        return bindGroup;
    }

    // getLightNumbers() {
    //     return this.lights.length;//这个需要进行可见性处理(enable,visible,stage)，todo 20241021
    // }

    /**
     * DrawCommand 的  createPipeline() 调用
     * 
     * 为每个DrawCommand，生成systemWGSL string，raw模式除外
     * @returns 
     */
    // getWGSLOfSystemShaderFS(renderType: renderKindForDCCC): string {
    //     if (renderType == renderKindForDCCC.light) {
    //         let code = wgsl_main_light.toString();
    //         return code;
    //     }
    //     let lightNumber = this._maxlightNumber.toString();
    //     let code = wgsl_main_FS.toString();
    //     code = code.replaceAll("$lightNumber", lightNumber);
    //     return code;
    // }
    // getWGSLOfSystemShaderVS(renderType: renderKindForDCCC): string {
    //     if (renderType == renderKindForDCCC.light) {
    //         let code = wgsl_main_light.toString();
    //         return code;
    //     }
    //     let lightNumber = this._maxlightNumber.toString();
    //     let code = wgsl_main_VS.toString();
    //     code = code.replaceAll("$lightNumber", lightNumber);
    //     return code;
    // }   

    /**
     * 处理VS相关的WGSL code(替换,合并)
     * 其中包括:(通过入参renderType区分)
     *  1,光源的shadowmap用户的VS
     *  2,单像素 defer render的VS
     * @param renderType renderKindForDCCC
     * @returns string,WGSL(VS) code of system shader for defer render
     */
    getWGSLOfSystemShaderOnlyVS(renderType: renderKindForDCCC): string {
        if (renderType == renderKindForDCCC.light) {
            let code = wgsl_main_light.toString();
            return code;
        }
        let lightNumber = this._maxlightNumber.toString();
        let code = wgsl_main_only_VS.toString();
        code = code.replaceAll("$lightNumber", lightNumber);
        return code;
    }
    /**
     * 处理前向渲染或第二遍单像素延迟渲染的 WGSL code(替换,合并)
     *  只包括:前向的shader(system.wgsl的代码)
     * @param renderType renderKindForDCCC
     * @returns string,WGSL(VS) code of system shader for defer render 
     */
    getWGSLOfSystemShader(renderType: renderKindForDCCC): string {
        if (renderType == renderKindForDCCC.light) {
            let code = wgsl_main_light.toString();
            return code;
        }
        let lightNumber = this._maxlightNumber.toString();
        let code = wgsl_main.toString();

        code = code.replaceAll("$lightNumberShadowNumber", (this._maxlightNumber * 6).toString());//这个在前面，因为这个在后面，会被替换掉
        code = code.replaceAll("$lightNumber", lightNumber);
        // $lightNumberShadowNumberLayer
        return code;
    }
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /**
     * 循环入口
     */
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    run(userRun: coreConst.userPromiseFN) {
        let scope = this;
        this.clock.update();
        async function perFrameRun() {
            scope.onBegin();
            if (scope.realTimeRender) {//是否开启实时更新

                if (scope._reSize === false) {//是否resize中
                    //时间更新
                    scope.clock.update();
                    const deltaTime = scope.clock.deltaTime;
                    const startTime = scope.clock.start;
                    const lastTime = scope.clock.last;
                    await scope.update(deltaTime, startTime, lastTime);
                    await scope.oneFrameRender();
                    if (userRun !== undefined)
                        await userRun(scope);
                }
                else {
                    // await scope.reSize();
                    // scope._reSize = false;
                    // console.log("run:", scope._reSize);
                }
            }
            scope.onFinish();
            requestAnimationFrame(perFrameRun);
        }
        requestAnimationFrame(perFrameRun)
    }
    onBegin() {
        this.lastCommand = [];
    }
    onFinish() {
        for (let i of this.lastCommand) {
            if (typeof i == "function") {
                i();
            }
        }
    }


    /** 
     * 每帧更新入口
     * 1、更新system uniform
     * 2、更新Acter
     * 3、更新实体 entity
     */
    async update(deltaTime: number, startTime: number, lastTime: number) {
        await this.updateUserDefine();
        await this.updateCameraActor(deltaTime, startTime, lastTime);
        //todo
        // 四个中间点，稍稍延迟
        // let rays = this.defaultCamera!.getCameraRays();
        // 四个中间点，稍稍延迟
        this.updateBVH();
        await this.lightsManagement.update(deltaTime, startTime, lastTime);
        this.updateActor(deltaTime, startTime, lastTime);//camera 在此位置更新，entities需要camera的dir和视锥参数
        this.updateEntities(deltaTime, startTime, lastTime);//更新实体状态，比如水，树，草等动态的
        this.updateStagesCommand(deltaTime, startTime, lastTime);
        this.generateBox();
        this.generateSphere();
        await this.updatePostProcess(deltaTime, startTime, lastTime);
    }

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //render 

    /**渲染入口
     * 必有摄像机和光源管理者
     */
    async oneFrameRender() {
        if (this.lightsManagement && this.defaultCameraActor) {
            // this.renderShadowMap();
            this.lightsManagement.render();//render light's shadow map
            this.renderStagesCommand();//render  stages commands
            this.renderSceneCommands();//render scene commands
            for (let i in this.GBufferPostprocess) {
                this.GBufferPostprocess[i].render();   //render GBuffer
            }
            this.renderTransparent();//render transparent
            this.copyRenderextureToCameraFrameBuffer();//copy GBuffer to camera framebuffer
            this.postProcessManagement.render();  //进行后处理
            this.showMultiCamera();
            await this.showGBuffersVisualize();     //按照配置或命令，进行GBuffer可视化
            await this.copyFinalTextureToSurface();

        }
    }

    /** 复制最终的渲染（GBuffer的color，【不透明-->透明渲染完成后的】）的纹理到摄像机的framebuffer */
    copyRenderextureToCameraFrameBuffer() {
        for (let i in this.cameraActors) {
            const camera = this.cameraActors[i];
            const cameraID = camera.id.toString();

            let copyToColorTexture = new CopyCommandT2T(
                {
                    A: this.GBuffers[cameraID]["color"],
                    B: this.cameraFrameBuffer[cameraID],
                    size: { width: this.canvas.width, height: this.canvas.height },
                    device: this.device
                }
            );
            copyToColorTexture.update();
        }
    }

    /**
     * 渲染每个摄像机、每个stage的透明队列 
     * 工作在合并GBuffer之后
    */
    renderTransparent() {
        //1、循环每个摄像机、每个stage的透明队列，进行渲染
        //2、前置条件：
        //      A、每个摄像机一个透明的渲染管理器e，只在Scene中；
        //      B、透明的RPD，attachments =GBUffer
        //      C、per entity输出的透明commands(
        //          1、每个entity只能是不透明或透明[由material决定]；
        //          2、透明没有深度commands，不透明有深度commands)；
        // 3、执行每个stage的每个camera的透明队列的render

        for (let i in this.cameraActors) {
            const camera = this.cameraActors[i];
            const cameraID = camera.id.toString();
            if (this.cameraTransparentRender[cameraID] != undefined) {
                this.cameraTransparentRender[cameraID].render();
            }
        }
    }
    /**render perstage 
     * 逐个处理camerasCommands的队列渲染
     */
    renderStagesCommand() {
        for (let i in this.stagesOrders) {
            const perList = this.stagesOrders[i];//number，stagesOfSystem的数组角标
            const name = this.stagesOfSystem[perList];
            {//每个stageGroup进行update，包含透明和不透明两个stage 
                if (this.stages[name]) {
                    this.stages[name]!.render();
                }
                //20241212:透明render移动到GBufferPostprocess中进行油画法
                // if (this.stages[name].transparent) {
                //     this.stages[name].transparent!.update(deltaTime, startTime, lastTime);
                // }
            }
        }
    }
    /**render root of scene */
    renderSceneCommands() {
        for (let one of this.commands) {
            one.update();
        }
    }
    ////////////////////////////////////////////////////////////////
    //render ：output

    /**
     * 多摄像机viewport合并
     */
    showMultiCamera() {
        //多camera
        if (this.multiCamera) {
            this.multiCameras.render();
        }
        //单camera
        else {
            this.copyTextureToTexture(this.cameraFrameBuffer[this.defaultCameraActor.id.toString()], this.finalTarget, { width: this.canvas.width, height: this.canvas.height });//ok
        }
        ///////////////////////////////////////////////////////////////////////////////////////////////////
        ////测试使用
        //测试多camera
        // for (let i in this.cameraFrameBuffer) {
        //     if (i == this.defaultCameraActor.id.toString()) {
        //         // console.log("相同", i, this.defaultCameraActor.id.toString());
        //         this.copyTextureToTexture(this.cameraFrameBuffer[i], this.finalTarget, { width: this.canvas.width, height: this.canvas.height });//ok
        //     }
        //     else {
        //         // console.log("不相同", i, this.defaultCameraActor.id.toString());
        //     }
        // }
        //基础测试World
        // this.copyTextureToTexture(this.stages["World"]!!.GBuffers[this.defaultCameraActor.id]["color"], this.finalTarget, { width: this.canvas.width, height: this.canvas.height });//ok
        // this.copyTextureToTexture(this.cameraFrameBuffer[this.defaultCameraActor.id], this.finalTarget, { width: this.canvas.width, height: this.canvas.height });//ok
    }
    /**每帧渲染的最后步骤 */
    async copyFinalTextureToSurface() {
        this.copyTextureToTexture(this.finalTarget, (this.context as GPUCanvasContext).getCurrentTexture(), { width: this.canvas.width, height: this.canvas.height });//ok

        ///////////////////////////////////////////////////////////////////////////////////////////////////
        ////测试使用
        //测试 copy 某个摄像机的framebuffer到surface
        // this.copyTextureToTexture(this.cameraFrameBuffer[this.defaultCameraActor.id.toString()], (this.context as GPUCanvasContext).getCurrentTexture(), { width: this.canvas.width, height: this.canvas.height });//ok,20241229,增加多摄像机之前

        //直接测试：world -->scene
        // this.copyTextureToTexture(this.stages["World"]!!.GBuffers["color"], (this.context as GPUCanvasContext).getCurrentTexture(), { width: this.canvas.width, height: this.canvas.height })
        // this.copyTextureToTexture(this.stages["World"].GBuffers[this.defaultCameraActor.id.toString()]["color"], (this.context as GPUCanvasContext).getCurrentTexture(), { width: this.canvas.width, height: this.canvas.height })

        //中转测试：world-->  scene
        // this.copyTextureToTexture(this.stages["World"]!!.GBuffers["color"], this.GBuffers["color"], { width: this.canvas.width, height: this.canvas.height })
        // this.copyTextureToTexture(this.GBuffers["color"], (this.context as GPUCanvasContext).getCurrentTexture(), { width: this.canvas.width, height: this.canvas.height })
    }


    ////////////////////////////////////////////////////////////////
    //update camera 
    /**
     * 更新camera actor的属性,最后调用updateSystemUniformBufferForCameras()更新camerasuniform
     * @param deltaTime number
     * @param startTime number
     * @param lastTime number
     */
    async updateCameraActor(deltaTime: number, startTime: number, lastTime: number) {
        if (this.cameraActors)
            for (let i in this.cameraActors) {
                if (this.defaultActor && this.cameraActors[i] != this.defaultCameraActor) {
                    this.cameraActors[i].update(deltaTime, startTime, lastTime);
                }
                else {
                    this.cameraActors[i].update(deltaTime, startTime, lastTime);
                }
            }
        await this.updateSystemUniformBufferForCameras();
    }

    /**更新所有camera的MVP */
    async updateSystemUniformBufferForCameras() {
        for (let i of this.cameraActors) {
            const id = i.id.toString();
            if (this.systemUniformBuffers["MVP"]![id] == undefined) {
                this.systemUniformBuffers["MVP"]![id] = await this.updatePerCameraMVP(i);
            }
            else {
                await this.updatePerCameraMVP(i);
            }
        }
    }
    /**
     * 获取camera MVP矩阵
     * @returns MVP(16*4)
     */
    async updatePerCameraMVP(one: CameraActor): Promise<GPUBuffer> {
        let mvp = one.camera.getMVP();
        const id = one.id.toString();
        const uniformBufferSize = 4 * 4 * 4 * 4;//MVP 
        let MVP: GPUBuffer;
        let MVP_buffer = new Float32Array([
            1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1,
            1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1,
            1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        ]);
        if (this.systemUniformBuffers["MVP"]![id]) {
            MVP = this.systemUniformBuffers["MVP"]![id];
        }
        else {
            MVP = this.device.createBuffer({
                label: "camera (" + id + ") MVP",
                size: uniformBufferSize,
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
            });
        }
        if (mvp) {
            let model = new Float32Array(MVP_buffer.buffer, 4 * 4 * 4 * 0, 16);
            mat4.copy((<Mat4[]>mvp)[0], model);

            let view = new Float32Array(MVP_buffer.buffer, 4 * 4 * 4 * 1, 16);
            mat4.copy((<Mat4[]>mvp)[1], view);

            let projection = new Float32Array(MVP_buffer.buffer, 4 * 4 * 4 * 2, 16);
            mat4.copy((<Mat4[]>mvp)[2], projection);

        }
        if (this.defaultCamera) {
            let cameraPosition = new Float32Array(MVP_buffer.buffer, 4 * 4 * 4 * 3, 3);
            cameraPosition[0] = this.defaultCamera.position[0];
            cameraPosition[1] = this.defaultCamera.position[1];
            cameraPosition[2] = this.defaultCamera.position[2];
            // if (this._isReversedZ) {
            //     cameraPosition[3] = 1;
            // }
        }
        if (this._isReversedZ) {
            let reversedZ = new Uint32Array(MVP_buffer.buffer, 4 * 4 * 4 * 3 + 3 * 4, 1);
            reversedZ[0] = 1;
        }
        await this.device.queue.writeBuffer(
            MVP,
            0,
            MVP_buffer.buffer,
            MVP_buffer.byteOffset,
            MVP_buffer.byteLength
        );
        return MVP;
    }


    ////////////////////////////////////////////////////////////////
    //update Actor 
    /**更新Actor
     * 循环所有actor ，并执行update
     * todo：
     * 1、有效性与可见性判断（对应每个摄像机）
     *          距离
     *          方向（BVH）
     *          视锥
     * 2、是否为动态Actor
     * 3、生命周期
     */
    updateActor(deltaTime: number, startTime: number, lastTime: number) {
        if (this.actors)
            for (let i in this.actors) {
                if (this.defaultActor && this.actors[i] != this.defaultActor) {
                    this.actors[i].update(deltaTime, startTime, lastTime);
                }
                else {
                    this.actors[i].update(deltaTime, startTime, lastTime);
                }
            }
    }
    ////////////////////////////////////////////////////////////////
    //update
    /**todo 
     * 更新所有实体的BVH(如果有动态或位置变换的实体，需要更新BVH)
     * 1、遍历所有实体，获取所有的mesh
     * 2、根据mesh，生成BVH
     * 3、将BVH存储到实体中
    */
    updateBVH() {

    }
    ////////////////////////////////////////////////////////////////
    //update
    /**todo
     * //20250405,这个应该是没有用途了，因为entity的update已经包含了stage中
     * 实体更新 
     * 
     * //20241119
     * 重复执行，这个entities在stage的update的for(root)中，执行了，暂时不需要
     * 
     * 1、执行所有entity
     *      A、判断stage，是否有效与可见性，是否可见
     *      B、判断实体的可见性与有效性
     *      C、判断摄像机（每个）的可见性
     *          距离
     *          方向（BVH）
     *          视锥
     *        输出是否本轮可见 
    */
    updateEntities(_deltaTime: number, _startTime: number, _lastTime: number) {

    }

    ////////////////////////////////////////////////////////////////
    //update Stages
    /**
     * 更新stage的命令队列
     * 1,更新scene的root
     * 2,更新stage的命令队列
     * 3,更新stage的Box3
     *  
     * @param deltaTime 
     * @param startTime
     * @param lastTime
     */
    updateStagesCommand(deltaTime: number, startTime: number, lastTime: number) {
        //scene的root更新，特殊的，非baseentity的
        this.commands = [];
        this.Box3s = [];
        for (let one of this.root) {
            for (let commandInOne of one.update(this))
                this.commands.push(commandInOne);
        }
        //更新stage
        for (let i in this.stagesOrders) {
            const perList = this.stagesOrders[i];//number，stagesOfSystem的数组角标
            const name = this.stagesOfSystem[perList];
            // const name = coreConst.stagesOfSystem[perList];

            {//每个stageGroup进行update，包含透明和不透明两个stage 
                if (this.stages[name]) {
                    this.stages[name]!.update(deltaTime, startTime, lastTime);
                    this.Box3s.push(this.stages[name].generateBox());
                }
                //20241212:透明render移动到GBufferPostprocess中进行油画法
                // if (this.stages[name].transparent) {
                //     this.stages[name].transparent!.update(deltaTime, startTime, lastTime);
                // }
            }
        }
    }
    ////////////////////////////////////////////////////////////////
    //update PostProcess
    /** 后处理进行每次循环的update    */
    async updatePostProcess(deltaTime: number, startTime: number, lastTime: number) {

        this.postProcessManagement.update(deltaTime, startTime, lastTime);

        //  this.copyTextureToTexture(this.stages["World"]!!.depthTextureOnly, this.GBuffers["depth"], { width: this.canvas.width, height: this.canvas.height });//ok
    }




    ////////////////////////////////////////////////////////////////
    //output :BuffersVisualize
    /**显示GBuffer可视化 
     * 
     * 只进行defaultcamera的GBuffer可视化
    */
    async showGBuffersVisualize() {
        if (this.multiCamera === false)//多摄像机时不显示GBuffer可视化
            if (this._GBuffersVisualize.enable) {
                let GBuffers = this.GBuffers[this.defaultCameraActor.id.toString()];
                if (this._GBuffersVisualize.forOtherDepth) {

                }
                if (this.GBuffersVisualize && this._GBuffersVisualize.statueChange === true) {//有可视化，且状态改变（layout不同）
                    this.GBuffersVisualize.destroy();
                    this.GBuffersVisualize != undefined;
                }
                if (this.GBuffersVisualize == undefined) {
                    this.GBuffersVisualize = new GBuffersVisualize({
                        parent: this,
                        device: this.device,
                        GBuffers: GBuffers,// this.GBuffers[this.defaultCameraActor.id.toString()],
                        surfaceSize: {
                            width: this.canvas.width,
                            height: this.canvas.height,
                        },
                        layout: this._GBuffersVisualize,
                        // copyToTarget: this.cameraFrameBuffer[this.defaultCameraActor.id.toString()],//ok,20241229 多摄像机之前
                        copyToTarget: this.finalTarget,
                    });
                    this._GBuffersVisualize.statueChange = false;//更新statue状态
                }
                this.GBuffersVisualize.render();

            }
            else {
                if (this.GBuffersVisualize && this._GBuffersVisualize.statueChange === true) {//关闭可视化，且layout也改变（这种应用少，即：关闭可视化，且改变布局）
                    this.GBuffersVisualize.destroy();
                    this.GBuffersVisualize != undefined;
                }
            }

    }
    /**设置 GBuffer 可视化，仅设置 */
    setGBuffersVisualize(input: GBuffersVisualizeViewport | false) {
        if (input as boolean === false) {
            this._GBuffersVisualize = { enable: false };
        }
        else if ((input as GBuffersVisualizeViewport).enable === true && (input as GBuffersVisualizeViewport).layout || (input as GBuffersVisualizeViewport).enable === false) {
            let name = (input as GBuffersVisualizeViewport).layout!.name;
            let isOK = false;
            if ((input as GBuffersVisualizeViewport).layout!.single === true && name != "color") {//single 模式
                for (const key in coreConst.GBufferName) {
                    if (key === name) {
                        isOK = true;
                    }
                }
                if (isOK) {
                    this._GBuffersVisualize = (input as GBuffersVisualizeViewport);
                    this._GBuffersVisualize.statueChange! = true;//无论是否更改了input，都是新的
                    return;
                }
            }
            else {
                for (const key in coreConst.GBuffersVisualizeLayoutAssemble) {
                    if (key === name) {
                        isOK = true;
                    }
                }
                if (isOK) {
                    this._GBuffersVisualize = (input as GBuffersVisualizeViewport);
                    this._GBuffersVisualize.statueChange! = true;//无论是否更改了input，都是新的
                    return;
                }
            }
        }
        else if ((input as GBuffersVisualizeViewport).forOtherDepth) {//其他深度纹理的可视化，与GBuffer无关
            this._GBuffersVisualize = (input as GBuffersVisualizeViewport);
            this._GBuffersVisualize.statueChange! = true;//无论是否更改了input，都是新的
            return;
        }
        else
            console.error("GBuffer可视化输入参数错误!");
    }

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //input
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /** 
     * 获取键盘输入
     * @returns KeyboardEvent https://developer.mozilla.org/zh-CN/docs/Web/API/KeyboardEvent
     */
    getKeyInput(): KeyboardEvent | undefined {
        return (this.inputControl as CamreaControl).getKeyInput();
    }
    /** 获取鼠标/触点输入
     * @returns PointerEvent https://developer.mozilla.org/zh-CN/docs/Web/API/PointerEvent
     */
    getPointerInput(): PointerEvent | undefined {
        return (this.inputControl as CamreaControl).getPointerInput();
    }
    /**获取鼠标点击后的surface中的xy
     * 返回鼠标左键点击后的 x和y坐标,没有click,返回false
     * @returns { x: number, y: number } | false
     */
    getInputControlPickupXY(): { x: number, y: number } | false {
        if (this.inputControl)
            if (this.inputControl.type == typeOfInputControl.Camera) {
                let mouse = (this.inputControl as CamreaControl).getPointerInput();
                if (mouse)
                    if (mouse.buttons == 1 && mouse.x && mouse.y) {
                        const rect = this.canvas.getBoundingClientRect()
                        //  console.log(mouse.x,mouse.y)
                        return { x: mouse.x - rect.x, y: mouse.y - rect.y }
                    }
            }
        return false;
    }
    /**获取鼠标左键点击后的pickup的物体
     * @returns  pickupTargetOfIDs | false 
     */
    async getPickup(): Promise<false | pickupTargetOfIDs> {
        let xy = this.getInputControlPickupXY();
        if (xy) {
            let target = await this.pickUp.getTargetID(xy.x, xy.y);
            if (target) {
                // console.log( target);
                return target;
            }

            return false;
        }
        else
            return false;
    }

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //用户自定义的更新
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /**
     * 用户自定义的更新
     * 比如：
     *  订阅，触发、MQ、WW等
     */
    async updateUserDefine() {
        for (let i of this.userDefineUpdateArray) {
            if (i.state) {
                i.call(this);
            }
        }
    }
    /**增加用户自定义 */
    addUserDefine(call: userDefineUpdateCall) {
        this.userDefineUpdateArray.push(call);
    }
    /**设置用户自定义call function的状态 */
    setUserDfineStateByName(name: String, state: boolean) {
        for (let i of this.userDefineUpdateArray) {
            if (i.name == name) {
                i.state = state;
                break;
            }
        }
    }

    /**获取用户字自定义 call function的状态 */
    getUserDfineStateByName(name: string, state: boolean): { name: string, state: boolean } {
        for (let i of this.userDefineUpdateArray) {
            if (i.name == name) {
                i.state = state;
                return { name, state };
            }
        }
        return { name: "false", state: false };
    }


    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // add and set  function 
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    addToScene(one: updateObjectOfRootOfScene) {
        this.root.push(one);
    }

    add = this.addToStage;
    /**
     *  将实体附加到stage
     * @param entity    实体
     * @param stage     默认=World
     * @param transparent  默认=false
     */
    async addToStage(entity: BaseEntity, stage: string = this.defaultStageName, transparent: boolean = false): Promise<number> {

        if (this.stages[stage]) {
            let id = await this.stages[stage]!.add(entity);
            return id;
        }
        else {
            console.log(stage, "stage，不存在");
            return 0;
        }

    }

    setDefaultCamera(camera: BaseCamera) {
        this.defaultCamera = camera;
    }
    setDefaultActor(actor: BaseActor) {
        this.defaultActor = actor;
        actor.setDefault(this);
    }
    /**获取深度纹理(uniform 使用)，用于透明渲染 */
    geTransparentOfUniform(cameraID: string, binding: number): uniformEntries[] {
        return this.cameraTransparentRender[cameraID].getBindGroupOfTextures(binding);
    }
    /**增加摄像机 Actor
     * 适用于：非活动Actor场景
     */
    async addCameraActor(one: CameraActor, isDefault = false) {
        one.setRootENV(this);
        if (this.cameraActors.length == 0) {
            isDefault = true;
        }
        const id = one.id.toString();
        this.cameraActors.push(one);//增加cameraActor数组中
        this.cameraFrameBuffer[id] = await this.createCameraFrameBufferForPerCamera(id);
        this.GBuffers[id] = await this.initGBuffers(this.canvas.width, this.canvas.height);//不透明的GBuffer，合并使用
         this.cameraTransparentRender[id] = new TransparentRender({
            parent: this, cameraID: id,
            surfaceSize: { width: this.canvas.width, height: this.canvas.height },
            device: this.device,
        });//透明渲染
        for (let i in this.stages) {
            await this.stages[i]?.initCameraGBuffer(id);
        }
        await this.initGBuffersPostProcess(id);

        if (this.multiCamera)//若多camera，check是多
            await this.multiCameras.check(id);
        if (isDefault === true) {
            this.setDefaultActor(one);//CameraActor 调用setDefault,设置defaultCamera
            this.defaultCameraActor = one;
        }
        else {
        }
        // console.log(" instance of CameraActor:",one instanceof CameraActor);
    }
    setDefaultCameraActor(one: CameraActor) {
        this.defaultCameraActor = one;
    }
    /** 设置multiCamera是否有效 */
    setEnableMultiCamera(enable: boolean) {
        this.multiCamera = enable;
    }
    /**
     * 增加actor，
     * 增加到stage：//todo
     *     "Actor",不透明
           "ActorTransparent",透明
     
     * @param one :BaseActor
     * @param isDefault :boolean,default=false
     */
    addActor(one: BaseActor, isDefault = false) {
        one.setRootScene(this);
        if (this.actors == undefined) {
            this.actors = {};
            this.actors[one.name] = one;
        }
        else {
            this.actors[one.name] = one;
        }
        if (isDefault === true) {
            this.setDefaultActor(one);
        }
    }

    addLight(one: BaseLight) {
        this.lightsManagement.addLights(one);
    }
    addPostProcess(one: PostProcessEffect) {
        this.postProcessManagement.add(one);
    }


    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Observer 
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //20241204
    //同步有问题，GBuffe全部重构后，报错
    async reSize() {
        let scope = this;
        console.log("scene::reSize()", scope._reSize);
        const width = scope.surfaceSize.now.width;
        const height = scope.surfaceSize.now.height;
        scope.surfaceSize.old.width = width;
        scope.surfaceSize.old.height = height;
        if (scope.defaultCamera && "aspect" in scope.defaultCamera.option) {
            let aspect = width / height;
            scope.aspect = aspect;
            scope.defaultCamera.option.aspect = aspect;
            scope.defaultCamera.onResize();
        }
        let allStage = [];
        const scene = new Promise(async (resolve) => {
            await resolve(scope.reInitGBuffers(width, height))
        });
        allStage.push(scene);
        for (let i in scope.stagesOrders) {
            const perList = scope.stagesOrders[i];//number，stagesOfSystem的数组角标
            const name = coreConst.stagesOfSystem[perList];

            {//每个stageGroup进行update，包含透明和不透明两个stage 
                if (scope.stages[name]) {
                    const stage = new Promise(async (resolve) => {
                        await resolve(scope.stages[name]!.reInitGBuffers(width, height))
                    });
                    allStage.push(stage);
                }
                if (scope.stages[name].transparent) {
                    const stage = new Promise(async (resolve) => {
                        await resolve(scope.stages[name]!.reInitGBuffers(width, height))
                    });
                    allStage.push(stage);
                }
            }
        }
        await Promise.all(allStage).then(() => {
            scope._reSize = false;
        });
    }
    observer() {
        let scope = this;
        const resizeObserver = new ResizeObserver(entries => {
            if (scope._reSize === true) {
                return;
            }
            else {

                // console.log(entries);
                const entry = entries[0];
                // const canvas = entry.target;
                const devicePixelRatio = window.devicePixelRatio;//设备像素比
                const width = Math.max(1, Math.min(entry.contentBoxSize[0].inlineSize * devicePixelRatio, scope.device.limits.maxTextureDimension2D));// entry.contentBoxSize[0].inlineSize * devicePixelRatio;
                const height = Math.max(1, Math.min(entry.contentBoxSize[0].blockSize * devicePixelRatio, scope.device.limits.maxTextureDimension2D));//entry.contentBoxSize[0].blockSize * devicePixelRatio;

                if (
                    width == scope.surfaceSize.old.width &&
                    height == scope.surfaceSize.old.height
                ) {
                    scope._reSize = false;
                    return;
                }
                scope._reSize = true;
                console.log("observer()", this._reSize);
                scope.surfaceSize.now.width = width;
                // scope.surfaceSize.old.width = width;
                scope.surfaceSize.now.height = height;
                // scope.surfaceSize.old.height = height;




                if (scope.defaultCamera && "aspect" in scope.defaultCamera.option) {
                    let aspect = width / height;
                    scope.aspect = aspect;
                    scope.defaultCamera.option.aspect = aspect;
                    scope.defaultCamera.onResize();
                }

                // canvas.width = width;
                // canvas.height = height;


                // let allStage = [];
                // const scene = new Promise((resolve, reject) => {
                //     resolve(scope.reInitGBuffers(width, height))
                // });
                // allStage.push(scene);
                // for (let i in scope.stagesOrders) {
                //     const perList = scope.stagesOrders[i];//number，stagesOfSystem的数组角标
                //     const name = coreConst.stagesOfSystem[perList];

                //     {//每个stageGroup进行update，包含透明和不透明两个stage 
                //         if (scope.stages[name]) {
                //             const stage = new Promise((resolve, reject) => {
                //                 resolve(scope.stages[name]!.reInitGBuffers(width, height))
                //             });
                //             allStage.push(stage);
                //         }
                //         if (scope.stages[name].transparent) {
                //             const stage = new Promise((resolve, reject) => {
                //                 resolve(scope.stages[name]!.reInitGBuffers(width, height))
                //             });
                //             allStage.push(stage);
                //         }
                //     }
                // }
                // Promise.all(allStage).then(() => {

                //     scope._updateForce = true;
                //     scope._reSize = false;
                // });
            }
            scope._reSize = false;//在this.reSize()中
        });
        resizeObserver.observe(this.canvas);
    }
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //   boundingBox
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /** 世界坐标的Box */
    generateBox(): boundingBox {

        this.boundingBox = generateBox3ByArrayBox3s(this.Box3s);
        return this.boundingBox;
    }
    getBoundingBox() {
        return this.boundingBox;
    }
    /**世界坐标的sphere */
    generateSphere(): boundingSphere {
        if (this.boundingBox == undefined) {
            this.generateBox();
        }
        this.boundingSphere = generateSphereFromBox3(this.boundingBox);
        return this.boundingSphere;
    }
    getBoundingSphere() {
        return this.boundingSphere;
    }
}

