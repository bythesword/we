import { Mat4 } from "wgpu-matrix";
import { BaseLight, lightStructSizeOfShadowMapMVP } from "./baseLight";


export interface optionShadowMap {
    lights: BaseLight[],

}
/**对应system.wgsl中的结构 ST_shadowMapMatrix */
export interface light_shadowMapMatrix {
    light_id: number,
    matrix_count: number,
    matrix_self_index: number,
    MVP: Mat4,
}
/**默认的最小最大值
 * 
 * todo：根据显卡实际情况，可以申请扩大
 */
export var maxTextureArrayLayers = 256;

/**每个light的MVP和texture，一一对应 */
export interface light_DepthTextureAndMVP {
    matrix: light_shadowMapMatrix,
    depthTexture: GPUTexture,
}

/**
 * 
 */
export type lights_DMVP = light_DepthTextureAndMVP[];
export class ShadowMap {
    lights_texture_depth_2d_array!: GPUTexture;
    

}