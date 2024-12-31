import {
    mat4,
} from 'wgpu-matrix';


import { BaseCamera, cameraRayValues, projectionOptions } from "./baseCamera";

export interface optionOrthProjection extends projectionOptions {
    left: number,
    right: number,
    top: number,
    bottom: number,

}

export class OrthographicCamera extends BaseCamera {
 
    getCameraRays(): cameraRayValues {
        throw new Error('Method not implemented.');
    }
    updateProjectionMatrix(option: optionOrthProjection) {
        this.projectionMatrix = mat4.ortho(option.left, option.right, option.bottom, option.top, option.near, option.far);
    }


}