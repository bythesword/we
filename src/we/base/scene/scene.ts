declare global {
    interface Window {
        scene: any
        DC: any
        weGPUdevice: GPUDevice
        weGPUadapter: GPUAdapter
    }
}
import wgsl_main from "../shader/system.wgsl?raw"
import * as coreConst from "../const/coreConst"
import {
    Mat4,
    mat4,
    //  vec3 
} from 'wgpu-matrix';

import { Clock } from '../scene/clock';
import { cameraRayValues } from "../camera/baseCamera";
import { BaseScene, sceneJson, renderPassSetting } from './baseScene';



import {
    //  projectionOptions,
    BaseCamera,
} from "../camera/baseCamera"

import { BaseActor } from '../actor/baseActor';
import { CameraActor } from '../actor/cameraActor';
import { BaseStage, commmandType, stageGroup } from '../stage/baseStage';
import { BaseEntity } from "../entity/baseEntity";
import { BaseLight, lightStructSize } from "../light/baseLight";


/**
 *  canvas: string, canvas id;
 *  color?:color4F,JSON {red:1.0,green:1,blue:1,alpha:1}
 */
declare interface sceneInputJson extends sceneJson {
    /**canvas id */
    canvas: string,
    // renderPassSetting?: renderPassSetting,
    color?: coreConst.color4F,
    /**最大光源数量，默认= coreConst.lightNumber ，32个*/
    lightNumber?: number,

}





/** system uniform 的结构 ，都是GPUBuffer，为更新uniform使用，
*/
export declare interface systemUniformBuffer {
    /**
     * size:3*4*4*4 byte 
     * 4*4 的matrix ，分别是model，view，projection
    */
    MVP?: GPUBuffer,
    /** stroage buffer */
    lights?: GPUBuffer,
    /**uint32 *2 */
    time?: GPUBuffer,
}

