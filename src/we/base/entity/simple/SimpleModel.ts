import { uniformEntries, unifromGroup } from "../../command/baseCommand";
import { DrawCommand, drawModeIndexed, drawOptionOfCommand, indexBuffer, vsAttributes } from "../../command/DrawCommand";
import { BaseMaterial } from "../../material/baseMaterial";
import { BaseStage } from "../../stage/baseStage";
import { BaseEntity, boundingBox, boundingSphere, initStateEntity, optionBaseEntity, renderCommands } from "../baseEntity";
import simpleModelVS from "../../shader/model/simpleModel.vs.wgsl?raw"

interface modelData {
    positions: [number, number, number][],
    normals: [number, number, number][],
    uvs: [number, number][],
    triangles: [number, number, number][],
}

export interface optionSimpleModel extends optionBaseEntity {
    data: modelData,
    material: BaseMaterial

}

export class SimpleModel extends BaseEntity {

    modelData: modelData;
    _material: BaseMaterial;
    constructor(input: optionSimpleModel) {
        super(input);
        this._material = input.material;
        this.modelData = input.data;
        this._init = initStateEntity.unstart;//
    }
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


    createDCC(parent: BaseStage): initStateEntity {
        let scope = this;
        let shader;
        let binding = 0;
        let constants = {};
        let uniforms: unifromGroup[] = [];
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
        if (this.deferRenderDepth) {
            uniforms[0].entries.push({
                binding: binding++,
                resource: this.stage!.depthTextureOnly.createView()
            });
            // constants = {
            //     canvasSizeWidth: this.stage!.parent.canvas.width,
            //     canvasSizeHeight: this.stage!.parent.canvas.height,
            // }
        }
        if (this.input?.shaderCode) {
            shader = this.input.shaderCode;
        } else {
            let shaderFS = this._material.getCodeFS(binding);
            let shaderVS = simpleModelVS;
            shader = shaderVS + shaderFS;
        }
        shader = this.shaderCodeProcess(shader);
        let vsa = this.getAttribute();
        let indexBuffer = this.getIndeices();
        let counts = this.getDrawCount();
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
        let options: drawOptionOfCommand = {
            label: this.name == "" ? "simple model " : this.name,
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
            },
            primitive: {
                topology: 'triangle-list',
                cullMode: "back",
            },
            // uniforms: [],
            uniforms: uniforms,
            // rawUniform: true,
            draw: {
                mode: "index",
                values: values,

            },
            indexBuffer: indexBuffer as indexBuffer,

        };

        let DC = new DrawCommand(options);
        this.commmands.forward.push(DC);////////////////////////////////////////////////////特别注意
        return initStateEntity.finished;
    }

    createDCCDeferRenderDepth(parent: any): initStateEntity {
        let scope = this;
        /////////////////////box  
        let shader = simpleModelVS;
        shader = this.shaderCodeProcess(shader);


        let vsa = this.getAttribute();
        let indexBuffer = this.getIndeices();
        let counts = this.getDrawCount();

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

        let options: drawOptionOfCommand = {
            label: "Mesh for deferRender depth" + this.name,
            parent: parent,
            vertex: {
                code: shader,
                entryPoint: "vs",
                buffers: vsa
            },
            primitive: {
                topology: 'triangle-list',
                cullMode: "back",
            },
            uniforms: uniforms,
            // rawUniform: true,
            draw: {
                mode: "index",
                values: values,

            },
            indexBuffer: indexBuffer as indexBuffer,

            renderPassDescriptor: this.stage!.getRenderPassDescriptor_ForDeferDepth(),


        };

        let DC = new DrawCommand(options);
        this.commmands.depth.push(DC);////////////////////////////////////////////////////特别注意

        return initStateEntity.initializing;
    }
    checkStatus(): boolean {
        return this._material.getReady();
    }
    updateDCC(parent: BaseStage, deltaTime: number, startTime: number, lastTime: number): renderCommands {
        return this.commmands;
    }
    //todo :20241219
    generateBox(): boundingBox {
        // throw new Error("Method not implemented.");
        return {
            min: [0, 0, 0],
            max: [0, 0, 0],
        }
    }
    generateSphere(): boundingSphere {
        throw new Error("Method not implemented.");
    }
    destroy() {
        this._destroy = true;
        this.modelData = {
            positions: [],
            normals: [],
            uvs: [],
            triangles: [],
        }
    }
    vsa!: vsAttributes[];
    /* 输出顶点信息
    * @returns sAttributes[]
    */
    getAttribute(): vsAttributes[] {
        if (this.vsa == undefined) {
            let position: vsAttributes = {
                vertexArray: new Float32Array(this.modelData.positions.flat()),
                type: "Float32Array",
                arrayStride: 4 * 3,
                attributes: [
                    {
                        shaderLocation: 0,
                        offset: 0,
                        format: "float32x3"
                    }
                ]
            };
            let uv: vsAttributes = {
                vertexArray: new Float32Array(this.modelData.uvs.flat()),
                type: "Float32Array",
                arrayStride: 4 * 2,
                attributes: [
                    {
                        shaderLocation: 1,
                        offset: 0,
                        format: "float32x2"
                    }
                ]
            };
            let normal: vsAttributes = {
                vertexArray: new Float32Array(this.modelData.normals.flat()),
                type: "Float32Array",
                arrayStride: 4 * 3,
                attributes: [
                    {
                        shaderLocation: 2,
                        offset: 0,
                        format: "float32x3"
                    }
                ]
            }

            this.vsa = [position, uv, normal];
        }
        return this.vsa;
    }

    indeices!: indexBuffer;
    /**
     * 返回片面的索引数据跟上
     * @returns indeBuffer 格式
     */
    getIndeices(): indexBuffer {
        if (this.indeices == undefined) {

            this.indeices = {
                buffer: new Uint32Array(this.modelData.triangles.flat()),
                indexForat: "uint32"
            };
        }
        return this.indeices;
    }
    /**
* 返回片面的索引模式的绘制数量
* @returns number
*/
    getDrawCount(): number {

        return this.modelData.triangles.flat().length;
    }
}
