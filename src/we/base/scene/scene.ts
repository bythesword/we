// declare global { interface Window { scene: any } }
import wgsl_main from "../shader/system.wgsl?raw"
import wgsl_main_light from "../shader/shadow/systemForLight.wgsl?raw"
import * as coreConst from "../const/coreConst"
import { Mat4, mat4, } from 'wgpu-matrix';
import { Clock } from '../scene/clock';
import { cameraRayValues } from "../camera/baseCamera";
import { BaseScene, sceneJson } from './baseScene';
import { BaseCamera } from "../camera/baseCamera"
import { BaseActor } from '../actor/baseActor';
import { CameraActor } from '../actor/cameraActor';
import { BaseStage, stageGroup } from '../stage/baseStage';
import { BaseEntity, valuesForCreateDCCC } from "../entity/baseEntity";
import { BaseLight, lightStructSize, lightStructSizeOfShadowMapMVP } from "../light/baseLight";
import { WeResource } from "../resource/weResource"
import { GBufferPostProcess, optionGBPP } from "./GBufferPostProcess";
import { PostProcessMangement } from "../postprocess/postProcessMangement";
import { GBuffersVisualize } from "./GBufferVisualize";
import { optionPickup, Pickup, pickupTargetOfIDs } from "../pickup/pickup";
import { InputControl, typeOfInputControl } from "../control/inputControl";
import { CamreaControl } from "../control/cameracCntrol";
import { PostProcessEffect } from "../postprocess/postProcessEffect";
import { MultiCameras, optionMulitCameras } from "./multiCameras";
import { boundingBox, generateBox3ByArrayBox3s } from "../math/Box";
import { boundingSphere, generateSphereFromBox3 } from "../math/sphere";
import { renderKindForDCCC } from "../const/coreConst";
import { LightsManagement } from "../light/lightsManagement";


declare global {
    interface Window {
        WEConst: any
    }
}

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



/** stage 数量 */
type stageStatus = "all" | "world";// | "userdefine"

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
    /**Debug  */
    // Debug?: WE_Debug,
    /**自定义stage */
    stageSetting: stageStatus,
    /**出现的camera显示，没有的不显示，按照数组的先后顺序进行render，0=最底层，数组最后的在最上层 
     * 
     * multiCameraViewport 与GBuffer可视化不可同时使用，multiCameraViewport优先级高
    */
    multiCameraViewport?: cameraViewport[],
}

/**scene 中配置是否使用GBuffer可视化的interface，
 * ·
 * showGBuffersVisualize()与run()循环配合使用 
 * 
 * setGBuffersVisualize()设置此interface的状态
 * */
export interface GBuffersVisualizeViewport {
    /**是否开启可视化 */
    enable: boolean,
    /**两种模式的布局，single与非single */
    layout?: {
        /**
         * layout有两种名称状态：
         * 
         * single模式下：使用coreConst.GBufferName的enum
         * 
         * 非single模式下：使用oreConst.GBuffersVisualizeLayoutAssemble-->name
         */
        name: string,
        single: boolean,
        // singleType?: ,
    },
    /**其他深度纹理的可视化 */
    forOtherDepth?: {
        depthTextureView: GPUTextureView,
    }
    /**状态：boolan，layout布局是否更改过的状态,人工保障正确性 */
    statueChange?: boolean,
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
    [name: string]: stageGroup
}
class Scene extends BaseScene {
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
    stagesOfSystem: coreConst.stageName;
    defaultStageName: string;
    // stages!: BaseStage[];
    stagesOrders!: coreConst.stagesOrderByRender// number[];
    stageNameOfGroup!: coreConst.stageName;
    stageStatus: stageStatus;
    ////////////////////////////////////////////////////////////////////////////////
    /**cameras 默认摄像机 */
    defaultCamera!: BaseCamera;
    defaultCameraActor!: CameraActor;
    /**多个摄像机队列 */
    // cameras!: BaseCamera[];
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

    ////////////////////////////////////////////////////////////////////////////////
    /** 进行GBuffer合并的对象集合 */
    GBufferPostprocess!: { [name: string]: GBufferPostProcess };
    /**GBuffer 可视化对象 */
    GBuffersVisualize!: GBuffersVisualize;
    /**后处理管理器 */
    postProcessManagement!: PostProcessMangement;
    /**GBuffer&GPU 的拾取管理器 */
    pickUp!: Pickup;
    /**GBuffer 可视化的配置interface  */
    _GBuffersVisualize: GBuffersVisualizeViewport;
    /**最终copy到surface的最后一个GPUTexture */
    sourceOfcopyToSurface: { [name: string]: GPUTexture };

