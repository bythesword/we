import * as coreConst from "../const/coreConst";
import { mat4, Mat4, Vec3, } from "wgpu-matrix";
import { Root } from "../scene/root";
import { WeGenerateID } from "../math/baseFunction";


export enum lightType {
    directional,
    point,
    spot,
}
export interface optionBaseLight extends coreConst.optionUpdate {
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
    shadow?: boolean,
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
    // update?: (scope: any,  deltaTime: number,startTime:number,lastTime:number) => Promise<any>,
}

/**
 * 光源的uniform的尺寸，ArrayBuffer的大小(byte) 
 */
export var lightStructSize = 112;//20240104 change 96->112,add some about shadow 
export var lightStructSizeOfShadowMapMVP = 80;//20240104 change 96->112,add some about shadow 
export var lightStructSizeForRenderOfBindGroup = 80;//20240104 change 96->112,add some about shadow 

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



export abstract class BaseLight/* extends Root */ {
    _kind!: lightType;
    /**
     * 
     */
    _buffer!: structBaselight;
    /**数字ID，scene中的队列的id */
    NID!: number;
    /**输入参数=input */
    input: optionBaseLight;
    id: number;
    MVP: Mat4[];
    enable: boolean;
    shadow: boolean;
    visible: boolean;


    constructor(input: optionBaseLight, kind: lightType) {
        // super();
        this.enable = false;
        this.input = input;
        this.MVP = [];
        this.id = WeGenerateID();
        if (this.input.position == undefined) this.input.position = [0.0, 0.0, 0.0];
        if (this.input.color == undefined) this.input.color = { red: 1, green: 1, blue: 1 };
        if (this.input.distance == undefined) this.input.distance = 0.0;
        if (this.input.decay == undefined) this.input.decay = 1;
        if (this.input.visible == undefined) this.input.visible = true;
        if (this.input.intensity == undefined) this.input.intensity = 1.0;
        this._kind = kind;
        this.shadow = false;
        if (input.shadow) this.shadow = input.shadow;
        this.visible = false;
        if (input.visible) this.visible = input.visible;
        this._buffer = this.updateStructBuffer();
    }


    abstract generateShadowMap(device: GPUDevice): shadowMap | false;

    getKind(): number {
        return this._kind
    }
    getPosition(): Vec3 | false {
        if (this._kind == lightType.point || this._kind == lightType.spot) {
            return this.input.position!;
        }
        return false;
    }
    getColor() {
        return this.input.color as coreConst.color3F;
    }
    getIntensity(): number {
        return this.input.intensity!;
    }
    /***
     * 光源的作用距离
     * 默认=0，一直起作用
     */
    getDistance(): number {
        return this.input.distance!;
    }
    getShadowEnable(): boolean {
        if (this.input.shadow && this.input.shadow.castShadow)
            return this.input.shadow.castShadow;
        return false;
    }
    getVisible(): boolean {
        return this.input.visible! as boolean;
    }

    /**只有方向光返回值，其他返回false */
    getDirection(): Vec3 | false {
        if (this._kind == lightType.point) {
            return false;
        }
        else {
            return this.input.direction!;
        }

    }
    getDecay() {
        return this.input.decay!;
    }
    /**只有spot有值，其他false */
    getAngle(): number[] | false {
        if (this._kind == lightType.spot) {
            return [this.input.angle!, this.input.angleOut!];
        }
        return false;
    }

    color3UTo3F(color: coreConst.color3U) {
        return [color.red / 255, color.green / 255, color.blue / 255];
    }
    set ID(id: number) {
        this.id = id;
    }
    get ID(): number { return this.id; }
    async update(deltaTime: number, startTime: number, lastTime: number) {
        let scope = this;
        if (this.input.update) {
            await scope.input.update!(scope, deltaTime, startTime, lastTime);
        }
        this._buffer = scope.updateStructBuffer();
        this.MVP = this.updateMVP();
    }
    /**更新光源MVP */
    abstract updateMVP(): Mat4[];
    //     {
    //         let m4 = mat4.identity();

    // //mat4.identity()

    //         return m4;
    //     }
    getMVP(): Mat4[] {
        return this.MVP;
    }

    getStructBuffer(): structBaselight {
        if (this._buffer == undefined) {
            this._buffer = this.updateStructBuffer();
        }
        return this._buffer;
    }
    /** 更新当前light的 structBuffer
     * 
     * wgsl中的ST_Light
     */
    updateStructBuffer(): structBaselight {
        // const ST_LightValues = new ArrayBuffer(size);
        let ST_LightValues = new ArrayBuffer(lightStructSize);
        // const ST_LightViews = {
        //     position: new Float32Array(ST_LightValues, 0, 3),
        //     decay: new Float32Array(ST_LightValues, 12, 1),
        //     color: new Float32Array(ST_LightValues, 16, 3),
        //     intensity: new Float32Array(ST_LightValues, 28, 1),
        //     direction: new Float32Array(ST_LightValues, 32, 3),
        //     distance: new Float32Array(ST_LightValues, 44, 1),
        //     angle: new Float32Array(ST_LightValues, 48, 2),
        //     shadow: new Int32Array(ST_LightValues, 56, 1),
        //     visible: new Int32Array(ST_LightValues, 60, 1),
        //     size: new Float32Array(ST_LightValues, 64, 4),
        //     kind: new Int32Array(ST_LightValues, 80, 1),
        // };
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
            id: new Uint32Array(ST_LightValues, 84, 1),
            shadow_map_type: new Uint32Array(ST_LightValues, 88, 1),//1=one depth,6=cube,0=none
            shadow_map_array_index: new Int32Array(ST_LightValues, 92, 1),//-1 = 没有shadowmap,other number=开始的位置，从0开始
            shadow_map_array_lenght: new Uint32Array(ST_LightValues, 96, 1),//1 or 6
            shadow_map_enable: new Int32Array(ST_LightValues, 100, 1),//depth texture array 会在light add之后的下一帧生效，这个是标志位。因为GPUTexture会重建
        };

        //种类
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

        //todo
        /*
        size
        id
        shadowmap
        */

        return new Float32Array(ST_LightValues);
    }
    setShdowMapValues(index: number, count: number, kind: number) {
        let ST_LightValues = this._buffer.buffer;
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
            id: new Uint32Array(ST_LightValues, 84, 1),
            shadow_map_type: new Uint32Array(ST_LightValues, 88, 1),//1=one depth,6=cube,0=none
            shadow_map_array_index: new Int32Array(ST_LightValues, 92, 1),//-1 = 没有shadowmap,other number=开始的位置，从0开始
            shadow_map_array_lenght: new Uint32Array(ST_LightValues, 96, 1),//1 or 6
            shadow_map_enable: new Int32Array(ST_LightValues, 100, 1),//depth texture array 会在light add之后的下一帧生效，这个是标志位。因为GPUTexture会重建
        };
        ST_LightViews.shadow_map_type[0] = kind;
        ST_LightViews.shadow_map_array_index[0] = index;
        ST_LightViews.shadow_map_array_lenght[0] = count;
        ST_LightViews.shadow_map_enable[0] = 1;//todo ,20250105，如果是动态管理shadowmap texture大小，这个需要适配
    }
    
}