// export declare type commmandType = DrawCommand | ComputeCommand;

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

    /** scene 的初始化参数 */
    declare input: sceneInputJson;

    /**每帧的webGPU的command集合 */
    command!: commmandType[];

    declare context: GPUCanvasContext;
    canvas!: HTMLCanvasElement;
    /**clock */
    clock: Clock;

    /** todo */
    MQ: any;
    /** todo */
    WW: any;

    /**cameras 默认摄像机 */
    defaultCamera: BaseCamera | undefined;



    /** stage 收集器  */
    stages!: stagesCollection;
    // stages!: BaseStage[];
    stagesOrders!: coreConst.stagesOrderByRender// number[];
    stageNameOfGroup!: coreConst.stageName;


    /**视场比例 */
    aspect!: number;
    // projectionMatrix!: Mat4;

    // colorAttachment!: GPUTextureView;
    // depthStencilAttachment!: GPUTextureView;

    /** system uniform buffer 结构体，参加 interfance systemUniformBuffer */
    systemUniformBuffers!: systemUniformBuffer;

    /** actor group */
    actors!: actorGroup;
    /** default actor
     *  一般的场景是CameraActor
     *  也可以是人物Actor
     */
    defaultActor!: BaseActor;

    /**scene 的默认renderPassSetting 
     * 有color和depth ，分别有2组
     * 第一组是每一帧初始化时，clear的配置
     * 第二组是load同一帧的之前内容，而不是采用clear的方式
    */
    renderPassSetting!: renderPassSetting;

    constructor(input: sceneInputJson) {
        super(input)
        if (input.lightNumber) {
            this._maxlightNumber = input.lightNumber;
        }
        if (input.name) {
            this.name = input.name;
        }
        else {
            this.name = "Scene";
        }
        this.systemUniformBuffers = {};

        this.clock = new Clock();
        this.input = input;

        let backgroudColor = [0, 0, 0, 0];
        if (input.color) {
            backgroudColor = [input.color.red, input.color.green, input.color.blue, input.color.alpha];
        }

        this.renderPassSetting = {
            color: {
                clearValue: backgroudColor,
                loadOp: "clear",
                storeOp: "store",
            },
            depth: {
                depthClearValue: 1.0,
                depthLoadOp: 'clear',
                depthStoreOp: 'store',
            },
            colorSecond: {
                // clearValue: [0, 0, 0, 0],
                loadOp: "load",
                storeOp: "store",
            },
            depthSecond: {
                // depthClearValue: 1.0,
                depthLoadOp: 'load',
                depthStoreOp: 'store',
            }
        }
        if (input.renderPassSetting) {
            if (input.renderPassSetting.color) {
                if (input.renderPassSetting.color.clearValue) this.renderPassSetting.color!.clearValue = input.renderPassSetting.color.clearValue;
                if (input.renderPassSetting.color.loadOp) this.renderPassSetting.color!.loadOp = input.renderPassSetting.color.loadOp;
                if (input.renderPassSetting.color.storeOp) this.renderPassSetting.color!.storeOp = input.renderPassSetting.color.storeOp;
            }
            if (input.renderPassSetting.depth) {
                if (input.renderPassSetting.depth.depthClearValue) this.renderPassSetting.depth!.depthClearValue = input.renderPassSetting.depth.depthClearValue;
                if (input.renderPassSetting.depth.depthLoadOp) this.renderPassSetting.depth!.depthLoadOp = input.renderPassSetting.depth.depthLoadOp;
                if (input.renderPassSetting.depth.depthStoreOp) this.renderPassSetting.depth!.depthStoreOp = input.renderPassSetting.depth.depthStoreOp;
            }
        }
        if (input.ambientLight) {
            this.setAmbientLight(input.ambientLight);
        }
        else {
            this.setAmbientLight();
        }

        // this._init();
        return this;
    }
    _init() { }
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
        window.weGPUadapter = adapter;

        const device = await adapter.requestDevice();
        if (!device) throw new Error("Couldn't request WebGPU device.");
        this.device = device;
        window.weGPUdevice = device;

        const canvas = document.getElementById(this.input.canvas) as HTMLCanvasElement;
        this.canvas = canvas;
        const context = canvas.getContext('webgpu') as GPUCanvasContext;
        this.context = context;

        const devicePixelRatio = window.devicePixelRatio;//设备像素比
        canvas.width = canvas.clientWidth * devicePixelRatio;
        canvas.height = canvas.clientHeight * devicePixelRatio;
        const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
        this.presentationFormat = presentationFormat;

        context.configure({
            device,
            format: presentationFormat,
            alphaMode: 'premultiplied',//预乘透明度
        });

        this.aspect = canvas.width / canvas.height;
        // this.projectionMatrix = mat4.perspective((2 * Math.PI) / 5, this.aspect, 1, 100.0);
        // const modelViewProjectionMatrix = mat4.create();

        //深度buffer
        this.depthTexture = device.createTexture({
            size: [canvas.width, canvas.height],
            format: 'depth24plus',
            usage: GPUTextureUsage.RENDER_ATTACHMENT,
        });

        this.renderPassDescriptor = this.createRenderPassDescriptor();
        // this.updateSystemUniformBuffer();
        this.initStages();
        this.initActors();
    }


    observer() {
        // new ResizeObserver(entries => {
        //     for (const entry of entries) {
        //         const canvas = entry.target;
        //         const width = entry.contentBoxSize[0].inlineSize;
        //         const height = entry.contentBoxSize[0].blockSize;
        //         canvas.width = Math.max(1, Math.min(width, device.limits.maxTextureDimension2D));
        //         canvas.height = Math.max(1, Math.min(height, device.limits.maxTextureDimension2D));
        //         // re-render
        //         render();
        //     }
        // });
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
    initStages() {
        // this.stageNameOfGroup = coreConst.stagesOfSystem;
        // let worldOpeaue: BaseStage = new BaseStage({ name: "World" });
        // let worldTransparent: BaseStage = new BaseStage({ name: "worldTransparent" });
        // this.stages = {
        //     "World": {
        //         isGroup: true,
        //         opaque: worldOpeaue,
        //         transparent: worldTransparent
        //     }
        // };
        let worldStage = new BaseStage({ name: "World", scene: this });
        let worldStageTransparent = new BaseStage({ name: "WorldTransparent", transparent: true, scene: this });
        this.stages = {};
        this.stages["World"] = {
            opaque: worldStage,
            transparent: worldStageTransparent,
        };
        this.stagesOrders = coreConst.defaultStageList;

    }
    add = this.addToStage;
    /**
     *  将实体附加到stage
     * @param entity    实体
     * @param stage     默认=World
     * @param transparent  默认=false
     */
    addToStage(entity: BaseEntity, stage: coreConst.stageIndex = coreConst.defaultStageName, transparent: boolean = false) {
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
    addCameraActor(one: CameraActor, isDefault = false) {
        if (this.actors == undefined) {
            this.actors = {};
        }
        this.actors[one.name] = one;
        if (isDefault === true) {
            this.setDefaultActor(one);//CameraActor 调用setDefault,设置defaultCamera
        }
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

    addLight(oneLight: BaseLight) {
        this.lights.push(oneLight);
    }

    /**
     * 获取scene 默认的canvas的render pass 
     * @returns GPURenderPassDescriptor
     */
    createRenderPassDescriptor() {
        // let scope = this;
        this.colorAttachment = (this.context as GPUCanvasContext)
            .getCurrentTexture()
            .createView();
        this.depthStencilAttachment = this.depthTexture.createView();
        const renderPassDescriptor: GPURenderPassDescriptor = {
            colorAttachments: [
                {
                    view: this.colorAttachment, // Assigned later
                    clearValue: this.renderPassSetting.color?.clearValue,// [0.5, 0.5, 0.5, 1.0],
                    loadOp: this.renderPassSetting.color!.loadOp!,// 'clear',
                    storeOp: this.renderPassSetting.color!.storeOp!,//"store"
                },
            ],
            depthStencilAttachment: {
                view: this.depthStencilAttachment,
                depthClearValue: this.renderPassSetting.depth!.depthClearValue!,// 1.0,
                // depthLoadOp: 'load',
                depthLoadOp: this.renderPassSetting.depth!.depthLoadOp!,// 'clear',
                depthStoreOp: this.renderPassSetting.depth!.depthStoreOp! //'store',
            },
        };
        return renderPassDescriptor;
    }
    getRenderPassDescriptor() {
        return this.renderPassDescriptor;
    }
    /**
     * start ：20241020
     *      todo ：最大的uniform buffer的限制=12，需要将所有的uniform buffer放到 bindGroup 0 中，
     *      todo: DCC中的uniform bind与slot需要统一改变，
     *      todo：DCC的4个bindGroup的规划需要改变，0=uniform，不需要编号（需要TS进行WGSL的语法合成，自动增加编号）
     *      todo：texture的bindGroup=1，pershaderStage最大16个，都在这里
     *      todo：storage的bindGroup=2，初设，这个需要测试，看看是否需要与uniform合并到0，还是可以单独（从目前来看应该是共用1000，在连续的内存中，
     *              如果是稀疏的map，应该是10个）
     *      todo：raw保持目前，DCC产生两个不同的版本分支，一个是集成，一个是raw的
     * end
     * uniform of system  bindGroup to  group  0 for pershader
     */
    createSystemUnifromGroupForPerShader(pipeline: GPURenderPipeline): GPUBindGroup {
        const bindLayout = pipeline.getBindGroupLayout(0);
        let groupDesc: GPUBindGroupDescriptor = {
            label: "global Group bind to 0",
            layout: bindLayout,
            entries:
                [
                    {
                        binding: 0,
                        resource: {
                            buffer: this.systemUniformBuffers["MVP"]!,
                        },
                    },
                    {
                        binding: 1,
                        resource: {
                            buffer: this.systemUniformBuffers["lights"]!,
                        }
                    }
                ],
        }
        const bindGroup: GPUBindGroup = this.device.createBindGroup(groupDesc);
        return bindGroup;
    }
    //作废，20241022，由于稀疏map和结构的问题，不在进行全局的uniform排列，而采用原来的layout bindGroup0 ，产生12个巨大的buffer
    getSystemUnifromGroupForPerShader(): GPUBindGroupEntry[] {
        let entries: GPUBindGroupEntry[] =
            [
                {
                    binding: 0,
                    resource: {
                        buffer: this.systemUniformBuffers["MVP"]!,
                    },
                },
                {
                    binding: 1,
                    resource: {
                        buffer: this.systemUniformBuffers["lights"]!,
                    }
                }
            ];
        return entries;

    }
    getLightNumbers() {
        return this.lights.length;//这个需要进行可见性处理(enable,visible,stage)，todo 20241021
    }

    /**
     * DrawCommand 的  createPipeline() 调用
     * 
     * 为每个DrawCommand，生成systemWGSL string，raw模式除外
     * @returns 
     */
    getWGSLOfSystemShader(): string {
        // let lightNumber = this.getLightNumbers();
        // let lightNumberForSystem = lightNumber + 1;
        // let lightsArray = `lights: array<ST_Light, ${lightNumberForSystem}>,`
        // if (lightNumber == 0) {
        //     lightsArray = 'lights: array<ST_Light, 1>';
        // }
        // let code = wgsl_main.toString();
        //// code = code.replace("$lightNumber", lightNumber.toString());//作废 num写入了结构体的buffer中，通过uniform传递
        // code = code.replace("$lightsArray", lightsArray.toString());

        // let lightNumber = coreConst.lightNumber;
        let lightNumber = this._maxlightNumber.toString();
        let code = wgsl_main.toString();
        code = code.replace("$lightNumber", lightNumber);
        return code;
    }





    /**
     * 循环入口
     */
    run() {
        let scope = this;
        this.clock.update();
        async function run() {
            // let deltaTime = scope.clock.deltaTime;
            scope.clock.update();
            const deltaTime = scope.clock.deltaTime;
            await scope.update(deltaTime);
            scope.oneFrameRender();
            scope.pickup();
            scope.postProcess();
            scope.updateUserDefine();
            requestAnimationFrame(run)
        }
        requestAnimationFrame(run)
    }
    //todo async/await for everthing ,20241103
    /**每帧更新入口
     * 1、更新system uniform
     * 2、更新Acter
     * 3、更新实体 entity
     */
    async update(deltaTime: number) {
        if (this.defaultActor)
            this.defaultActor.update(deltaTime);
        this.updateSystemUniformBuffer();

        //todo
        // 四个中间点，稍稍延迟
        // let rays = this.defaultCamera!.getCameraRays();
        // 四个中间点，稍稍延迟
        // this.updateBVH(rays)
        await this.updateLights(deltaTime);
        this.updateAcotr(deltaTime);//camera 在此位置更新，entities需要camera的dir和视锥参数
        this.updateEntities(deltaTime);//更新实体状态，比如水，树，草等动态的
        this.updateStagesCommand(deltaTime);
    }
    async updateLights(deltaTime: number) {
        for (let i of this.lights) {
            await i.update(deltaTime);
        }
    }

    /**
    * 每个shader/DraeCommand/ComputeCommand为自己的uniform调用更新uniform group 0 
    * 这个需要确保每帧只更新一次
    */

    updateSystemUniformBuffer() {
        if (this.defaultCamera)
            this.systemUniformBuffers["MVP"] = this.getMVP();
        this.systemUniformBuffers["lights"] = this.getUniformOfSystemLights();
    }

    /**
     * 在WGSL是一个struct ，参见“system.wgsl”中的 ST_Lights结构
  
    * struct ST_Lights {

            lightNumber : u32,
            Ambient : ST_AmbientLight,
            $lightsArray
            };
   
            * @returns 光源的GPUBuffer,大小=16 + 16 + lightNumber * 96,
     */
    getUniformOfSystemLights(): GPUBuffer {
        let size = lightStructSize;
        let lightNumber = coreConst.lightNumber;
        let lightRealNumberOfSystem = this.getLightNumbers();

        let lightsGPUBuffer: GPUBuffer;

        if (lightNumber == this._lastNumberOfLights)
            //generate GPUBuffer
            if (this.systemUniformBuffers["lights"]) {
                lightsGPUBuffer = this.systemUniformBuffers["lights"];
            }
            else {
                lightsGPUBuffer = this.device.createBuffer({
                    label: 'lightsGPUBuffer',
                    size: 16 + 16 + lightNumber * size,
                    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
                });
            }
        else {//不同，注销并新建
            if (this.systemUniformBuffers["lights"]) {
                this.systemUniformBuffers["lights"].destroy();
            }
            lightsGPUBuffer = this.device.createBuffer({
                label: 'lightsGPUBuffer',
                size: 16 + 16 + lightNumber * size,
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
            });
            this._lastNumberOfLights = lightNumber;
        }


        //总arraybuffer
        let buffer = new ArrayBuffer(16 + 16 + lightNumber * size);

        //第一个16，是光源数量
        let ST_lightNumber = new Uint32Array(buffer, 0, 1);
        ST_lightNumber[0] = lightRealNumberOfSystem;

        //第二个16，是当前的环境光参数（每个stage的环境光可能不同，室内外）
        let ST_AmbientLightViews = {
            color: new Float32Array(buffer, 16, 3),
            intensity: new Float32Array(buffer, 16 + 12, 1),
        };
        ST_AmbientLightViews.color[0] = this.ambientLight._color[0];
        ST_AmbientLightViews.color[1] = this.ambientLight._color[1];
        ST_AmbientLightViews.color[2] = this.ambientLight._color[2];
        ST_AmbientLightViews.intensity[0] = this.ambientLight._intensity;

        //第三部分，lightNumber * size
        //映射到每个viewer上，并写入新的数据（无论是否有变化）
        for (let i = 0; i < this.lights.length; i++) {
            let StructBuffer = new Float32Array(buffer, 16 + 16 + size * i, size / 4);//todo，20241117，需要确认是否/4(byte*4 -->float32*1)
            let lightStructBuffer = this.lights[i].getStructBuffer();
            for (let j = 0; j < size; j++) {
                StructBuffer[i * size + j] = lightStructBuffer[j];
            }
        }

        //生成浮点数据队列
        let bufferFloat32Array = new Float32Array(buffer);
        // let bufferFloat32Array = buffer;
        //将新生成的浮点数据写入到GPUBuffer中，
        this.device.queue.writeBuffer(
            lightsGPUBuffer,
            0,
            bufferFloat32Array.buffer,
            bufferFloat32Array.byteOffset,
            bufferFloat32Array.byteLength
        );
        return lightsGPUBuffer;
    }
    /**
     * 
     * @param mvp 
     * @returns 
     */
    getUnitMVP(mvp: Mat4[] | boolean = false): GPUBuffer {
        const uniformBufferSize = 4 * 4 * 4 * 4;//MVP 
        let MVP: GPUBuffer;
        let MVP_buffer = new Float32Array([
            1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1,
            1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1,
            1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        ]);
        if (this.systemUniformBuffers["MVP"]) {
            MVP = this.systemUniformBuffers["MVP"];
        }
        else {
            MVP = this.device.createBuffer({
                label: 'system MVP',
                size: uniformBufferSize,
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
            });
        }
        if (mvp !== false) {
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
        }
        this.device.queue.writeBuffer(
            MVP,
            0,
            MVP_buffer.buffer,
            MVP_buffer.byteOffset,
            MVP_buffer.byteLength
        );
        return MVP;
    }


    /**
     * 获取MVP矩阵
     * @returns MVP(16*4)
     */
    getMVP(): GPUBuffer {
        if (this.defaultCamera) {
            let mvpArray = this.defaultCamera.getMVP();
            return this.getUnitMVP(mvpArray);
        }
        else//返回单位矩阵数组和000的摄像机位置
            return this.getUnitMVP();
    }

    updateBVH(cameraValues: cameraRayValues) {

    }
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
    updateAcotr(deltaTime: number) {
        if (this.actors)
            for (let i in this.actors) {
                if (this.defaultActor && this.actors[i] != this.defaultActor)
                    this.actors[i].update(deltaTime);
            }
    }
    /**实体更新 
     * 1、执行所有entity
     *      A、判断stage，是否有效与可见性，是否可见
     *      B、判断实体的可见性与有效性
     *      C、判断摄像机（每个）的可见性
     *          距离
     *          方向（BVH）
     *          视锥
     *        输出是否本轮可见 
    */
    updateEntities(deltaTime: number,) {

    }


    /**
     * 更新stage
     * 包括：
     *      colorTexture、depthTextur
     *      视锥状态是否更新
     *      视口是否变化
     * @param deltaTime 
     */
    updateStagesCommand(deltaTime: number,) {
        for (let i in this.stagesOrders) {
            const perList = this.stagesOrders[i];//number，stagesOfSystem的数组角标
            const name = coreConst.stagesOfSystem[perList];

            {//每个stageGroup进行update，包含透明和不透明两个stage 
                if (this.stages[name].opaque) {
                    this.stages[name].opaque!.update(deltaTime);
                }
                if (this.stages[name].transparent) {
                    this.stages[name].transparent!.update(deltaTime);
                }
            }
        }
    }


    /**
     * 每帧绘制入口
     * 1、清空scene.commmand
     * 
     * 2、循环所有stages
     *      A、每个stage的root——>command[]
     *          //这个可能需要分成透明、不透明进行渲染，有可能涉及到2个stage，todo
     *      B、scene.command.push(percommand)
     * 
     * 3、执行scene的command
     *      A、恢复loadOp的参数（一次）
     *      B、创建view(一次)
     *      C、更新loadOp的参数到load(一次)
     *      D、执行command.update()
     
    * todo 
    * stage 合并
    * stage 深度测试
    * stage 透明深度与合并
    * sky、UI的合并与顺序
    * */
    oneFrameRender() {
        //清空command
        this.command = [];
        (<GPURenderPassColorAttachment[]>this.renderPassDescriptor.colorAttachments)[0].view =
            this.context.getCurrentTexture().createView();//ok,重新申明了this.context的类型
        // (<GPUCanvasContext>this.context).getCurrentTexture().createView();//ok
        for (let i in this.stagesOrders) {
            const perList = this.stagesOrders[i];//number，stagesOfSystem的数组角标
            const name = coreConst.stagesOfSystem[perList];

            {//聚合stage的command，包含透明和不透明两个stage ,
                if (this.stages[name].opaque) {
                    const perStageCommandOfOpaque = this.stages[name].opaque!.command;
                    for (let command_i of perStageCommandOfOpaque) {
                        this.command.push(command_i);
                    }
                }
                if (this.stages[name].transparent) {
                    const perStageCommandOfTransparent = this.stages[name].transparent!.command;
                    for (let command_i of perStageCommandOfTransparent) {
                        this.command.push(command_i);
                    }
                }
            }
        }

        if (this.command.length > 0) {
            for (let i in this.command) {
                if (i == "0") {
                    (<GPURenderPassColorAttachment[]>this.renderPassDescriptor.colorAttachments)[0].loadOp = this.renderPassSetting.color!.loadOp!;
                    // (<GPURenderPassColorAttachment[]>this.renderPassDescriptor.colorAttachments)[0].clearValue = this.renderPassSetting.color!.clearValue!;
                    this.renderPassDescriptor.depthStencilAttachment!.depthLoadOp = this.renderPassSetting.depth!.depthLoadOp!;
                    (<GPURenderPassColorAttachment[]>this.renderPassDescriptor.colorAttachments)[0].view =
                        (this.context as GPUCanvasContext)
                            .getCurrentTexture()
                            .createView();
                }
                else if (i == "1") {
                    (<GPURenderPassColorAttachment[]>this.renderPassDescriptor.colorAttachments)[0].loadOp = this.renderPassSetting.colorSecond!.loadOp!;
                    this.renderPassDescriptor.depthStencilAttachment!.depthLoadOp = this.renderPassSetting.depthSecond!.depthLoadOp!;
                }
                this.command[i].update();
            }
        }
    }

    pickup() { }
    postProcess() { }
    // addUserUpdate(fun: any) { }
    /**
     * 用户自定义的更新
     * 比如：
     *  订阅，触发、MQ、WW等
     */
    updateUserDefine() { }

}

export { Scene };
export type { sceneInputJson };
