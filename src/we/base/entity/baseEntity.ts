import { mat4, Mat4, vec3, Vec3 } from "wgpu-matrix";
import { BaseMaterial } from "../material/baseMaterial";
import { BaseStage } from "../stage/baseStage";
import * as coreConst from "../const/coreConst"
import { Root } from "../scene/root";

import partAdd_st_entity_VS from "../shader/entities/part_add.st_entity.vs.wgsl?raw"
import partAdd_st_VertexShaderOutput_VS from "../shader/entities/part_add.st.VertexShaderOutput.vs.wgsl?raw"
import partReplace_VertexShaderOutput_VS from "../shader/entities/part_replace.VertexShaderOutput.vs.wgsl?raw"
import { commmandType } from "../scene/baseScene";
import { boundingBox, generateBox3 } from "../math/Box";
import { boundingSphere, generateSphereFromBox3 } from "../math/sphere";
import { renderKindForDCCC } from "../const/coreConst";

export interface renderCommands {
    forward: commmandType[],
    depth: commmandType[],
    color: commmandType[],
}

// export interface renderCommandsOfShadowMap {
//     [shadowmap:number]: commmandType[],
// }


// export interface boundingSphere {
//     position: [number, number, number],
//     radius: number,
// }
// export interface boundingBox {
//     min: [number, number, number],
//     max: [number, number, number],
// }

/**createDCCC的参数
 * 
 */
export interface valuesForCreateDCCC {
    parent: BaseStage,
    id: string,//camera id or light id 
    kind: renderKindForDCCC,//enmu 
    matrixIndex?: number,//matrix of light MVP[]
}


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


/**三段式初始化的第一步： input参数 */
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
    parent?: BaseStage,
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
    dynamicPostion?: boolean,
    /**
     * 是否未动态形变物体
     * 默认=false
     */
    dynamicMesh?: boolean,
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
/**三段式初始化的第二步：init */
export interface optionBaseEntityStep2 {
    stage: BaseStage,
    ID: number,
    deferRenderDepth: boolean,
    deferRenderColor: boolean,
    reversedZ: boolean,
}
/**为多摄像机输出的commmand格式 */
export interface commandsOfEntity {
    [name: string]: renderCommands
}
/**为多shadow map输出的commmand格式
 * 
 * name=light.id(转换后的string 格式)
 */
export interface commandsOfShadowOfEntity {
    [name: string]: commmandType[]
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
    // _shadowMaterail!: ShadowMaterial;
    commmands: commandsOfEntity;//commmandType[];
    commandsOfShadow: commandsOfShadowOfEntity;
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
    matrixWorldBuffer!: Float32Array;//instance的uniform 数组数量，在createDCCC中进行字符串替换，每个子类单独进行
    structUnifomrBuffer!: ArrayBuffer;//instance的uniform 数组数量，在createDCCC中进行字符串替换，每个子类单独进行
    /**for shader  */
    entity_id: Uint32Array;
    /**for shader */
    stage_id: Uint32Array;
    /**是否每帧更新 */
    updateMatrixPerFrame: boolean;
    visible!: boolean;
    enable!: boolean;
    children!: BaseEntity[];
    name!: string;

    // _id!: entityID;
    // get ID() {
    //     return this._id;
    // }
    // set ID(id: entityID) {
    //     this._id = id;
    //     // this.updateUniformBuffer(this.scene, 1, 1, 1);
    // }

    parent!: BaseEntity;
    /** stageID*/
    stageID!: number;


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


    reversedZ!: boolean;
    deferRenderDepth!: boolean;
    deferRenderColor!: boolean;


