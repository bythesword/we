import { Scene } from "../scene/scene";
import { lightType, optionBaseLight, shadowMap } from "./baseLight";
import { BaseLight } from "./baseLight";
import { mat4, Mat4, vec3, Vec3 } from "wgpu-matrix";

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
    /**
     * 更新以光源为视点的MVP
     * @param scene 
     * @returns Mat4[]
     */
    updateMVP(scene: Scene): Mat4[] {
        let matrix = new Float32Array([
            1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1,
        ]);

        if (this.shadow) {

            const box3 = scene.getBoundingBox();

            if (box3) {
                /** 第一行,X轴 */
                let right = new Float32Array(matrix.buffer, 4 * 0, 4);
                /** 第二行,Y轴 */
                let up = new Float32Array(matrix.buffer, 4 * 4, 4);
                /** 第三行,Z轴 */
                let back = new Float32Array(matrix.buffer, 4 * 8, 4);
                /** 第四行,位置 */
                let position = new Float32Array(matrix.buffer, 4 * 12, 4);

                vec3.copy(vec3.normalize(this.values.direction!), back);
                vec3.copy(vec3.normalize(vec3.cross(up, back)), right);
                vec3.copy(vec3.normalize(vec3.cross(back, right)), up);

                //todo,20250114,四至与box3的关系随方向光的vec3而变化，这里目前先简单的写成固定的box3
                const projectionMatrix = mat4.ortho(-2, 2, - 2, 2, -10, 10);
                // const projectionMatrix = mat4.ortho(box3.min[0] * 2, box3.max[0] * 2, box3.min[1] * 2, box3.max[1] * 2, box3.max[2] * 2 + this.epsilon, box3.min[2] * 2 - this.epsilon);
                // const projectionMatrix = mat4.ortho(box3.min[0], box3.max[0], box3.min[1], box3.max[1], -box3.min[2] + this.epsilon, -box3.max[2] - this.epsilon);

                // const projectionMatrix  = mat4.perspective((2 * Math.PI) / 5, 1,  this.epsilon, box3.max[2]);

                const MVP = mat4.multiply(projectionMatrix, mat4.invert(matrix));
                return [MVP];
            }
        }

        return [matrix];

    }
    constructor(input: optionDirectionalLight) {
        super(input, lightType.directional);

    }

    generateShadowMap(_device: GPUDevice): shadowMap {
        throw new Error("Method not implemented.");
    }


}