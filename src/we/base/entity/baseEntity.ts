import { mat4, Mat4, vec3, Vec3 } from "wgpu-matrix";
import { BaseStage } from "../stage/baseStage";
import { RootOfGPU } from "../organization/root";

import partAdd_st_entity_VS from "../shader/entities/part_add.st_entity.vs.wgsl?raw"
import partAdd_st_VertexShaderOutput_VS from "../shader/entities/part_add.st.VertexShaderOutput.vs.wgsl?raw"
import partReplace_VertexShaderOutput_VS from "../shader/entities/part_replace.VertexShaderOutput.vs.wgsl?raw"
import { boundingBox, generateBox3 } from "../math/Box";
import { boundingSphere, generateSphereFromBox3 } from "../math/sphere";
import { lifeState, renderKindForDCCC } from "../const/coreConst";

import {
    geometryBufferOfEntity,
    optionBaseEntity,
    optionBaseEntityStep2,
    optionShadowEntity,
    valuesForCreateDCCC,
} from "./baseEntityDefine";

import { commandsOfEntity, commandsOfShadowOfEntity, commandsOfShadowOfEntityOfTransparent, commandsOfTransparentOfEntity, commmandType } from "../command/base";



export abstract class BaseEntity extends RootOfGPU {
    ///////////////////////////////////////////
    // shader
    /**for shader  */
    entity_id: Uint32Array;
    /**for shader */
    stage_id: Uint32Array;
    /**uvU */
    uvU: Float32Array;
    /**uvV */
    uvV: Float32Array;
    /**entiy 的ID（u32）等其他数据占位，这个需要与wgsl shader中同步更改 */
    _entityIdSizeForWGSL = 4;//以u32（f32）计算

    ////////////////////////////////////////////////////////////////////
    //基础属性
    input: optionBaseEntity | undefined;

    /** stageID*/
    stageID!: number;

    /**
     * 目前没有使用，20250501
     * 顶点信息 */
    // _vertexAndMaterialGroup!: entityContentGroup;


    ///////////////////////////////////////////////////////////////////
    //层级、LOD、实例化等


    // /**
    //  *  todo     
    //  * LOD
    //  * */
    // _LOD!: LOD[];//

    /**实例化数量，默认为1 */
    numInstances: number;

    /**
     * 剔除模式
     * 
     * 默认=back
     * */
    _cullMode!: GPUCullMode;

    ///////////////////////////////////////////////////////////////////
    //空间属性
    // _position!: Vec3;
    // _scale!: Vec3;
    // _rotation!: Vec3;

    // /**当前mesh的local的矩阵，按需更新 */
    // matrix!: Mat4;
    // /**当前entity在世界坐标（层级的到root)，可以动态更新 */
    // matrixWorld !: Mat4;
    boundingBox!: boundingBox;//initDCC中赋值
    boundingSphere!: boundingSphere;
    /**
     * 20241120，增加了matrix buffer，因为实例化可能是一个或多个，最终输出是一个buffer
     */
    matrixWorldBuffer!: Float32Array;//instance的uniform 数组数量，在createDCCC中进行字符串替换，每个子类单独进行
    structUnifomrBuffer!: ArrayBuffer;//instance的uniform 数组数量，在createDCCC中进行字符串替换，每个子类单独进行


    ///////////////////////////////////////////////////////////////////
    //状态属性
    _init: lifeState;
    /**是否每帧更新 */
    updateMatrixPerFrame: boolean;
    /**
     * 是否单独更新每个instance 
     * 
     * 默认=false
    */
    flagUpdateForPerInstance!: boolean;

    /**是否需要更新 */
    needUpdate: boolean;

    //////////////////////////////////////////////////////////////////
    //是否透明属性

    /**透明属性
     * 默认=false，
     * 通过后续材质或函数设置
     */
    //20240825
    _transparent!: boolean;

    ///////////////////////////////////////////////////////////////////
    //可见性相关
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
    // visible: boolean;
    // enable: boolean;

    //////////////////////////////////////////////////////////////////
    //生成与实现
    _shadow: optionShadowEntity;


