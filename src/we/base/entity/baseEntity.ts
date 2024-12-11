import { mat4, Mat4, vec3, Vec3 } from "wgpu-matrix";
import { BaseMaterial } from "../material/baseMaterial";
import { ShadowMaterial } from "../material/shadow/shadowMaterial";
import { BaseStage } from "../stage/baseStage";
import * as coreConst from "../const/coreConst"
import { Root } from "../const/root";

import partAdd_st_entity_VS from "../shader/entities/part_add.st_entity.vs.wgsl?raw"
import partAdd_st_VertexShaderOutput_VS from "../shader/entities/part_add.st.VertexShaderOutput.vs.wgsl?raw"
import partReplace_VertexShaderOutput_VS from "../shader/entities/part_replace.VertexShaderOutput.vs.wgsl?raw"
import { commmandType } from "../scene/baseScene";



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
 * todo
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


/**
 * enum，实体的状态
 */
export enum initStateEntity {
    constructing,
    unstart,
    initializing,
    finished
}
/**
 * 阴影选项
 * 是否接受与是否产生阴影
 * 默认时：全部都是true
 */
export interface optionShadowEntity {
    /**是否接收阴影 */
    accept?: boolean,
    /**是否产生阴影     */
    generate?: boolean,
}
/**
 * input参数
 * 
 */
export interface optionBaseEntity extends coreConst.optionUpdate {
    /**
 * 两种情况：
 * 
 * 1、代码实时构建，延迟GPU device相关的资源建立需要延迟。需要其顶级使用者被加入到stage中后，才能开始。有其上级类的readyForGPU() 给材料进行GPUDevice的传值
 * 
 * 2、代码实时构建，可以显示的带入scene，则不用等待
 * 
 * 3、加载场景模式，原则上是通过加载器带入scene参数。todo
 * 
 * 20241129,类型从any 改为BaseStage
 */
    scene?: BaseStage,
    name?: string,
    //todo
    /** 顶点和材质组一对一 */
    vertexAndMaterialGroup?: entityContentGroup,
    // /**默认=World */
    // stage?: {
    //     Transparent: number[] //coreConst.defaultStageTransparent,
    //     Opaque: number[]
    // },
    // /**自定义更新functon() */
    // update?: (scope: any) => {},
    /**阴影选项 */
    shadow?: optionShadowEntity,
    /**初始化的参数matrix  ，这个mesh的   */
    matrix?: Mat4,
    /**初始化的参数scale     */
    scale?: Vec3,
    /**初始化的参数position     */
    position?: Vec3,
    /**初始化的参数rotatae     */
    rotate?: {
        axis: Vec3,
        angleInRadians: number,
    },
    /**是否每帧更新Matrix，默认=false */
    updateMatrixPerFrame?: boolean,
    /** side,显示的面，默认:front */
    side?: "front" | "back" | "all",
    /**
     * 实体是否为动态，boolean
     * 默认=false
     */
    dynamicPostion?: boolean;
    /**
     * 是否未动态形变物体
     * 默认=false
     */
    dynamicMesh?: boolean;
    /**实例化数量，默认为1 */
    numInstances?: number,
    /**
     * 这里是实例化的每个实例的位置，默认是[0,0,0]
     * 
     * 一个可以使用默认，多个就会重叠
     */
    instancesPosition?: Vec3[],
    /**自定义shader代码，包括VS和FS */
    shaderCode?: string,
}

export abstract class BaseEntity extends Root {


