import { Scene } from "./scene";
import { BaseStage } from "../stage/baseStage";

export abstract class RootOfGPU {
    device!: GPUDevice;
    scene!: Scene;
    canvas!: HTMLCanvasElement;
    stage!: BaseStage  ;//UI 可能没有不透明层
    // stageTransparent!: BaseStage | undefined;//sky 没有透明层

    _readyForGPU!: boolean;

    _id!: number;
    set ID(id) { this._id = id; }
    get ID() { return this._id; }

    async setRootScene(scene: Scene) {
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