    //////////////////////////////////////////////////////////////////
    // commands输出 ，四大类command

    /**前向渲染，根据this.transparent，判断是否为透明entity
     * 
     * 不透明有：comamnds.depth,comamnds.color
     * 
     * 透明只有：comamnds.color
     */
    commmands: commandsOfEntity;//commmandType[];

    /**
     * shadowmap 渲染，是多个光源的渲染队列集合
     * 
     * 根据this.transparent，判断是否为透明entity
     * 
     * 不透明只需要一步shadowmap的渲染(lightsmanagement管理)，
     * 
     * 透明在第二步进行shadowmap的渲染，在完成第一步的shadowmap渲染后(所有不透明)，lightsmanagement进行第二步的shadowmap渲染
     */
    commandsOfShadow: commandsOfShadowOfEntity;

    /**透明阴影渲染队列 */
    commandsOfShadowOfTransparent: commandsOfShadowOfEntityOfTransparent;


    /**
     * 透明材质的渲染队列，是多个摄像机的透明渲染队列集合
     * 
     * 透明绘制流程是在不透明完成之后，所以只有透明的渲染队列，不会有多个渲染队列(color，depth,...);
     * 
     * 但是会有多个摄像机的，所以是一个对象，每个摄像机一个渲染队列。
     */
    commandsOfTransparent: commandsOfShadowOfEntity;




    ////////////////////////////////////////////////////////////////////////////
    //渲染相关

    //反向Z
    reversedZ!: boolean;
    //延迟渲染，depth模式，先绘制depth，单像素
    deferRenderDepth!: boolean;
    //延迟渲染，color模式，todo：先绘制color，depth，材质集中在一起处理，需要一个shader进行处理，即，合批shader
    deferRenderColor!: boolean;

    ////////////////////////////////////////////////////////////////////////////
    //todo
    /**
     * todo
     * 本次是否更新，BVH的可见性,默认=true
     */
    _output: boolean;

    constructor(input: optionBaseEntity) {
        super();
        this._init = lifeState.constructing;
        this.flagUpdateForPerInstance = false;
        this._output = true;
        this.needUpdate = false;
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
        this._cullMode = "back";
        if (input.cullmode) {
            this._cullMode = input.cullmode;
        }

        //注释掉，20250824
        // this._id = 0;//在stage中的ID，默认=0，如果_id=0，则与ID相关的功能失效 
        
        this.stageID = 0;
        // this._LOD = [];

        this.commmands = {};
        this.commandsOfTransparent = {};
        this.commandsOfShadow = {};
        this.commandsOfShadowOfTransparent = {};



        if (input.position) this._position = input.position;
        if (input.scale) this._scale = input.scale;
        if (input.rotate) this._rotate = input.rotate;
        if (input.name) this.Name = input.name;

        //////////////////
        //about shader
        this.structUnifomrBuffer = new ArrayBuffer(this.getSizeOfUniform());//4 * 4 * this.numInstances * 4 + this._entityIdSizeForWGSL * 4
        this.matrixWorldBuffer = new Float32Array(this.structUnifomrBuffer, 0, 4 * 4 * this.numInstances);
        this.entity_id = new Uint32Array(this.structUnifomrBuffer, 4 * 4 * this.numInstances * 4, 1);
        this.stage_id = new Uint32Array(this.structUnifomrBuffer, 4 * 4 * this.numInstances * 4 + 4, 1);
        this.uvU = new Float32Array(this.structUnifomrBuffer, 4 * 4 * this.numInstances * 4 + 4 * 2, 1);
        this.uvV = new Float32Array(this.structUnifomrBuffer, 4 * 4 * this.numInstances * 4 + 4 * 3, 1);


        this.updateMatrixPerFrame = false;


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
    }

    get UVu() {
        return this.uvU[0];
    }
    get UVv() {
        return this.uvV[0];
    }
    set UVu(u: number) {
        this.uvU[0] = u;
    }
    set UVv(v: number) {
        this.uvV[0] = v;
    }

