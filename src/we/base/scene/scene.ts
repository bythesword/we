import { Mat4, mat4, vec3 } from 'wgpu-matrix';
import { Clock } from '../scene/clock';

declare type sceneInputJson = {
    /**canvas id */
    canvas: string,
}
declare interface cameras {

}

class Scene {
    /** scene 的初始化参数 */
    input: sceneInputJson;
    aspect: number | undefined;
    projectionMatrix: Mat4;
    modelViewProjectionMatrix: Mat4;
    /**webgpuo adapter */
    adapter: GPUAdapter | undefined;
    /**webgpuo device */
    device: GPUDevice | undefined;
    /** 默认的渲染对象*/
    renderTo: HTMLCanvasElement | undefined | GPUTexture;
    /**默认的渲染对象输出*/
    context: GPUCanvasContext | GPUTextureView | undefined;
    /** presentationFormat*/
    presentationFormat: GPUTextureFormat | undefined;
    /**每帧的webGPU的command集合 */
    command: any[];
    /**架构的uniform */
    uniform: any[];
    /**clock */
    clock: any;
    /** todo */
    MQ: any;
    /** todo */
    WW: any;
    /**cameras list */
    cameras: {};
    /** main camera */
    cameraDefault: any;
    /** lights array */
    lights: any[];
    /** todo  */
    stages: any;
    /** root of group  */
    root: any[];



    constructor(input: sceneInputJson) {
        this.clock = new Clock();
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

        const canvas = document.getElementById(this.input.canvas) as HTMLCanvasElement;
        this.renderTo = canvas;
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
    get projectionOfMatrix() {
        return this.projectionMatrix;
    }
    fatal(msg: string | undefined) {
        document.body.innerHTML += `<pre>${msg}</pre>`;
        throw Error(msg);
    }
    addUserUpdate(fun: any) {

    }
    updateUserDefine() {

    }
    requestAnimationFrame() {
        let scope = this;
        this.clock.update();
        function run() {
            let deltaTime = scope.clock.deltaTime;
            scope.clock.update();
            scope.update();
            scope.oneFrame();
            requestAnimationFrame(run)
        }
        requestAnimationFrame(run)
    }
    oneFrame() {
        if (this.command.length > 0) {

        }
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
    observer() {
        new ResizeObserver(entries => {
            for (const entry of entries) {
                const canvas = entry.target;
                const width = entry.contentBoxSize[0].inlineSize;
                const height = entry.contentBoxSize[0].blockSize;
                canvas.width = Math.max(1, Math.min(width, device.limits.maxTextureDimension2D));
                canvas.height = Math.max(1, Math.min(height, device.limits.maxTextureDimension2D));
                // re-render
                render();
            }
        });
    }
}

export { Scene };
export type { sceneInputJson };
