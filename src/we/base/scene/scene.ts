import { Mat4, mat4, vec3 } from 'wgpu-matrix';

declare type sceneInputJson = {
    /**canvas id */
    canvas: string,
}

class Scene {
    /** scene 的初始化参数 */
    input: sceneInputJson;
    aspect: number | undefined;
    projectionMatrix: Mat4;
    modelViewProjectionMatrix: Mat4;
    adapter: GPUAdapter | undefined;
    device: GPUDevice | undefined;
    rendTo: HTMLCanvasElement | undefined | GPUTexture;
    context: GPUCanvasContext | GPUTextureView | undefined;
    presentationFormat: GPUTextureFormat | undefined;
    command: any[];
    uniform: any[];
    clock: any;
    MQ: any;
    WW: any;
    cameras: any[];
    lights: any[];
    stages: any;
    root: any[];

    constructor(input: sceneInputJson) {
        this.input = input;
        this.projectionMatrix = mat4.create();
        this.modelViewProjectionMatrix = mat4.create();
        this.root = [];
        this.command = [];
        this.uniform = [];
        this.cameras = [];
        this.lights = [];
        // this.init();
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

        const canvas = document.querySelector(this.input.canvas) as HTMLCanvasElement;
        this.rendTo = canvas;
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

    }
    fatal(msg: string | undefined) {
        document.body.innerHTML += `<pre>${msg}</pre>`;
        throw Error(msg);
    }
    oneFrame() {
        this.update();
        if(this.command.length >0){
            
        }
        requestAnimationFrame(this.oneFrame)
    }
    update() {
        this.command = [];
        for (let i of this.root) {
            let perCommand = i.update();
            if (perCommand.lenght > 0) {
                for (let j of perCommand)
                    this.command.push(j);
            }
        }
    }
}

export { Scene };
export type { sceneInputJson };
