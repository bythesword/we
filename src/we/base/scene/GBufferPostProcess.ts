import { DrawCommand, drawMode, drawOptionOfCommand } from "../command/DrawCommand";
import { unifromGroup } from "../command/baseCommand";
import { GBuffers, GBuffersRPDAssemble, stagesOfSystem } from "../const/coreConst";
import { BaseStage } from "../stage/baseStage";
import { Scene } from "./scene";
import { SingleRender, optionSingleRender } from "./singleRender";

import shaderDepthAndID from "../shader/GBuffers/gbuffers_render_depthAndID.wgsl?raw"
import shaderOpaque from "../shader/GBuffers/gbuffers_render_other.wgsl?raw"
import shaderTransparent from "../shader/GBuffers/gbuffers_render_transparent.wgsl?raw"
import { CopyCommandT2T } from "../command/copyCommandT2T";

shaderOpaque

export interface optionGBPP extends optionSingleRender {
    GBuffers: GBuffers,
    // renderPassDescriptor: GPURenderPassDescriptor,
    parent: Scene,
    copyTotarget: GPUTexture,
}

interface renderPassDescriptorAndTaget {
    renderPassDescriptor: GPURenderPassDescriptor,
    colorAttachmentTargets: GPUColorTargetState[]
}
export class GBufferPostProcess extends SingleRender {
    destroy(): void {
        throw new Error("Method not implemented.");
    }
    GBuffers: GBuffers;
    declare input: optionGBPP;

    presentationFormat: GPUTextureFormat;
    depthDefaultFormat: GPUTextureFormat;
    // sampler: GPUSampler;
    renderPassDescriptorOfID!: GPURenderPassDescriptor;
    colorAttachmentTargetsOfID!: GPUColorTargetState[];
    renderPassDescriptorOfOther!: GPURenderPassDescriptor;
    colorAttachmentTargetsOfOther!: GPUColorTargetState[];
    renderPassDescriptorOfTransparent!: GPURenderPassDescriptor;
    colorAttachmentTargetsOfTransparent!: GPUColorTargetState[];
    clearValue = [0, 0, 0, 0];

    /**GBuffer["color"] copy 对象，uniform使用*/
    colorTexture: GPUTexture;
    _temp_colorTexture_entityID: GPUTexture;

    _isReversedZ!: boolean;