    boundingBox!: boundingBox;//initDCC中赋值
    boundingSphere!: boundingSphere;

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
        this._id = 0;//在stage中的ID，默认=0，如果_id=0，则与ID相关的功能失效 
        this.stageID = 0;
        this._LOD = [];
        this._destroy = false;
        this.commmands = {};
        this.commandsOfShadow = {};
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
        // if (this._shadow.generate === true) {
        //     this._shadowMaterail = new ShadowMaterial();
        // }
        // this.updateMatrix();
        this.commmands = {};
        // this.commmands["default"] = {
        //     forward: [],
        //     depth: [],
        //     color: []
        // };

    }
    /** */
    async init(values: optionBaseEntityStep2) {
        this.stage = values.stage;
        this.stageID = values.stage.ID;
        this.reversedZ = values.reversedZ;
        this.deferRenderDepth = values.deferRenderDepth;
        this.deferRenderColor = values.deferRenderColor;
        this.stageTransparent = values.stage.scene.stages[values.stage.name].transparent;
        await this.setRootENV(values.stage.scene);//为获取在scene中注册的resource
        this.ID = values.ID;//这个在最后，update需要判断ID是否存在，以开始更新
    }

    abstract generateBoxAndSphere(): void

    set transparent(transparent: boolean) {
        this._transparent = transparent;
    }

    get transparent() {
        return this._transparent;
    }

    /** camera: string,camera or light 的id（string形式）
     * 
     * type:string ,"camera"|"light",default="camera"
     */
    abstract createDCCC(values: valuesForCreateDCCC): initStateEntity
    abstract createDCCCDeferRenderDepth(values: valuesForCreateDCCC): initStateEntity
    abstract createDCCCForShadowMap(values: valuesForCreateDCCC): initStateEntity
    // abstract createDCCC(parent: BaseStage, camera: string, kind?: string): initStateEntity
    // abstract createDCCCDeferRenderDepth(parent: BaseStage, camera: string, kind?: string): initStateEntity
    // abstract createDCCCForShadowMap(parent: BaseStage, camera: string, kind?: string): initStateEntity


    /** 世界坐标的Box */
    generateBox(position: number[]): boundingBox {
        let box = generateBox3(position);
        // box.min[0] += this.Positon[0];
        // box.min[1] += this.Positon[1];
        // box.min[2] += this.Positon[2];
        // box.max[0] += this.Positon[0];
        // box.max[1] += this.Positon[1];
        // box.max[2] += this.Positon[2];
        const min = vec3.transformMat4(box.min, this.matrixWorld);
        const max = vec3.transformMat4(box.max, this.matrixWorld);
        box.max[0] = max[0];
        box.max[1] = max[1];
        box.max[2] = max[2];
        box.min[0] = min[0];
        box.min[1] = min[1];
        box.min[2] = min[2];
        return box;
    }
    /**世界坐标的sphere */
    generateSphere(box: boundingBox): boundingSphere {
        if (this.boundingBox == undefined) {
            console.error("boundingBox 没有计算");
        }

        return generateSphereFromBox3(box);
    }
    /** */
    addContent(name: string, vm: entityContentOfVertexAndMaterial) {
        this._vertexAndMaterialGroup[name] = vm;
    }

    /**todo */
    addLOD(_lod: geometryBufferOfEntity, _level: number) {
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

    /** 绕任意轴旋转 */
    rotate(axis: Vec3, angle: number) {
        ////这里注销到的是因为，for操作的是instance的每个个体
        // for (let i = 0; i < this.numInstances; i++) {
        //     this.matrix[i] = mat4.axisRotate(this.matrix[i], axis, angle, this.matrix[i]);
        // }
        this.matrix = mat4.axisRotate(this.matrix, axis, angle, this.matrix);
    }
    /**绕X轴(100)旋转 */
    rotateX(angle: number) {
        this.rotate([1, 0, 0], angle);
    }
    /**绕y轴(010)旋转 */
    rotateY(angle: number) {
        this.rotate([0, 1, 0], angle);
    }
    /**绕z轴(001)旋转 */
    rotateZ(angle: number) {
        this.rotate([0, 0, 1], angle);
    }
    /**
     * 在现有matrix（原有的position）上增加pos的xyz，
         * 将entity的矩阵应用POS的位置变换，是在原有矩阵上增加
         * @param pos :Vec3
         */
    translate(pos: Vec3,) {
        this.matrix = mat4.translate(this.matrix, pos);
    }
    /** 创建单位矩阵，矩阵的xyz(12,13,14)=pos
    * @param pos :Vec3
    */
    translation(pos: Vec3,) {
        this.matrix = mat4.translation(this.matrix, pos);
    }
    /**
     * 替换pos的位置（matrix的:12,13,14），其他的matrix数据不变，
     * 将entity的位置变为POS,等价wgpu-matrix的mat4的translation，是替换，不是增加
     * @param pos :Vec3
     */
    setTranslation(pos: Vec3,) {
        this.matrix = mat4.setTranslation(this.matrix, pos);
    }
    /**scale */
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
            this.setTranslation(this.input.position);

        this.matrixWorld = this.updateMatrixWorld();
        this.updateUniformBuffer(this.stage as BaseStage, 0, 0, 0);
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



    initDCC(parent: BaseStage) {
        let already = this.checkStatus();
        if (already) {
            this._init = initStateEntity.initializing;
            this.generateBoxAndSphere();
            this.upgradeLights(parent);
            this.upgradeCameras(parent);

            this._init = initStateEntity.finished;//this.createDCCC(valueOfCamera);
        }
    }
    checkIdOfCommands(id: string, commands: commandsOfEntity | commandsOfShadowOfEntity): boolean {
        for (let i in commands) {
            if (i == id) return true;
        }
        return false;
    }
    /**更新(创建)关于cameras的DCCC commands
     * 
     * @param parent 
     */
    upgradeCameras(parent: BaseStage) {
        for (let i of this.scene.cameraActors) {
            const id = i.id.toString();
            const already = this.checkIdOfCommands(id, this.commmands);//获取是否已经存在
            if (already) {
                continue;
            }
            else {
                const valueOfCamera: valuesForCreateDCCC = {
                    parent,
                    id: id,
                    kind: renderKindForDCCC.camera
                };
                if (this.deferRenderDepth) this._init = this.createDCCCDeferRenderDepth(valueOfCamera);
                this.createDCCC(valueOfCamera);
            }
        }
    }
    /**更新(创建)关于lights的DCCC commands
     * 
     */
    upgradeLights(parent: BaseStage) {
        for (let i of this.scene.lightsManagement.getShdowMapsStructArray()) {
            const id = i.light_id.toString();
            const already = this.checkIdOfCommands(id, this.commandsOfShadow);//获取是否已经存在
            if (already) {
                continue;
            }
            else {
                const valueOfLight: valuesForCreateDCCC = {
                    parent,
                    id: id,
                    kind: renderKindForDCCC.light,
                    matrixIndex: i.matrix_self_index
                };
                this.createDCCCForShadowMap(valueOfLight);
            }

        }
    }
    checkUpgradeCameras(parant: BaseStage) {
        const countsOfCamerasCommand = Object.keys(this.commmands).length;
        const countsOfCameraActors = this.scene.cameraActors.length;
        if (countsOfCameraActors > countsOfCamerasCommand) {
            this.upgradeCameras(parant)
        }
    }
    checkUpgradeLights(parant: BaseStage) {
        const countsOfCamerasCommand = Object.keys(this.commandsOfShadow).length;
        const countsOfCameraActors = this.scene.lightsManagement.getShdowMapsStructArray().length;
        if (countsOfCameraActors > countsOfCamerasCommand) {
            this.upgradeLights(parant)
        }
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
     * @param parent 
     * @param deltaTime 
     * @param startTime 
     * @param lastTime  
     * @returns 
     */
    update(parent: BaseStage, deltaTime: number, startTime: number, lastTime: number): commandsOfEntity {
        // let cameraOrLight: string, forWhatRender: entityRenderFor;
        //初始化DCC

        if (this._readyForGPU && this._id != 0)

            if (this._init === initStateEntity.unstart) {
                this.updateMatrix();//在这里必须更新一次，entityID，stageID，都是延迟到增加至stage之后才更新的。
                this.initDCC(parent);
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
                //检查是否有新摄像机，有进行更新
                this.checkUpgradeCameras(parent);
                //建设是否有新光源，有进行更新
                this.checkUpgradeLights(parent);
                if (this._dynamicMesh === true || this._dynamicPostion === true || this.input!.update !== undefined) {
                    this.updateUniformBuffer(parent, deltaTime, startTime, lastTime);
                    this.commmands = this.updateDCC(parent, deltaTime, startTime, lastTime);
                }
                else//静态，直接返回commands
                {
                    return this.commmands;
                }
            }
            else if (this._init == initStateEntity.initializing) {
                this.checkStatus();
            }

        // return [];
        // let commands = this.updateChilden(parent, deltaTime, startTime, lastTime);

        return this.commmands;
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
     * 
     * @param _parent 
     * @param _deltaTime 
     * @param _startTime 
     * @param _lastTime 
     * @returns commandsOfEntity, 返回this.commmands 包括多个camera和light的renderCommands 每个renderCommands中包括3个类型的commands
     */
    updateDCC(_parent: BaseStage, _deltaTime: number, _startTime: number, _lastTime: number): commandsOfEntity {
        return this.commmands;
    }
    getCommandsOfShadowMap(): commandsOfShadowOfEntity {
        return this.commandsOfShadow;
    }
    updateChilden(_parent: BaseStage, _deltaTime: number, _startTime: number, _lastTime: number, _updateForce: boolean = false): commmandType[] {
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
    updateUniformBuffer(_parent: BaseStage, _deltaTime: number, _startTime: number, _lastTime: number): any {

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


    getID() {
        return { stageID: this.stageID, ID: this.ID };
    }
    getStageID() {
        return this.stageID;
    }




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

    /**判断是否有deferRender depth，并增加@group(1)@binding(1)、material的binding顺延
     * 
     * 增加结构体 ST_entity
     * 
     * 判断是否有deferRender depth，并增加@group(1)@binding(1)、material的binding顺延
     * 
     * 增加结构体 VertexShaderOutput
     * 
     * 替换$instacnce ,实例化数量
     * 
     * 替换$vsOutput的输出内容
     * 
     */
    shaderCodeProcess(shaderCode: string): string {
        let deferRender = "";
        if (this.deferRenderDepth) {
            deferRender = `\n @group(1) @binding(1) var u_DeferDepth : texture_depth_2d; \n `;
        }
        let code = partAdd_st_entity_VS + deferRender + shaderCode;//增加结构体 ST_entity
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
        return this.stage!.colorAttachmentTargets;
    }
}