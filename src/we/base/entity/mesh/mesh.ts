import * as coreConst from "../../const/coreConst";
import { BaseEntity, initStateEntity, optionBaseEntity, valuesForCreateDCCC } from "../baseEntity";
import { BaseMaterial } from "../../material/baseMaterial";
import { BaseGeometry } from "../../geometry/baseGeometry";
import { DrawCommand} from "../../command/DrawCommand";

import { uniformEntries, unifromGroup , drawMode, drawModeIndexed, drawModeType, DrawOptionOfCommand, indexBuffer } from "../../command/commandDefine";
//for wireframe
import partHead_GBuffer_Add_FS from "../../shader/material/part/part_add.st_gbuffer.head.fs.wgsl?raw"
import partOutput_GBuffer_Replace_FS from "../../shader/material/part/part_replace.st_gbuffer.output.fs.wgsl?raw"
import { BaseStage } from "../../stage/baseStage";
import { renderKindForDCCC } from "../../const/coreConst";





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
    getTransparent(): boolean {
        // throw new Error("Method not implemented.");
        return this._material.getTransparent();
    }

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
     * 目的：判断是否完成准备工作，如果完成执行createDCCC()
     * 
     * @param parent 
     */
    // initDCC(parent: BaseStage) {
    //     let already = this.checkStatus();
    //     if (already) {
    //         this._init = initStateEntity.initializing;
    //         if (this.deferRenderDepth) this._init = this.createDCCCDeferRenderDepth(parent);
    //         this._init = this.createDCCC(parent);
    //         this.generateBox();
    //     }
    // }

    /**
     * 前向渲染
     * 
     * 创建Draw Compute Commands
     * 
     * DCC push 到this.commmands.forward中 
     * @param parent 
     * @returns 完成标志位：initStateEntity.finished
     */ 
    createDCCC(valuesOfDCCC: valuesForCreateDCCC): initStateEntity {
        const parent: BaseStage = valuesOfDCCC.parent;
        const camera: string = valuesOfDCCC.id;
        const kind: string = valuesOfDCCC.kind
        let matrixIndex = 0;
        if (valuesOfDCCC.matrixIndex) {
            matrixIndex = valuesOfDCCC.matrixIndex;
        }

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

            let values: drawModeIndexed | drawMode = {
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

            let drawMode: drawModeType;
            let options: DrawOptionOfCommand;
            if (indexBuffer === false) {
                drawMode = {
                    mode: "draw",
                    values: {
                        vertexCount: counts,
                    }
                }
            }
            else {
                drawMode = {
                    mode: "index",
                    values: {
                        indexCount: counts,
                        instanceCount: this.numInstances,
                    },
                }
            }
            options = {
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
                draw: drawMode,
                // draw: {
                //     mode: "index",
                //     values: values,
                // },
                indexBuffer: indexBuffer as indexBuffer,
                renderForID: camera,
                renderForType: kind as renderKindForDCCC,
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
            let drawMode: drawModeType;
            let wireFrameOptions: DrawOptionOfCommand;
            if (wireFrameIndexBuffer === false) {
                drawMode = {
                    mode: "draw",
                    values: {
                        vertexCount: wireFrameCounts,
                    }
                }
            }
            else {
                drawMode = {
                    mode: "index",
                    values: {
                        indexCount: wireFrameCounts,
                        instanceCount: this.numInstances,
                    },
                }
            }
            wireFrameOptions = {
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
                draw: drawMode,
                //  {
                //     mode: "index",
                //     values: wireFrameValues
                // },
                indexBuffer: wireFrameIndexBuffer as indexBuffer,
                // instanceCount: this.numInstances,
                renderForID: camera,
                renderForType: kind as renderKindForDCCC,
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
    /**
     * 延迟渲染的深度渲染
     * 
     * DCC push 到this.commmands.depth中 
     */
    createDCCCDeferRenderDepth(valuesOfDCCC: valuesForCreateDCCC): initStateEntity {
        const parent: BaseStage = valuesOfDCCC.parent;
        const camera: string = valuesOfDCCC.id;
        const kind: string = valuesOfDCCC.kind
        let matrixIndex = 0;
        if (valuesOfDCCC.matrixIndex) {
            matrixIndex = valuesOfDCCC.matrixIndex;
        }
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
        let drawMode: drawModeType;
        let options: DrawOptionOfCommand;
        if (indexBuffer === false) {
            drawMode = {
                mode: "draw",
                values: {
                    vertexCount: counts,
                }
            }
        }
        else {
            drawMode = {
                mode: "index",
                values: {
                    indexCount: counts,
                    instanceCount: this.numInstances,
                },
            }
        }
        options = {
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
            draw: drawMode,
            indexBuffer: indexBuffer as indexBuffer,

            renderPassDescriptor,
            renderForID: camera,
            renderForType: kind as renderKindForDCCC,
            systemUniforms: parent.createSystemUnifromGroupForPerShaderForOnlyVS,
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

    /**
     * 光源的shadowmap渲染
     * 输出到 this.commandsOfShadow[camera id]中
     * @param valuesOfDCCC  
     * @returns initStateEntity 渲染状态
     */
    createDCCCForShadowMap(valuesOfDCCC: valuesForCreateDCCC): initStateEntity {
        const parent: BaseStage = valuesOfDCCC.parent;

        const kind: string = valuesOfDCCC.kind
        let matrixIndex = 0;
        if (valuesOfDCCC.matrixIndex) {
            matrixIndex = valuesOfDCCC.matrixIndex;
        }
        const id: string = valuesOfDCCC.id + "_" + matrixIndex;
        if (this.commandsOfShadow[id] == undefined) {
            this.commandsOfShadow[id] = [];
        }
        let scope = this;

        //////////////////////////////////////////////////
        //RPD 
        const renderPassDescriptor = parent.getRenderPassDescriptorOfLight(valuesOfDCCC);
        if (renderPassDescriptor === false) {
            console.error("获取renderPassDescriptor失败");
        }
        else {
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
            let drawMode: drawModeType;
            let options: DrawOptionOfCommand;
            if (indexBuffer === false) {
                drawMode = {
                    mode: "draw",
                    values: {
                        vertexCount: counts,
                    }
                }
            }
            else {
                drawMode = {
                    mode: "index",
                    values: {
                        indexCount: counts,
                        instanceCount: this.numInstances,
                    },
                }
            }
            options = {
                label: "Mesh For ShadowMap" + this.name,
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
                draw: drawMode,
                indexBuffer: indexBuffer as indexBuffer,

                renderPassDescriptor,
                renderForID: id,//聚合了id和matrixIndex
                renderForType: kind as renderKindForDCCC,//
                systemUniforms: parent.createSystemUnifromGroupForPerShaderOfShadowMap,
                // depthStencilState: {
                //     depthWriteEnabled: true,
                //     depthCompare: 'less',
                //     format: 'depth32float',
                // },
                // layout,

            };

            let DC = new DrawCommand(options);
            if (this.commandsOfShadow[id] == undefined) {
                this.commandsOfShadow[id] = [];
            }
            this.commandsOfShadow[id].push(DC);
        }

        return initStateEntity.initializing;
    }
}