import * as coreConst from "../../const/coreConst";
import { BaseEntity, initStateEntity, optionBaseEntity } from "../baseEntity";
import { BaseMaterial } from "../../material/baseMaterial";
import { BaseGeometry } from "../../geometry/baseGeometry";
import { DrawCommand, drawModeIndexed, DrawOptionOfCommand, indexBuffer } from "../../command/DrawCommand";

import { uniformEntries, unifromGroup } from "../../command/baseCommand";
//for wireframe
import partHead_GBuffer_Add_FS from "../../shader/material/part/part_add.st_gbuffer.head.fs.wgsl?raw"
import partOutput_GBuffer_Replace_FS from "../../shader/material/part/part_replace.st_gbuffer.output.fs.wgsl?raw"
import { BaseStage } from "../../stage/baseStage";





/**mesh的顶点结构与材质，各有一个，一一对应 */
export interface optionMeshEntity extends optionBaseEntity {
    /**几何体 */
    geometry: BaseGeometry,
    /**材质 */
    material: BaseMaterial, //| BaseMaterial[],

    /**只显示线框 */
    wireFrameOnly?: boolean;
    /**线框，boolean,默认使用 */
    wireFrame?: boolean,
    /**线框颜色，默认黑色 */
    wireFrameColor?: coreConst.color4F,
    /**剔除面 */
    cullmode?: GPUCullMode,
}


/**
 * Mesh 输出三角形和网格线
 * 
 * 可以有两种方式输出网格线
 * 
 * 1、三角形+一个像素的lines
 * 
 * 2(todo)、三角形（shader网格线，线宽可定义）
 * 
 * 
 */
export class Mesh extends BaseEntity {
    _geometry!: BaseGeometry;
    _material!: BaseMaterial;
    _wireframeColor!: coreConst.color4F;
    _wireframeEnable!: boolean;
    _cullMode!: GPUCullMode;
    _wireFrameOnly?: boolean;
    constructor(input: optionMeshEntity) {
        super(input);
        this._cullMode = "back";
        if (input.cullmode) {
            this._cullMode = input.cullmode;
        }
        this._wireFrameOnly = false;
        if (input.wireFrameOnly) {
            this._wireFrameOnly = true;
        }
        this._geometry = input.geometry;
        this._material = input.material;

        // this._init = initStateEntity.unstart;

        this._wireframeColor = { red: 0, green: 0, blue: 0, alpha: 1 };
        if ((this.input as optionMeshEntity).wireFrame === false) {//默认有线框
            this._wireframeEnable = false;
        }
        else {
            this._wireframeEnable = true;
        }

        if ((this.input as optionMeshEntity).wireFrameColor) {
            this._wireframeColor = (this.input as optionMeshEntity).wireFrameColor as coreConst.color4F;
        }

        this._init = initStateEntity.unstart;
    }
    /**覆写 Root的function,因为材料类需要GPUDevice */
    async readyForGPU() {
        await this._material.init({
            scene: this.scene,//为获取在scene中注册的resource
            deferRenderColor: this.deferRenderColor,
            deferRenderDepth: this.deferRenderDepth,
            reversedZ: this.reversedZ,
            parent: this,
        });
        // await this._material.setRootENV(this.scene);
    }
    destroy() {
        for (let i in this.commmands) {
            let one = this.commmands[i]
            for (let j of one.forward) {
                j.destroy();
            }
            for (let j of one.depth) {
                j.destroy();
            }
            for (let j of one.color) {
                j.destroy();
            }
        }

    }
    checkStatus(): boolean {
        return this._material.getReady() && this._geometry.getReady();

    }

    generateBoxAndSphere() {
        if (this.checkStatus()) {
            this.boundingBox = this.generateBox(this._geometry.buffer.position);
            this.boundingSphere = this.generateSphere(this.boundingBox);
        }
    }
    /**
     * 覆写了父类的这个function
     * 
     * 目的：判断是否完成准备工作，如果完成执行createDCC()
     * 
     * @param parent 
     */
    // initDCC(parent: BaseStage) {
    //     let already = this.checkStatus();
    //     if (already) {
    //         this._init = initStateEntity.initializing;
    //         if (this.deferRenderDepth) this._init = this.createDCCDeferRenderDepth(parent);
    //         this._init = this.createDCC(parent);
    //         this.generateBox();
    //     }
    // }

