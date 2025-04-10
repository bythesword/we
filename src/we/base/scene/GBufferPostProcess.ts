import { DrawCommand, drawMode, DrawOptionOfCommand } from "../command/DrawCommand";
import { unifromGroup } from "../command/baseCommand";
import { GBuffers, GBuffersRPDAssemble } from "../const/coreConst";
import { Scene } from "./scene";
import { SingleRender, optionSingleRender } from "./singleRender";

import shaderDepthAndID from "../shader/GBuffers/gbuffers_render_depthAndID.wgsl?raw";
import shaderOpaqueOther from "../shader/GBuffers/gbuffers_render_other.wgsl?raw";
import shaderOpaqueColor from "../shader/GBuffers/gbuffers_render_color.wgsl?raw";
import { CopyCommandT2T } from "../command/copyCommandT2T";



export interface optionGBPP extends optionSingleRender {
    GBuffers: GBuffers,
    parent: Scene,
    copyToTarget: GPUTexture,
    camera: string,
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

    renderPassDescriptorOfColor!: GPURenderPassDescriptor;
    colorAttachmentTargetsOfColor!: GPUColorTargetState[];

    renderPassDescriptorOfTransparent!: GPURenderPassDescriptor;
    colorAttachmentTargetsOfTransparent!: GPUColorTargetState[];


    clearValue = [0, 0, 0, 0];

    /**GBuffer["color"] copy 对象，uniform使用*/
    colorTexture: GPUTexture;
    // _temp_colorTexture_entityID: GPUTexture;

    _isReversedZ!: boolean;
    /**GBuffer 对应的camera */
    camera: string;

    /**MSAA texture */
    multisampleTexture: GPUTexture;
    MSAASampleCount = 4;

