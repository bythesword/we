import { Vec3 } from "wgpu-matrix";
import { lightType, optionBaseLight, shadowMap, structBaselight } from "./baseLight";
import { BaseLight } from "./baseLight"; 



export interface optionSpotLight extends optionBaseLight {
    position: Vec3, 
    /**光的强度 ,wgsl，不受距离与立体角影响
     * 默认=1.0
    */
    intensity?: number,
    direction: Vec3,
    /**弧度制 */
    angle: number,
    /**弧度制 */
    angleOut?: number,//todo
}

export class SpotLight extends BaseLight {

    constructor(input: optionSpotLight) {
 
        super(input, lightType.spot);
    }

    generateShadowMap(device: GPUDevice): shadowMap {
        throw new Error("Method not implemented.");
    }




}