    /**
     * 三段式初始化的第二步：init
     * @param values
     */
    async init(values: optionBaseEntityStep2): Promise<number> {
        this.transparent = this.getTransparent();
        this.stage = values.stage;
        this.stageID = values.stage.ID;
        this.reversedZ = values.reversedZ;
        this.deferRenderDepth = values.deferRenderDepth;
        this.deferRenderColor = values.deferRenderColor;
        await this.setRootENV(values.stage.scene);//为获取在scene中注册的resource

        //如果是OBJ等，需要递归设置ID，或采用一个相同的ID，这个需要在OBJ、GLTF、FBX等中进行开发；基础的entity，不考虑这种情况
        this.renderID = values.renderID;//这个在最后，update需要判断ID是否存在，以开始更新
        return this.renderID + 1;
    }

    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // abstract 部分
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////

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
    /**
     * 可见性(visible)、
     * 可用性(enable)、
     * 初始化状态(_init)
     * 上级group的状态（可见性、使用性）
     */
    abstract checkStatus(): boolean

    /** 生成Box和Sphere */
    abstract generateBoxAndSphere(): void
    /** 获取混合模式 */
    abstract getBlend(): GPUBlendState | undefined;
    /** 获取是否透明 */
    abstract getTransparent(): boolean;
    /**前向渲染 不透明 */
    abstract createDCCC(values: valuesForCreateDCCC): lifeState
    /**延迟渲染的深度渲染：单像素模延迟 ，不透明*/
    abstract createDCCCDeferRenderDepth(values: valuesForCreateDCCC): lifeState
    /**渲染shadowmap 不透明*/
    abstract createDCCCForShadowMap(values: valuesForCreateDCCC): lifeState
    /**渲染shadowmap 透明模式 */
    abstract createDCCCForShadowMapOfTransparent(values: valuesForCreateDCCC): lifeState
    /**透明渲染 */
    abstract createDCCCForTransparent(values: valuesForCreateDCCC): lifeState

    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // 基础部分
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////

    getID() {
        return { stageID: this.stageID, ID: this.ID };
    }
    getStageID() {
        return this.stageID;
    }


    /** 设置是否透明 */
    set transparent(transparent: boolean) {
        this._transparent = transparent;
    }
    /** 获取是否透明 */
    get transparent() {
        return this._transparent;
    }

