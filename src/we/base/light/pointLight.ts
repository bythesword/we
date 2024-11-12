import { Vec3 } from "wgpu-matrix";
import { optionBaseLight, shadowMap, structBaselight } from "./baseLight";
import { BaseLight } from "./baseLight";
import { color3F } from "../const/coreConst";



export interface optionPointLight extends optionBaseLight {
    position: Vec3,
    color: color3F,
    /**光的强度 ,wgsl，不受距离与立体角影响
     * 默认=1.0
    */
    intensity?: number,
    size?: number//todo
}
export interface shadowMapBox {
    map: GPUTexture,
    map1: GPUTexture,
    map2: GPUTexture,
    map3: GPUTexture,
    map4: GPUTexture,
    map5: GPUTexture,
}

export class PointLight extends BaseLight {
    generateShadowMap(device: GPUDevice): shadowMapBox {
        throw new Error("Method not implemented.");
    }




}