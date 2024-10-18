import { optionBaseLight, shadowMap, structBaselight } from "./baseLight";
import { BaseLight } from "./baseLight";


export interface optionPointLight extends optionBaseLight {

}


export class DirectionalLight extends BaseLight {
    generateShadowMap(device: GPUDevice): shadowMap {
        throw new Error("Method not implemented.");
    }
    getStructBuffer(): structBaselight {
        throw new Error("Method not implemented.");
    }

}