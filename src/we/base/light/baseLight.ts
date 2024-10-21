import * as coreConst from "../const/coreConst";
import {
    //vec3,
    Vec3
} from "wgpu-matrix";

// export interface optionBaseLightSize{

// }
export interface optionLightShadow {
    /**
     * 是否产生阴影
     * 默认=false
     */
    castShadow?: boolean,
    mapSize?: {
        width: number,
        height: number
    }
}
export enum lightType {
    directional,
    point,
    spot,
}
export interface optionBaseLight {
    position?: Vec3,
    color?: coreConst.color3U,
    /**光的强度 
     * 默认=1.0
    */
    intensity?: number,
    /**光的可视距离 
     * 0.0=无限远
    */
    distance?: number,
    direction?: Vec3,
    /**
     * 衰减因子，待定
     */
    decay?: number,

    shadow?: optionLightShadow,
    size?: number,
    visible?: boolean
    /**
     * 光源与stage的关系
     * 默认（undefined）：照亮所有stage
     * 有数组：["World"] || ["Room"],则代表仅在当前的一个或几个stage中有效
     * 
     * 若投射阴影，也仅在相关的stage中进行，比如室内不考虑室外
     */
    stage?: coreConst.stageName,
}
export type typeLight = string;

export interface structBaselight {
    buffer: Float32Array,
}
export interface shadowMap {
    map: GPUTexture,
}
export abstract class BaseLight {
    _id!: number;
    parameters: optionBaseLight;
    constructor(input: optionBaseLight) {
        this.parameters = input;
        if (this.parameters.position == undefined) this.parameters.position = [0.0, 0.0, 0.0];
        if (this.parameters.color == undefined) this.parameters.color = { red: 1, green: 1, blue: 1 };
        if (this.parameters.distance == undefined) this.parameters.distance = 0.0;
        if (this.parameters.decay == undefined) this.parameters.decay = 1;
        if (this.parameters.visible == undefined) this.parameters.visible = true;
        if (this.parameters.intensity == undefined) this.parameters.intensity = 1.0;


        if (this.parameters.shadow != undefined)
            if (this.parameters.shadow.castShadow === true)
                if (this.parameters.shadow.mapSize == undefined) {
                    this.parameters.shadow.mapSize = {
                        width: coreConst.shadowMapSize,
                        height: coreConst.shadowMapSize,
                    }
                }

    }

    abstract getStructBuffer(): structBaselight;
    abstract generateShadowMap(device: GPUDevice): shadowMap | false;

    color3UTo3F(color: coreConst.color3U) {
        return [color.red / 255, color.green / 255, color.blue / 255];
    }
    set id(id: number) {
        this._id = id;
    }
    get id(): number { return this._id; }
}