    constructor(input: optionGBPP) {
        super(input);
        this.camera = input.camera;
        // this.parent = input.parent;
        // this.renderPassDescriptor = this.parent.renderPassDescriptor;
        this.GBuffers = input.GBuffers;
        this.presentationFormat = this.parent.presentationFormat;
        this.depthDefaultFormat = this.parent.depthDefaultFormat;

        this.colorTexture = input.copyToTarget;
        // this.colorTexture = this.device.createTexture({
        //     size: [this.surfaceSize.width, this.surfaceSize.height],
        //     format: this.presentationFormat,
        //     usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC | GPUTextureUsage.COPY_DST | GPUTextureUsage.TEXTURE_BINDING
        //     ,
        // });
        // this._temp_colorTexture_entityID = this.device.createTexture({
        //     size: [this.surfaceSize.width, this.surfaceSize.height],
        //     format: this.presentationFormat,
        //     usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC | GPUTextureUsage.COPY_DST | GPUTextureUsage.TEXTURE_BINDING
        //     ,
        // });

        this.multisampleTexture = this.device.createTexture({
            size: [this.surfaceSize.width, this.surfaceSize.height],
            format: this.presentationFormat,
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC | GPUTextureUsage.COPY_DST | GPUTextureUsage.TEXTURE_BINDING,
            sampleCount: this.MSAASampleCount,
        });
        this._isReversedZ = this.parent._isReversedZ;
        //ID
        let RenderID = this.createRenderPassDescriptorOfID();
        this.renderPassDescriptorOfID = RenderID.renderPassDescriptor;
        this.colorAttachmentTargetsOfID = RenderID.colorAttachmentTargets;
        //other
        let RenderOther = this.createRenderPassDescriptorOfOther();
        this.renderPassDescriptorOfOther = RenderOther.renderPassDescriptor;
        this.colorAttachmentTargetsOfOther = RenderOther.colorAttachmentTargets;
        //color
        let RenderColor = this.createRenderPassDescriptorOfColorOfMSAA();
        this.renderPassDescriptorOfColor = RenderColor.renderPassDescriptor;
        this.colorAttachmentTargetsOfColor = RenderColor.colorAttachmentTargets;





        let RenderTransparent = this.createRenderPassDescriptorOfTransparent();
        this.renderPassDescriptorOfTransparent = RenderTransparent.renderPassDescriptor;
        this.colorAttachmentTargetsOfTransparent = RenderTransparent.colorAttachmentTargets;
        this.init();
    }
    render() {
        if (this.commands.length > 0) {
            for (let i in this.commands) {

                if (this.commands[i].name == "Actor" || this.commands[i].name == "DynamicEntities" || this.commands[i].name == "World" || this.commands[i].name == "Sky") {
                    let name = this.commands[i].name;
                    if (Object.keys(this.parent.stages[name]!.camerasCommands).length > 0)//过滤掉，没有内容的stage)
                        this.commands[i].update();
                }
                else {
                    this.commands[i].update();
                }
            }
        }
    }
    init() {
        // let shaderDepthAndID: string;
        // let shaderOpaque: string;
        // let shaderTransparent: string;
        if (this.parent.stageStatus == "all") {
            let values: drawMode = {
                vertexCount: 6
            };
            let uniformsOpaque: unifromGroup[] = this.getTexturesOfUniformFromStageForID();
            // let far = this._isReversedZ ? 0 : 1;
            //合并所有stage的Depth和ID
            let optionsOpaque: DrawOptionOfCommand = {
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
                parent: this.parent,
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


            //跟进ID合并stage的其他GBuffers
            // let run_i = 0;
            let state_i = 0;
            for (let i of this.parent.stagesOrders) {
                let name = this.parent.stagesOfSystem[i];
                if (this.parent.stages[name] && name != "UI"
                    //初始化状态，暂时没有commands，所以不进行渲染
                    // && Object.keys(this.parent.stages[name].camerasCommands).length > 0
                    // && Object.keys(this.parent.stages[name].camerasCommands.default.commands).length > 0
                ) {
                    // console.log(name)
                    let uniformsOther: unifromGroup[] = this.getTexturesOfUniformFromStageForOther(name);
                    let optionsOther: DrawOptionOfCommand = {
                        label: "GBuffers render Other",
                        name: name,
                        vertex: {
                            code: shaderOpaqueOther,
                            entryPoint: "vs",
                        },
                        fragment: {
                            code: shaderOpaqueOther,
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
                        parent: this.parent,
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

                    /////////////////////////////////////////////////////////////////////////////
                    //下面的代码进行了MSAA，目测没看到效果，但是逻辑应该是执行了。
                    //本次的代码是将GBuffer的color又独立执行了一次
                    //没有效果可能有两个原因，
                    //1、textureLoad的问题，但如果都是color的输出，那么就不会有问题，color的输出都会是MSAA*4，所以不会有问题
                    //2、这个是一个buffer的合并，MSAA是否会进行多采样？ 
                    // {
                    //     let uniforms: unifromGroup[] = this.getTexturesOfUniformFromStageForColor(name);
                    //     let options: DrawOptionOfCommand = {
                    //         label: "GBuffers render Color",
                    //         vertex: {
                    //             code: shaderOpaqueColor,
                    //             entryPoint: "vs",
                    //         },
                    //         fragment: {
                    //             code: shaderOpaqueColor,
                    //             entryPoint: "fs",
                    //             targets: this.colorAttachmentTargetsOfColor,
                    //             constants: {
                    //                 // far: far,
                    //                 // count_of_stage: 4,
                    //                 canvasSizeWidth: this.surfaceSize.width,
                    //                 canvasSizeHeight: this.surfaceSize.height,
                    //                 // reversedZ: this._isReversedZ,
                    //             }
                    //         },
                    //         draw: {
                    //             mode: "draw",
                    //             values: values
                    //         },
                    //         parent: this.parent,
                    //         uniforms: uniforms,
                    //         primitive: {
                    //             topology: 'triangle-list',
                    //             cullMode: "back",
                    //         },
                    //         rawUniform: true,
                    //         renderPassDescriptor: this.renderPassDescriptorOfColor,
                    //         multisample: {
                    //             count: this.MSAASampleCount,
                    //         },
                    //     };
                    //     let DC = new DrawCommand(options);
                    //     this.commands.push(DC);
                    // }
                }
                if (state_i == 0) {//20250404,更改了loadOP，但背景还是透明，这个可能是在stage中的问题了

                    for (let RPD_collor_attache_i of this.renderPassDescriptorOfOther.colorAttachments) {
                        RPD_collor_attache_i!.loadOp = "load";
                    }
                    state_i++;
                }
                if (state_i == 1) {
                    // break;
                }
                // if(run_i++ ==2 ) break;
            }

            //copy GBuffer的color到target
            let copyToColorTexture = new CopyCommandT2T(
                {
                    A: this.GBuffers["color"],
                    B: this.colorTexture,
                    size: { width: this.surfaceSize.width, height: this.surfaceSize.height },
                    device: this.device
                }
            );
            this.commands.push(copyToColorTexture);
        }
        else if (this.parent.stageStatus == "world") {
            //copy GBuffer的color到target
            for (let i in this.GBuffers) {
                let copyToColorTexture = new CopyCommandT2T(
                    {
                        A: this.parent.stages["World"]!.GBuffers[this.camera][i],
                        B: this.GBuffers[i],
                        size: { width: this.surfaceSize.width, height: this.surfaceSize.height },
                        device: this.device
                    }
                );
                this.commands.push(copyToColorTexture);
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
        }
        else {
            console.error("GBuffer post process init() error!");
        }
        //20241212,todo:将透明层由合并改为比较depth的油画法
        // //只有color，一个DC，stage在uniform中
        // let uniformsTransparent: unifromGroup[] = this.getTexturesOfUniformFromStageForTransparent();
        // let optionsTransparent: DrawOptionOfCommand = {
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
    /**创建entityID的RPD  */
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
                    // clearValue: [1,1,1,1], 
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
    /**为其他的GBuffer创建RPD */
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
                    loadOp: 'clear',//透明背景问题所在，todo，20250404
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
    /**
     * 20250404,禁用，使用MSAA需要修改init中的注释到的msaa的代码
     * @returns 
     */
    createRenderPassDescriptorOfColorOfMSAA(): renderPassDescriptorAndTaget {
        let colorAttachments: GPURenderPassColorAttachment[] = [];
        let colorAttachmentTargets: GPUColorTargetState[] = [];
        Object.entries(GBuffersRPDAssemble).forEach(([key, value]) => {
            if (key == "color") {
                let one: GPURenderPassColorAttachment;
                // if (key == "color") {
                one = {
                    // view: this.GBuffers[key].createView(),
                    resolveTarget: this.GBuffers[key].createView(),
                    view: this.multisampleTexture.createView(),  //MSAA
                    // clearValue: [1,1,1,1],
                    clearValue: this.parent.backgroudColor,
                    loadOp: 'load',//如果是clear，则物体颜色会被backgroundColor覆盖,但背景还是透明的,20250403，这个与MSAA有关，但与背景透明无关
                    // loadOp: 'clear',//如果是clear，则物体颜色会被backgroundColor覆盖,但背景还是透明的,20250403
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
    //作废，透明的采用前向渲染方式
    //可以copy到透明渲染中适用
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
                    resource: stage.GBuffers[this.camera]["depth"].createView()
                });
                unifromGroup_2.entries.push({
                    label: `GBuffer post process  for Render Transparent of color ,stage:${stage}`,
                    binding: i,
                    resource: stage.GBuffers[this.camera]["color"].createView()
                });
            }
        }


        return [unifromGroup_0, unifromGroup_1, unifromGroup_2];
    }
    getTexturesOfUniformFromStageForColor(stageName: string): unifromGroup[] {
        let uniformOther: unifromGroup = {
            layout: 1,
            entries: [
                {
                    label: `stage:${stageName} GBuffer Render Other : entityID `,
                    binding: 0,
                    resource: this.parent.stages[stageName]!.GBuffers[this.camera]["entityID"].createView()
                },
                {
                    label: `stage:${stageName} GBuffer Render Other : color `,
                    binding: 1,
                    resource: this.parent.stages[stageName]!.GBuffers[this.camera]["color"].createView()
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
    getTexturesOfUniformFromStageForOther(stageName: string): unifromGroup[] {
        let uniformOther: unifromGroup = {
            layout: 1,
            entries: [
                {
                    label: `stage:${stageName} GBuffer Render Other : entityID `,
                    binding: 0,
                    resource: this.parent.stages[stageName]!.GBuffers[this.camera]["entityID"].createView()
                },
                {
                    label: `stage:${stageName} GBuffer Render Other : color `,
                    binding: 1,
                    resource: this.parent.stages[stageName]!.GBuffers[this.camera]["color"].createView()
                },
                {
                    label: `stage:${stageName} GBuffer Render Other : normal `,
                    binding: 2,
                    resource: this.parent.stages[stageName]!.GBuffers[this.camera]["normal"].createView()
                },
                {
                    label: `stage:${stageName} GBuffer Render Other : uv `,
                    binding: 3,
                    resource: this.parent.stages[stageName]!.GBuffers[this.camera]["uv"].createView()
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
            const name = this.parent.stagesOfSystem[perList];
            if (this.parent.stages[name]) {
                let stage = this.parent.stages[name]!;
                depths.push(stage.GBuffers[this.camera]["depth"]);
                IDs.push(stage.GBuffers[this.camera]["entityID"]);
                colors.push(stage.GBuffers[this.camera]["color"]);
                normals.push(stage.GBuffers[this.camera]["normal"]);
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