    /**
     * 创建Draw Compute Commands
     * 
     * DCC push 到this.commmands.forward中 
     * @param parent 
     * @returns 完成标志位：initStateEntity.finished
     */
    createDCC(parent: BaseStage, cameraActorID: string, kind: string = "camera"): initStateEntity {
        let camera = cameraActorID;
        if (this.commmands[camera] == undefined) {
            this.commmands[camera] = {
                forward: [],
                depth: [],
                color: []
            };
        }
        let scope = this;

        ///////////////////////////////

        const renderPassDescriptor = this.stage!.getRenderPassDescriptor(camera);
        /////////////////////box  
        let shader;
        let binding = 0;
        let constants = {};
        let uniforms: unifromGroup[] = [];
        if (this._wireFrameOnly === false) {
            uniforms.push(
                {
                    layout: 1,
                    entries: [
                        {
                            label: "Mesh matrixWorld",
                            binding: binding++,
                            size: this._entityIdSizeForWGSL * 4 + 4 * 16 * this.numInstances,
                            get: () => { return scope.getUniformOfMatrix() },
                        }
                    ]
                });
            //如果是延迟渲染(单像素) ，增加depth texture
            if (this.deferRenderDepth) {
                uniforms[0].entries.push({
                    binding: binding++,
                    resource: this.stage!.depthTextureOnly[camera].createView()
                });
                // constants = {
                //     canvasSizeWidth: this.stage!.parent.canvas.width,
                //     canvasSizeHeight: this.stage!.parent.canvas.height,
                // }
            }
            if (this.input?.shaderCode) {
                shader = this.input.shaderCode;
            }
            else {
                let shaderFS = this._material.getCodeFS(binding);
                let shaderVS = this._geometry.getCodeVS();
                shader = shaderVS + shaderFS;
                shader = this.shaderCodeProcess(shader);
            }

            let vsa = this._geometry.getAttribute();
            let indexBuffer = this._geometry.getIndeices();
            let counts = this._geometry.getDrawCount();

            let values: drawModeIndexed = {
                indexCount: counts,
                instanceCount: this.numInstances,
            };
            // let options: drawOptionOfCommand;
            let uniformFS = this._material.getUniform(binding);

            if (uniformFS !== false) {
                for (let i of uniformFS as uniformEntries[])
                    uniforms[0].entries.push(i);
            }

            //////////////////////////////////////////////////////////////////////


            let options: DrawOptionOfCommand = {
                label: this.name == "" ? "Mesh" : this.name,
                parent: parent,
                vertex: {
                    code: shader,
                    entryPoint: "vs",
                    buffers: vsa
                },
                fragment: {
                    code: shader,
                    entryPoint: "fs",
                    targets: this.getFragmentTargets(),
                    constants: constants
                    //[{ format: parent.presentationFormat }]
                },
                primitive: {
                    topology: 'triangle-list',
                    cullMode: this._cullMode,
                },
                // uniforms: [],
                uniforms: uniforms,
                // rawUniform: true,
                draw: {
                    mode: "index",
                    values: values,
                },
                indexBuffer: indexBuffer as indexBuffer,
                renderForID: camera,
                renderForType: kind,
                systemUniforms: parent.createSystemUnifromGroupForPerShader,
                renderPassDescriptor: renderPassDescriptor,
            };

            let DC = new DrawCommand(options);
            this.commmands[camera].forward.push(DC);
        }

        /////////////////////////////// wire frame
        if (this._wireframeEnable === true) {
            let wireFrameShaderCodeVS = this._geometry.getWireFrameShdaerCodeVS(this._wireframeColor);//获取线框的shader code ，传入线框颜色
            wireFrameShaderCodeVS = this.shaderCodeProcess(wireFrameShaderCodeVS);

            let wireFrameShaderCodeFS = this._geometry.getWireFrameShdaerCodeFS(this._wireframeColor);//获取线框的shader code ，传入线框颜色
            wireFrameShaderCodeFS = partHead_GBuffer_Add_FS + wireFrameShaderCodeFS;
            wireFrameShaderCodeFS = wireFrameShaderCodeFS.replaceAll("$output", partOutput_GBuffer_Replace_FS.toString());
            let wireFrameShaderCode = wireFrameShaderCodeVS + wireFrameShaderCodeFS;

            let wireFrameVsa = this._geometry.getAttribute();

            let wireFrameIndexBuffer = this._geometry.getWireFrameIndeices();
            let wireFrameCounts = this._geometry.getWireFrameDrawCount();
            let wireFrameValues: drawModeIndexed = {
                indexCount: wireFrameCounts,
                instanceCount: this.numInstances,
            }

            let wireFrameOptions: DrawOptionOfCommand = {
                label: this.name == "" ? "Mesh wireframe" : this.name + " wireframe",
                parent: parent,
                vertex: {
                    code: wireFrameShaderCode,
                    entryPoint: "vs",
                    buffers: wireFrameVsa
                },
                fragment: {
                    code: wireFrameShaderCode,
                    entryPoint: "fs",
                    targets: this.getFragmentTargets()
                    // targets: [{ format: parent.presentationFormat }]
                },
                primitive: {
                    topology: "line-list",
                    cullMode: this._cullMode,
                },
                uniforms: [
                    {
                        layout: 1,
                        entries: [
                            {
                                label: "Mesh matrixWorld",
                                binding: 0,
                                size: this._entityIdSizeForWGSL * 4 + 4 * 16 * this.numInstances,
                                get: () => { return scope.getUniformOfMatrix(); },
                            }
                        ]
                    },
                ],
                // rawUniform: true,
                draw: {
                    mode: "index",
                    values: wireFrameValues
                },
                indexBuffer: wireFrameIndexBuffer as indexBuffer,
                // instanceCount: this.numInstances,
                renderForID: camera,
                renderForType: kind,
                systemUniforms: parent.createSystemUnifromGroupForPerShader,
                renderPassDescriptor,
            }
            let wireFrameDC = new DrawCommand(wireFrameOptions);
            this.commmands[camera].forward.push(wireFrameDC);
        }
        return initStateEntity.finished;
    }

