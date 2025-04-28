import { DrawCommand } from "../command/DrawCommand";
import * as coreConst from "../const/coreConst";
import { optionSingleRender, SingleRender } from "../organization/singleRender";
// import shaderCodeDepth from "../shader/GBuffersVisualize/depth.wgsl?raw";
// import shaderCodeEID from "../shader/GBuffersVisualize/entityID.wgsl?raw";
// import shaderCodeVec4f from "../shader/GBuffersVisualize/vec4f.wgsl?raw";
import { CopyCommandT2T } from "../command/copyCommandT2T";
import { unifromGroup, drawMode, DrawOptionOfCommand } from "../command/commandDefine";
// import { GBuffersVisualizeViewport } from "./scene";

//GBuffer可视化至于GBuffers、layout、compyToTarget像刚刚

//1、GBuffer的可视化是通过scene中的setGBuffersVisualize(value)进行设置的，形式如下：
//2、 scene.setGBuffersVisualize({
//     enable: true,
//     layout: {
//       name: "default",
//       single: false,
//     }
//   });
//3、 value：GBuffersVisualizeViewport的interface声明与export在scene.ts 中
//4、如何scene.run()通过调用的scene.showGBuffersVisualize()调用本类的


/**scene 中配置是否使用GBuffer可视化的interface，
 * ·
 * showGBuffersVisualize()与run()循环配合使用 
 * 
 * setGBuffersVisualize()设置此interface的状态
 * */
export interface GBuffersVisualizeViewport {
    /**是否开启可视化 */
    enable: boolean,
    /**两种模式的布局，single与非single 
     * 用于整个GBuffer的可视化，
     * 非single模式下，需要指定layout的名称，
     * 然后在GBuffersVisualizeLayoutAssemble中指定
     *
     * 与下面的forOtherDepth互斥
    */
    layout?: {
        /**
         * layout有两种名称状态：
         * 
         * single模式下：使用coreConst.GBufferName的enum
         * 
         * 非single模式下：使用oreConst.GBuffersVisualizeLayoutAssemble-->name
         */
        name: string,
        single: boolean,
        // singleType?: ,
    },
    /**其他深度纹理的可视化 ，需要明确指定出深度纹理的view，
     * 
     * 与上面的layout互斥
     *
     * 
    */
    forOtherDepth?: {
        depthTextureView: GPUTextureView,
        width: number,
        height: number,
    }
    /**状态：boolan，layout布局是否更改过的状态,人工保障正确性 */
    statueChange?: boolean,
}
export interface optionGBuffersVisualize extends optionSingleRender {
    layout: GBuffersVisualizeViewport,
    copyToTarget: GPUTexture,
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
    depthTextureWidth: number ;
    depthTextureHeight: number ;

    constructor(input: optionGBuffersVisualize) {
        super(input);


        this.width = input.surfaceSize.width;
        this.height = input.surfaceSize.height;
        this.GBuffers = input.GBuffers;
        this.presentationFormat = this.parent.presentationFormat;
        this.depthDefaultFormat = this.parent.depthDefaultFormat;
        if(input.layout.forOtherDepth){
            this.depthTextureWidth = input.layout.forOtherDepth.width;
            this.depthTextureHeight = input.layout.forOtherDepth.height; 
        }
        else{
            this.depthTextureWidth = this.width;
            this.depthTextureHeight = this.height;
        }
        // this.sampler = this.device.createSampler({
        //     magFilter: 'linear',
        //     minFilter: 'linear',
        // });
        this.sampler = this.device.createSampler({
            magFilter: 'nearest',
            minFilter: 'nearest',
            // mipmapFilter: 'nearest', 
            // // 其他属性，如地址模式等
            // addressModeU: 'clamp-to-edge',
            // addressModeV: 'clamp-to-edge',
            // addressModeW: 'clamp-to-edge',
        });


        this.colorTexture = this.device.createTexture({
            size: [this.width, this.height],
            format: this.presentationFormat,
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC | GPUTextureUsage.COPY_DST | GPUTextureUsage.TEXTURE_BINDING,
        });
        this.renderPassDescriptor = this.createRenderPassDescriptor();

        this.init();
    }
    /**1、初始化single或viewport模式，并push到commands
     * 
     * 2、生成copy command，push到commands
     */
    init() {
        if (this.input.layout.forOtherDepth) {
            this.initSingleForOtherDepthTextureView();
        }
        else if (this.input.layout.layout!.single === true) {
            this.initSingle();
        }
        else {
            this.initLayout();
        }
        let copyToColorTexture = new CopyCommandT2T(
            {
                A: this.colorTexture,
                B: this.input.copyToTarget,
                size: { width: this.surfaceSize.width, height: this.surfaceSize.height },
                device: this.device
            }
        );
        this.commands.push(copyToColorTexture);
    }

