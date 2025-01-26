import { Mat4, Vec3 } from "wgpu-matrix";
import { lightType, optionBaseLight, shadowMap } from "./baseLight";
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

    generateShadowMap(_device: GPUDevice): shadowMap {
        throw new Error("Method not implemented.");
    }

    updateMVP(): Mat4[] {
        // throw new Error("Method not implemented.");
        //1、cameras的boundingSphere
        //2、light的boundingSphere
        //3、取两个boundingSphere的交集
        //4、取交集的boundingSphere的中心点
        //5、取交集的boundingSphere的半径
        //6、取中心点+半径为光源的位置
        //7、取中心点为光源的方向
        //8、取半径为光源的范围
    }


}