    ////////////////////////////////////////////////////////////////////////////////
    /** for raw */
    rawColorTexture!: GPUTexture;
    /** for raw*/
    rawDepthTexture!: GPUTexture;
    /** for raw*/
    rawColorAttachmentTargets!: GPUColorTargetState[];

    /**最后的各个功能输出的target texture */
    finalTarget!: GPUTexture;
    /**system uniform（）的GPUBindGroupLayout */
    layoutOfSystemUniform!: GPUBindGroupLayout;
    ////////////////////////////////////////////////////////////////////////////////
    //lights
    lightsManagement!: LightsManagement;



    lastCommand: coreConst.SimpleFunction[];

    ////////////////////////////////////////////////////////////////////////////////
    // function
    ////////////////////////////////////////////////////////////////////////////////
    constructor(input: sceneInputJson) {
        super(input);
        this.lastCommand = [];
        this.root = [];
        this.cameraActors = [];
        this.actors = {};
        this.sourceOfcopyToSurface = {}
        this.stagesOfSystem = coreConst.stagesOfSystem;
        this.defaultStageName = coreConst.stagesOfSystem[coreConst.defaultStage];
        this.multiCamera = false;
        this.multiCameraViewport = [];
        if (input.multiCameraViewport) {
            this.multiCameraViewport = input.multiCameraViewport;
            this.multiCamera = true;
        }
        this.stagesOrders = coreConst.defaultStageList;
        this.stageStatus = "all";
        //这个部分是为stage自定义部分
        // if (input.stageSetting && input.stageSetting.sceneStageInit && input.stageSetting.stageStatus == "userdefine") {
        //     this.stagesOfSystem = input.stageSetting.sceneStageInit.stages;
        //     this.defaultStageName = input.stageSetting.sceneStageInit.defaultStageName;
        //     this.stagesOrders = input.stageSetting.sceneStageInit.stagesOrders;
        //     this.stageStatus = "userdefine";
        // }
        // else
        if (input.stageSetting) {
            this.stageStatus = input.stageSetting;
            if (this.stageStatus == "world") {
                this.stagesOfSystem = ["World"];
                this.defaultStageName = "World";
                this.stagesOrders = [0];
            }
        }
        if (input.color) {
            this.backgroudColor = [input.color.red, input.color.green, input.color.blue, input.color.alpha];
        }
        this._realTimeRender = true;
        this._reSize = false;
        this._updateForce = false;
        this.userDefineUpdateArray = [];

        if (input.lightNumber) {
            this._maxlightNumber = input.lightNumber;
        }
        if (input.name) {
            this.name = input.name;
        }
        else {
            this.name = "Scene";
        }
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
        return this;
    }
    ////////////////////////////////////////////////////////////////////////////////
    //init
    /**
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
    async createSourceOfcopyToSurface(camera: string) {
        return this.device.createTexture({
            label: "sourceOfcopyToSurface of " + camera,
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
    /**20241229,未使用 */
    // async initForRAW() {
    //     this.rawColorTexture = this.device.createTexture({
    //         size: [this.canvas.width, this.canvas.height],
    //         format: this.presentationFormat,
    //         usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC | GPUTextureUsage.COPY_DST | GPUTextureUsage.TEXTURE_BINDING,
    //     });
    //     this.rawDepthTexture = this.device.createTexture({
    //         size: [this.canvas.width, this.canvas.height],
    //         format: this.depthDefaultFormat,
    //         usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC | GPUTextureUsage.COPY_DST | GPUTextureUsage.TEXTURE_BINDING,
    //     });
    //     this.rawColorAttachmentTargets = [
    //         // color
    //         { format: this.presentationFormat },
    //     ];
    //     this.renderPassDescriptor = {
    //         label: "stage:forward render pass descriptor",
    //         colorAttachments: [
    //             {
    //                 view: this.rawColorTexture.createView(),
    //                 clearValue: this.backgroudColor,
    //                 loadOp: 'clear',
    //                 storeOp: "store"
    //             }
    //         ],
    //         depthStencilAttachment: {
    //             view: this.rawDepthTexture.createView(),
    //             depthClearValue: this._isReversedZ ? this.depthClearValueOfReveredZ : this.depthClearValueOfZ,
    //             // depthLoadOp: 'load',
    //             depthLoadOp: 'clear',
    //             depthStoreOp: 'store',
    //         },
    //     };
    // }

