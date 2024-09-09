import { mat4, Mat4, vec3, Vec3 } from "wgpu-matrix";
import { BaseMaterial } from "../material/baseMaterial";
import * as coreConst from "../const/coreConst"
import {
    unifromGroup,
    uniformEntries,
    uniformBufferPart,
    uniformBuffer,
    storageBufferPart
} from "../command/baseCommand";
import { DrawCommand } from "../command/DrawCommand";
import { commmandType } from "../stage/baseStage";
import { cameraRayValues } from "../camera/baseCamera";
export type positionArray = Float32Array | Float64Array | Uint8Array | Uint16Array | Uint32Array;
export interface geometryBufferOfEntity {
    /**索引buffer
     * 非必须 
     * 索引模型应该有2的256次方的大小限制，todo(webGPU 是否相同，20240813)
     */
    index?: Uint32Array,
    /** 
     * 可以是一个，也可以是多个属性合一的buffer
           三角形：多属性合一的概念示例
                position: positionArray,float32x3          
                normal?: Float32Array,float32x3
                uv?: Float32Array,     float32x2
                color?: Uint8Array,    Uint8x4
            线段：
                position
                color?
                uv?
            点：
                position
                color?
     */
    position: positionArray,
    /** 单个数据宽度 */
    arrayStride: number,
    /**
     * 多种primitive 模式
     *  数据匹配性与正确性由具体调用负责保障
     */
    type: "triangles" | "lines" | "points",
}


export type entityID = number;


/**
 * 顶点和材质一对一
 */
export interface entityContentOfVertexAndMaterial {
    vertexes: geometryBufferOfEntity,
    material: BaseMaterial,
}
/** entity的顶点与材质的group */
export interface entityContentGroup {
    [name: string]: entityContentOfVertexAndMaterial
}

/**
 * LOD定义
 * 默认 ：0
 */
export interface LOD {
    /**
     * interface索引，对应于this._VM.(通过name进行索引)
    //  * 简单化，只有一对一
     */
    //合批问题再议，延迟
    objects: entityContentGroup,
    mimapLevel: number,
    distance: number,
}

export interface entityUniform {
    uniforms: unifromGroup[]
}

export enum initStateEntity {
    constructing,
    unstart,
    initializing,
    finished
}
/**
 * input参数
 * 
 */
export interface optionBaseEntity {
    name?: string,
    vertexAndMaterialGroup?: entityContentGroup,
    stage?: {
        Transparent: number[] //coreConst.defaultStageTransparent,
        Opaque: number[]
    },
    update?: (scope: any) => {};
}

export abstract class BaseEntity {


    input: optionBaseEntity | undefined;
    /**
     * 实体是否为动态，boolean
     * 默认=false
     */
    _dynamic: boolean;
    /**
     * LOD array
     */
    _LOD!: LOD[];
    _commmands: commmandType[];
    _vertexAndMaterialGroup!: entityContentGroup;
    _position!: Vec3;
    _scale!: Vec3;
    _rotation!: Vec3;
    _destroy: boolean;
    _init: initStateEntity;
    /**局部的，按需更新 */
    matrix!: Mat4;
    /**层级的到root，可以动态更新 */
    matrixWorld !: Mat4;
    visible!: boolean;
    enable!: boolean;
    children!: BaseEntity[];
    name!: string;
    id!: entityID;
    parent: BaseEntity | undefined;


    /**透明属性
     * 默认=false，
     * 通过后续材质或函数设置
     */
    //20240825
    _transparent!: boolean;
    /**
     * 本次是否更新，BVH的可见性,默认=true
     */
    _output: boolean;


    constructor(input?: optionBaseEntity) {
        this._init =initStateEntity.constructing;
        this._output = true;
        this.transparent = false;
        this.input = input;
        this._dynamic = false;
        this._LOD = [];
        this._destroy = false;
        this._commmands = [];
        this._vertexAndMaterialGroup = {};
        this.enable = true; 
        this._position = vec3.create();
        this._scale = vec3.create(1, 1, 1);
        this._rotation = vec3.create();
        this.matrix = mat4.create();
        this.matrixWorld = mat4.create();
        this.visible = true;
        this.children = [];
        this.name = ''
        this.id = new Date().getTime();

        if (input) {
            if (input.name) this.name = input.name;
            if (input.vertexAndMaterialGroup) this._vertexAndMaterialGroup = input.vertexAndMaterialGroup;

            //作废，原因，stage与entity更改为一对一关系
            // if (input.stage) {
            //     if (input.stage.Opaque) this.stage = input.stage.Opaque;
            //     else this.stage = [coreConst.defaultStage];
            //     if (input.stage.Transparent) this.stage = input.stage.Transparent;
            //     else this.stageTransparent = [coreConst.defaultStageTransparent];

            // }
            // else {
            //     this.stage = [coreConst.defaultStage];
            //     this.stageTransparent = [coreConst.defaultStageTransparent];
            // }
        }
       
    }
    /** */
    abstract init(): any

