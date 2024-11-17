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
    angleOut?: number,
    shadow?: optionLightShadow,
    size?: number,
    visible?: boolean
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

/**
 * 光源的uniform的尺寸，ArrayBuffer的大小(byte) 
 */
export var lightStructSize = 96;

/**
 * 输出的uniform的buffer的类型，float32Array，大小(length)以float32(4个字节)计算=lightStructSize/4
 */
export type structBaselight = Float32Array;


//todo
/**
 * shadowmap 
 */
export interface shadowMap {
    map: GPUTexture,
}
export abstract class BaseLight {
    _id!: number;
    _kind!: number;
    /**
     * 
     */
    _buffer!: structBaselight;
    /**数字ID，scene中的队列的id */
    NID!: number;
    /**输入参数=input */
    parameters: optionBaseLight;
    constructor(input: optionBaseLight, kind: number = -1) {
        this.parameters = input;
        if (this.parameters.position == undefined) this.parameters.position = [0.0, 0.0, 0.0];
        if (this.parameters.color == undefined) this.parameters.color = { red: 1, green: 1, blue: 1 };
        if (this.parameters.distance == undefined) this.parameters.distance = 0.0;
        if (this.parameters.decay == undefined) this.parameters.decay = 1;
        if (this.parameters.visible == undefined) this.parameters.visible = true;
        if (this.parameters.intensity == undefined) this.parameters.intensity = 1.0;
        this._kind = kind;

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


    abstract generateShadowMap(device: GPUDevice): shadowMap | false;

    getKind(): number {
        return this._kind
    }
    getPosition(): Vec3 | false {
        if (this._kind == lightType.point || this._kind == lightType.spot) {
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
    getVisible(): boolean {
        return this.parameters.visible! as boolean;
    }

    /**只有方向光返回值，其他返回false */
    getDirection(): Vec3 | false {
        if (this._kind == lightType.point) {
            return false;
        }
        else {
            return this.parameters.direction!;
        }

    }
    getDecay() {
        return this.parameters.decay!;
    }
    /**只有spot有值，其他false */
    getAngle(): number[] | false {
        if (this._kind == lightType.spot) {
            return [this.parameters.angle!, this.parameters.angleOut!];
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
    getStructBuffer(): structBaselight {
        if (this._buffer == undefined) {
            this._buffer = this.updateStructBuffer();
        }
        return this._buffer;
    }
    //todo ：未完成，20241103
    updateStructBuffer(): structBaselight {
        // const ST_LightValues = new ArrayBuffer(size);
        let ST_LightValues = new ArrayBuffer(lightStructSize);
        const ST_LightViews = {
            position: new Float32Array(ST_LightValues, 0, 3),
            decay: new Float32Array(ST_LightValues, 12, 1),
            color: new Float32Array(ST_LightValues, 16, 3),
            intensity: new Float32Array(ST_LightValues, 28, 1),
            direction: new Float32Array(ST_LightValues, 32, 3),
            distance: new Float32Array(ST_LightValues, 44, 1),
            angle: new Float32Array(ST_LightValues, 48, 2),
            shadow: new Int32Array(ST_LightValues, 56, 1),
            visible: new Int32Array(ST_LightValues, 60, 1),
            size: new Float32Array(ST_LightValues, 64, 4),
            kind: new Int32Array(ST_LightValues, 80, 1),
        };

        ST_LightViews.kind[0] = this.getKind();

        let position = this.getPosition();
        if (position) {
            ST_LightViews.position[0] = position[0];
            ST_LightViews.position[1] = position[1];
            ST_LightViews.position[2] = position[2];
        }

        let color = this.getColor();
        ST_LightViews.color[0] = color.red;
        ST_LightViews.color[1] = color.green;
        ST_LightViews.color[2] = color.blue;

        ST_LightViews.intensity[0] = this.getIntensity();

        ST_LightViews.distance[0] = this.getDistance();

        let dir = this.getDirection();
        if (dir) {
            ST_LightViews.direction[0] = dir[0];
            ST_LightViews.direction[1] = dir[1];
            ST_LightViews.direction[2] = dir[2];
        }

        ST_LightViews.decay[0] = this.getDecay();

        let angle = this.getAngle();
        if (angle) {
            ST_LightViews.angle[0] = angle[0];
            ST_LightViews.angle[1] = angle[1];
        }

        ST_LightViews.shadow[0] = this.getShadowEnable() ? 1 : 0;
        ST_LightViews.visible[0] = this.getVisible() ? 1 : 0;

        return new Float32Array(ST_LightValues);
    }
}