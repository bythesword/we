import { commmandType } from "./baseScene";
import { Scene } from "./scene";



export interface optionSingleRender {
    // parent?: Scene | BaseScene | BaseStage;
    device: GPUDevice;
    surfaceSize: {
        width: number,
        height: number,
    },
    parent: Scene,

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
    parent: Scene;

    constructor(input: optionSingleRender) {
        this.surfaceSize = input.surfaceSize;
        this.device = input.device;
        this.input = input;
        this.parent = input.parent;
        this.commands = [];

    }
    update() {
        if (this.commands.length > 0) {
            for (let i in this.commands) {
                this.commands[i].update();
            }
        }
    }

    abstract destroy(): void;
}