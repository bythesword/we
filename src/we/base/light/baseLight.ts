import * as coreConst from "../const/coreConst";
import { mat4, Mat4, Vec3, } from "wgpu-matrix";
import { RootOfOrganization } from "../organization/root";
import { WeGenerateID, WeGenerateUUID } from "../math/baseFunction";
import { Scene } from "../scene/scene";
import { optionUpdate } from "../const/coreConst";


export enum lightType {
    direction,
    point,
    spot,
    ambient,
    area
}
export interface optionBaseLight extends optionUpdate {
    /**
     * 位置
     * position
     */
    position?: Vec3,

    /**
     * 颜色
     * color
     */
    color?: coreConst.color3F,

    /**
     * 光的强度 ， 默认=1.0
     * light intensity, default=1.0
    */
    intensity?: number,

    /**光的可视距离 
     * 0.0=无限远
    */
    distance?: number,

    /**
     * 方向: 方向光源和聚光灯需要
     * direction: direction light and spot light need
     */
    direction?: Vec3,

    /**
     * decay
     * 衰减因子，待定
     */
    decay?: number,
    /**
     * 角度(内切): 聚光灯需要
     * angle(in): spot light need
     */
    angle?: number,

    /**
     * 角度外切: 聚光灯需要
     * angleOut: spot light need
     */
    angleOut?: number,

    /**
     * 阴影
     * shadow
     */
    shadow?: boolean,
    /**
     * 大小
     * size
     */
    size?: number,

    /**
     * 可见性,目前看没有意义，保留
     * 
     * visibility,  
     */
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
// export var lightStructSizeOfShadowMapMVP = 80;//20240104 change 96->112,add some about shadow` 
// export var lightStructSizeForRenderOfBindGroup = 80;//20240104 change 96->112,add some about ` 

/**
 * 输出的uniform的buffer的类型，float32Array，大小(length)以float32(4个字节)计算=lightStructSize/4
 */
export type structBaselight = Float32Array;




/**
 * lights uniform's shadowmap in  struct of St_Light(in shader)
 * 光源uniform中的阴影的信息，在shader中，在St_Light结构体
 */
interface optionBaseShadowMapOfST_Light {
    shadow_map_type: number,  //1=one depth,6=cube,0=none
    shadow_map_array_index: number,   //-1 = 没有shadowmap,other number=开始的位置，从0开始
    shadow_map_array_lenght: number,  //1 or 6
    shadow_map_enable: number,  //depth texture array 会在light add之后的下一帧生效，这个是标志位
}

export abstract class BaseLight extends RootOfOrganization {
    /**
     * type of lights
     * 光源的类型
     */
    _kind!: lightType;
    /**
     * light's uniform buffer
     * 光源的uniform的buffer
     */
    _buffer!: structBaselight;
    /**
     * light's input values
     * 输入参数=input 
     * */
    inputValues: optionBaseLight;

    /**
     * light's enable
     * 是否启用 
     * */

    /**
     * light's visible
     * 是否可见，未使用(当光源被移除时，会被设置为false)，即_parent==undefined
     * */
    visible: boolean;
    enable: boolean;
    /////////////////////////////////////////////////
    //about  shadow map 
    /**
     * matrix of MVP ,for shadow map .point light has 6 MVP,other have one MVP,so use array .
     * MVP 矩阵，shadowmap使用 。点光源有6个MVP，其他的有一个MVP，所以使用数组
     * */
    MVP: Mat4[];

    /**
     * light's shadow enable
     * 是否启用阴影
     * */
    shadow: boolean;

    /**
     * light's epsilon for matirx MVP
     * MVP矩阵的偏移量的大小
     * */
    epsilon = 0.1;

    /**
     * light's shadow map attribute for uniform
     * 光源的阴影的属性，在uniform中
     * */
    shadowMapOfSt_Light: optionBaseShadowMapOfST_Light = {
        /**
         * 阴影的类型
         * shadow map type
         */
        shadow_map_type: 0,
        /**
         * 定位当前光源在shadowmap的纹理中的位置
         * the location of light in shadowMapTexture
         * 
         * 阴影的数组的索引，在LightsManagement中的shadowMapTexture：GPUTexture数组的索引
         * shadow map array index in LightsManagement's shadowMapTexture:GPUTexture array index
         */
        shadow_map_array_index: -1,
        /**
         * 阴影的数组的长度：1 或 6
         * shadow map array length:1 or 6
         */
        shadow_map_array_lenght: 0,
        /**
         * 阴影的启用，这个定义重复了，与类中的shadow，保留
         * shadow map enable
         */
        shadow_map_enable: 0,
    }

    constructor(input: optionBaseLight, kind: lightType) {
        super();
        this.ID = WeGenerateID();

        this.UUID = WeGenerateUUID();
        this.enable = false;
        this.inputValues = input;
        this.MVP = [];
        if (this.inputValues.position == undefined) this.inputValues.position = [0.0, 0.0, 0.0];
        if (this.inputValues.color == undefined) this.inputValues.color = { red: 1, green: 1, blue: 1 };
        if (this.inputValues.distance == undefined) this.inputValues.distance = 0.0;
        if (this.inputValues.decay == undefined) this.inputValues.decay = 1;
        if (this.inputValues.visible == undefined) this.inputValues.visible = true;
        if (this.inputValues.intensity == undefined) this.inputValues.intensity = 1.0;
        this._kind = kind;
        this.shadow = false;
        if (input.shadow) this.shadow = input.shadow;
        this.visible = false;
        if (input.visible) this.visible = input.visible;
        this._buffer = this.updateStructBuffer();
    }


