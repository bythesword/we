import * as coreConst from "../const/coreConst"
import {
    Vec3
} from "wgpu-matrix";
import { CamreaControl } from "../control/cameracCntrol";
import { ObjectControl } from "../control/objectControl";
// import { ObjectControl } from "../control/objectControl";
import { BaseLight, optionBaseLight, lightType } from "../light/baseLight";
import { BaseCamera } from "../camera/baseCamera";
import { RootOfGPU } from "../organization/root";

export interface actorLight {
    /** 相当于actor局部坐标 原点的xyz的position */
    position?: Vec3,
    light?: BaseLight,
    type: lightType,
    option?: optionBaseLight,
}

export type actorCamera = BaseCamera;


export type actorControl = CamreaControl | ObjectControl;

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
    //作废，20240827，pool只有附属的对象，无上级对象
    // /** stage(layer) */
    // stage?: coreConst.stageIndex,
    entities?: actorEntity[],
}

/**actor 基础初始化参数 */
export interface optionActor extends coreConst.optionUpdate {
    /**位置 */
    position?: Vec3,
    /**是否每帧更新，缺省=true（不设置=默认） */
    needUupdate?: boolean,
    parent?: any,
    name: string,
    enable?: boolean,
}
/**
 * 基础actor 
 * 
 * 场景中默认有一个Actor，
 */
export abstract class BaseActor extends RootOfGPU {

    /** option的初始化参数保存 */
    input!: optionActor;
    bindPool!: actorBindPool;
    name!: string;

    /**
     * 用户自定义 callback
     * scope:CameraActor
     * 
     * */
    // userCallBack: ((scope: any, input: any) => Promise<any>) | undefined;
    // userUpdate: ((scope: any, input: any) => Promise<any>) | undefined;
    // userInput: any;

    id!: number;
    enable: boolean;

    constructor(option: optionActor) {
        super();
        this.enable = true;
        if (option.enable != undefined) {
            this.enable = option.enable;
        }
        
        this.input = option;
        this.name = this.input.name;
    }
    // set stage(stage: coreConst.stageIndex) {
    //     this._stage = stage;
    // }

    // get stage() {
    //     return this._stage;
    // }

    abstract initBindPool(): any
    /**更新入口 */
    abstract update(deltaTime: number, startTime: number, lastTime: number): any

    abstract get position(): Vec3;
    abstract set position(position: Vec3);

    abstract setDefault(scope: any): any
    /**
     * 用户自定义 callback
     * scope:CameraActor
     * 
     * */
    // setUserUpdate(fn: (scope: any, input: any) => Promise<any>, input: any) {
    //     this.userUpdate = fn;
    //     this.userInput = input;
    // }

    setEnable(enable:boolean){
        this.enable=enable;
    }
}