    async initDCC(scene: any) {
        this._init = this.createDCC(scene);
        this.generateBox();
    }
    set transparent(transparent: boolean) {
        this._transparent = transparent;
    }

    get transparent() {
        return this._transparent;
    }

    /**
     * 创建this._vertexAndMaterialGroup对应的DrawCommand组
     * 
     */
    abstract createDCC(scene: any): initStateEntity



    /** todo */
    generateBox() { }

    addContent(name: string, vm: entityContentOfVertexAndMaterial) {
        this._vertexAndMaterialGroup[name] = vm;
    }

    /**todo */
    addLOD(lod: geometryBufferOfEntity, level: number) {
        // this._LOD[level]
    }

    add(obj: BaseEntity) {
        this.children.push(obj);
        obj.parent = this;
    }
    remove(obj: BaseEntity) {
        let index = this.getObjectIndexByID(obj.id);
        if (index !== false) {
            delete this.children[index as number];
            return true;
        }
        else {
            return false;
        }
    }
    getObjectIndexByID(id: entityID): number | boolean {
        for (let i in this.children) {
            if (this.children[i].id == id) {
                return parseInt(i);
            }
        }
        return false;
    }
    /**返回第一个具有name的object */
    getObjectByName(name: string): BaseEntity | boolean {
        for (let i of this.children) {
            if (i.name == name) {
                return this;
            }
            else {
                let scope = i.getObjectByName(name);
                if (typeof scope != "boolean") {
                    return scope;
                }
            }
        }
        return false;
    }

    rotate(axis: Vec3, angle: number) {
        mat4.axisRotate(this.matrix, axis, angle, this.matrix);
    }
    rotateX(angle: number) {
        this.rotate([1, 0, 0], angle);
    }
    rotateY(angle: number) {
        this.rotate([0, 1, 0], angle);
    }
    rotateZ(angle: number) {
        this.rotate([0, 0, 1], angle);
    }
    translateOnAxisOfWorld(axis: Vec3, pos: Vec3,) { }

    get Positon() {
        return this._position
    }
    set Positon(pos) {
        this._position = pos;
    }

    /**todo */
    updateMatrix() { }
    /**todo */
    updateMatrixWorld() { }


    /**每帧更新入口
     * 1、完成初始化，进行DCC更新
     * 2、未完成初始化，返回空数组
     */
    update(scene: any, deltaTime: number, updateForce: boolean = false): commmandType[] {
        //初始化DCC
        if (this._init === initStateEntity.unstart) {
            this.initDCC(scene);
        }
        //初始化是完成状态，同时checkStatus=true
        else if (this._init === initStateEntity.finished && this.checkStatus()) {
            //动态物体 或 强制更新
            if (this._dynamic === true || updateForce === true) {
                if (this.input && this.input.update) {
                    this.input.update(this);
                }
                this.updateUniformBuffer(scene, deltaTime);
                this._commmands = this.updateDCC(scene, deltaTime);
                return this._commmands;
            }
            //静态，直接返回commands
            else
            // if (this._dynamic === false)
            {
                return this._commmands;
            }
        }
        return [];
    }
    /**
     * 可见性(visible)、
     * 可用性(enable)、
     * 初始化状态(_init)
     * 上级group的状态（可见性、使用性）
     */
    abstract checkStatus(): boolean

    // /** 作废
    //  * 包围盒：
    //  *      距离、视锥（所有点）（dot）、方向（cross，摄像机正方向）
    //  * 
    //  */
    // abstract checkCameraVisualRange(rays: cameraRayValues): boolean


    /**
     * 被update调用，更新vs、fs的uniform
     * 
     * @param deltaTime 
     */
    abstract updateUniformBuffer(scene: any, deltaTime: number): any


    /**
     * 被update调用
     * 更新this._vertexAndMaterialGroup对应的DrawCommand组
     * 
     * 1、主要是GPUBuffer和材质，是本class管理的（非DrawCommand自己管理范围内的，DC管理自己的）
     *      A、uniform buffer，GPUBuffer，storageBuffer
     * 
     * 2、如果没有更新直接返回DCC的数组
     * 
     */
    abstract updateDCC(scene: any, deltaTime: number): commmandType[];

    /**
     * 循环注销children
     * 注销this._LOD
     * 注销DrawCommand
     * 注销ComputeCommand
     * 注销GPUBuffer
     * 注销材质Buffer
     * 清空内存数组this._vertexAndMaterialGroup
     * 归零变量
     */
    abstract destroy(): any

    isDestroy() {
        return this._destroy;
    }
}