    initSingleForOtherDepthTextureView() {
        let shaderCode = coreConst.varOfshaderCodeSingleOfGBuffersVisualizeLayout["depth"];

        let values: drawMode = {
            vertexCount: 6
        };
        let uniforms: unifromGroup[];

        uniforms = [
            {
                layout: 0,
                entries: [

                    {
                        binding: 0,
                        resource: this.input.layout.forOtherDepth!.depthTextureView,
                    },
                    // {
                    //     binding: 1,
                    //     resource: this.depthSampler,
                    // },
                ]
            }
        ];
        
        let constants = {};
        

        constants = {
            scaleWidth: this.depthTextureWidth/this.width,
            scaleHeight: this.depthTextureHeight/this.height,
        };


        let option: DrawOptionOfCommand = {
            label: "GBuffers render  ForOtherDepthTextureView",
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
            renderForID: ""
        };
        let DC = new DrawCommand(option);
        this.commands.push(DC);
    }
    /**single，全屏模式的可视化 */
    initSingle() {
        let layoutName = this.input.layout.layout!.name;
        let shaderCode = coreConst.varOfshaderCodeSingleOfGBuffersVisualizeLayout[layoutName];

        let values: drawMode = {
            vertexCount: 6
        };
        let uniforms: unifromGroup[];

        if (layoutName == "depth") {
            uniforms = [
                {
                    layout: 0,
                    entries: [

                        {
                            binding: 0,
                            resource: this.GBuffers[layoutName].createView(),
                        },
                        // {
                        //     binding: 1,
                        //     resource: this.sampler,
                        // },
                    ]
                }
            ];
        }
        
        else if (layoutName != "entityID") {
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
                            resource: this.parent.stages["World"]!.GBuffers["default"]["entityID"].createView(),
                            // resource: this.GBuffers[layoutName].createView(),
                        }
                    ]
                }
            ];

        }

        let option: DrawOptionOfCommand = {
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
            parent: this.parent,
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

    /**
     * viewport布局的可视化
     */
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
                if (key == "depth") {
                    uniforms = [
                        {
                            layout: 0,
                            entries: [

                                {
                                    binding: 0,
                                    resource: this.GBuffers[key].createView(),
                                },
                                // {
                                //     binding: 1,
                                //     resource: this.sampler,
                                // },
                            ]
                        }
                    ];
                    constants = {
                        scaleWidth:value.u32!.scale,
                        scaleHeight: value.u32!.scale,
                        u32OffsetX: value.u32!.offsetX*this.width,
                        u32OffsetY: value.u32!.offsetY,
                    };
                }
               else if (key != "entityID") {
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
                            u32OffsetX: value.u32!.offsetX*this.width,
                            u32OffsetY: value.u32!.offsetY,
                            u32Scale: value.u32!.scale,
                        };
                    }
                    else {
                        console.error("u32格式的texture在GBuffer可视化时,需要u32的相关参数！");
                    }
                }

                let option: DrawOptionOfCommand = {
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