import { Scene } from "../scene/scene";
import { lightType, optionBaseLight, shadowMap } from "./baseLight";
import { BaseLight } from "./baseLight";
import { mat4, Mat4, vec3, Vec3, vec4 } from "wgpu-matrix";

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

            // const box3 = scene.getBoundingBox();//
            const spshere = scene.getBoundingSphere();

            if (spshere) {
                /** 第一行,X轴 */
                let right = new Float32Array(matrix.buffer, 4 * 0, 4);
                /** 第二行,Y轴 */
                let up = new Float32Array(matrix.buffer, 4 * 4, 4);
                /** 第三行,Z轴 */
                let back = new Float32Array(matrix.buffer, 4 * 8, 4);
                /** 第四行,位置 */
                let position = new Float32Array(matrix.buffer, 4 * 12, 4);

                let dir = vec3.normalize(vec3.sub(vec3.create(0, 0, 0), this.inputValues.direction!));
                if (this.inputValues.direction![0] == 0 && this.inputValues.direction![1] == 1 && this.inputValues.direction![2] == 0) {
                    vec3.copy(this.inputValues.direction!, back);
                    vec3.copy(vec3.create(1, 0, 0), right);
                    vec3.copy(vec3.create(0, 0, 1), up);
                }
                else {
                    // vec3.copy(vec3.normalize(dir), back);
                    vec3.copy(vec3.normalize(this.inputValues.direction!), back);
                    vec3.copy(vec3.normalize(vec3.cross(up, back)), right);
                    vec3.copy(vec3.normalize(vec3.cross(back, right)), up);
                }

                //todo,202501024,暂时使用sphere代替摄像机的视锥体可视范围
                let p0 = vec4.transformMat4(vec4.create(spshere.position[0], spshere.position[1], spshere.position[2], 1), mat4.invert(matrix));



                //todo,20250124,四至这里目前先简单的写成固定的sphere
                //todo，后期改为视锥体中所有boundingbox的聚会的boudingbox或boudingsphere
                const projectionMatrix = mat4.ortho(
                    p0[0] - spshere.radius - this.epsilon,
                    p0[0] + spshere.radius + this.epsilon,

                    p0[1] - spshere.radius - this.epsilon,
                    p0[1] + spshere.radius + this.epsilon,

                    p0[2] - spshere.radius - this.epsilon,
                    p0[2] + spshere.radius + this.epsilon
                );


                //todo,20250114,四至与box3的关系随方向光的vec3而变化，这里目前先简单的写成固定的box3
                //  const projectionMatrix = mat4.ortho(-10, 10, -10, 10, -10, 10);//ok
                const MVP = mat4.multiply(projectionMatrix, mat4.invert(matrix));
                return [MVP];
            }
        }

        return [matrix];

    }
    constructor(input: optionDirectionalLight) {
        super(input, lightType.direction);

    }

    generateShadowMap(_device: GPUDevice): shadowMap {
        throw new Error("Method not implemented.");
    }


}