    constructor(input: optionGBPP) {
        super(input);
        // this.parent = input.parent;
        this.renderPassDescriptor = this.parent.renderPassDescriptor;
        this.GBuffers = input.GBuffers;
        this.presentationFormat = this.parent.presentationFormat;
        this.depthDefaultFormat = this.parent.depthDefaultFormat;

        this.colorTexture = input.copyTotarget;
        // this.colorTexture = this.device.createTexture({
        //     size: [this.surfaceSize.width, this.surfaceSize.height],
        //     format: this.presentationFormat,
        //     usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC | GPUTextureUsage.COPY_DST | GPUTextureUsage.TEXTURE_BINDING
        //     ,
        // });
        this._temp_colorTexture_entityID = this.device.createTexture({
            size: [this.surfaceSize.width, this.surfaceSize.height],
            format: this.presentationFormat,
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC | GPUTextureUsage.COPY_DST | GPUTextureUsage.TEXTURE_BINDING
            ,
        });
        this._isReversedZ = this.parent._isReversedZ;
        let RenderID = this.createRenderPassDescriptorOfID();
        this.renderPassDescriptorOfID = RenderID.renderPassDescriptor;
        this.colorAttachmentTargetsOfID = RenderID.colorAttachmentTargets;
        let RenderOther = this.createRenderPassDescriptorOfOther();
        this.renderPassDescriptorOfOther = RenderOther.renderPassDescriptor;
        this.colorAttachmentTargetsOfOther = RenderOther.colorAttachmentTargets;
        let RenderTransparent = this.createRenderPassDescriptorOfTransparent();
        this.renderPassDescriptorOfTransparent = RenderTransparent.renderPassDescriptor;
        this.colorAttachmentTargetsOfTransparent = RenderTransparent.colorAttachmentTargets;
        this.init();
    }
    init() {
        // let shaderDepthAndID: string;
        // let shaderOpaque: string;
        // let shaderTransparent: string;

        let values: drawMode = {
            vertexCount: 6
        };
        let uniformsOpaque: unifromGroup[] = this.getTexturesOfUniformFromStageForID();
        let far = this._isReversedZ ? 0 : 1;
        let optionsOpaque: drawOptionOfCommand = {
            label: "GBuffers render ID",
            vertex: {
                code: shaderDepthAndID,
                entryPoint: "vs",
            },
            fragment: {
                code: shaderDepthAndID,
                entryPoint: "fs",
                targets: this.colorAttachmentTargetsOfID,
                constants: {
                    // far: far,
                    //count_of_stage: 4,
                    canvasSizeWidth: this.surfaceSize.width,
                    canvasSizeHeight: this.surfaceSize.height,
                    reversedZ: this._isReversedZ,
                }
            },
            draw: {
                mode: "draw",
                values: values
            },
            scene: this.parent,
            uniforms: uniformsOpaque,
            primitive: {
                topology: 'triangle-list',
                cullMode: "back",
            },
            rawUniform: true,
            renderPassDescriptor: this.renderPassDescriptorOfID,
            depthStencilState: {
                depthWriteEnabled: true,
                depthCompare: this._isReversedZ ? "greater" : 'less',
                format: this.depthDefaultFormat//'depth32float',
            }
        };
        let DC_Opaque = new DrawCommand(optionsOpaque);
        this.commands.push(DC_Opaque);


        let run_i = 0;
        for (let i of this.parent.stagesOrders) {
            let name = this.parent.stagesOfSystem[i];
            if (this.parent.stages[name].opaque && name != "UI"
                //  && name=="World"
            ) {
                let uniformsOther: unifromGroup[] = this.getTexturesOfUniformFromStageForOther(name);
                let optionsOther: drawOptionOfCommand = {
                    label: "GBuffers render Other",
                    vertex: {
                        code: shaderOpaque,
                        entryPoint: "vs",
                    },
                    fragment: {
                        code: shaderOpaque,
                        entryPoint: "fs",
                        targets: this.colorAttachmentTargetsOfOther,
                        constants: {
                            // far: far,
                            // count_of_stage: 4,
                            canvasSizeWidth: this.surfaceSize.width,
                            canvasSizeHeight: this.surfaceSize.height,
                            // reversedZ: this._isReversedZ,
                        }
                    },
                    draw: {
                        mode: "draw",
                        values: values
                    },
                    scene: this.parent,
                    uniforms: uniformsOther,
                    primitive: {
                        topology: 'triangle-list',
                        cullMode: "back",
                    },
                    rawUniform: true,
                    renderPassDescriptor: this.renderPassDescriptorOfOther,
                };
                let DC_Other = new DrawCommand(optionsOther);
                this.commands.push(DC_Other);
            }
            // if(run_i++ ==2 ) break;
        }

        let copyToColorTexture = new CopyCommandT2T(
            {
                A: this.GBuffers["color"],
                B: this.colorTexture,
                size: { width: this.surfaceSize.width, height: this.surfaceSize.height },
                device: this.device
            }
        );
        this.commands.push(copyToColorTexture);

        //20241212,todo:将透明层由合并改为比较depth的油画法
        // //只有color，一个DC，stage在uniform中
        // let uniformsTransparent: unifromGroup[] = this.getTexturesOfUniformFromStageForTransparent();
        // let optionsTransparent: drawOptionOfCommand = {
        //     label: "GBuffers render Transparent",
        //     vertex: {
        //         code: shaderTransparent,
        //         entryPoint: "vs",
        //     },
        //     fragment: {
        //         code: shaderTransparent,
        //         entryPoint: "fs",
        //         targets: this.colorAttachmentTargetsOfTransparent,
        //         constants: {
        //             // far: far,
        //             // count_of_stage: 4,
        //             canvasSizeWidth: this.surfaceSize.width,
        //             canvasSizeHeight: this.surfaceSize.height,
        //             reversedZ: this._isReversedZ,
        //         }
        //     },
        //     draw: {
        //         mode: "draw",
        //         values: values
        //     },
        //     scene: this.parent,
        //     uniforms: uniformsTransparent,
        //     primitive: {
        //         topology: 'triangle-list',
        //         cullMode: "back",
        //     },
        //     rawUniform: true,
        //     renderPassDescriptor: this.renderPassDescriptorOfTransparent,
        // };
        // let DC_Transparent = new DrawCommand(optionsTransparent);
        // this.commands.push(DC_Transparent);

        // let copyGbufferColorToTarget = new CopyCommandT2T(
        //     {
        //         A: this.GBuffers["color"],
        //         B: this.colorTexture,
        //         size: { width: this.surfaceSize.width, height: this.surfaceSize.height },
        //         device: this.device
        //     }
        // );
        // this.commands.push(copyGbufferColorToTarget);
        this.drawTransparent();

    }
    //todo 20241212
    drawTransparent() {
        // //systerm uniform 需要增加 depth texture ,以进行比较
        // for (let i in this.parent.stagesOrders) {
        //     const perList = this.parent.stagesOrders[i];//number，stagesOfSystem的数组角标
        //     const name = stagesOfSystem[perList];
        //     if (this.parent.stages[name].transparent) {
        //         this.parent.stages[name].transparent!.update(deltaTime, startTime, lastTime);
        //     }
        // }
    }

