import * as coreConst from "../const/coreConst"
import {
    Mat4,
    mat4,
    //  vec3 
} from 'wgpu-matrix';

import { Clock } from '../scene/clock';
import { cameraRayValues } from "../camera/baseCamera";
import { BaseScene, sceneJson, renderPassSetting } from './baseScene';

// import {
//     DrawCommand,
//     // primitiveOption,
//     // drawModeIndexed,
//     // drawMode,
//     // indexBuffer,
//     // unifromGroup,
//     // uniformEntries,
//     // uniformBufferPart,
//     // fsPart,
//     // vsPart,
//     // vsAttributes
// } from "../command/DrawCommand"

// import { ComputeCommand } from '../command/ComputeCommand';

import {
    //  projectionOptions,
    BaseCamera,
} from "../camera/baseCamera"

import { BaseActor } from '../actor/baseActor';
import { CameraActor } from '../actor/cameraActor';
import { BaseStage, commmandType, stageGroup } from '../stage/baseStage';
import { BaseEntity } from "../entity/baseEntity";
import { BaseLight } from "../light/baseLight";
// import { optionPerspProjection, PerspectiveCamera } from "../camera/perspectiveCamera"
// import { optionCamreaControl } from "../control/cameracCntrol"
// import { ArcballCameraControl } from "../control/arcballCameraControl"

/**
 *  canvas: string, canvas id;
 *  color?:color4F,JSON {red:1.0,green:1,blue:1,alpha:1}
 */
declare interface sceneInputJson extends sceneJson {
    /**canvas id */
    canvas: string,
    // renderPassSetting?: renderPassSetting,
    color?: coreConst.color4F
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

    /** lights array */
    lights!: lights[];

    /** todo  */
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
        // this.projectionMatrix = mat4.create();
        // this.modelViewProjectionMatrix = mat4.create();
        // this.root = [];
        // this.command = [];
        // this.uniform = [];
        // this.cameras = [];
        // this.lights = [];


        return this;
    }
    async init() {
        if (!("gpu" in navigator)) this.fatal("WebGPU not supported.");

        const adapter = await navigator.gpu.requestAdapter();
        if (!adapter) throw new Error("Couldn't request WebGPU adapter.");
        this.adapter = adapter;

        const device = await adapter.requestDevice();
        if (!device) throw new Error("Couldn't request WebGPU device.");
        this.device = device;

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
        //
        this.renderPassDescriptor = this.createRenderPassDescriptor();
        this.updateSystemUniformBuffer();
        this.initStages();
        this.initActors();
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
     * 每个shader/DraeCommand/ComputeCommand为自己的uniform调用更新uniform group 0 
     * 这个需要确保每帧只更新一次
     */

    updateSystemUniformBuffer() {
        if (this.defaultCamera)
            this.systemUniformBuffers["MVP"] = this.getMVP();
    }
    /**
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
                ],
        }
        const bindGroup: GPUBindGroup = this.device.createBindGroup(groupDesc);
        return bindGroup;
    }

    getUnitMVP(mvp: Mat4[] | boolean = false): GPUBuffer {
        const uniformBufferSize = 4 * 4 * 4 * 3;//MVP 
        let MVP: GPUBuffer;
        let MVP_buffer = new Float32Array([
            1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1,
            1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1,
            1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1,
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

            let a = 1;
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
    getMVP(): GPUBuffer {
        if (this.defaultCamera) {
            let mvpArray = this.defaultCamera.getMVP();
            return this.getUnitMVP(mvpArray);
        }
        else
            return this.getUnitMVP();
    }

    // addUserUpdate(fun: any) { }
    /**
     * 用户自定义的更新
     * 比如：
     *  订阅，触发、MQ、WW等
     */
    updateUserDefine() { }


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
        this.command = [];
        (<GPURenderPassColorAttachment[]>this.renderPassDescriptor.colorAttachments)[0].view =
            this.context.getCurrentTexture().createView();//ok,重新申明了this.context的类型
        // (<GPUCanvasContext>this.context).getCurrentTexture().createView();//ok
        for (let i in this.stagesOrders) {
            const perList = this.stagesOrders[i];//number，stagesOfSystem的数组角标
            const name = coreConst.stagesOfSystem[perList];

            {//复合stage，包含透明和不透明两个stage 
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

            {//复合stage，包含透明和不透明两个stage 
                if (this.stages[name].opaque) {
                    this.stages[name].opaque!.update(deltaTime);
                }
                if (this.stages[name].transparent) {
                    this.stages[name].transparent!.update(deltaTime);
                }
            }
        }
    }

    updateBVH(cameraValues: cameraRayValues) {

    }

    /**每帧更新入口
     * 1、更新system uniform
     * 2、更新Acter
     * 3、更新实体 entity
     */
    update(deltaTime: number) {
        if (this.defaultActor)
            this.defaultActor.update(deltaTime);
        this.updateSystemUniformBuffer();

        // 四个中间点，稍稍延迟
        // let rays = this.defaultCamera!.getCameraRays();

        /// 四个中间点，稍稍延迟
        // this.updateBVH(rays)

        this.updateAcotr(deltaTime);//camera 在此位置更新，entities需要camera的dir和视锥参数
        this.updateEntities(deltaTime);//更新实体状态，比如水，树，草等动态的
        this.updateStagesCommand(deltaTime);
    }



    /**
     * 循环入口
     */
    run() {
        let scope = this;
        this.clock.update();
        function run() {
            // let deltaTime = scope.clock.deltaTime;
            scope.clock.update();
            const deltaTime = scope.clock.deltaTime;
            scope.update(deltaTime);
            scope.oneFrameRender();
            scope.pickup();
            scope.postProcess();
            scope.updateUserDefine();
            requestAnimationFrame(run)
        }
        requestAnimationFrame(run)
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
    pickup() { }
    postProcess() { }
}

export { Scene };
export type { sceneInputJson };
