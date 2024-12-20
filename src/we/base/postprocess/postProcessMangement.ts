import { CopyCommandT2T } from "../command/copyCommandT2T";
import { commmandType } from "../scene/baseScene";
import { Scene } from "../scene/scene"
import { optionBasePostprocessEffectStep2, PostProcessEffect } from "./postProcessEffect";


export interface optionPostprocessMangement {
    // GBuffers: GBuffers,
    // renderPassDescriptor: GPURenderPassDescriptor,
    parent: Scene,
    copyTotarget: GPUTexture,
    rawColorTexture?: GPUTexture,
}

export class PostProcessMangement {
    device: GPUDevice;
    copyTotarget: GPUTexture;
    // GBuffers: GBuffers;
    parent: Scene;
    presentationFormat: GPUTextureFormat;
    root: PostProcessEffect[];
    input: optionPostprocessMangement;
    commands: commmandType[];
    rawColorTexture: GPUTexture;
    /** for raw*/
    // rawDepthTexture: GPUTexture;
    /** for raw*/
    rawColorAttachmentTargets: GPUColorTargetState[];
    renderPassDescriptor: GPURenderPassDescriptor;

    constructor(input: optionPostprocessMangement) {
        this.input = input;
        this.parent = input.parent;
        this.device = this.parent.device;
        this.copyTotarget = input.copyTotarget;
        // this.GBuffers = input.GBuffers;
        this.root = [];
        this.commands = [];
        this.presentationFormat = this.parent.presentationFormat;
        if (input.rawColorTexture) {
            this.rawColorTexture = this.parent.rawColorTexture;
        }
        else {
            this.rawColorTexture = this.device.createTexture({
                size: [this.parent.canvas.width, this.parent.canvas.height],
                format: this.presentationFormat,
                usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC | GPUTextureUsage.COPY_DST | GPUTextureUsage.TEXTURE_BINDING,
            });
        }
        this.rawColorAttachmentTargets = [
            // color
            { format: this.presentationFormat },
        ];

        this.renderPassDescriptor = {
            label: "stage:forward render pass descriptor",
            colorAttachments: [
                {
                    view: this.rawColorTexture.createView(),
                    clearValue: [0, 0, 1, 0],
                    loadOp: 'clear',
                    storeOp: "store"
                }
            ],
        };
    }

    async add(one: PostProcessEffect) {
        let values: optionBasePostprocessEffectStep2 = {
            copyTotarget: this.copyTotarget,
            rawColorTexture: this.rawColorTexture,
            renderPassDescriptor: this.renderPassDescriptor,
            scene: this.parent,
            presentationFormat: this.presentationFormat
        }
        await one.init(values);
        this.root.push(one);
    }
    update(deltaTime: number, startTime: number, lastTime: number) {
        this.commands = [];
        for (let i of this.root) {
            const commmands = i.update(deltaTime, startTime, lastTime);
            for (let j of commmands) {
                this.commands.push(j);
            }
        }

    }
    render() {
        for (let i of this.commands) {
            i.update();
        }
    }
}