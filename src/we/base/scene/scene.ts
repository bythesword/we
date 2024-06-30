import { mat4, vec3 } from 'wgpu-matrix';
class Scene {
    constructor() {
        // this.init();
    }
    async init() {
        const adapter = await navigator.gpu.requestAdapter();
        const device = await adapter.requestDevice();
        const context = canvas.getContext('webgpu') as GPUCanvasContext;

        const devicePixelRatio = window.devicePixelRatio;//设备像素比
        canvas.width = canvas.clientWidth * devicePixelRatio;
        canvas.height = canvas.clientHeight * devicePixelRatio;
        const presentationFormat = navigator.gpu.getPreferredCanvasFormat();

        context.configure({
            device,
            format: presentationFormat,
            alphaMode: 'premultiplied',//预乘透明度
        });

        const aspect = canvas.width / canvas.height;
        const projectionMatrix = mat4.perspective((2 * Math.PI) / 5, aspect, 1, 100.0);
        const modelViewProjectionMatrix = mat4.create();

    }

}

export default Scene