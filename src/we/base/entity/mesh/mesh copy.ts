import * as coreConst from "../../const/coreConst";
import { BaseEntity, initStateEntity, optionBaseEntity } from "../baseEntity";
import { BaseMaterial } from "../../material/baseMaterial";
import { BaseGeometry } from "../../geometry/baseGeometry";
import { DrawCommand, drawModeIndexed, drawOptionOfCommand, indexBuffer } from "../../command/DrawCommand";
// import { cameraRayValues } from "../../camera/baseCamera";
import { commmandType } from "../../stage/baseStage";
// import { color3U, color4U } from "../../const/coreConst";
import { uniformBufferPart, uniformEntries, unifromGroup } from "../../command/baseCommand";



/**mesh的顶点结构与材质，各有一个，一一对应 */
export interface optionMeshEntity extends optionBaseEntity {
    /**几何体 */
    geometry: BaseGeometry,
    /**材质 */
    material: BaseMaterial, //| BaseMaterial[],
    /**线框，boolean,默认使用 */
    wireFrame?: boolean,
    /**线框颜色，默认黑色 */
    wireFrameColor?: coreConst.color4F
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
    constructor(input: optionMeshEntity) {
        super(input);
        this._geometry = input.geometry;
        this._material = input.material;
        this._init = initStateEntity.unstart;
        this.init()
        this._init = initStateEntity.unstart;
    }
    init() {

        this._wireframeColor = { red: 0, green: 0, blue: 0, alpha: 1 };
        if ((this.input as optionMeshEntity).wireFrame === false) {//默认有线框
            this._wireframeEnable = false;
        }
        else {
            this._wireframeEnable = true;
        }

        if ((this.input as optionMeshEntity).wireFrameColor) {
            this._wireframeColor = (this.input as optionMeshEntity).wireFrameColor as coreConst.color4F;
            let abc = 1;
        }

        // throw new Error("Method not implemented.");

    }

    updateUniformBuffer(_scene: any,  deltaTime: number,startTime:number,lastTime:number) {
        // throw new Error("Method not implemented.");
    }
    updateDCC(_scene: any,  deltaTime: number,startTime:number,lastTime:number): commmandType[] {
        // throw new Error("Method not implemented.");
        return this._commmands;
    }
    destroy() {
        // throw new Error("Method not implemented.");
        for (let i of this._commmands) {
            i.destroy();
        }
    }
    checkStatus(): boolean {
        return this._material._already && this._geometry._already;

    }
    initDCC(scene: any) {
        let already = this.checkStatus();
        if (already) {
            this._init = this.createDCC(scene);
            this.generateBox();
        }
    }
    /**
     * 创建Draw Compute Commands
     * @param scene 
     * @returns 完成标志位：initStateEntity.finished
     */
    createDCC(scene: any): initStateEntity {

        let scope = this;
        /////////////////////box 
        let shaderFS = this._material.getCodeFS();
        let shaderVS = this._geometry.getCodeVS();
        let shader = shaderVS + shaderFS;
        let vsa = this._geometry.getAttribute();
        let indexBuffer = this._geometry.getIndeices();
        let counts = this._geometry.getDrawCount();

        let values: drawModeIndexed = {
            indexCount: counts
        };
        // let options: drawOptionOfCommand;
        let uniformFS = this._material.getUniform();
        let uniforms: unifromGroup[] = [
            {
                layout: 1,
                entries: [
                    {
                        label: "Mesh matrixWorld",
                        binding: 0,
                        size: 4 * 16,
                        get: () => { return scope.getUniformOfMatrix() },
                    }
                ]
            },
        ];
        if (uniformFS !== false) {
            for (let i of uniformFS as uniformEntries[])
                uniforms[0].entries.push(i);
        }
        let options: drawOptionOfCommand = {
            label: "a triangle",
            scene: scene,
            vertex: {
                code: shader,
                entryPoint: "vs",
                buffers: vsa
            },
            fragment: {
                code: shader,
                entryPoint: "fs",
                targets: [{ format: scene.presentationFormat }]
            },
            primitive: {
                topology: 'triangle-list',
                cullMode: 'none',
            },
            // uniforms: [],
            uniforms: uniforms,
            // rawUniform: true,
            draw: {
                mode: "index",
                values: values
            },
            indexBuffer: indexBuffer as indexBuffer,
        };

        let DC = new DrawCommand(options);
        this._commmands.push(DC);

        /////////////////////////////// wire frame
        if (this._wireframeEnable === true) {
            let wireFrameShaderCode = this._geometry.getWireFrameShdaerCode(this._wireframeColor);//获取线框的shader code ，传入线框颜色
            let wireFrameVsa = this._geometry.getAttribute();
            let wireFrameIndexBuffer = this._geometry.getWireFrameIndeices();
            let wireFrameCounts = this._geometry.getWireFrameDrawCount();
            let wireFrameValues: drawModeIndexed = {
                indexCount: wireFrameCounts
            }
            let wireFrameOptions: drawOptionOfCommand = {
                label: "a triangle",
                scene: scene,
                vertex: {
                    code: wireFrameShaderCode,
                    entryPoint: "vs",
                    buffers: wireFrameVsa
                },
                fragment: {
                    code: wireFrameShaderCode,
                    entryPoint: "fs",
                    targets: [{ format: scene.presentationFormat }]
                },
                primitive: {
                    topology: "line-list",
                    cullMode: 'none',
                },
                uniforms: [
                    {
                        layout: 1,
                        entries: [
                            {
                                label: "Mesh matrixWorld",
                                binding: 0,
                                size: 4 * 16,
                                get: () => { return scope.getUniformOfMatrix() },
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

            }
            let wireFrameDC = new DrawCommand(wireFrameOptions);
            this._commmands.push(wireFrameDC);
        }
        return initStateEntity.finished;
    }



}