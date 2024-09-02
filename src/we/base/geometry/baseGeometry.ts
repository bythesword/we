// import { BaseMaterial } from "../material/baseMaterial";


type geometryMaterialStep = number[];

export interface geometryAttribute {
    position: number[],
    normal: number[],
    uv: number[],
    indeices: number[],
    materialStep: geometryMaterialStep[]
}



export interface optionBaseGemetry { }
/**
 * 设计目标提供静态的基础几何体
 */
export abstract class BaseGeometry {
    input: optionBaseGemetry;
    buffer!: geometryAttribute;
    _destory: boolean;

    constructor(input: optionBaseGemetry) {
        this._destory = false;
        this.buffer = {
            position: [],
            normal: [],
            uv: [],
            indeices: [],
            materialStep: []
        }
        this.input = input;
        this.init(input)
    }

    abstract init(input: optionBaseGemetry): any
    abstract destory(): any

    isDestory() {
        return this._destory;
    }

}