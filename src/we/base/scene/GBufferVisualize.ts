import { DrawCommand, drawMode, drawOptionOfCommand } from "../command/DrawCommand";
import * as coreConst from "../const/coreConst";
import { optionSingleRender, SingleRender } from "./singleRender";
// import shaderCodeDepth from "../shader/GBuffersVisualize/depth.wgsl?raw";
// import shaderCodeEID from "../shader/GBuffersVisualize/entityID.wgsl?raw";
// import shaderCodeVec4f from "../shader/GBuffersVisualize/vec4f.wgsl?raw";
import { CopyCommandT2T } from "../command/copyCommandT2T";
import { unifromGroup } from "../command/baseCommand";
import { GBuffersVisualizeViewport } from "./scene";
import { GBufferName } from "../const/coreConst";


export interface optionGBuffersVisualize extends optionSingleRender {
    layout: GBuffersVisualizeViewport,
    copyTotarget: GPUTexture,
    GBuffers: coreConst.GBuffers,
}

export class GBuffersVisualize extends SingleRender {


    /**GBuffer的布局格式集合，这个在实现默认布局， */
    // layout: coreConst.GBufferLayout;
    // layoutName: string;
    GBuffers: coreConst.GBuffers;
    declare input: optionGBuffersVisualize;

    presentationFormat: GPUTextureFormat;
    depthDefaultFormat: GPUTextureFormat;
    width: number;
    height: number;
    sampler: GPUSampler;
    shaderCode!: {
        [name: string]: { [name in coreConst.GBufferName]: string }
    };
    colorTexture: GPUTexture;


    constructor(input: optionGBuffersVisualize) {
        super(input);

        this.width = input.surfaceSize.width;
        this.height = input.surfaceSize.height;
        this.GBuffers = input.GBuffers;
        this.presentationFormat = this.parent.presentationFormat;
        this.depthDefaultFormat = this.parent.depthDefaultFormat;
        this.sampler = this.device.createSampler({
            magFilter: 'linear',
            minFilter: 'linear',
        });
        this.colorTexture = this.device.createTexture({
            size: [this.width, this.height],
            format: this.presentationFormat,
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC | GPUTextureUsage.COPY_DST | GPUTextureUsage.TEXTURE_BINDING,
        });
        this.renderPassDescriptor = this.createRenderPassDescriptor();

        this.init();
    }
    init() {
        if (this.input.layout.layout!.single === true) {
            this.initSingle();
        }
        else {
            this.initLayout();
        }
        let copyToColorTexture = new CopyCommandT2T(
            {
                A: this.colorTexture,
                B: this.input.copyTotarget,
                size: { width: this.surfaceSize.width, height: this.surfaceSize.height },
                device: this.device
            }
        );
        this.commands.push(copyToColorTexture);
    }
    initSingle() {
        let layoutName = this.input.layout.layout!.name;
        let shaderCode = coreConst.varOfshaderCodeSingleOfGBuffersVisualizeLayout[layoutName];

        let values: drawMode = {
            vertexCount: 6
        };
        let uniforms: unifromGroup[];

        if (layoutName != "entityID") {
            uniforms = [
                {
                    layout: 0,
                    entries: [

                        {
                            binding: 0,
                            resource: this.GBuffers[layoutName].createView(),
                        },
                        {
                            binding: 1,
                            resource: this.sampler,
                        },
                    ]
                }
            ];
        }
        else {
            uniforms = [
                {
                    layout: 0,
                    entries: [
                        {
                            binding: 0,
                            resource: this.parent.stages["World"].opaque!.GBuffers["entityID"].createView(),
                            // resource: this.GBuffers[layoutName].createView(),
                        }
                    ]
                }
            ];

        }

        let option: drawOptionOfCommand = {
            label: "GBuffers render ID",
            vertex: {
                code: shaderCode,
                entryPoint: "vs",
            },
            fragment: {
                code: shaderCode,
                entryPoint: "fs",
                targets: [
                    //color
                    { format: this.presentationFormat }
                ],

            },
            draw: {
                mode: "draw",
                values: values
            },
            scene: this.parent,
            uniforms: uniforms,
            primitive: {
                topology: 'triangle-list',
                cullMode: "back",
            },
            rawUniform: true,
            renderPassDescriptor: this.renderPassDescriptor,


        };
        let DC = new DrawCommand(option);
        this.commands.push(DC);
    }

    initLayout() {
        let layoutName = this.input.layout.layout!.name;
        let layout = coreConst.GBuffersVisualizeLayoutAssemble[layoutName];
        let shaderCode: coreConst.shaderCodeOfGBuffersVisualize = coreConst.varOfshaderCodeOfGBuffersVisualizeLayout[layoutName];

        Object.entries(layout).forEach(([key, value]) => {
            if (typeof key === "string") {
                let values: drawMode = {
                    vertexCount: 6
                };
                // let uniformsOpaque: unifromGroup[] = this.getTexturesOfUniformFromStageForID();
                let x: number = Math.trunc(value.x * (this.width - 1));
                let y: number = Math.trunc(value.y * (this.height - 1));
                let width: number = Math.trunc(value.width * (this.width - 1));
                let height: number = Math.trunc(value.height * (this.height - 1));
                let uniforms: unifromGroup[];
                let constants = {};
                if (key != "entityID") {
                    uniforms = [
                        {
                            layout: 0,
                            entries: [

                                {
                                    binding: 0,
                                    resource: this.GBuffers[key].createView(),
                                },
                                {
                                    binding: 1,
                                    resource: this.sampler,
                                },
                            ]
                        }
                    ];
                }
                else {
                    uniforms = [
                        {
                            layout: 0,
                            entries: [
                                {
                                    binding: 0,
                                    resource: this.GBuffers[key].createView(),
                                }
                            ]
                        }
                    ];
                    if (value.u32) {
                        constants = {
                            u32OffsetX: value.u32!.offsetX,
                            u32OffsetY: value.u32!.offsetY,
                            u32Scale: value.u32!.scale,
                        };
                    }
                    else {
                        console.error("u32格式的texture在GBuffer可视化时,需要u32的相关参数！");
                    }
                }

                let option: drawOptionOfCommand = {
                    label: "GBuffers render ID",
                    vertex: {
                        code: shaderCode[key] as string,
                        entryPoint: "vs",
                    },
                    fragment: {
                        code: shaderCode[key] as string,
                        entryPoint: "fs",
                        targets: [
                            //color
                            { format: this.presentationFormat }
                        ],
                        constants: constants
                    },
                    draw: {
                        mode: "draw",
                        values: values
                    },
                    scene: this.parent,
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
                        // x: 0,
                        // y: 0,
                        // width: 200,
                        // height: 200,
                        // minDepth: 0,
                        // maxDepth: 1,
                    }

                };
                let DC = new DrawCommand(option);
                this.commands.push(DC);
            }
            // console.log(`Key: ${key}, Value: ${value}`);
        });

    }


    destroy() {
        this.colorTexture.destroy();
        for (let i of this.commands) {
            i.destroy();
        }
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