    /** 世界坐标的Box */
    generateBox(position: number[]): boundingBox {
        let box = generateBox3(position);
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
     * 获取实例渲染的buffer
     * 
     * 单个示例可以在input.update（）进行更新
     */
    getUniformOfMatrix() {
        // return this.matrixWorldBuffer;
        return new Float32Array(this.structUnifomrBuffer);
    }
    /**size of uniform of this.structUnifomrBuffer */
    getSizeOfUniform(){
        return this._entityIdSizeForWGSL * 4 + 4 * 16 * this.numInstances;
    }
    /**检查camear的id在commands中是否已经存在 */
    checkIdOfCommands(id: string, commands: commandsOfEntity | commandsOfShadowOfEntity): boolean {
        for (let i in commands) {
            if (i == id) return true;
        }
        return false;
    }




    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // 阴影相关部分
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /**
     * 是否产生阴影
     * @returns boolean
     */
    getShadwoMapGenerate(): boolean {
        return this._shadow.generate;
    }
    /**
     * 是否接受阴影
     * @returns boolean
     */
    getShadowmAccept() {
        return this._shadow.accept;
    }
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //// update 部分
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /**
     * 更新矩阵的顺序是先进行线性变换，在进行位置变换
     * 
     * 其实是没有影响，线性工作在3x3矩阵，位置变换在[12,13,14]
     */
    updateMatrix(): any {
        super.updateMatrix();

        // this.matrix = mat4.create(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1,);
        // this.matrixWorld = mat4.create(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1,);
        // if (this.input?.matrix)
        //     mat4.copy(this.input.matrix, this.matrix);
        // if (this.input?.scale)
        //     this.scale(this.input.scale);
        // if (this.input?.rotate)
        //     this.rotate(this.input.rotate.axis, this.input.rotate.angleInRadians);

        // if (this.input?.position)
        //     this.setTranslation(this.input.position);

        // if (this.input?.dynamicPostion)
        //     this.setTranslation(this.position);

        this.matrixWorld = this.updateMatrixWorld();
        this.updateUniformBuffer(this.stage as BaseStage, 0, 0, 0);
    }

    /** 
     * todo:20250824,需要更正，第二版设计改为，非子对象递归更新父类的，而是乘以父类的worldMatrix
     * 递归更新每层,
     */
    updateMatrixWorld(m4: Mat4 | boolean = false): Mat4 {
        if (m4 === false)
            m4 = mat4.copy(this.matrix);
        else {
            m4 = mat4.multiply(this.matrix, m4 as Mat4);
        }
        if (this.parent instanceof BaseEntity) {
            return this.parent.updateMatrixWorld(m4);
        }
        else {
            return m4;
        }
    }
    /** 获取当前状态（是否可以进行update）*/
    getStateus(): boolean {
        if (this.checkStatus() && this.visible && this.enable) {
            return true;
        }
        return false;
    }
    /** 清除DCC 渲染队列*/
    clearDCCC() {
        this.commmands = {};
        this.commandsOfShadow = {};
        this.commandsOfShadowOfTransparent = {};
        this.commandsOfTransparent = {};
    }
    //初始化当前entity的DCC
    initDCC(parent: BaseStage) {
        let already = this.checkStatus();
        if (already) {
            this._init = lifeState.initializing;
            this.generateBoxAndSphere();
            this.upgradeLights(parent);
            this.upgradeCameras(parent);

            this._init = lifeState.finished;//this.createDCCC(valueOfCamera);
        }
    }
    /**更新(创建)关于cameras的DCCC commands
     * 
     * @param parent 
     */
    upgradeCameras(parent: BaseStage) {
        for (let i of this.scene.cameraActors) {
            const id = i.id.toString();
            let already: boolean
            //判断透明还是不透明
            if (this.transparent === true) {
                // this.createDCCCForTransparent({ parent, id: "transparent", kind: renderKindForDCCC.transparent });
                already = this.checkIdOfCommands(id, this.commandsOfTransparent);//获取是否已经存在
            }
            else {
                already = this.checkIdOfCommands(id, this.commmands);//获取是否已经存在
            }

            if (already) {
                continue;
            }
            else {
                const valueOfCamera: valuesForCreateDCCC = {
                    parent,
                    id: id,
                    kind: renderKindForDCCC.camera
                };
                if (this.transparent === true) {
                    this.createDCCCForTransparent(valueOfCamera);
                }
                else {
                    if (this.deferRenderDepth) this._init = this.createDCCCDeferRenderDepth(valueOfCamera);
                    this.createDCCC(valueOfCamera);
                }
            }
        }
    }
    /**更新(创建)关于lights的DCCC commands
     * 
     */
    upgradeLights(parent: BaseStage) {
        for (let i of this.scene.lightsManagement.getShdowMapsStructArray()) {
            const id = i.light_id.toString();
            let already: boolean;
            if (this.transparent === true) {
                already = this.checkIdOfCommands(id, this.commandsOfShadowOfTransparent);//获取是否已经存在 
            }
            else {
                already = this.checkIdOfCommands(id, this.commandsOfShadow);//获取是否已经存在
            }
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
                if (this.transparent === true) {
                    this.createDCCCForShadowMapOfTransparent(valueOfLight);
                }
                else {
                    this.createDCCCForShadowMap(valueOfLight);
                }
            }

        }
    }
    /**检查是否有新摄像机，有进行更新 */
    checkUpgradeCameras(parant: BaseStage) {
        const countsOfCamerasCommand = Object.keys(this.commmands).length;
        const countsOfCameraActors = this.scene.cameraActors.length;
        if (countsOfCameraActors > countsOfCamerasCommand) {
            this.upgradeCameras(parant)
        }
    }
    /**检查是否有新光源，有进行更新 */
    checkUpgradeLights(parant: BaseStage) {
        const countsOfCamerasCommand = Object.keys(this.commandsOfShadow).length;
        const countsOfCameraActors = this.scene.lightsManagement.getShdowMapsStructArray().length;
        if (countsOfCameraActors > countsOfCamerasCommand) {
            this.upgradeLights(parant)
        }
    }


