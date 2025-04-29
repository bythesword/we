/** 透明渲染(每个摄像机)
 * 
 * 1、管理透明的RPD与切换
 * 2、执行透明层的render
 * 
 */

import { GBuffers, GBuffersRPDAssemble } from "../const/coreConst";
import { GBufferFactory } from "../Gbuffers/GBuffers";
import { Scene } from "./scene";
import { optionSingleRender, SingleRender } from "../organization/singleRender";
import { CopyCommandT2T } from "../command/copyCommandT2T";

export interface optionTransparentRender extends optionSingleRender {
    /**scene */
    parent: Scene,
    /**cameraID */
    cameraID: string,
}

export class TransparentRender extends SingleRender {

    /**cameraID */
    cameraID: string;

    /**GBuffers，scene中的指定cameraID的GBuffers */
    GBuffers !: GBuffers;

    /**深度纹理的bindGroup */
    depthTextureOfUniform!: GPUTexture;
    /**透明纹理的bindGroup 
     * 
     * 1、与GBuffer内容相同
    */
    transparentTextureOfUniform!: GBufferFactory;

    /**初始化参数 */
    declare input: optionTransparentRender;
    /** pipeline 使用的深度状态
     * 
     * 1、depthWriteEnabled：是否写入深度；如果是透明在的话，也写入深度，深度处理不是webGPU进行处理，是shader的处理（因为是always，总是通过）。
     * 
     * 2、depthCompare：深度比较函数；如果是透明在的话，就需要在shader中比较深度。
     * 
     * 3、format：深度格式
     *
     */
    depthStencil: GPUDepthStencilState;

    constructor(input: optionTransparentRender) {
        super(input);
        this.cameraID = input.cameraID;
        this.GBuffers = input.parent.GBuffers[input.cameraID];
        this.depthStencil = {
            depthWriteEnabled: true,
            depthCompare: "always", //this.parent._isReversedZ ? 'greater' : "less",// 'greater-equal', 
            format: this.parent.depthDefaultFormat,
        }
        // this.depthTextureOfUniform = this.parent.depthTextureOfUniform[input.cameraID];
        this.createRenderPassDescriptor();
        this.depthTextureOfUniform = this.device.createTexture({//深度纹理
            size: [this.input.surfaceSize.width, this.input.surfaceSize.height],
            format: this.parent.depthDefaultFormat,
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC | GPUTextureUsage.COPY_DST | GPUTextureUsage.TEXTURE_BINDING,
        });
        this.transparentTextureOfUniform = new GBufferFactory({//透明纹理
            device: this.device,
            surfaceSize: { width: this.input.surfaceSize.width, height: this.input.surfaceSize.height },
            presentationFormat: this.parent.presentationFormat,
            depthDefaultFormat: this.parent.depthDefaultFormat,
        });

    }
    getDepthStencil(): GPUDepthStencilState {
        return this.depthStencil;
    }
    destroy(): void {
        throw new Error("Method not implemented.");
    }
    render(): void {
        let iii = 0;
        let copyToColorTexture = new CopyCommandT2T(
            {
                A: this.GBuffers["depth"],
                B: this.depthTextureOfUniform,
                size: { width: this.surfaceSize.width, height: this.surfaceSize.height },
                device: this.device
            }
        );
        copyToColorTexture.update();//深度拷贝到uniform 的depth texture
        for (let j in this.parent.stagesOrders) {
            const perList = this.parent.stagesOrders[j];//number，stagesOfSystem的数组角标
            const name = this.parent.stagesOfSystem[perList];
            if (this.parent.stages[name]) {
                for (let i in this.parent.stages[name].camerasCommandsOfTransparent[this.cameraID]) {
                    // if (iii == 0) {
                    //     //todo，20250410 RPD 需要使用新的为透明的RPD
                    //     for (let i in this.renderPassDescriptor.colorAttachments as GPURenderPassColorAttachment[]) {
                    //         let perOne = (<GPURenderPassColorAttachment[]>this.renderPassDescriptor.colorAttachments)[i];
                    //         perOne.loadOp = "clear";
                    //     }
                    // }
                    // else if (iii == 1) {
                    //     for (let i in this.renderPassDescriptor.colorAttachments as GPURenderPassColorAttachment[]) {
                    //         let perOne = (<GPURenderPassColorAttachment[]>this.renderPassDescriptor.colorAttachments)[i];
                    //         perOne.loadOp = "load";
                    //     }
                    // }
                    // iii++;
                    copyToColorTexture.update();//深度拷贝到uniform 的depth texture
                    this.parent.stages[name].camerasCommandsOfTransparent[this.cameraID][i].update();
                }
            }
        }
    }
    async createRenderPassDescriptor() {
        let colorAttachments: GPURenderPassColorAttachment[] = [];
        this.colorAttachmentTargets = [];
        Object.entries(GBuffersRPDAssemble).forEach(([key, value]) => {
            if (key != "depth") {
                let one: GPURenderPassColorAttachment;
                if (key == "color") {
                    one = {
                        view: this.GBuffers[key].createView(),
                        clearValue: [0, 0, 0, 0],
                        loadOp: 'load',
                        storeOp: "store"
                    };
                }
                else {
                    one = {
                        view: this.GBuffers[key].createView(),
                        clearValue: [0, 0, 0, 0],
                        loadOp: 'load',
                        storeOp: "store",
                    };
                }
                colorAttachments.push(one);
                let format: GPUTextureFormat;
                if (value.format == "WEsystem") {
                    format = this.parent.presentationFormat;
                }
                else if (value.format == "WEdepth") {
                    format = this.parent.depthDefaultFormat;
                }
                else {
                    format = value.format;
                }
                this.colorAttachmentTargets.push({ format });
            }
        });

        this.renderPassDescriptor = {
            colorAttachments: colorAttachments,
            depthStencilAttachment: {
                view: this.GBuffers["depth"].createView(),
                depthClearValue: this.parent._isReversedZ ? this.parent.depthClearValueOfReveredZ : this.parent.depthClearValueOfZ,// 1.0,                
                depthLoadOp: 'load',// depthLoadOp: 'load',
                depthStoreOp: 'store',
            },
        };
        // return this.renderPassDescriptor;
    }
}