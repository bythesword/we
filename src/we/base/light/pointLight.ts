import { optionBaseLight, shadowMap, structBaselight } from "./baseLight";
import { BaseLight } from "./baseLight";


export interface optionPointLight extends optionBaseLight {

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
    getStructBuffer(): structBaselight {
        throw new Error("Method not implemented.");
    }



}