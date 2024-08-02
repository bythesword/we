import { vec3, Vec3 } from "wgpu-matrix";
// import { BaseCamera } from "../camera/baseCamera";
import { CamreaControl, optionCamreaControl } from "../control/cameracCntrol";
// import { ObjectControl } from "../control/objectControl";
import { BaseLight } from "../light/baseLight";
import { OrthographicCamera, orthProjectionOptions } from "../camera/orthographicCamera";
import { PerspectiveCamera, perspProjectionOptions } from "../camera/perspectiveCamera";


export interface optionActor {
    position: Vec3,
}

/**
 * 基础actor 
 * 
 * 场景中默认有一个Actor，
 */
export abstract class BaseActor {

    _setting!: optionActor;

    constructor(option: optionActor) {
        this._setting = option;
    }

    abstract update(): any
}



export interface actorLight {
    /** 相当于actor局部坐标 原点的xyz的position */
    position?: Vec3,
    light: BaseLight,
}

export interface actorCamera {
    position?: Vec3,
    camera: PerspectiveCamera | OrthographicCamera,
}

export interface optionCameraActor extends optionActor {
    position: Vec3,
    lookAt?: Vec3,
    camera: {
        type: "Perspective" | "Orthographic",
        option: perspProjectionOptions | orthProjectionOptions
    }
    light?: {
        type: any,
        option: any,
    },
    control: {
        type: "cameraControl",
        option: optionCamreaControl
    }
}

export class CameraActor extends BaseActor {
    camera?: actorCamera;
    control?: CamreaControl
    constructor(option: optionCameraActor) {
        super(option);
        if (typeof option.lookAt == "undefined") {
            option.lookAt = vec3.create(0, 0, 0);
        }
    }

    update() {
        throw new Error("Method not implemented.");
    }

}