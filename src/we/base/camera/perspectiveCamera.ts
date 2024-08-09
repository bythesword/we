import {
    Mat4,
    Vec3,
    // Vec4,
    mat4,
    vec3
} from 'wgpu-matrix';


import { BaseCamera, projectionOptions } from "./baseCamera"

/** 透视相机 */
export interface optionPerspProjection extends projectionOptions {
    /**The camera angle from top to bottom (in radians). */
    fov: number,
    aspect: number,
    filmGauge?: number,
    filmOffset?: number,
    focus?: number,
    zoom?: number
}

export class PerspectiveCamera extends BaseCamera {
    declare option: optionPerspProjection
    constructor(option: optionPerspProjection) {
        super(option);
        this.option = option;
        this.projectionMatrix = mat4.perspective(option.fov, option.aspect, option.near, option.far);

        // const modelViewProjectionMatrix = mat4.create();
    }

    /**
     * 更新摄像机矩阵（三个，M，V，P）
     * @param position ：摄像机位置
     * @param direction ：摄像机方向
     * @param normalize ：摄像机方向是否归一化的
     * @returns  MVP的Mat4[]
     */
    update(position: Vec3, direction: Vec3, normalize = false): Mat4[] {
        this.position = position;
        if (normalize === false) {
            vec3.normalize(vec3.subtract(position, direction, this.back));
        }
        else {
            this.back = direction;
        }
        this.right = vec3.normalize(vec3.cross(this.upDirection, this.back));
        this.up = vec3.normalize(vec3.cross(this.back, this.right));

        // console.log("projectionMatrix=", this.projectionMatrix)

        this.MVP = [mat4.invert(this.modelMatrix), mat4.invert(this.viewMatrix), this.projectionMatrix];
        // let mv = mat4.multiply(this.viewMatrix, this.modelMatrix,);
        // // console.log("M*V=", mv, "M*V的invert=", mat4.invert(mv))

        // let mv1 = mat4.multiply(mat4.invert(this.viewMatrix), mat4.invert(this.modelMatrix),);
        // // console.log("M.invert * V.invert=", mv1)

        // let mvp = mat4.multiply(this.projectionMatrix, mat4.invert(mv));
        // // console.log(mat4.invert(mv), mvp)

        return this.MVP;
    }

    /**
     * 更新透视相机的投影矩阵
     * @param option 透视相机的初始化参数
     */
    updateProjectionMatrix(option: optionPerspProjection) {
        this.projectionMatrix = mat4.perspective(option.fov, option.aspect, option.near, option.far);
    }

}