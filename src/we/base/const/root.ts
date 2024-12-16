import { BaseScene } from "../scene/baseScene";
import { Scene } from "../scene/scene";
import { BaseStage } from "../stage/baseStage";

export abstract class Root {
    device!: GPUDevice;
    scene!: Scene;
    canvas!: HTMLCanvasElement;
    stage: BaseStage | undefined;
    stageTransparent: BaseStage | undefined;

    _readyForGPU!: boolean;

    _id!: number;
    set ID(id) { this._id = id; }
    get ID() { return this._id; }

    async setRootScene(scene: any) {
        this.scene = scene;
    }
    async setRootcanvas(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
    }
    async setRootENV(scene: Scene) {
        this.device = scene.device;
        this.canvas = scene.canvas;
        this.scene = scene;
        this._readyForGPU = true;
        await this.readyForGPU();

    }
    async setRootDevice(device: GPUDevice) {
        this.device = device;
        this._readyForGPU = true;
    }
    async readyForGPU() { }
}