    //GBuffer
    /**scene 初始化GBuffer，如果是debug模式，同时初始化可视化*/
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
            copyToTarget: this.sourceOfcopyToSurface[camera],
            camera,
        }
        this.GBufferPostprocess[camera] = new GBufferPostProcess(option);
    }
    /**init post process management */
    initPostProcess() {
        this.postProcessManagement = new PostProcessMangement({
            parent: this,
            copyToTarget: this.sourceOfcopyToSurface,
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
                let stageOpaque = new BaseStage({
                    name,
                    scene: this,
                    deferRender: {
                        enable: this.deferRender,
                        type: this.deferRenderDepth ? "depth" : "color"
                    }
                });
                await stageOpaque.init();
                let stageTransparent = new BaseStage({
                    name, transparent: true,
                    scene: this,
                    deferRender: {
                        enable: this.deferRender,
                        type: this.deferRenderDepth ? "depth" : "color"
                    }
                });
                await stageTransparent.init();
                this.stages[name] = {
                    opaque: stageOpaque,
                    transparent: stageTransparent,
                };
            }
            else if (name == "Sky") {
                let stageOpaque = new BaseStage({
                    name,
                    scene: this,
                    deferRender: {
                        enable: this.deferRender,
                        type: this.deferRenderDepth ? "depth" : "color"
                    }
                });
                await stageOpaque.init();
                this.stages[name] = {
                    opaque: stageOpaque,
                    transparent: undefined,
                };
            }
            else if (name == "UI") {
                let stageTransparent = new BaseStage({
                    name,
                    scene: this,
                    deferRender: {
                        enable: this.deferRender,
                        type: this.deferRenderDepth ? "depth" : "color"
                    }
                });
                await stageTransparent.init();
                this.stages[name] = {
                    opaque: undefined,
                    transparent: stageTransparent,
                };
            }
        }
    }
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //GPU 
    /** for raw uniform model*/
    getRenderPassDescriptor(camera: string, _kind?: string): GPURenderPassDescriptor {
        return this.renderPassDescriptor[camera];
    }

    /**
     * 说明：20241128，这个是创建bindGroup，其中entries中的buffer是在scene中创建GPUBuffer（或者说是指向了GPUBuffer），
     * GPUBuffer在每帧的update()中已经更新，所以这里的buffer是不用进行更新。  
     *  
     * uniform of system  bindGroup to  group  0 for pershader
     */
    createSystemUnifromGroupForPerShader(pipeline: GPURenderPipeline, /*_scope?: BaseScene , */ camera?: string, _kind?: renderKindForDCCC): GPUBindGroup {
        let groupDesc: GPUBindGroupDescriptor;
        const bindLayout = pipeline.getBindGroupLayout(0);


        let ID = this.defaultCameraActor.id.toString();
        if (camera != undefined) {
            ID = camera;
        }
        groupDesc = {
            label: "global Group bind to 0 , camera+lights",
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
    /** shadow map 使用的light的 uniform
     * 
     * @param pipeline 
     * @param _scope 
     * @param id 
     * @param kind 
     * @param matrixIndex 
     * @returns 
     */
    createSystemUnifromGroupForShadowMapPerShader(pipeline: GPURenderPipeline, /*_scope: BaseScene,*/ id: string, matrixIndex: number): GPUBindGroup {
        let groupDesc: GPUBindGroupDescriptor;
        const bindLayout = pipeline.getBindGroupLayout(0);
        const buffer = this.lightsManagement.getOneLightsMVP(id, matrixIndex);
        if (buffer === false) {
            throw new Error("createSystemUnifromGroupForShadowMapPerShader(),  call this.lightsManagement.getOneLightsMVP(id,matrixIndex) is false ");
        }
        groupDesc = {
            label: "global Group bind to 0 ,light MVP for shadow map ",
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
    getWGSLOfSystemShader(renderType: renderKindForDCCC): string {
        if (renderType == renderKindForDCCC.light) {
            let code = wgsl_main_light.toString();
            return code;
        }
        let lightNumber = this._maxlightNumber.toString();
        let code = wgsl_main.toString();
        code = code.replaceAll("$lightNumber", lightNumber);
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
        async function run() {
            if (scope.realTimeRender) {//是否开启实时更新
                scope.onBegin();
                if (scope._reSize === false) {//是否resize中
                    //时间更新
                    scope.clock.update();
                    const deltaTime = scope.clock.deltaTime;
                    const startTime = scope.clock.start;
                    const lastTime = scope.clock.last;
                    await scope.update(deltaTime, startTime, lastTime);
                    await scope.oneFrameRender();
                    await scope.copyToSurface();
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
            requestAnimationFrame(run);
        }
        requestAnimationFrame(run)
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


    /**作废： 20241207,合并到run中，简化嵌套
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
        // this.updateBVH(rays)
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

    /**  stage 透明深度与合并
    * 
    * sky、UI的合并与顺序
    * */
    async oneFrameRender() {
        if (this.lightsManagement && this.defaultCameraActor) {
            // this.renderShadowMap();
            this.lightsManagement.render();//render light's shadow map
            this.renderStagesCommand();//render  stages commands
            this.renderSceneCommands();//render scene commands
            for (let i in this.GBufferPostprocess) {
                this.GBufferPostprocess[i].render();   //render GBuffer
            }
            this.postProcessManagement.render();  //进行后处理
            this.showMultiCamera();
            await this.showGBuffersVisualize();     //按照配置或命令，进行GBuffer可视化
        }
    }
    renderShadowMap() {
        for (let i in this.stagesOrders) {
            const perList = this.stagesOrders[i];//number，stagesOfSystem的数组角标
            const name = this.stagesOfSystem[perList];
            if (this.stages[name].opaque) {
                this.stages[name].opaque!.renderForLightsShadowMap();
            }
        }
    }
    /**render perstage  */
    renderStagesCommand() {
        for (let i in this.stagesOrders) {
            const perList = this.stagesOrders[i];//number，stagesOfSystem的数组角标
            const name = this.stagesOfSystem[perList];
            {//每个stageGroup进行update，包含透明和不透明两个stage 
                if (this.stages[name].opaque) {
                    this.stages[name].opaque!.render();
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
     * 多摄像机viewport显示
     */
    showMultiCamera() {
        //多camera
        if (this.multiCamera) {
            this.multiCameras.render();
        }
        else {
            this.copyTextureToTexture(this.sourceOfcopyToSurface[this.defaultCameraActor.id.toString()], this.finalTarget, { width: this.canvas.width, height: this.canvas.height });//ok
        }
        //测试多camera
        // for (let i in this.sourceOfcopyToSurface) {
        //     if (i == this.defaultCameraActor.id.toString()) {
        //         // console.log("相同", i, this.defaultCameraActor.id.toString());
        //         this.copyTextureToTexture(this.sourceOfcopyToSurface[i], this.finalTarget, { width: this.canvas.width, height: this.canvas.height });//ok
        //     }
        //     else {
        //         // console.log("不相同", i, this.defaultCameraActor.id.toString());
        //     }
        // }
        //基础测试World
        // this.copyTextureToTexture(this.stages["World"]!.opaque!.GBuffers[this.defaultCameraActor.id]["color"], this.finalTarget, { width: this.canvas.width, height: this.canvas.height });//ok
        // this.copyTextureToTexture(this.sourceOfcopyToSurface[this.defaultCameraActor.id], this.finalTarget, { width: this.canvas.width, height: this.canvas.height });//ok
    }
    /**每帧渲染的最后步骤 */
    async copyToSurface() {
        this.copyTextureToTexture(this.finalTarget, (this.context as GPUCanvasContext).getCurrentTexture(), { width: this.canvas.width, height: this.canvas.height });//ok
        // this.copyTextureToTexture(this.sourceOfcopyToSurface[this.defaultCameraActor.id.toString()], (this.context as GPUCanvasContext).getCurrentTexture(), { width: this.canvas.width, height: this.canvas.height });//ok,20241229,增加多摄像机之前

        //直接测试：world -->scene
        // this.copyTextureToTexture(this.stages["World"]!.opaque!.GBuffers["color"], (this.context as GPUCanvasContext).getCurrentTexture(), { width: this.canvas.width, height: this.canvas.height })

        //中转测试：world-->  scene
        // this.copyTextureToTexture(this.stages["World"]!.opaque!.GBuffers["color"], this.GBuffers["color"], { width: this.canvas.width, height: this.canvas.height })
        // this.copyTextureToTexture(this.GBuffers["color"], (this.context as GPUCanvasContext).getCurrentTexture(), { width: this.canvas.width, height: this.canvas.height })
    }
    /** 20241229 ,未使用
     * 这个是准备做WE tory （类似shadertoy）使用的
     */
    copyRawToSurface() {
        this.copyTextureToTexture(this.rawColorTexture, (this.context as GPUCanvasContext).getCurrentTexture(), { width: this.canvas.width, height: this.canvas.height });//ok
    }

    ////////////////////////////////////////////////////////////////
    //update camera 
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
    /**todo */
    updateBVH(_cameraValues: cameraRayValues) {

    }
    ////////////////////////////////////////////////////////////////
    //update
    /**todo
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
     * 更新stage
     * 包括：
     *      colorTexture、depthTextur
     *      视锥状态是否更新
     *      视口是否变化
     * @param deltaTime 
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
                if (this.stages[name].opaque) {
                    this.stages[name].opaque!.update(deltaTime, startTime, lastTime);
                    this.Box3s.push(this.stages[name].opaque.generateBox());
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
    /** 初始化 后处理    */
    async updatePostProcess(deltaTime: number, startTime: number, lastTime: number) {

        this.postProcessManagement.update(deltaTime, startTime, lastTime);

        //  this.copyTextureToTexture(this.stages["World"]!.opaque!.depthTextureOnly, this.GBuffers["depth"], { width: this.canvas.width, height: this.canvas.height });//ok
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
                        // copyToTarget: this.sourceOfcopyToSurface[this.defaultCameraActor.id.toString()],//ok,20241229 多摄像机之前
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
    setGBuffersVisualize(input: GBuffersVisualizeViewport | false) { //enable: boolean, layout: string = coreConst.GBuffersVisualizeLayoutDefaultName) {
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
     * @returns KeyboardEvent https://developer.mozilla.org/zh-CN/docs/Web/API/KeyboardEvent
     */
    getKeyInput(): KeyboardEvent | undefined {
        return (this.inputControl as CamreaControl).getKeyInput();
    }
    /** 
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
    addToStage(entity: BaseEntity, stage: string = this.defaultStageName, transparent: boolean = false) {
        if (entity.transparent === false || transparent === false) {
            if (this.stages[stage].opaque)
                this.stages[stage].opaque!.add(entity);
            else
                console.log(stage, "不透明，不存在");
        }
        else {
            if (this.stages[stage].transparent)
                this.stages[stage].transparent!.add(entity);
            else
                console.log(stage, "透明，不存在");
        }
    }

    setDefaultCamera(camera: BaseCamera) {
        this.defaultCamera = camera;
    }
    setDefaultActor(actor: BaseActor) {
        this.defaultActor = actor;
        actor.setDefault(this);
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
        this.sourceOfcopyToSurface[id] = await this.createSourceOfcopyToSurface(id);
        this.GBuffers[id] = await this.initGBuffers(this.canvas.width, this.canvas.height);
        for (let i in this.stages) {
            await this.stages[i].opaque?.initCameraGBuffer(id);
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
                if (scope.stages[name].opaque) {
                    const stage = new Promise(async (resolve) => {
                        await resolve(scope.stages[name].opaque!.reInitGBuffers(width, height))
                    });
                    allStage.push(stage);
                }
                if (scope.stages[name].transparent) {
                    const stage = new Promise(async (resolve) => {
                        await resolve(scope.stages[name].opaque!.reInitGBuffers(width, height))
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
                //         if (scope.stages[name].opaque) {
                //             const stage = new Promise((resolve, reject) => {
                //                 resolve(scope.stages[name].opaque!.reInitGBuffers(width, height))
                //             });
                //             allStage.push(stage);
                //         }
                //         if (scope.stages[name].transparent) {
                //             const stage = new Promise((resolve, reject) => {
                //                 resolve(scope.stages[name].opaque!.reInitGBuffers(width, height))
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
/**用户自定义 update interface */
export interface userDefineUpdateCall {
    /**不可以使用异步方式，会影响性能 */
    call: (scope: any) => {},
    name: string,
    state: boolean;
}
export { Scene };
