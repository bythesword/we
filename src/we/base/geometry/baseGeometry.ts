// import { BaseMaterial } from "../material/baseMaterial";
 
import { color3U } from "../const/coreConst";
import framelineVS from "../shader/geometry/baseGeometryFrameline.vs.wgsl?raw"
import framelineFS from "../shader/geometry/baseGeometryFrameline.fs.wgsl?raw"
import triangleVS from "../shader/geometry/baseGeometry.vs.wgsl?raw"
import * as coreConst from "../const/coreConst";
import { indexBuffer, vsAttributes } from "../command/commandDefine";

type geometryMaterialStep = number[];
export interface xyz {
    x: number,
    y: number,
    z: number,
}
/**
 * 片面的几何属性
 */
export interface geometryAttribute {
    position: number[],
    normal: number[],
    uv: number[],
    color: number[],
    indeices: number[],
    materialStep: geometryMaterialStep[],

}
/**
 * 线框的几何属性
 */
export interface geometryWireFrameAttribute {
    indeices: number[],
}

export interface optionBaseGemetry {
    /**指定的shader code */
    code?: string
}
/**
 * 设计目标提供静态的基础几何体
 */
export abstract class BaseGeometry {
    type!: string;
    input: optionBaseGemetry;
    buffer!: geometryAttribute;
    wireFrame!: geometryWireFrameAttribute
    _destroy: boolean;

    _wireframeColor!: color3U;
    _wireframeEnable!: boolean;

    _already: boolean;

    constructor(input: optionBaseGemetry) {
        this._destroy = false;
        this._already = false;
        this.buffer = {
            position: [],
            normal: [],
            color: [],
            uv: [],
            indeices: [],
            materialStep: []
        }
        this.input = input;

    }

    abstract init(input: optionBaseGemetry): any
    // abstract destroy(): any


    //线框
    // abstract getWireFrame(): vsAttributes[]
    // abstract getWireFrameDrawCount(): number;
    // abstract getWireFrameIndeices(): indexBuffer | boolean
    // abstract getWireFrameShdaerCode(color: color3U): string;


    //片面
    /**
     * 输出 shader 的vs 部分code
     */
    // abstract getCodeVS(): any

    /**
     * 输出顶点信息
     */
    // abstract getAttribute(): vsAttributes[]
    // abstract getIndeices(): indexBuffer | boolean
    // abstract getDrawCount(): number

    isDestroy() {
        return this._destroy;
    }
    /**
 * 创建线框数据结构
 */
    createWrieFrame() {
        let list: { [name: string]: number[] };
        list = {};
        if (this.buffer.indeices.length == 0) {
            let i_index=0;
            for (let i = 0; i < this.buffer.position.length / 3; i++) {
                list[i_index++] = [i, i + 1];
                list[i_index++] = [i + 1, i + 2];
                list[i_index++] = [i + 2, i];               

            }
        }
        else {
            for (let i = 0; i < this.buffer.indeices.length; i += 3) {
                let A = this.buffer.indeices[i];
                let B = this.buffer.indeices[i + 1];
                let C = this.buffer.indeices[i + 2];
                let AB = [A, B].sort().toString();
                let BC = [B, C].sort().toString();
                let CA = [C, A].sort().toString();
                list[AB] = [A, B];
                list[BC] = [B, C];
                list[CA] = [C, A];
            }
        }
        let indeices: number[] = [];
        for (let i in list) {
            indeices.push(list[i][0], list[i][1]);
        }
        let output: geometryWireFrameAttribute = {
            indeices: indeices
        };
        this.wireFrame = output;
    }
    /**
     * 返回线框索引
     * @returns indexBuffer 结构
     */
    getWireFrameIndeices(): indexBuffer | false {
        if (this.wireFrame.indeices.length == 0) {
            return false;
        }
        let indeices: indexBuffer = {
            buffer: new Uint32Array(this.wireFrame.indeices),
            indexForat: "uint32"
        };
        return indeices;
    }
    /**
     * 返回线框索引绘制的数量
     * @returns number
     */
    getWireFrameDrawCount(): number {
        if (this.wireFrame.indeices.length == 0) {
            return this.buffer.position.length / 3;
        }
        return this.wireFrame.indeices.length;
    }
    /***
     * 返回顶点属性，索引模式
     */
    getWireFrame(): vsAttributes[] {
        let position: vsAttributes = {
            vertexArray: new Float32Array(this.buffer.position),
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
        let vsa: vsAttributes[] = [position];
        return vsa;
    }
    /**
 * 返回片面的索引模式的绘制数量
 * @returns number
 */
    getDrawCount(): number {
        if (this.buffer.indeices.length == 0) {
            return this.buffer.position.length / 3;
        }
        return this.buffer.indeices.length;
    }
    /**
     * 获取线框shaderCode
     * @param _color 线框颜色
     * @returns shader code
     */
    getWireFrameShdaerCodeVS(_color: coreConst.color4F): string {
        let code = framelineVS;
        return code;
    }

    /**
     * todo：20241129，
     * 1、后期使用线材质，或线框材质，或shader线框，代替；
     * 2、这个目前这个目前没有输出entityID，输出的是0
     * 
     * 线框的FS
     * @param color 
     * @returns 
     */
    getWireFrameShdaerCodeFS(color: coreConst.color4F): string {
        let red = color.red;
        let green = color.green;
        let blue = color.blue;
        let alpha = 1.0;
        if ("alpha" in color) {
            color.alpha;
        }
        let code = framelineFS;
        code = code.replace("$red", red.toString());
        code = code.replace("$blue", blue.toString());
        code = code.replace("$green", green.toString());
        code = code.replace("$alpha", alpha.toString());

        return code;
    }

    /**
     * 返回片面的索引数据跟上
     * @returns indeBuffer 格式
     */
    getIndeices(): indexBuffer | false {
        if (this.buffer.indeices.length == 0) {
            return false;
        }
        let indeices: indexBuffer = {
            buffer: new Uint32Array(this.buffer.indeices),
            indexForat: "uint32"
        };
        return indeices;
    }
    /**
     * 返回shader的VS部分的code
     * @returns string
     */
    getCodeVS() {
        if (this.input.code) {
            return this.input.code;
        }
        return triangleVS;
    }
    /**
    * 输出顶点信息
    * @returns sAttributes[]
    */
    getAttribute(): vsAttributes[] {

        let position: vsAttributes = {
            vertexArray: new Float32Array(this.buffer.position),
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
            vertexArray: new Float32Array(this.buffer.uv),
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
            vertexArray: new Float32Array(this.buffer.normal),
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
        if (this.buffer.color.length == 0) {
            this.buffer.color = this.generateColorArray(this.buffer.position.length / 3);
        }
        let color: vsAttributes = {
            vertexArray: new Float32Array(this.buffer.color),
            type: "Float32Array",
            arrayStride: 4 * 3,
            attributes: [
                {
                    shaderLocation: 3,
                    offset: 0,
                    format: "float32x3"
                }
            ]
        }
        let vsa: vsAttributes[] = [position, uv, normal, color];
        return vsa;
    }
    generateColorArray(length: number, color = [1, 1, 1]) {
        let colorsArray = [];
        for (let i = 0; i < length; i++) {
            colorsArray.push(color[0], color[1], color[2]);
        }
        return colorsArray;
    }
    destroy() {
        this._destroy = true;
        this.buffer = {
            position: [],
            normal: [],
            uv: [],
            color: [],
            indeices: [],
            materialStep: []
        }
    }
    getReady() {
        if (this._already) {
            return true;
        }
        else {
            return false;
        }
    }
}