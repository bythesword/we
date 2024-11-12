import { Vec3 } from "wgpu-matrix";
import { optionBaseLight, shadowMap, structBaselight } from "./baseLight";
import { BaseLight } from "./baseLight";
import { color3F } from "../const/coreConst";
// import * as coreConst from "../const/coreConst";



export interface optionSpotLight extends optionBaseLight {
    position: Vec3,
    color: color3F,
    /**光的强度 ,wgsl，不受距离与立体角影响
     * 默认=1.0
    */
    intensity?: number,
    direction: Vec3,
    // distance: 0,
    angle: number,
    angleOut: number,//todo
}

export class SpotLight extends BaseLight {

    constructor(input: optionSpotLight) {
        super(input);
    }

    generateShadowMap(device: GPUDevice): shadowMap {
        throw new Error("Method not implemented.");
    }




}