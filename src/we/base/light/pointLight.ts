import { Mat4, Vec3 } from "wgpu-matrix";
import { lightType, optionBaseLight,  } from "./baseLight";
import { BaseLight } from "./baseLight"; 


export interface optionPointLight extends optionBaseLight {
    /**位置 */
    position: Vec3,

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
    constructor(input: optionPointLight) {
        super(input, lightType.point);
    }

    generateShadowMap(_device: GPUDevice): shadowMapBox {
        throw new Error("Method not implemented.");
    }
    updateMVP(): Mat4[] {
        // throw new Error("Method not implemented.");
    }




}