    /**每帧更新入口
     * 
     * 1、完成初始化，进行DCC更新
     * 
     * 2、未完成初始化，返回空数组
     * 
     * @param parent BaseStage
     * @param deltaTime 
     * @param startTime 
     * @param lastTime  
     * @returns 
     */
    update(parent: BaseStage, deltaTime: number, startTime: number, lastTime: number) {
        //两阶段初始化状态是否完成
        if (this._readyForGPU && this._id != 0) {
            //如果是延迟初始化，需要在增加到stage之后，才进行初始化
            if (this._init === lifeState.unstart) {
                this.clearDCCC();
                this.updateMatrix();//在这里必须更新一次，entityID，stageID，都是延迟到增加至stage之后才更新的。
                this.initDCC(parent);
                this.needUpdate = false;
            }
            //比如：material 是在运行中是可以更改的，需要重新初始化。
            //由人工按需触发
            else if (this.needUpdate === true) {
                this._init = lifeState.unstart;//重新初始化，下一帧进行重新初始化工作 
            }
            //初始化是完成状态，同时checkStatus=true
            //material 是在运行中是可以更改的，所以需要检查状态。
            else if (this._init === lifeState.finished && this.checkStatus()) {
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
                //检查是否有新光源，有进行更新
                this.checkUpgradeLights(parent);


                if (this._dynamicMesh === true || this._dynamicPostion === true || this.input!.update !== undefined) {
                    this.updateUniformBuffer(parent, deltaTime, startTime, lastTime);
                    // this.commmands = this.updateDCC(parent, deltaTime, startTime, lastTime);
                }
            }
            else if (this._init == lifeState.initializing) {
                this.checkStatus();
            }
        }
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
        this.entity_id[0] = this.renderID;
        this.stage_id[0] = this.getStageID();
    }
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // 输出commands部分
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    /**
     *返回DCC的数组 
     * @param _parent 
     * @param _deltaTime 
     * @param _startTime 
     * @param _lastTime 
     * @returns commandsOfEntity, 返回this.commmands 包括多个camera和light的renderCommands 每个renderCommands中包括3个类型的commands
     */
    updateDCC(_parent: BaseStage, _deltaTime: number, _startTime: number, _lastTime: number): commandsOfEntity {
        return this.commmands;
    }

    /**获取摄像机的渲染commands（所有摄像机的）
     * @returns commandsOfEntity, 返回this.commmands 包括多个camera的Commands 每个数组元素中包括3个类型的commands
     */
    getCommandsOfCameras(): commandsOfEntity {
        return this.commmands;
    }
    /**获取摄像机的渲染的透明commands（所有摄像机的）
   * 
   * @returns commandsOfEntity, 返回this.commmands 包括多个camera的Commands 每个数组元素中包括3个类型的commands
   */
    getCommandsOfCamerasOfTransparent(): commandsOfTransparentOfEntity {
        return this.commandsOfTransparent;
    }

    /**获取shadowmap的 commands
     * 相当于render中的updateDCC()版本
     */
    getCommandsOfShadowMap(): commandsOfShadowOfEntity {
        return this.commandsOfShadow;
    }

    /**获取透明层的shadowmap
     * 
     * @returns commandsOfShadowOfEntity
     */
    getCommandsOfShadowMapOfTransparent(): commandsOfShadowOfEntityOfTransparent {
        return this.commandsOfShadowOfTransparent;
    }


    updateChilden(_parent: BaseStage, _deltaTime: number, _startTime: number, _lastTime: number, _updateForce: boolean = false): commmandType[] {
        return [];
    }




    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //材质合并shader相关部分
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
        if (this.transparent === true) {
            let targets = this.stage!.colorAttachmentTargets;
            let blending = this.getBlend();
            if (blending != undefined) {
                targets[0].blend = blending;
            }
            return targets;

        }
        else {
            return this.stage!.colorAttachmentTargets;
        }
    }


}