    input: optionBaseEntity | undefined;
    /**
     * 实体是否为动态，boolean
     * 默认=false
     */
    _dynamicPostion: boolean;
    /**
     * 是否未动态形变物体
     * 默认=false
     */
    _dynamicMesh: boolean;
    /**
     * todo
     * LOD array
     */
    _LOD!: LOD[];//todo
    _shadow!: optionShadowEntity;
    _shadowMaterail!: ShadowMaterial;
    _commmands: commmandType[];
    _vertexAndMaterialGroup!: entityContentGroup;
    _position!: Vec3;
    _scale!: Vec3;
    _rotation!: Vec3;
    _destroy: boolean;
    _init: initStateEntity;
    // /**局部的，按需更新 */
    // matrixInstances!: Mat4[];
    // /**层级的到root，可以动态更新 */
    // matrixWorldInstances !: Mat4[];
    /**当前mesh的local的矩阵，按需更新 */
    matrix!: Mat4;
    /**当前entity在世界坐标（层级的到root)，可以动态更新 */
    matrixWorld !: Mat4;
    /**
     * 20241120，增加了matrix buffer，因为实例化可能是一个或多个，最终输出是一个buffer
     */
    matrixWorldBuffer!: Float32Array;//instance的uniform 数组数量，在createDCC中进行字符串替换，每个子类单独进行
    structUnifomrBuffer!: ArrayBuffer;//instance的uniform 数组数量，在createDCC中进行字符串替换，每个子类单独进行
    entity_id: Uint32Array;
    stage_id: Uint32Array;
    /**是否每帧更新 */
    updateMatrixPerFrame: boolean;
    visible!: boolean;
    enable!: boolean;
    children!: BaseEntity[];
    name!: string;
    /**在stage中的ID，默认=0，如果_id=0，则与ID相关的功能失效 */
    _id!: entityID;
    get ID() {
        return this._id;
    }
    set ID(id: entityID) {
        this._id = id;
        // this.updateUniformBuffer(this.scene, 1, 1, 1);
    }
    parent: BaseEntity | undefined;
    stageID!: number

    /**透明属性
     * 默认=false，
     * 通过后续材质或函数设置
     */
    //20240825
    _transparent!: boolean;
    /**
     * todo
     * 本次是否更新，BVH的可见性,默认=true
     */
    _output: boolean;

    /**实例化数量，默认为1 */
    numInstances: number;

    /**
     * 是否单独更新每个instance 
     * 
     * 默认=false
    */
    flagUpdateForPerInstance!: boolean;

    /**entiy 的ID（u32）等其他数据占位，这个需要与wgsl shader中同步更改 */
    _entityIdSizeForWGSL = 4;//以u32（f32）计算

    constructor(input: optionBaseEntity) {
        super();
        this._init = initStateEntity.constructing;
        this.flagUpdateForPerInstance = false;
        this._output = true;
        this.transparent = false;
        this.input = input;
        this._dynamicPostion = false;
        this._dynamicMesh = false;
        this.numInstances = 1;
        if (input.numInstances) {
            this.numInstances = input.numInstances;
        }
        if (input.dynamicPostion) {
            this._dynamicPostion = input.dynamicPostion
        }
        if (input.dynamicMesh) {
            this._dynamicMesh = input.dynamicMesh
        }
        this._id = 0;
        this.stageID = 0;
        this._LOD = [];
        this._destroy = false;
        this._commmands = [];
        this._vertexAndMaterialGroup = {};
        this.enable = true;
        this._position = vec3.create();
        this._scale = vec3.create(1, 1, 1);
        this._rotation = vec3.create();
        this.matrix = mat4.create(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1,);
        this.matrixWorld = mat4.create(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1,);


        // this.matrixWorldBuffer = new Float32Array(4 * 4 * this.numInstances);
        this.structUnifomrBuffer = new ArrayBuffer(4 * 4 * this.numInstances * 4 + this._entityIdSizeForWGSL * 4);

        this.matrixWorldBuffer = new Float32Array(this.structUnifomrBuffer, 0, 4 * 4 * this.numInstances);
        this.entity_id = new Uint32Array(this.structUnifomrBuffer, 4 * 4 * this.numInstances * 4, 1);
        this.stage_id = new Uint32Array(this.structUnifomrBuffer, 4 * 4 * this.numInstances * 4 + 4, 1);


        // this.matrixWorldBuffer = new Float32Array(4 * 4 * this.numInstances);
        // let perMatrix = mat4.identity();
        // for (let i = 0; i < this.numInstances; i++) {
        //     this.matrixWorldBuffer.set(perMatrix, i * 16);
        // }
        this.visible = true;
        this.children = [];
        this.name = ''
        // this.ID = new Date().getTime();
        this.updateMatrixPerFrame = false;

        if (input.name) this.name = input.name;
        if (input.vertexAndMaterialGroup) this._vertexAndMaterialGroup = input.vertexAndMaterialGroup;
        this._shadow = {
            accept: true,
            generate: true,
        };
        if (input.shadow) {
            if (input.shadow.accept === false) this._shadow.accept = false;
            if (input.shadow.generate === false) {
                this._shadow.generate = false;
            }
        }
        if (this._shadow.generate === true) {
            this._shadowMaterail = new ShadowMaterial();
        }
        // this.updateMatrix();

    }
    /** */
    abstract init(): any


