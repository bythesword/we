import {
    Mat4,
    Vec3,
    Vec4,
    // mat4, 
    // vec3
} from 'wgpu-matrix';


import { BaseCamera, projectionOptions } from "./baseCamera";

export interface orthProjectionOptions extends projectionOptions {
    left?: number,
    right?: number,
    top?: number,
    bottom?: number,

}

export class OrthographicCamera extends BaseCamera {
    constructor(option:orthProjectionOptions) {
        super(option);
    }

    update(position: Vec3, direction: Vec3): Mat4[] {
        throw new Error('Method not implemented.');
    }
    getMVP(): Mat4[] {
        throw new Error('Method not implemented.');
    }
    updateProjectionMatrix(option: projectionOptions): Mat4 {
        throw new Error('Method not implemented.');
    }

}