    // abstract generateShadowMap(device: GPUDevice): shadowMap | false;

    getKind(): number {
        return this._kind
    }
    getPosition(): Vec3 | false {
        if (this._kind == lightType.point || this._kind == lightType.spot) {
            return this.inputValues.position!;
        }
        return false;
    }
    getColor() {
        return this.inputValues.color as coreConst.color3F;
    }
    getIntensity(): number {
        return this.inputValues.intensity!;
    }
    /***
     * 光源的作用距离
     * 默认=0，一直起作用
     */
    getDistance(): number {
        return this.inputValues.distance!;
    }
    getShadowEnable(): boolean {
        if (this.inputValues.shadow && this.inputValues.shadow)
            return this.inputValues.shadow;
        return false;
    }
    getVisible(): boolean {
        return this.inputValues.visible! as boolean;
    }

    /**只有方向光返回值，其他返回false */
    getDirection(): Vec3 | false {
        if (this._kind == lightType.point) {
            return false;
        }
        else {
            return this.inputValues.direction!;
        }
    }

    getDecay() {
        return this.inputValues.decay!;
    }
    /**
     * only for spot    
     * 弧度制 :只有spot有值，其他false 
     * 
     * */
    getAngle(): number[] | false {
        if (this._kind == lightType.spot) {
            return [this.inputValues.angle!, this.inputValues.angleOut!];
        }
        return false;
    }


    async update(scene: Scene, deltaTime: number, startTime: number, lastTime: number) {
        let scope = this;
        if (this.inputValues.update) {
            scope.inputValues.update!(scope, deltaTime, startTime, lastTime);
        }
        this._buffer = scope.updateStructBuffer();
        this.MVP = this.updateMVP(scene);
    }
    /**更新光源MVP */
    abstract updateMVP(scene: Scene): Mat4[];

    /**
     * 获取光源的MVP矩阵数组。
     * get light’s MVP array
     * @returns Mat4[]
     */
    getMVP(): Mat4[] {
        return this.MVP;
    }
    /**
     * 获取光源的MVP数组的index的MVP。
     * get light’s MVP array[index]
     * @param index 索引
     * @returns Mat4
     */
    getMVPByIndex(index: number): Mat4 {
        if (this.MVP[index])
            return this.MVP[index];
        else {
            // console.error("返回单位矩阵,未找到index=", index, "的MVP", this);
            return mat4.identity();
        }
    }
    /**
     * 获取光源的structBuffer。
     * get light’s structBuffer
     * @returns structBaselight
     */
    getStructBuffer(): structBaselight {
        if (this._buffer == undefined) {
            this._buffer = this.updateStructBuffer();
        }
        return this._buffer;
    }

    /**
     * 更新光源的structBuffer(每个光源的uniform)。
     * update light’s structBuffer(per light's uniform )
     * @returns structBaselight
     */
    updateStructBuffer(): structBaselight {
        let ST_LightValues = new ArrayBuffer(lightStructSize);
        const ST_LightViews = {
            position: new Float32Array(ST_LightValues, 0, 3),//这里position是light的worldposition，即 position * worldMatrix ,需要每帧更新（静态还好，一致。在其他entity的children中，就需要左乘wolrdmatrix）
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


        ST_LightViews.visible[0] = this.getVisible() ? 1 : 0;
        //对应的shadowmap的信息
        ST_LightViews.shadow[0] = this.getShadowEnable() ? 1 : 0;
        ST_LightViews.shadow_map_type[0] = this.shadowMapOfSt_Light.shadow_map_type;
        ST_LightViews.shadow_map_array_index[0] = this.shadowMapOfSt_Light.shadow_map_array_index;
        ST_LightViews.shadow_map_array_lenght[0] = this.shadowMapOfSt_Light.shadow_map_array_lenght;
        ST_LightViews.shadow_map_enable[0] = this.shadowMapOfSt_Light.shadow_map_enable;
        return new Float32Array(ST_LightValues);
    }

    /**
     * 设置光源的shadowmap信息。
     * set light’s shadowmap info
     * @param index 索引
     * @param count 数量
     * @param kind 类型
     */
    setShdowMapValues(index: number, count: number, kind: number) {
        let ST_LightValues = this._buffer.buffer;
        const ST_LightViews = {
            position: new Float32Array(ST_LightValues, 0, 3),//这里position是light的worldposition，即 position * worldMatrix ,需要每帧更新（静态还好，一致。在其他entity的children中，就需要左乘wolrdmatrix）
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
        ST_LightViews.shadow_map_enable[0] = 1;//todo ,20250105，如果是动态管理shadowmap texture大小，这个需要适配，目前未使用

        this.shadowMapOfSt_Light = {
            shadow_map_type: kind,
            shadow_map_array_index: index,
            shadow_map_array_lenght: count,
            shadow_map_enable: 1,
        };
    }

}