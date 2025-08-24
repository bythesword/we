import * as coreConst from "../../const/coreConst";
import { BaseEntity} from "../baseEntity";
import { BaseMaterial } from "../../material/baseMaterial";
import { BaseGeometry } from "../../geometry/baseGeometry";
import { DrawCommand } from "../../command/DrawCommand";

import { uniformEntries, unifromGroup, drawMode, drawModeIndexed, drawModeType, DrawOptionOfCommand, indexBuffer } from "../../command/commandDefine";
//for wireframe
import partHead_GBuffer_Add_FS from "../../shader/material/part/part_add.st_gbuffer.head.fs.wgsl?raw"
import partOutput_GBuffer_Replace_FS from "../../shader/material/part/part_replace.st_gbuffer.output.fs.wgsl?raw"
import { BaseStage } from "../../stage/baseStage";
import { lifeState, renderKindForDCCC } from "../../const/coreConst";
import { meshConstantsVS, optionBaseEntity, valuesForCreateDCCC } from "../baseEntityDefine";





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
    /**UV option */
    UV?: {
        /**UV sacale */
        uvScale?: {
            u: number,
            v: number
        },
        /**UV offset */
        uvOffset?: {
            x: number,
            y: number
        },
    }
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
    declare input: optionMeshEntity;


    _geometry!: BaseGeometry;
    _material!: BaseMaterial;
    _wireframeColor!: coreConst.color4F;
    _wireframeEnable!: boolean;
    // _cullMode!: GPUCullMode;
    _wireFrameOnly?: boolean;
    constructor(input: optionMeshEntity) {
        super(input);
        // this._cullMode = "back";
        // if (input.cullmode) {
        //     this._cullMode = input.cullmode;
        // }
        this._wireFrameOnly = false;
        if (input.wireFrameOnly) {
            this._wireFrameOnly = true;
        }
        this._geometry = input.geometry;
        this._material = input.material;

        // this._init = lifeState.unstart;

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

        this._init = lifeState.unstart;
    }
    update(parent: BaseStage, deltaTime: number, startTime: number, lastTime: number): void {
        super.update(parent, deltaTime, startTime, lastTime);
        this._material.update();
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
        if (this._material.getTransparent() === true) {//如果不是透明的，就设置为透明
            this._cullMode = "none";
        }

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
        this._material.destroy();
        this._geometry.destroy();
    }
    checkStatus(): boolean {
        let readyForMaterial: boolean;
        let readyForGeometry = this._geometry.getReady();
        //完成状态，正常情况
        if (this._material.getReady() == lifeState.finished) {
            readyForMaterial = true;
        }
        //更新状态，需要重新初始化
        else if (this._material.getReady() == lifeState.updated) {
            readyForMaterial = true;
        }
        else {
            readyForMaterial = false;
        }
        return readyForMaterial && readyForGeometry;

    }

    generateBoxAndSphere() {
        if (this.checkStatus()) {
            this.boundingBox = this.generateBox(this._geometry.buffer.position);
            this.boundingSphere = this.generateSphere(this.boundingBox);
        }
    }


    /**
     * 前向渲染
     * 
     * 摄像机的创建Draw Compute Commands
     * 
     * DCC push 到this.commmands.forward中 
     * @param parent 
     * @returns 完成标志位：lifeState.finished
     */
    createDCCC(valuesOfDCCC: valuesForCreateDCCC): lifeState {
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
        let constantsVS: meshConstantsVS = {};
        if (this.input?.UV) {
            if (this.input.UV.uvScale) {
                if (this.input.UV.uvScale.u) {
                    constantsVS.uvScale_u = this.input.UV.uvScale.u;
                }
                if (this.input.UV.uvScale.v) {
                    constantsVS.uvScale_v = this.input.UV.uvScale.v;
                }
            }
            if (this.input.UV.uvOffset) {
                if (this.input.UV.uvOffset.x) {
                    constantsVS.uvOffset_x = this.input.UV.uvOffset.x;

                }
                if (this.input.UV.uvOffset.y) {
                    constantsVS.uvOffset_y = this.input.UV.uvOffset.y;
                }
            }
        }
        let uniforms: unifromGroup[] = [];
        if (this._wireFrameOnly === false) {
            uniforms.push(
                {
                    layout: 1,
                    entries: [
                        {
                            label: "Mesh matrixWorld",
                            binding: binding++,
                            size: this.getSizeOfUniform(),
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
                label: this.Name == "" ? "Mesh" : this.Name,
                parent: parent,
                vertex: {
                    code: shader,
                    entryPoint: "vs",
                    buffers: vsa,
                    constants: constantsVS
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
                                size: this.getSizeOfUniform(),
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
        return lifeState.finished;
    }
    /**
     * camera的透明显然队列
     * @param valuesOfDCCC 
     * @returns 
     */
    createDCCCForTransparent(valuesOfDCCC: valuesForCreateDCCC): lifeState {
        const parent: BaseStage = valuesOfDCCC.parent;
        const camera: string = valuesOfDCCC.id;
        const kind: string = valuesOfDCCC.kind
        let matrixIndex = 0;
        if (valuesOfDCCC.matrixIndex) {
            matrixIndex = valuesOfDCCC.matrixIndex;
        }

        if (this.commandsOfTransparent[camera] == undefined) {
            this.commandsOfTransparent[camera] = [];
        }
        let scope = this;
        let constantsVS: meshConstantsVS = {};
        if (this.input?.UV) {
            if (this.input.UV.uvScale) {
                if (this.input.UV.uvScale.u) {
                    constantsVS.uvScale_u = this.input.UV.uvScale.u;
                }
                if (this.input.UV.uvScale.v) {
                    constantsVS.uvScale_v = this.input.UV.uvScale.v;
                }
            }
            if (this.input.UV.uvOffset) {
                if (this.input.UV.uvOffset.x) {
                    constantsVS.uvOffset_x = this.input.UV.uvOffset.x;

                }
                if (this.input.UV.uvOffset.y) {
                    constantsVS.uvOffset_y = this.input.UV.uvOffset.y;
                }
            }
        }
        ///////////////////////////////

        const renderPassDescriptor = this.stage!.getRenderPassDescriptorOfTransparent(camera);
        const depthStencilState = this.stage.getDepthStencilOfTransparent(camera);
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
                            size: this.getSizeOfUniform(),
                            get: () => { return scope.getUniformOfMatrix() },
                        },
                        // {
                        //     label: "透明的depth texture",
                        //     binding: binding,
                        //     resource: this.stage!.geTransparentOfUniform(camera).createView()//这里是深度纹理，而不是view
                        // }
                    ]
                });

            //透明渲染的uniforms
            //binding = 1,这个是固定的
            //这里的transparentTexturesOfUniform是不包括color的
            let transparentTexturesOfUniform = this.stage!.geTransparentOfUniform(camera, binding);
            for (let i of transparentTexturesOfUniform) {
                uniforms[0].entries.push(i);
                binding++;
            }

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
                depthStencilState: depthStencilState,
                parent: parent,
                vertex: {
                    code: shader,
                    entryPoint: "vs",
                    buffers: vsa,
                    constants: constantsVS
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
            this.commandsOfTransparent[camera].push(DC);
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
                                size: this.getSizeOfUniform(),
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
        return lifeState.finished;
    }


    /**
     * 摄像机的延迟渲染的深度渲染
     * 
     * DCC push 到this.commmands.depth中 
     */
    createDCCCDeferRenderDepth(valuesOfDCCC: valuesForCreateDCCC): lifeState {
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
                        size: this.getSizeOfUniform(),
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

        return lifeState.initializing;
    }

    /**
     * 光源的shadowmap渲染
     * 输出到 this.commandsOfShadow[camera id]中
     * @param valuesOfDCCC  
     * @returns lifeState 渲染状态
     */
    createDCCCForShadowMap(valuesOfDCCC: valuesForCreateDCCC): lifeState {
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
                            size: this.getSizeOfUniform(),
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

        return lifeState.initializing;
    }

    /**
     * 光源的shadowmap的渲染队列，未完成，20250824
     * @param values 
     */
    createDCCCForShadowMapOfTransparent(values: valuesForCreateDCCC): lifeState {
        throw new Error("Method not implemented.");
    }

    /**
     * 材质的blend状态
     * @returns 
     */
    getBlend(): GPUBlendState | undefined {
        return this._material.getBlend();
    }
    /**
     * 材质的transparent状态
     * @returns 
     */
    getTransparent(): boolean {
        // throw new Error("Method not implemented.");
        return this._material.getTransparent();
    }
}