    createRenderPassDescriptorOfID(): renderPassDescriptorAndTaget {
        let colorAttachmentTargets: GPUColorTargetState[] = [
            //color
            { format: this.presentationFormat },
            // id
            { format: "r32uint" },

            // { format: <GPUTextureFormat>GBuffersRPDAssemble["entityID"].format },

        ];
        const renderPassDescriptor: GPURenderPassDescriptor = {
            label: "stage:forward render pass descriptor",
            colorAttachments: [
                {
                    view: this.GBuffers["color"].createView({ label: "post process RPD colorAttachments[0].view of  entityID" }),
                    //  view: this.GBuffers["entityID"].createView({ label: "post process RPD colorAttachments[0].view of  entityID" }),
                    // clearValue: [0,0,0,0],
                    loadOp: 'clear',
                    storeOp: "store"
                },
                {
                    // view: this.GBuffers["color"].createView({ label: "post process RPD colorAttachments[0].view of  entityID" }),
                    view: this.GBuffers["entityID"].createView({ label: "post process RPD colorAttachments[0].view of  entityID" }),
                    // clearValue: [0,0,0,0],
                    loadOp: 'clear',
                    storeOp: "store"
                }
            ],
            depthStencilAttachment: {
                view: this.GBuffers["depth"].createView({ label: "post process RPD depth.view of  entityID" }),
                depthClearValue: this._isReversedZ ? this.parent.depthClearValueOfReveredZ : this.parent.depthClearValueOfZ,
                // depthLoadOp: 'load',
                depthLoadOp: 'clear',
                depthStoreOp: 'store',
            },
        };
        return { renderPassDescriptor, colorAttachmentTargets };
    }
    createRenderPassDescriptorOfOther(): renderPassDescriptorAndTaget {
        let colorAttachments: GPURenderPassColorAttachment[] = [];
        let colorAttachmentTargets: GPUColorTargetState[] = [];
        Object.entries(GBuffersRPDAssemble).forEach(([key, value]) => {
            if (key != "depth" && key != "entityID") {
                let one: GPURenderPassColorAttachment;
                // if (key == "color") {
                one = {
                    view: this.GBuffers[key].createView(),
                    clearValue: this.parent.backgroudColor,
                    loadOp: 'load',
                    storeOp: "store"
                };
                colorAttachments.push(one);
                let format: GPUTextureFormat;
                if (value.format == "WEsystem") {
                    format = this.presentationFormat;
                }
                else if (value.format == "WEdepth") {
                    format = this.depthDefaultFormat;
                }
                else {
                    format = value.format;
                }
                colorAttachmentTargets.push({ format });
            }
        });

        const renderPassDescriptor: GPURenderPassDescriptor = {
            colorAttachments: colorAttachments,
        };
        return { renderPassDescriptor, colorAttachmentTargets };
    }
    createRenderPassDescriptorOfTransparent(): renderPassDescriptorAndTaget {

        let colorAttachmentTargets: GPUColorTargetState[] = [
            { format: this.presentationFormat }
        ];


        const renderPassDescriptor: GPURenderPassDescriptor = {
            colorAttachments: [{
                view: this.GBuffers["color"].createView(),
                clearValue: this.parent.backgroudColor,
                loadOp: 'clear',
                storeOp: "store"
            },]
        };
        return { renderPassDescriptor, colorAttachmentTargets };
    }