    initDCC(scene: any) {
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
        let index = this.getObjectIndexByID(obj.ID);
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
            if (this.children[i].ID == id) {
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
        ////这里注销到的是因为，for操作的是instance的每个个体
        // for (let i = 0; i < this.numInstances; i++) {
        //     this.matrix[i] = mat4.axisRotate(this.matrix[i], axis, angle, this.matrix[i]);
        // }
        this.matrix = mat4.axisRotate(this.matrix, axis, angle, this.matrix);
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
    /**
         * 将entity的矩阵应用POS的位置变换，是在原有矩阵
         * @param pos :Vec3
         */
    translate(pos: Vec3,) {
        this.matrix = mat4.setTranslation(this.matrix, pos);
    }
    /**
     * 将entity的位置变为POS,等价wgpu-matrix的mat4的translation
     * @param pos :Vec3
     */
    translation(pos: Vec3,) {
        this.matrix = mat4.setTranslation(this.matrix, pos);
    }
    scale(vec: Vec3) {
        this.matrix = mat4.scale(this.matrix, vec);
    }

    get Positon() {
        return this._position
    }
    set Positon(pos) {
        this._position = pos;
    }

    /**
     * 更新矩阵的顺序是先进行线性变换，在进行位置变换
     * 
     * 其实是没有影响，线性工作在3x3矩阵，位置变换在[12,13,14]
     */
    updateMatrix(): any {
        this.matrix = mat4.create(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1,);
        this.matrixWorld = mat4.create(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1,);
        if (this.input?.matrix)
            mat4.copy(this.input.matrix, this.matrix);
        if (this.input?.scale)
            this.scale(this.input.scale);
        if (this.input?.rotate)
            this.rotate(this.input.rotate.axis, this.input.rotate.angleInRadians);
        if (this.input?.position)
            this.translation(this.input.position);

        this.matrixWorld = this.updateMatrixWorld();
        this.updateUniformBuffer(false, 0, 0, 0);
    }

    /** 
     * 递归更新每层
     */
    updateMatrixWorld(m4: Mat4 | boolean = false): Mat4 {
        if (m4 === false)
            m4 = mat4.copy(this.matrix);
        else {
            m4 = mat4.multiply(this.matrix, m4 as Mat4);
        }
        if (this.parent) {
            return this.parent.updateMatrixWorld(m4);
        }
        else {
            return m4;
        }
    }
    /**
     * 输出实例渲染的个数的buffer
     * 
     * 单个示例可以在input.update（）进行更新
     */
    getUniformOfMatrix() {
        // return this.matrixWorldBuffer;
        return new Float32Array(this.structUnifomrBuffer);
    }
    /**
     * 1、完成初始化，进行DCC更新
     * 2、未完成初始化，返回空数组
     */


    /**每帧更新入口
     * 
     * 1、完成初始化，进行DCC更新
     * 
     * 2、未完成初始化，返回空数组
     * 
     * @param scene 
     * @param deltaTime 
     * @param startTime 
     * @param lastTime 
     * @param updateForce boolean，true=重新生成Draw Command
     * @returns 
     */
    update(scene: any, deltaTime: number, startTime: number, lastTime: number, updateForce: boolean = false): commmandType[] {
        //初始化DCC
        if (this._readyForGPU && this._id != 0)

            if (this._init === initStateEntity.unstart) {
                this.updateMatrix();//在这里必须更新一次，entityID，stageID，都是延迟到增加至stage之后才更新的。
                this.initDCC(scene);
            }
            //初始化是完成状态，同时checkStatus=true
            else if (this._init === initStateEntity.finished && this.checkStatus()) {
                if (this.input && this.input.update) {
                    this.matrix = mat4.identity();
                    this.updateMatrix();
                    this.input.update(this, deltaTime, startTime, lastTime);
                }
                //动态物体 或 强制更新
                if (this._dynamicPostion === true) {
                    this.matrixWorld = this.updateMatrixWorld();
                }
                if (updateForce === true) {

                }
                else if (this._dynamicMesh === true || this._dynamicPostion === true || this.input!.update !== undefined) {

                    this.updateUniformBuffer(scene, deltaTime, startTime, lastTime);
                    this._commmands = this.updateDCC(scene, deltaTime, startTime, lastTime);
                    // return this._commmands;
                }
                else//静态，直接返回commands
                {
                    return this._commmands;
                }
            }
            else if (this._init == initStateEntity.initializing) {
                this.checkStatus();
            }

        // return [];
        // let commands = this.updateChilden(scene, deltaTime, startTime, lastTime);

        return this._commmands;
    }
    updateChilden(scene: any, deltaTime: number, startTime: number, lastTime: number, updateForce: boolean = false): commmandType[] {

        return [];
    }
    /**
     * 可见性(visible)、
     * 可用性(enable)、
     * 初始化状态(_init)
     * 上级group的状态（可见性、使用性）
     */
    abstract checkStatus(): boolean

    // /**确认parent 状态 */
    // getStatusOfParents(): boolean {
    //     if (this.parent) {
    //         return this.parent.getStateus() && this.visible && this.enable;
    //     }
    //     else {
    //         return this.visible && this.enable;
    //     }
    // }
    /** */
    getStateus(): boolean {
        if (this.checkStatus() && this.visible && this.enable) {
            return true;
        }
        return false;
    }
    // /** 作废
    //  * 包围盒：
    //  *      距离、视锥（所有点）（dot）、方向（cross，摄像机正方向）
    //  * 
    //  */
    // abstract checkCameraVisualRange(rays: cameraRayValues): boolean


    /**
     * 是否单独更新每个instance
     * 
     * 即：使用用户更新的update()的结果，或连续的结果（前一帧的的矩阵内容）
     * 
     * 
     * @param state :boolean
     * 
     */
    setUpdateForPerInstance(state: boolean) {
        this.flagUpdateForPerInstance = state;
    }

    /**
     * 返回this.flagUpdateForPerInstance的标志位，默认状态=false
     * @returns boolean
     * 
     */
    getUpdateForPerInstance() {
        return this.flagUpdateForPerInstance;
    }
    /**
     * 被update调用，更新vs、fs的uniform
     * 
     * this.flagUpdateForPerInstance 影响是否单独更新每个instance，使用用户更新的update（）的结果，或连续的结果
     */
    // abstract
    updateUniformBuffer(scene: any, deltaTime: number, startTime: number, lastTime: number): any {

        for (let i = 0; i < this.numInstances; i++) {
            let perMatrix = mat4.identity();
            //是否单独更新每个instance，使用用户更新的update（）的结果，或连续的结果
            if (this.flagUpdateForPerInstance) {
                perMatrix = this.matrixWorldBuffer.subarray(i * 16, (i + 1) * 16);
            }
            let perWorld = mat4.copy(this.matrixWorld);
            perMatrix = mat4.multiply(perWorld, perMatrix);
            if (this.input?.instancesPosition) {
                mat4.setTranslation(perMatrix, this.input.instancesPosition[i], perMatrix);
            }
            this.matrixWorldBuffer.set(perMatrix, i * 16);
        }

        this.entity_id[0] = this.ID;
        this.stage_id[0] = this.getStageID();

    }

    updateUniformBuffer_old_changing(scene: any, deltaTime: number, startTime: number, lastTime: number): any {
        for (let i = 0; i < this.numInstances; i++) {
            let perMatrix = mat4.identity();
            //是否单独更新每个instance，使用用户更新的update（）的结果，或连续的结果
            if (this.flagUpdateForPerInstance) {
                perMatrix = this.matrixWorldBuffer.subarray(i * 16, (i + 1) * 16);
            }
            let perWorld = mat4.copy(this.matrixWorld);
            perMatrix = mat4.multiply(perWorld, perMatrix);
            if (this.input?.instancesPosition) {
                mat4.setTranslation(perMatrix, this.input.instancesPosition[i], perMatrix);
            }
            this.matrixWorldBuffer.set(perMatrix, i * 16);
        }
        const ST_entityValues = new ArrayBuffer(80);
        const ST_entityViews = {
            MatrixWorld: new Float32Array(ST_entityValues, 0, 16),
            entity_id: new Uint32Array(ST_entityValues, 64, 1),
            stage_id: new Uint32Array(ST_entityValues, 68, 1),
        };

        ST_entityViews.entity_id[0] = this.ID;
        ST_entityViews.stage_id[0] = this.getStageID();
        // let baseInfoSetting = new Float32Array(this._entityIdSizeForWGSL);
        // baseInfoSetting[0] = this.ID;
        // baseInfoSetting[1] = this.getStageID();


        // this.matrixWorldBuffer.set(baseInfoSetting, 0);
    }

    updateUniformBuffer_new(scene: any, deltaTime: number, startTime: number, lastTime: number): any {
        const ST_entityValues = new ArrayBuffer(this._entityIdSizeForWGSL * 4 + 4 * 4 * this.numInstances * 4);
        const ST_entityViews = {
            entity_id: new Uint32Array(ST_entityValues, 0, 1),
            stage_id: new Uint32Array(ST_entityValues, 4, 1),
            MatrixWorld: new Float32Array(ST_entityValues, 16, 16),
        };
        ST_entityViews.entity_id[0] = this.ID;
        ST_entityViews.stage_id[0] = this.getStageID();

        this.matrixWorldBuffer = new Float32Array(ST_entityValues);

        for (let i = 0; i < this.numInstances; i++) {
            let perMatrix = mat4.identity();
            //是否单独更新每个instance，使用用户更新的update（）的结果，或连续的结果
            if (this.flagUpdateForPerInstance) {
                perMatrix = this.matrixWorldBuffer.subarray(this._entityIdSizeForWGSL + i * 16, (i + 1) * 16);
            }
            let perWorld = mat4.copy(this.matrixWorld);
            perMatrix = mat4.multiply(perWorld, perMatrix);
            if (this.input?.instancesPosition) {
                mat4.setTranslation(perMatrix, this.input.instancesPosition[i], perMatrix);
            }
            this.matrixWorldBuffer.set(perMatrix, this._entityIdSizeForWGSL + i * 16);
        }
        this.matrixWorldBuffer = new Float32Array(ST_entityValues);
    }
    getID() {
        return { stageID: this.stageID, ID: this.ID };
    }
    getStageID() {
        return this.stageID;
    }


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
    abstract updateDCC(scene: any, deltaTime: number, startTime: number, lastTime: number): commmandType[];

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
    /**
     * 增加结构体 “ST_entity” 和uniform binding
     * @param code :string 
     * @returns string
     */
    shaderCodeAddPartForVS_ST_entity(code: string): string {
        let shaderCodeAdded = partAdd_st_entity_VS + code;
        return shaderCodeAdded;
    }
    /**
     * 替换VS中的instance相关的内容
     * @param shaderCode :string
     * @returns string
     */
    shaderCodeReplaceFor_instance(shaderCode: string): string {
        let shaderCodeReplaced = shaderCode.replaceAll("$instacnce", this.numInstances.toString());
        return shaderCodeReplaced;
    }

    /**合并shaderCodeAddPartForVS_ST_entity.shaderCodeReplaceFor_instance两个功能
     * 
     */
    shaderCodeProcess(shaderCode: string): string {
        let code = partAdd_st_entity_VS + shaderCode;//增加结构体 ST_entity
        code = partAdd_st_VertexShaderOutput_VS + code;//增加结构体 VertexShaderOutput
        code = code.replaceAll("$instacnce", this.numInstances.toString());//替换$instacnce ,实例化数量
        code = code.replaceAll("$vsOutput", partReplace_VertexShaderOutput_VS.toString());//替换$vsOutput的输出内容
        return code;
    }
    /**
     * 获取stage中的renderPassDescriptor: GPURenderPassDescriptor的对应的colorAttachment的format格式
     * 
     * DC的pipeline的fragment target 使用
     * @returns GPUColorTargetState[]
     */
    getFragmentTargets(): GPUColorTargetState[] {
        return this.stage.colorAttachmentTargets;
    }
}