import { CameraActor } from "../actor/cameraActor";
import { DrawCommand } from "../command/DrawCommand";
import { MultiGBuffers } from "../const/coreConst";
import { cameraViewport } from "./scene";
import { optionSingleRender, SingleRender } from "./singleRender";
import shaderCodeVec4f from "../shader/GBuffersVisualize/vec4f.wgsl?raw";
import { unifromGroup, drawMode, DrawOptionOfCommand } from "../command/commandDefine";

export interface optionMulitCameras extends optionSingleRender {
    multiCameraViewport: cameraViewport[],
    copyToTarget: GPUTexture,
    MultiGBuffers: MultiGBuffers,
    CameraActors: CameraActor[],
}

export class MultiCameras extends SingleRender {
    colorTexture: GPUTexture;
    multiCameraViewport: cameraViewport[];
    width: number;
    height: number;
    sampler: GPUSampler;
    MultiGBuffers: MultiGBuffers;
    declare input: optionMulitCameras;

    constructor(input: optionMulitCameras) {
        super(input);
        this.input = input;
        this.width = this.parent.canvas.width;
        this.height = this.parent.canvas.height;
        this.colorTexture = input.copyToTarget;
        this.multiCameraViewport = input.multiCameraViewport;
        this.MultiGBuffers = input.MultiGBuffers;
        this.sampler = this.device.createSampler({
            magFilter: 'linear',
            minFilter: 'linear',
        });
        this.renderPassDescriptor = this.createRenderPassDescriptor();
    }
    destroy(): void {
        throw new Error("Method not implemented.");
    }
    /** mulity camera DCCC create */
    async check(cameraActorID: string) {
        // this.commands = [];
        let values: drawMode = {
            vertexCount: 6
        };
        for (let one of this.input.multiCameraViewport) {
            const cameraActor = this.getCameraActorByNameAndID(one.cameraActorName, cameraActorID);
            if (cameraActor) {
                const cameraActorID = cameraActor.id.toString();
                const colorTexture = this.MultiGBuffers[cameraActorID]["color"];
                const viewport = one.viewport;
                let x: number = Math.trunc(viewport.x * (this.width - 1));
                let y: number = Math.trunc(viewport.y * (this.height - 1));
                // let width: number = 100;
                let width: number = Math.trunc(viewport.width * (this.width - 1));
                // let height: number = 100;
                let height: number = Math.trunc(viewport.height * (this.height - 1));
                let uniforms: unifromGroup[] = [
                    {
                        layout: 0,
                        entries: [

                            {
                                binding: 0,
                                resource: colorTexture.createView(),
                            },
                            {
                                binding: 1,
                                resource: this.sampler,
                            },
                        ]
                    }
                ];;
                let constants = {};
                let option: DrawOptionOfCommand = {
                    label: "Multi Cameras Output:" + one.cameraActorName,
                    vertex: {
                        code: shaderCodeVec4f as string,
                        entryPoint: "vs",
                    },
                    fragment: {
                        code: shaderCodeVec4f as string,
                        entryPoint: "fs",
                        targets: [
                            //color
                            { format: this.parent.presentationFormat }
                        ],
                        constants: constants
                    },
                    draw: {
                        mode: "draw",
                        values: values
                    },
                    parent: this.parent,
                    uniforms: uniforms,
                    primitive: {
                        topology: 'triangle-list',
                        cullMode: "back",
                    },
                    rawUniform: true,
                    renderPassDescriptor: this.renderPassDescriptor,
                    viewport: {
                        x,
                        y,
                        width,
                        height
                    }

                };
                let DC = new DrawCommand(option);
                this.commands.push(DC);
            }
            // else {
            //     console.error("输入多摄像机未找到！名称:", one.cameraActorName);
            // }
        }



        //copy to final target 
        // let copyToColorTexture = new CopyCommandT2T(
        //     {
        //         A: this.GBuffers["color"],
        //         B: this.colorTexture,
        //         size: { width: this.surfaceSize.width, height: this.surfaceSize.height },
        //         device: this.device
        //     }
        // );
        // this.commands.push(copyToColorTexture);
    }
    getCameraActorByNameAndID(name: string, id: string): CameraActor | false {
        for (let one of this.parent.cameraActors) {
            if (one.name == name && one.id.toString() == id)
                return one;
        }
        return false;
    }
    createRenderPassDescriptor(): GPURenderPassDescriptor {
        const renderPassDescriptor: GPURenderPassDescriptor = {
            label: "stage:forward render pass descriptor",
            colorAttachments: [
                {
                    view: this.colorTexture.createView(),
                    clearValue: [0, 0, 0, 0],
                    loadOp: 'load',
                    storeOp: "store"
                }
            ]
        };
        return renderPassDescriptor;
    }
}