export abstract class Root {
    device!: GPUDevice;
    scene: any;
    canvas!: HTMLCanvasElement;

    _readyForGPU!: boolean;

    async setRootScene(scene: any) {
        this.scene = scene;
    }
    async setRootcanvas(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
    }
    async setRootENV(scene: any) {
        this.device = scene.device;
        this.canvas = scene.canvas;
        this.scene = scene;
        this._readyForGPU = true;
        this.readyForGPU();

    }
    async setRootDevice(device: GPUDevice) {
        this.device = device;
        this._readyForGPU = true;
    }
    async readyForGPU() { }
}