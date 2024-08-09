import * as coreConst from "../const/coreConst"
import {
    //vec3, 
    Vec3
} from "wgpu-matrix";
// import { BaseCamera } from "../camera/baseCamera";
import { CamreaControl, optionCamreaControl } from "../control/cameracCntrol";
import { ObjectControl } from "../control/objectControl";
// import { ObjectControl } from "../control/objectControl";
import { BaseLight, optionBaseLight, typeLight } from "../light/baseLight";
import { OrthographicCamera, optionOrthProjection } from "../camera/orthographicCamera";
import { PerspectiveCamera, optionPerspProjection } from "../camera/perspectiveCamera";
import { BaseCamera } from "../camera/baseCamera";

export interface actorLight {
    /** 相当于actor局部坐标 原点的xyz的position */
    position?: Vec3,
    light?: BaseLight,
    type: typeLight,
    option?: optionBaseLight,
}

export type actorCamera = BaseCamera;
// export interface actorCamera {
//     position: Vec3,
//     camera: BaseCamera,
//     type?: "Perspective" | "Orthographic",
//     option?: optionPerspProjection | optionOrthProjection
// }

export type actorControl = CamreaControl | ObjectControl;
// export interface actorControl {
//     type: "cameraControl" | "ObjectControl",
//     option: optionCamreaControl,
//     control: ObjectControl | CamreaControl
// }
/** todo */
export interface actorAnimation { }

/** todo */
export interface actorAudio { }

/** todo */
export interface actorEntity { }

/** 绑定对象到Actor */
export interface actorBindPool {
    control?: actorControl,
    camera?: actorCamera[],
    light?: actorLight[],
    animtion?: actorAnimation[],
    audio?: actorAudio[],
    /** stage(layer) */
    stage?: coreConst.stageType,
    entities?: actorEntity,
}

/**actor 基础初始化参数 */
export interface optionActor {
    /**位置 */
    position?: Vec3,
    /**是否每帧更新，缺省=true（不设置=默认） */
    update?: boolean,
    parent?: any,
    name: string,
    /** */
    stage?: coreConst.stageType,
    // scene: any,

}
/**
 * 基础actor 
 * 
 * 场景中默认有一个Actor，
 */
export abstract class BaseActor {

    /** option的初始化参数保存 */
    _option!: optionActor;
    bindPool!: actorBindPool;
    // scene: any;
    name!: string;
    /**stage ,默认= coreConst.defaultStage*/
    _stage!: coreConst.stageType;
    /**
     * 用户自定义 callback
     * scope:CameraActor
     * 
     * */
    userCallBack: ((scope: any, input: any) => Promise<any>) | undefined;
    userCallBackInput: any;


    constructor(option: optionActor) {
        this._option = option;
        this.name = this._option.name;
        // this.scene = option.scene;
        if (option.stage) {
            this.stage = option.stage;
        }
        else {
            this.stage = coreConst.defaultStage;
        }

    }
    set stage(stage: coreConst.stageType) {
        this._stage = stage;
    }

    get stage() {
        return this._stage;
    }

    abstract initBindPool(): any
    /**更新入口 */
    abstract update(deltaTime: number): any

    abstract get position(): Vec3;
    abstract set position(position: Vec3);

    abstract setDefault(scope: any): any
    /**
     * 用户自定义 callback
     * scope:CameraActor
     * 
     * */
    setUserUpdate(fn: (scope: any, input: any) => Promise<any>, input: any) {
        this.userCallBack = fn;
        this.userCallBackInput = input;
    }
}