    getTexturesOfUniformFromStageForTransparent(): unifromGroup[] {
        let unifromGroup_0: unifromGroup = {
            layout: 0,
            entries: [
                {
                    label: "GBuffer post process GBuffer['depth']  for Render Transparent ",
                    binding: 0,
                    resource: this.GBuffers["depth"].createView()
                },
                {
                    label: "GBuffer post proces texture'colorTexture'  for Render Transparent",
                    binding: 1,
                    resource: this.colorTexture.createView()
                }]
        };
        let unifromGroup_1: unifromGroup = {
            layout: 1,
            entries: [
            ]
        };
        let unifromGroup_2: unifromGroup = {
            layout: 2,
            entries: [
            ]
        };

        for (let i of this.parent.stagesOrders) {
            let name = this.parent.stagesOfSystem[i];
            if (this.parent.stages[name].transparent && name != "UI" && name != "Sky") {
                let stage = this.parent.stages[name].transparent
                unifromGroup_1.entries.push({
                    label: `GBuffer post process  for Render Transparent of depth ,stage:${stage}`,
                    binding: i,
                    resource: stage.GBuffers["depth"].createView()
                });
                unifromGroup_2.entries.push({
                    label: `GBuffer post process  for Render Transparent of color ,stage:${stage}`,
                    binding: i,
                    resource: stage.GBuffers["color"].createView()
                });
            }
        }


        return [unifromGroup_0, unifromGroup_1, unifromGroup_2];
    }
    getTexturesOfUniformFromStageForOther(stageName: string): unifromGroup[] {
        let uniformOther: unifromGroup = {
            layout: 1,
            entries: [
                {
                    label: `stage:${stageName} GBuffer Render Other : entityID `,
                    binding: 0,
                    resource: this.parent.stages[stageName].opaque!.GBuffers["entityID"].createView()
                },
                {
                    label: `stage:${stageName} GBuffer Render Other : color `,
                    binding: 1,
                    resource: this.parent.stages[stageName].opaque!.GBuffers["color"].createView()
                },
                {
                    label: `stage:${stageName} GBuffer Render Other : normal `,
                    binding: 2,
                    resource: this.parent.stages[stageName].opaque!.GBuffers["normal"].createView()
                },
                {
                    label: `stage:${stageName} GBuffer Render Other : uv `,
                    binding: 3,
                    resource: this.parent.stages[stageName].opaque!.GBuffers["uv"].createView()
                }
            ]
        };
        let uniformID: unifromGroup = {
            layout: 0,
            entries: [{
                label: "scene GBuffer['entityID']  for Render other GBuffers",
                binding: 0,
                resource: this.GBuffers["entityID"].createView()
            }]
        };


        return [uniformID, uniformOther];
    }
    getTexturesOfUniformFromStageForID(): unifromGroup[] {
        let depths: GPUTexture[] = [];
        let IDs: GPUTexture[] = [];
        let colors: GPUTexture[] = [];
        let normals: GPUTexture[] = [];
        for (let i in this.parent.stagesOrders) {
            const perList = this.parent.stagesOrders[i];//number，stagesOfSystem的数组角标
            const name = stagesOfSystem[perList];
            if (this.parent.stages[name].opaque) {
                let stage = this.parent.stages[name].opaque!;
                depths.push(stage.GBuffers["depth"]);
                IDs.push(stage.GBuffers["entityID"]);
                colors.push(stage.GBuffers["color"]);
                normals.push(stage.GBuffers["normal"]);
            }
        }
        let uniformDepth: unifromGroup = {
            layout: 0,
            entries: []
        };
        let uniformID: unifromGroup = {
            layout: 1,
            entries: []
        };
        let uniformColor: unifromGroup = {
            layout: 2,
            entries: []
        };
        let uniformNormal: unifromGroup = {
            layout: 3,
            entries: []
        };
        for (let i in depths) {
            uniformDepth.entries.push({
                label: "GBuffer Render for DepthAndID Depth: " + i,
                binding: parseInt(i),
                resource: depths[i].createView()
            });
            uniformID.entries.push({
                label: "GBuffer Render for DepthAndID ID:  " + i,
                binding: parseInt(i),
                resource: IDs[i].createView()
            });
            uniformColor.entries.push({
                label: "GBuffer Render for DepthAndID color:  " + i,
                binding: parseInt(i),
                resource: colors[i].createView()
            });
            uniformNormal.entries.push({
                label: "GBuffer Render for DepthAndID normal:  " + i,
                binding: parseInt(i),
                resource: normals[i].createView()
            });
        }
        return [uniformDepth, uniformID, uniformColor, uniformNormal];
    }



}