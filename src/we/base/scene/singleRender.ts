import { commmandType } from "./baseScene";



export interface optionSingleRender {
    // parent?: Scene | BaseScene | BaseStage;
    device: GPUDevice;
    surfaceSize: {
        width: number,
        height: number,
    }
}
// type DrawCommandAndComputeCommandAndCopyCommand = DrawCommand | ComputeCommand | CopyCommandT2T;
export abstract class SingleRender {
    // parent!: Scene;
    device: GPUDevice;
    surfaceSize: {
        width: number,
        height: number,
    }
    renderPassDescriptor!: GPURenderPassDescriptor;
    commands: commmandType[];
    input: optionSingleRender;
    colorAttachmentTargets!: GPUColorTargetState[];

    constructor(input: optionSingleRender) {
        this.surfaceSize = input.surfaceSize;
        this.device = input.device;
        this.input = input;
        this.commands = [];

    }
    abstract update(): any;
    abstract getTextures(): GPUTexture[];
    abstract getColorAttachmentTargets(): GPUColorTargetState[];

    getRenderPassDescriptor(): GPURenderPassDescriptor {
        return this.renderPassDescriptor;
    };
}