import { lightType, optionBaseLight, shadowMap } from "./baseLight";
import { BaseLight } from "./baseLight"; 
import { Vec3 } from "wgpu-matrix";

export interface optionDirectionalLight extends optionBaseLight {
    // color: coreConst.color3F,
    /**光的强度 ,wgsl，不受距离与立体角影响
     * 默认=1.0
    */
    intensity: number,
    direction: Vec3,
    distance?: 0,
}


export class DirectionalLight extends BaseLight {
    constructor(input: optionDirectionalLight) {
        super(input, lightType.directional);

    }

    generateShadowMap(device: GPUDevice): shadowMap {
        throw new Error("Method not implemented.");
    }


}