// import { BaseMaterial } from "../material/baseMaterial";

import { indexBuffer, vsAttributes } from "../command/DrawCommand";
import { color3U } from "../const/coreConst";


type geometryMaterialStep = number[];

/**
 * 片面的几何属性
 */
export interface geometryAttribute {
    position: number[],
    normal: number[],
    uv: number[],
    indeices: number[],
    materialStep: geometryMaterialStep[]
}
/**
 * 线框的几何属性
 */
export interface geometryWireFrameAttribute {
    indeices: number[],
}

export interface optionBaseGemetry { }
/**
 * 设计目标提供静态的基础几何体
 */
export abstract class BaseGeometry {
    type!:string;
    input: optionBaseGemetry;
    buffer!: geometryAttribute;
    wireFrame!: geometryWireFrameAttribute
    _destroy: boolean;
    
    _wireframeColor!: color3U;
    _wireframeEnable!: boolean;

    constructor(input: optionBaseGemetry) {
        this._destroy = false;
        this.buffer = {
            position: [],
            normal: [],
            uv: [],
            indeices: [],
            materialStep: []
        }
        this.input = input;
     
    }

    abstract init(input: optionBaseGemetry): any
    abstract destroy(): any


    //线框
    abstract getWireFrame(): vsAttributes[]
    abstract getWireFrameDrawCount(): number;
    abstract getWireFrameIndeices(): indexBuffer | boolean
    abstract getWireFrameShdaerCode(color: color3U): string;


    //片面
    /**
     * 输出 shader 的vs 部分code
     */
    abstract getCodeVS(): any

    /**
     * 输出顶点信息
     */
    abstract getAttribute(): vsAttributes[]
    abstract getIndeices(): indexBuffer | boolean
    abstract getDrawCount(): number

    isDestroy() {
        return this._destroy;
    }

}