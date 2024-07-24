import {
    Mat4,
    mat4,
    //  vec3 
} from 'wgpu-matrix';

import { Clock } from '../scene/clock';

import {
    BaseScene,
    sceneJson
} from './baseScene';

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


declare interface sceneInputJson extends sceneJson {
    /**canvas id */
    canvas: string,
}
declare interface camera {
    stage: number | boolean,//是否只在一个stage中
}
declare interface light { }
declare interface BVH { }
export declare interface stage {
    root: [],
    name: string,
    enable: boolean,
    visible: boolean,
    depthTest: boolean,
    BVH_Enable: boolean,
    BVHS_Dynamic: boolean,
    BVH?: BVH,
    transparent: boolean,

}

class Scene extends BaseScene {

    /** scene 的初始化参数 */
    declare input: sceneInputJson;
    /**每帧的webGPU的command集合 */
    command!: DrawCommand[];
    /**架构的uniform */
    uniformSystem!: any[];
    /**clock */
    clock: Clock;
    /** todo */
    MQ: any;
    /** todo */
    WW: any;
    /**cameras list */
    cameras!: camera[];
    cameraDefualt!: camera;
    /** main camera */
    cameraDefault: any;
    /** lights array */
    lights!: light[];
    /** todo  */
    stages!: stage[];
    stagesOrders!: number[]
    /** root of group  */

    aspect!: number;
    projectionMatrix!: Mat4;

    cocolorAttachment!: GPUTextureView;
    depthStencilAttachment!: GPUTextureView;


    constructor(input: sceneInputJson) {
        super(input)
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
        this.projectionMatrix = mat4.perspective((2 * Math.PI) / 5, this.aspect, 1, 100.0);
        // const modelViewProjectionMatrix = mat4.create();

        //深度buffer
        this.depthTexture = device.createTexture({
            size: [canvas.width, canvas.height],
            format: 'depth24plus',
            usage: GPUTextureUsage.RENDER_ATTACHMENT,
        });
        //
        this.renderPassDescriptor = this.createRenderPassDescriptor();
    }
    getMVP() {
        throw new Error('Method not implemented.');
    }
    /**
     * 作废，不需要获取，直接更新
     * 获取scene 的uniform 
     */
    getuniformSystem() { }
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
    updateUnifrombuffer() { }
    /**
     * uniform of system  bindGroup to  group  0 for pershader
     */
    updateUnifrombufferForPerShader() { }

    getProjectionOfMatrix() {
        return this.projectionMatrix;
    }
    // addUserUpdate(fun: any) { }
    updateUserDefine() { }


    requestAnimationFrame() {
        let scope = this;
        this.clock.update();
        function run() {
            // let deltaTime = scope.clock.deltaTime;
            scope.clock.update();
            scope.update();
            scope.oneFrame();
            requestAnimationFrame(run)
        }
        requestAnimationFrame(run)
    }
    updateUniformSystem() {

    }
    oneFrame() {
        (<GPURenderPassColorAttachment[]>this.renderPassDescriptor.colorAttachments)[0].view =
            (<GPUCanvasContext>this.context).getCurrentTexture().createView();//ok
        if (this.command.length > 0) {

        }
    }
    update() {
        this.updateUnifrombuffer();
        this.command = [];
        // for (let i of this.root) {
        //     let perCommand = i.update();
        //     if (perCommand.lenght > 0) {
        //         for (let j of perCommand)
        //             this.command.push(j);
        //     }
        // }
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
}

export { Scene };
export type { sceneInputJson };
