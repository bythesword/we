import { vec3, Vec3 } from "wgpu-matrix";
import { BaseActor, optionActor } from "./baseActor";
import {
    CamreaControl,
    // optionCamreaControl
} from "../control/cameracCntrol";
import { BaseCamera } from "../camera/baseCamera";
import { stageName } from "../const/coreConst";
import { WeGenerateID } from "../math/baseFunction";


export interface optionCameraActor extends optionActor {
    lookAt?: Vec3,
    camera: BaseCamera,
    control?: CamreaControl,
    stages?: string[],
}

export class CameraActor extends BaseActor {


    declare input: optionCameraActor;
    _camera: BaseCamera;
    _control: CamreaControl | undefined;
    stagesName: stageName;

    globalPosition!: boolean;
    constructor(option: optionCameraActor) {
        super(option);
        this.id = WeGenerateID();
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

        // this.cameras = [];
        // if (Array.isArray(option.camera)) {
        //     this.cameras = option.camera;
        //     this._camera = this.cameras[0];
        // }
        // else
        // {
        this._camera = this.input.camera as BaseCamera;
        // this.cameras.push(this._camera);
        // }
        if (option.control) {
            this._control = this.input.control as CamreaControl;
            if (this._control.camera == undefined) {
                this._control.camera = this.camera;
            }
        }
        if (option.stages) {
            this.stagesName = option.stages;
        }
        else {
            this.stagesName = {};
        }

    }
    initGBuffers() {

    }

    setDefault(scope: any) {
        scope.defaultActor = this;
        scope.inputControl = this._control;
        scope.setDefaultCamera(this.camera);//scene
    }
    initBindPool() {

    }
    async update(deltaTime: number, startTime: number, lastTime: number) {
        if (this._control) {
            this._control.update(deltaTime, startTime, lastTime);
            if (this.input.update) {
                this.input.update(this, deltaTime, startTime, lastTime);
            }
        }
    }

    getMVP() {
        return this.camera.getMVP();
        // return this.camera.MVP;
    }

    // setDefaultCamera(id: number) {
    // scope.setDefaultCamera(this.camera);//scene
    // }
    // setDefaultActor(scope: any) {
    //     scope.defaultActor = this;
    //     scope.inputControl = this._control;
    // }
    get position(): Vec3 {
        return this.camera.position;
    }
    set position(position: Vec3) {
        this.camera.position = position;
    }
    get camera(): BaseCamera {
        return this._camera;
    }
    get control(): CamreaControl | undefined {
        return this._control;
    }

    set camera(camera: BaseCamera) {
        if (this._control)
            this._control.camera = camera;
        this._camera = camera;
    }
    set control(control: CamreaControl) {
        this._control = control;
    }

}