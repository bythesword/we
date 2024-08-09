import * as coreConst from "../const/coreConst"
import {
    Mat4,
    mat4,
    //  vec3 
} from 'wgpu-matrix';

import { Clock } from '../scene/clock';

import { BaseScene, sceneJson } from './baseScene';

import {
    DrawCommand,
    // primitiveOption,
    // drawModeIndexed,
    // drawMode,
    // indexBuffer,
    // unifromGroup,
    // uniformEntries,
    // uniformBufferPart,
    // fsPart,
    // vsPart,
    // vsAttributes
} from "../command/DrawCommand"

import { ComputeCommand } from '../command/ComputeCommand';

import {
    //  projectionOptions,
    BaseCamera,
} from "../camera/baseCamera"

import { BaseActor } from '../actor/baseActor';
import { CameraActor } from '../actor/cameraActor';
import { Stage, commmandType, stageType } from '../stage/baseStage';

// import { optionPerspProjection, PerspectiveCamera } from "../camera/perspectiveCamera"
// import { optionCamreaControl } from "../control/cameracCntrol"
// import { ArcballCameraControl } from "../control/arcballCameraControl"

declare interface sceneInputJson extends sceneJson {
    /**canvas id */
    canvas: string,
}


declare interface light { }
declare interface lightUniform { }
declare interface BVH { }
/**system  uniform 时间结构体 */
declare interface timeUniform {
    deltaTime: number,
    time: number,
}

/**
 * todo ，需要更新，按照playcanvas的模式
 * 默认的stage结构 */
// export declare interface stage {
//     root: [],
//     name: string,
//     enable: boolean,
//     visible: boolean,
//     depthTest: boolean,
//     transparent: boolean,
//     /**每个stage的command集合 
//      * 一个实体可以由多个command，分布在不同的stage，比如透明，不透明
//     */
//     command: commmandType[];
// }

/** stage 收集器/集合 */
export interface stages {
    [name: string]: stageType
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

class Scene extends BaseScene {

    /** scene 的初始化参数 */
    declare input: sceneInputJson;

    /**每帧的webGPU的command集合 */
    command!: commmandType[];


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
    lights!: light[];

    /** todo  */
    stages!: stages;
    stagesOrders!: number[]

    /**视场比例 */
    aspect!: number;
    // projectionMatrix!: Mat4;

    cocolorAttachment!: GPUTextureView;
    depthStencilAttachment!: GPUTextureView;

    /** system uniform buffer 结构体，参加 interfance systemUniformBuffer */
    systemUniformBuffers!: systemUniformBuffer;

    /** actor group */
    actors!: actorGroup;
    /** default actor
     *  一般的场景是CameraActor
     *  也可以是人物Actor
     */
    defaultActor!: BaseActor;

    constructor(input: sceneInputJson) {
        super(input)
        this.systemUniformBuffers = {};

        this.clock = new Clock();
        this.input = input;
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
        let worldStage: stageType = {
            root: [],
            name: '',
            enable: true,
            visible: true,
            depthTest: true,
            transparent: false,
            command: []
        }
        this.stages = {
            "World": worldStage
        };
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
            this.setDefaultActor(one);
        }

    }
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
        this.cocolorAttachment = (this.context as GPUCanvasContext)
            .getCurrentTexture()
            .createView();
        this.depthStencilAttachment = this.depthTexture.createView();
        const renderPassDescriptor: GPURenderPassDescriptor = {
            colorAttachments: [
                {
                    view: this.cocolorAttachment, // Assigned later
                    clearValue: [0.5, 0.5, 0.5, 1.0],
                    loadOp: 'clear',
                    storeOp: 'store',
                },
            ],
            depthStencilAttachment: {
                view: this.depthStencilAttachment,
                depthClearValue: 1.0,
                // depthLoadOp: 'load',
                depthLoadOp: 'clear',
                depthStoreOp: 'store',
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
    updateUserDefine() { }


    /**
     * 每帧绘制入口
     */
    oneFrameRender() {
        this.command = [];
        (<GPURenderPassColorAttachment[]>this.renderPassDescriptor.colorAttachments)[0].view =
            (<GPUCanvasContext>this.context).getCurrentTexture().createView();//ok
        for (let i in coreConst.defaultStageList) {
            const perList = coreConst.defaultStageList[i];//number，stagesOfSystem的数组角标
            const name = coreConst.stagesOfSystem[perList];
            const perStageCommand = this.stages[name].command;
            for (let command_i of perStageCommand) {
                this.command.push(command_i);
            }
        }

        if (this.command.length > 0) {
            for (let i of this.command) {
                i.update();
            }
        }
    }
    /**更新Actor */
    updateAcotr(deltaTime: number) {
        if (this.actors)
            for (let i in this.actors) {
                this.actors[i].update(deltaTime);
            }
    }
    /**每帧更新入口 */
    update(deltaTime: number) {
        this.updateSystemUniformBuffer();
        this.updateAcotr(deltaTime);
        this.updateEntries(deltaTime);
    }

    updateEntries(deltaTime: number) {

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
