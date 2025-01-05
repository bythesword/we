import { CopyCommandT2T } from "../command/copyCommandT2T";
import { GBuffers, userFN } from "../const/coreConst";
import { Root } from "../scene/root";
import { commmandType } from "../scene/baseScene";
import { Scene } from "../scene/scene";

export interface optionBasePostprocessEffect {
    // width?: number,
    // height?: number,
}
export interface optionBasePostprocessEffectStep2 {
    copyToTarget: { [name: string]: GPUTexture },
    rawColorTexture: GPUTexture,
    renderPassDescriptor: GPURenderPassDescriptor,
    presentationFormat: GPUTextureFormat,
    scene: Scene,
    update?: userFN
}
export abstract class PostProcessEffect extends Root {
    commands: commmandType[];
    copyToTarget!: { [name: string]: GPUTexture };
    rawColorTexture!: GPUTexture;
    renderPassDescriptor!: GPURenderPassDescriptor;
    GBuffers!: {
        [name: string]: GBuffers
    };
    presentationFormat!: GPUTextureFormat;
    input: optionBasePostprocessEffect;
    width!: number;
    height!: number;

    constructor(input: optionBasePostprocessEffect) {
        super();
        // this.width = input.height;
        // this.height = input.height;
        this.input = input;
        this.commands = [];
    }

    abstract _init(): void

    async init(values: optionBasePostprocessEffectStep2) {
        await this.setRootENV(values.scene);//为获取在scene中注册的resource
        this.copyToTarget = values.copyToTarget;
        this.rawColorTexture = values.rawColorTexture;
        this.presentationFormat = this.scene.presentationFormat;
        this.renderPassDescriptor = values.renderPassDescriptor;
        this.width = this.scene.canvas.width;
        this.height = this.scene.canvas.height;
        this.GBuffers = this.scene.GBuffers;
        this._init();
        // this.copy();
    }

    copy(source: GPUTexture, target: GPUTexture) {
        let copyToColorTexture = new CopyCommandT2T(
            {
                A: source,
                B: target,
                // A: this.rawColorTexture,
                // B: this.copyToTarget,
                size: { width: this.canvas.width, height: this.canvas.height },
                device: this.device
            }
        );
        this.commands.push(copyToColorTexture);
    }
    update(_deltaTime: number, _startTime: number, _lastTime: number): commmandType[] {
        return this.commands;
    }

}