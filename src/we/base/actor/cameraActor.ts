import {
    Mat4,
    vec3,
    Vec3
} from "wgpu-matrix";
import { BaseActor, actorCamera, actorControl, actorLight, optionActor } from "./baseActor";
import {
    CamreaControl,
    // optionCamreaControl
} from "../control/cameracCntrol";
import { BaseCamera } from "../camera/baseCamera";
import { OrthographicCamera, optionOrthProjection } from "../camera/orthographicCamera";
import { PerspectiveCamera, optionPerspProjection } from "../camera/perspectiveCamera";


export interface optionCameraActor extends optionActor {
    lookAt?: Vec3,
    camera: BaseCamera,
    control: CamreaControl,

    // /** 
    //  * 是否使用Camera的配置，比如 position
    //  * 默认为true
    //  */
    // globalPosition?: boolean,
}

export class CameraActor extends BaseActor {


    declare _option: optionCameraActor;
    _camera!: BaseCamera;
    _control!: CamreaControl;
    // _position!: Vec3;
    /**
     * Camera Actor 与 camera 的位置是否同步，默认=true，同步
     * 一般不会出现不同步的情况。
     * playActor 会不同
     */
    globalPosition!: boolean;
    constructor(option: optionCameraActor) {
        super(option);
        if (typeof option.lookAt == "undefined") {
            option.lookAt = vec3.create(0, 0, 0);
        }
        // if (typeof option.globalPosition == "undefined") {
        //     // option.position = vec3.create(0, 0, 0);
        //     this.position = option.camera.position;
        //     this.globalPosition = true;
        // } else {
        //     this.position = option.position!;
        //     this.globalPosition = false;
        // }
        this._camera = this._option.camera;
        this._control = this._option.control as CamreaControl;
        if (this.control.camera == undefined) {
            this.control.camera = this.camera;
        }

    }
    setDefault(scope: any) {
        scope.defaultCamera = this.camera;
    }
    initBindPool() {

    }
    async update(deltaTime: number) {
        this.control.update(deltaTime);
        if (this.userCallBack) {
            await this.userCallBack(this, this.userCallBackInput);
        }
    }

    getMVP() {
        return this.camera.MVP;
    }

    setDefaultCamera(scope: any) {
        scope.defaultCamera = this.camera;
    }
    setDefaultActor(scope: any) {
        scope.defaultActor = this;
        this.setDefaultCamera(scope);
    }
    get position(): Vec3 {
        return this.camera.position;
    }
    set position(position: Vec3) {
        this.camera.position = position;
    }
    get camera(): BaseCamera {
        return this._camera;
    }
    get control(): CamreaControl {
        return this._control;
    }

    set camera(camera: BaseCamera) {
        this._camera = camera;
    }
    set control(control: CamreaControl) {
        this._control = control;
    }

}