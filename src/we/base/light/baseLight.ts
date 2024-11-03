import * as coreConst from "../const/coreConst";
import {
    //vec3,
    Vec3, vec3
} from "wgpu-matrix";

// export interface optionBaseLightSize{

// }
export interface optionLightShadow {
    /**
     * 是否产生阴影
     * 默认=false
     */
    castShadow?: boolean,
    mapSize?: {
        width: number,
        height: number
    }
}
export enum lightType {
    directional,
    point,
    spot,
}
export interface optionBaseLight {
    position?: Vec3,
    color?: coreConst.color3F,
    /**光的强度 
     * 默认=1.0
    */
    intensity?: number,
    /**光的可视距离 
     * 0.0=无限远
    */
    distance?: number,
    direction?: Vec3,
    /**
     * 衰减因子，待定
     */
    decay?: number,
    angle?: number,
    shadow?: optionLightShadow,
    size?: number,
    enable?: boolean
    /**
     * 光源与stage的关系
     * 默认（undefined）：照亮所有stage
     * 有数组：["World"] || ["Room"],则代表仅在当前的一个或几个stage中有效
     * 
     * 若投射阴影，也仅在相关的stage中进行，比如室内不考虑室外
     */
    stage?: coreConst.stageName,
    update?: (scope: any, deltaTime: number) => Promise<any>,
}


export var lightStructSize = 96;
export type structBaselight = Float32Array;

export interface shadowMap {
    map: GPUTexture,
}
export abstract class BaseLight {
    _id!: number;
    _kind!: number;
    _buffer!: structBaselight;

    parameters: optionBaseLight;
    constructor(input: optionBaseLight) {
        this.parameters = input;
        if (this.parameters.position == undefined) this.parameters.position = [0.0, 0.0, 0.0];
        if (this.parameters.color == undefined) this.parameters.color = { red: 1, green: 1, blue: 1 };
        if (this.parameters.distance == undefined) this.parameters.distance = 0.0;
        if (this.parameters.decay == undefined) this.parameters.decay = 1;
        if (this.parameters.enable == undefined) this.parameters.enable = true;
        if (this.parameters.intensity == undefined) this.parameters.intensity = 1.0;


        if (this.parameters.shadow != undefined)
            if (this.parameters.shadow.castShadow === true)
                if (this.parameters.shadow.mapSize == undefined) {
                    this.parameters.shadow.mapSize = {
                        width: coreConst.shadowMapSize,
                        height: coreConst.shadowMapSize,
                    }
                }
        this._buffer = this.updateStructBuffer();
    }

    getStructBuffer(): structBaselight {
        if (this._buffer == undefined) {
            this._buffer = this.updateStructBuffer();
        }
        return this._buffer;
    }
    //todo ：未完成，20241103
    updateStructBuffer(): structBaselight {
        let buffer = new Float32Array(lightStructSize);
        return buffer;
    }
    abstract generateShadowMap(device: GPUDevice): shadowMap | false;

    getKind(): number {
        return this._kind
    }
    getPosition(): Vec3 | false {
        if (this._kind != 1) {
            return this.parameters.position!;
        }
        return false;
    }
    getColor() {
        return this.parameters.color as coreConst.color3F;
    }
    getIntensity(): number {
        return this.parameters.intensity!;
    }
    /***
     * 光源的作用距离
     * 默认=0，一直起作用
     */
    getDistance(): number {
        return this.parameters.distance!;
    }
    getShadowEnable(): boolean {
        if (this.parameters.shadow && this.parameters.shadow.castShadow)
            return this.parameters.shadow.castShadow;
        return false;
    }
    getEnable(): boolean {
        return this.parameters.enable!;
    }

    /**只有方向光返回值，其他返回false */
    getDirection(): Vec3 | false {
        if (this._kind == lightType.directional) {
            return this.parameters.direction!;
        }
        return false;
    }
    getDecay() {
        return this.parameters.decay!;
    }
    /**只有spot有值，其他false */
    getAngle(): number | false {
        if (this._kind == lightType.spot) {
            return this.parameters.angle!;
        }
        return false;
    }

    color3UTo3F(color: coreConst.color3U) {
        return [color.red / 255, color.green / 255, color.blue / 255];
    }
    set id(id: number) {
        this._id = id;
    }
    get id(): number { return this._id; }
    async update(deltaTime: number) {
        let scope = this;
        if (this.parameters.update) {
            await scope.parameters.update!(scope, deltaTime);
            scope.updateStructBuffer();
        }
    }
}