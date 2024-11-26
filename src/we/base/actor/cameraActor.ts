import { 
    vec3,
    Vec3
} from "wgpu-matrix";
import { BaseActor,  optionActor } from "./baseActor";
import {
    CamreaControl,
    // optionCamreaControl
} from "../control/cameracCntrol";
import { BaseCamera } from "../camera/baseCamera"; 

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
 

    declare input: optionCameraActor;
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
        this._camera = this.input.camera;
        this._control = this.input.control as CamreaControl;
        if (this.control.camera == undefined) {
            this.control.camera = this.camera;
        }

    } 

    setDefault(scope: any) {
        scope.defaultCamera = this.camera;
    }
    initBindPool() {

    }
    async update(deltaTime: number,startTime:number,lastTime:number) {
        this.control.update(deltaTime,startTime,lastTime);
        if (this.input.update) {
            this.input.update(this,deltaTime,startTime,lastTime);
        }
    }

    getMVP() {
        return this.camera.getMVP();
        // return this.camera.MVP;
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