    // /**返回this.commmands
    //  * 
    //  * 其中包括3个类型的commands
    //   */
    // updateDCC(_parent: any, deltaTime: number, startTime: number, lastTime: number): commandsOfEntity {
    //     return this.commmands;
    // }
    /**DCC push 到this.commmands.depth中 */
    createDCCDeferRenderDepth(parent: BaseStage, camera: string, kind?: string): initStateEntity {
        let scope = this;
        ///////////////////////////////
        const renderPassDescriptor = this.stage!.getRenderPassDescriptor_ForDeferDepth(camera, kind);
        /////////////////////box  
        let shader = this._geometry.getCodeVS();
        shader = this.shaderCodeProcess(shader);

        let vsa = this._geometry.getAttribute();
        let indexBuffer = this._geometry.getIndeices();
        let counts = this._geometry.getDrawCount();

        let values: drawModeIndexed = {
            indexCount: counts,
            instanceCount: this.numInstances,
        };

        let uniforms: unifromGroup[] = [
            {
                layout: 1,
                entries: [
                    {
                        label: "Mesh matrixWorld",
                        binding: 0,
                        size: this._entityIdSizeForWGSL * 4 + 4 * 16 * this.numInstances,
                        get: () => { return scope.getUniformOfMatrix() },
                    }
                ]
            },
        ];
        let options: DrawOptionOfCommand = {
            label: "Mesh for deferRender depth" + this.name,
            parent: parent,
            vertex: {
                code: shader,
                entryPoint: "vs",
                buffers: vsa
            },
            primitive: {
                topology: 'triangle-list',
                cullMode: this._cullMode,
            },
            uniforms: uniforms,
            // rawUniform: true,
            draw: {
                mode: "index",
                values: values,

            },
            indexBuffer: indexBuffer as indexBuffer,

            renderPassDescriptor,
            renderForID: camera,
            renderForType: kind,
            systemUniforms: parent.createSystemUnifromGroupForPerShader,
            // depthStencilState: {
            //     depthWriteEnabled: true,
            //     depthCompare: 'less',
            //     format: 'depth32float',
            // },
            // layout,

        };

        let DC = new DrawCommand(options);
        if (this.commmands[camera] == undefined) {
            this.commmands[camera] = {
                forward: [],
                depth: [],
                color: []
            };
        }
        this.commmands[camera].depth.push(DC);

        return initStateEntity.initializing;
    }
}