import { BaseEntity, valuesForCreateDCCC } from "../entity/baseEntity";
import { BaseScene, commmandType, sceneJson } from "../scene/baseScene";
import * as coreConst from "../const/coreConst"
import { Scene } from "../scene/scene";
import { CameraActor } from "../actor/cameraActor";
import { renderKindForDCCC } from "../const/coreConst";
import { uniformEntries } from "../command/commandDefine";





/**stage input option */
export interface optionBaseStage extends sceneJson {
    /**stage 的名称 */
    name: string,
    /**是否启用 */
    enable?: boolean,
    /**是否可见 */
    visible?: boolean,
    /**scene */
    scene: Scene,

    /**是否透明 */
    // transparent?: boolean,
}

/**摄像机队列内容 */
export interface cameraCommands {
    /**正常前向渲染 */
    commands: commmandType[];
    /**延迟单像素渲染：第一遍的深度渲染通道描述 */
    commandsDepth: commmandType[];
    /**todo，目前没使用，延迟渲染，合批shader的延迟渲染 */
    commandsColor: commmandType[];
}

/**
 * stage的目标
 * 多stage的renderToTexture，形成color和depth的texture
 * cache使用：BVH，摄像机视锥，静态
 * 为scene的多层stage合并加速
 * 分开处理不透明和透明，并分别处理depth信息，再合并texture，混合透明（颜色+深度）
 */
export class BaseStage extends BaseScene {

    /**entities 集合 */
    root: BaseEntity[];
    /**当前可用的ID，顺序增加 */
    idOfRoot: number;



    /**stage 是否使用，此项目前没有使用 */
    enable!: boolean;
    /**是否可见， 此项目前没有使用*/
    visible!: boolean;
    /**深度测试， 此项目前没有使用*/
    depthTest!: boolean;

    scene!: Scene;

    /**是否使用cache，需要配合GBuffer，即使用上一帧的GBuffer内容， 此项目前没有使用*/
    _cache: boolean;

    /**在stage 的ID，与coreConst中的stagesOfSystem数组的值
     * 20241128 stagesOfSystem[0]="Actor"
     */
    _id!: number;

    get ID() {
        return this._id;
    }
    set ID(id: number) {
        this._id = id;
    }

    /**仅仅输出深度的纹理，非前向渲染的depth buffer */
    depthTextureOnly!: { [name: string]: GPUTexture };

    /**延迟单像素渲染：第一遍的深度渲染通道描述 */
    RPD_ForDeferDepth!: {
        [name: string]: GPURenderPassDescriptor
    };

    /**
     * 多camera队列
     */
    camerasCommands: {
        [name: string]: cameraCommands
    }
    /** 透明渲染队列 */
    camerasCommandsOfTransparent: {
        [name: string]: commmandType[]
    };




    /**   @param input optionBaseStage     */
    constructor(input: optionBaseStage) {
        super(input.scene.input);//采用与scene相同的初始化参数,主要考虑的ReversedZ
        //////////////////////////////////////////////////////////////////////////////////////
        //初始化空值
        this.RPD_ForDeferDepth = {};
        this.depthTextureOnly = {};
        this.root = [];
        this.camerasCommandsOfTransparent = {};
        this.camerasCommands = {
            default: {
                commands: [],
                commandsDepth: [],
                commandsColor: []
            }
        };
        // this.lightsCommands = {}

        ////////////////////////////////////////////////////////////////////////////////////
        //初始化默认值
        this.idOfRoot = 1;
        this._cache = false;
        this.enable = true;
        this.visible = true;

        ///////////////////////////////////////////////////////////////////////////////////
        //赋值从input
        this.device = input.scene!.device;
        this.scene = input.scene;
        // this.backgroudColor = this.scene.backgroudColor;


        if (input.scene)
            this.scene = input.scene;

        this.deferRender = input.deferRender!.enable;

        if (input.enable != undefined && input.enable === false) {
            this.enable = input.enable;
        }
        if (input.visible != undefined && input.visible === false) {
            this.visible = input.visible;
        }
        //从scene中复制
        this.presentationFormat = this.scene.presentationFormat;
        this.depthDefaultFormat = input.scene!.depthDefaultFormat;
        this.deferRenderDepth = input.scene!.deferRenderDepth;
        this.deferRenderColor = input.scene!.deferRenderColor;
        this._isReversedZ = input.scene!._isReversedZ;
        this.depthStencilOfZ = input.scene!.depthStencilOfZ;
        this.depthStencil = input.scene!.depthStencil;
        this.backgroudColor = input.scene!.backgroudColor;



        ///////////////////////////////////////////////////////////////////////////////////
        //设置
        let name = input.name;
        let addonName = "";
        //20250404
        // if (input.transparent)            addonName = "_transparent";

        this.name = input.name + addonName;
        //这个是写死的，后期改成公共functon，需要同步更改pickup.ts getTargetID()中的内容
        /**设置stage id，不透明=数组下标*2，透明=数组下标*2+1 */
        for (let i in coreConst.stagesOfSystem) {
            if (name == coreConst.stagesOfSystem[i]) {
                this.ID = parseInt(i) * 2 + 1;//+ 1 代表actor 从0 到1，避免了在shader中，没有stage=0，actor也是0;
                break;
            }
        }
    }
    /**实现父类的抽象定义 */
    async init() { }

    /** 
     * 初始化camera的GBuffer，
     * 初始化camera的renderPassDescriptor，
     *  如果由单像素延迟渲染，则初始化camera的deferDepth
     * 
     * @param camera id:string
     */
    async initCameraGBuffer(camera: string) {
        const width = this.scene.canvas.width;
        const height = this.scene.canvas.height;
        //stage初始化defer render（单像素模式）使用
        //如果启用了单像素延迟渲染
        if (this.deferRenderDepth) {
            //深度buffer
            this.depthTextureOnly[camera] = this.device.createTexture({
                label: "stage:depth attachemnet of one pixel defer",
                size: [width, height],
                format: this.depthDefaultFormat,            // format: 'depth24plus',
                usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC | GPUTextureUsage.TEXTURE_BINDING,
            });
            this.RPD_ForDeferDepth[camera] = this.createRPD_ForDeferDepth(camera);
        }
        //初始化GBuffers
        this.GBuffers[camera] = await this.initGBuffers(this.scene!.canvas!.width, this.scene!.canvas.height);
        //初始化renderPassDescriptor by camera
        this.renderPassDescriptor[camera] = await this.createRenderPassDescriptor(camera);
    }

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //RPD

    /**延迟单像素depth通道描述 RPD*/
    createRPD_ForDeferDepth(camera: string, _kind?: string): GPURenderPassDescriptor {
        // this.depthStencilAttachment = this.depthTexture.createView();
        const renderPassDescriptor: GPURenderPassDescriptor = {
            colorAttachments: [],
            depthStencilAttachment: {
                view: this.depthTextureOnly[camera].createView(),
                depthClearValue: this._isReversedZ ? this.depthClearValueOfReveredZ : this.depthClearValueOfZ,// 根据是否适用Reversed Z而定
                // depthLoadOp: 'load',
                depthLoadOp: 'clear',
                depthStoreOp: 'store',
            },
        };
        return renderPassDescriptor;
    }

    /**获取前向渲染通道，不透明RPD */
    getRenderPassDescriptor(camera: string, _kind?: string): GPURenderPassDescriptor {
        return this.renderPassDescriptor[camera];
    }

    /**透明RPD*/
    getRenderPassDescriptorOfTransparent(camera: string, _kind?: string): GPURenderPassDescriptor {
        return this.scene.getRenderPassDescriptorOfTransparent(camera);
    }

    /**获取摄像机的透明绘制通道的pipeline的depthStancil */
    getDepthStencilOfTransparent(camera: string): GPUDepthStencilState {
        return this.scene.cameraTransparentRender[camera].getDepthStencil();
    }

    /**深度RPD，获取单像素延迟渲染通道 */
    getRenderPassDescriptor_ForDeferDepth(camera: string, _kind?: string): GPURenderPassDescriptor {
        return this.RPD_ForDeferDepth[camera];
    }

    /** shadowmap 渲染RPD */
    getRenderPassDescriptorOfLight(values: valuesForCreateDCCC): GPURenderPassDescriptor | false {
        return this.scene.lightsManagement.gettShadowMapRPD(values);
    }

    getCountsOfCommandsOfCamra(cameraID: string): number {
        let counts = 0;
        if (this.camerasCommands[cameraID] !== undefined && this.camerasCommands[cameraID].commands != undefined) {
            counts = this.camerasCommands[cameraID].commands.length;
        }
        return counts;
    }
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //uniform

    /** camera 获取bingGroup
     * 
     * @param pipeline 
     * @param scope 
     * @param camera 
     * @param kind 
     * @returns 
     */
    createSystemUnifromGroupForPerShader(pipeline: GPURenderPipeline, scope: BaseStage, camera?: string, kind?: renderKindForDCCC): GPUBindGroup {
        if (camera == undefined) {//默认摄像机
            return scope.scene.createSystemUnifromGroupForPerShader(pipeline);
        }
        else {
            return scope.scene.createSystemUnifromGroupForPerShader(pipeline, /*scope.scene,*/ camera, kind);
        }
    }

    /** camera 获取bingGroup，仅包含VS部分*/
    createSystemUnifromGroupForPerShaderForOnlyVS(pipeline: GPURenderPipeline, scope: BaseStage, camera?: string, kind?: renderKindForDCCC): GPUBindGroup {
        if (camera == undefined) {//默认摄像机
            return scope.scene.createSystemUnifromGroupForPerShaderForOnlyVS(pipeline);
        }
        else {
            return scope.scene.createSystemUnifromGroupForPerShaderForOnlyVS(pipeline, /*scope.scene,*/ camera, kind);
        }
    }

    /**light的shadow map 获取 bindGroup
     * 
     * @param pipeline 
     * @param scope 
     * @param id 
     * @param _kind 
     * @returns 
     */
    createSystemUnifromGroupForPerShaderOfShadowMap(pipeline: GPURenderPipeline, scope: BaseStage, id?: string, _kind?: renderKindForDCCC): GPUBindGroup {
        let ID = id!.split("_");
        return scope.scene.createSystemUnifromGroupForPerShaderOfShadowMap(pipeline, /*scope.scene,*/ ID[0], parseInt(ID[1]));
    }

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //render
    //todo 20241020，未进行距离、方向、可见性、视锥、BVH等的剔除

    /**stage的调用入口 */
    render() {
        if (this.cache === false) {//无缓存模式
            if (this.deferRenderDepth) {
                this.renderOfDepth();
            }
            this.renderOfForward();//进行前向渲染，在这个stage中
            this.copyForTAA();
        }
        // this.renderForLightsShadowMap();//作废，转移到lightsManagement中
    }


    //todo,stage 中的TAA，可以减少与非本stage的干扰
    copyForTAA() { }


    /**
     * render延迟单像素渲染的第一遍depth
     * @param deltaTime 
     * @param startTime 
     * @param lastTime 
     */
    renderOfDepth() {
        for (let Ci in this.camerasCommands) {
            if (Ci == this.scene.defaultCameraActor.id.toString() || this.scene.multiCamera) {
                const commands = this.camerasCommands[Ci];
                if (commands.commandsDepth.length > 0) {
                    //如果有延迟渲染，这个是第二遍渲染，前向则是就一遍
                    for (let i in commands.commandsDepth) {
                        if (i == "0") {
                            this.RPD_ForDeferDepth[Ci].depthStencilAttachment!.depthLoadOp = "clear";
                        }
                        else if (i == "1") {
                            this.RPD_ForDeferDepth[Ci].depthStencilAttachment!.depthLoadOp = "load";
                        }
                        commands.commandsDepth[i].update();
                    }
                }
            }
        }
    }

    /**渲染每个摄像机的透明材质 */
    renderTransparent() {
        for (let Ci in this.camerasCommandsOfTransparent) {
            if (Ci == this.scene.defaultCameraActor.id.toString() || this.scene.multiCamera) {
                const commands = this.camerasCommandsOfTransparent[Ci];
                if (commands.length > 0) {
                    //如果有延迟渲染，这个是第二遍渲染，前向则是就一遍
                    for (let i in commands) {
                        if (i == "0") {
                            //todo，20250410 RPD 需要使用新的为透明的RPD
                            for (let i in this.renderPassDescriptor[Ci].colorAttachments as GPURenderPassColorAttachment[]) {
                                let perOne = (<GPURenderPassColorAttachment[]>this.renderPassDescriptor[Ci].colorAttachments)[i];
                                perOne.loadOp = "clear";
                            }
                        }
                        else if (i == "1") {
                            for (let i in this.renderPassDescriptor[Ci].colorAttachments as GPURenderPassColorAttachment[]) {
                                let perOne = (<GPURenderPassColorAttachment[]>this.renderPassDescriptor[Ci].colorAttachments)[i];
                                perOne.loadOp = "load";
                            }
                        }
                        commands[i].update();

                    }
                }
            }
        }
    }

    /**
     * 前向渲染或是延迟单像素渲染的第二遍
     * @param deltaTime 
     * @param startTime 
     * @param lastTime 
     */
    renderOfForward() {
        for (let Ci in this.camerasCommands) {
            if (Ci == this.scene.defaultCameraActor.id.toString() || this.scene.multiCamera) {
                const commands = this.camerasCommands[Ci];
                if (commands.commands.length > 0) {
                    //如果有延迟渲染，这个是第二遍渲染，前向则是就一遍
                    for (let i in commands.commands) {
                        if (i == "0") {
                            for (let i in this.renderPassDescriptor[Ci].colorAttachments as GPURenderPassColorAttachment[]) {
                                let perOne = (<GPURenderPassColorAttachment[]>this.renderPassDescriptor[Ci].colorAttachments)[i];
                                perOne.loadOp = "clear";
                                //202411290014:不需要每个更新,但canvas需要,copytexturetotextur,只是copy,也不需要
                                // perOne.view = this.colorTextureViews[i];////20241128：这一步在canvas中式必须的，texture 是否必须，测试后给出定论
                            }
                            // (<GPURenderPassColorAttachment[]>this.renderPassDescriptor.colorAttachments)[0].loadOp = "clear";
                            this.renderPassDescriptor[Ci].depthStencilAttachment!.depthLoadOp = "clear";
                            // (<GPURenderPassColorAttachment[]>this.renderPassDescriptor.colorAttachments)[0].view =
                            //     this.colorAttachment;
                        }
                        else if (i == "1") {
                            for (let i in this.renderPassDescriptor[Ci].colorAttachments as GPURenderPassColorAttachment[]) {
                                let perOne = (<GPURenderPassColorAttachment[]>this.renderPassDescriptor[Ci].colorAttachments)[i];
                                perOne.loadOp = "load";
                            }
                            //(<GPURenderPassColorAttachment[]>this.renderPassDescriptor.colorAttachments)[0].loadOp = "load";
                            this.renderPassDescriptor[Ci].depthStencilAttachment!.depthLoadOp = "load";
                        }
                        commands.commands[i].update();
                    }
                }
            }
        }

    }
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //update

    /**更新entities容器RooT的每个entity */
    update(deltaTime: number, startTime: number, lastTime: number) {
        if (Object.keys(this.GBuffers).length == 0) {
            return;
        }
        this.Box3s = [];//清空包围盒
        this.camerasCommands = {};
        this.camerasCommandsOfTransparent = {};
        // this.lightsCommands = {};
        for (let i of this.root) {
            if (i.enable && i.visible) {
                i.update(this, deltaTime, startTime, lastTime);
                // let dcc = i.update(this, deltaTime, startTime, lastTime);
                if (i.boundingBox)
                    this.Box3s.push(i.boundingBox);
                if (i.getTransparent()) {
                    let dcc = i.getCommandsOfCamerasOfTransparent();//获取entity的渲染命令(摄像机的)
                    for (let oneCA of this.scene.cameraActors) {
                        if (this.camerasCommandsOfTransparent[oneCA.id.toString()] == undefined) {//若camera是有效的，清空stage中的cameresCommandsOfTransparent中对应的内容
                            this.camerasCommandsOfTransparent[oneCA.id.toString()] = [];
                        }
                        for (let j of dcc[oneCA.id]) {//透明
                            this.camerasCommandsOfTransparent[oneCA.id.toString()].push(j);
                        }
                    }
                }
                else {
                    let dcc = i.getCommandsOfCameras();//获取entity的渲染命令(摄像机的)
                    if (Object.keys(dcc).length)//如果是有效的,dcc里面是camera的id的string形式
                    {
                        //CameraActor 循环
                        for (let oneCA of this.scene.cameraActors) {
                            if (this.camerasCommands[oneCA.id.toString()] == undefined) {//若camera是有效的，清空stage中的cameresCommands中对应的内容
                                this.camerasCommands[oneCA.id.toString()] = {
                                    commands: [],
                                    commandsDepth: [],
                                    commandsColor: []
                                };
                            }
                            //这里需要将BaseEntity中的renderCommands转换到cameraCommands
                            // if (oneCA.id == this.scene.defaultCameraActor.id) 
                            if (this.getRenderVisibleForCamera(oneCA, i)) {//获取entity的可视性

                                if (this.deferRenderDepth) {//单像素延迟渲染
                                    for (let j of dcc[oneCA.id].depth) {
                                        // this.commandsDepth.push(j);
                                        this.camerasCommands[oneCA.id.toString()].commandsDepth.push(j);
                                    }
                                }
                                for (let j of dcc[oneCA.id].forward) {//正常前向渲染
                                    // this.commands.push(j);
                                    this.camerasCommands[oneCA.id.toString()].commands.push(j);
                                }
                                //未涉及延迟渲染的color模式
                            }
                        }
                    }
                    //获取shadowmap的commands（光源的）
                    const commandShadowMap = i.getCommandsOfShadowMap();
                    //输出到light management的lightsCommands中,按照lightID
                    if (Object.keys(commandShadowMap).length) {
                        for (let oneSM in commandShadowMap) {
                            if (this.scene.lightsManagement.lightsCommands[oneSM] == undefined) {
                                this.scene.lightsManagement.lightsCommands[oneSM] = [];
                            }
                            for (let i of commandShadowMap[oneSM]) {
                                this.scene.lightsManagement.lightsCommands[oneSM].push(i);
                            }
                        }
                    }
                }
            }
        }
    }

    /**todo */
    getRenderVisibleForCamera(_camera: CameraActor, _entity: BaseEntity): boolean {
        return true;
    }

    /**todo */
    getRenderVisibleForLight(_camera: CameraActor, _entity: BaseEntity): boolean {
        return true;
    }

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //ADD entity
    /**
     * entity add
     * 
     * 操作：
     * 
     * 1、给entity设置GPU环境
     * 
     * 2、将entity增加到stage的root[]
     * 
     * 3、设置entity的ID和所属stage ID
     * 
     * @param one :BaseEntity
     */
    async add(one: BaseEntity): Promise<number> {
        // one.stage = this;
        // one.stageTransparent = this.scene.stages[this.name].transparent;
        // one.stageID = this.ID;
        // await one.setRootENV(this.scene);
        // this.root.push(one);
        // one.ID = this.root.length

        //由entity自己负责ID的递增
        let tempID = this.idOfRoot;
        this.idOfRoot = await one.init({
            stage: this,
            ID: this.idOfRoot,
            // ID: this.idOfRoot++,
            reversedZ: this.scene._isReversedZ,
            deferRenderDepth: this.deferRenderDepth,
            deferRenderColor: this.deferRenderColor
        })
        if (tempID == this.idOfRoot) {
            this.idOfRoot++;
        }
        this.root.push(one);
        return one.ID;
    }

    remove(one: BaseEntity) {
        let index = this.root.indexOf(one);
        if (index != -1) {
            this.root.splice(index, 1);
        }
        else {
            console.warn("remove error,can not find entity in stage", one);
        }
    }

    get cache() {
        return this._cache;
    }

    set cache(enable: boolean) {
        this._cache = enable;
    }

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // shader 合并

    // getWGSLOfSystemShaderFS(renderType: renderKindForDCCC): string {
    //     return this.scene!.getWGSLOfSystemShaderFS(renderType);
    // }
    // getWGSLOfSystemShaderVS(renderType: renderKindForDCCC): string {
    //     return this.scene!.getWGSLOfSystemShaderVS(renderType);
    // } 
    getWGSLOfSystemShaderOnlyVS(renderType: renderKindForDCCC): string {
        return this.scene!.getWGSLOfSystemShaderOnlyVS(renderType);
    }
    getWGSLOfSystemShader(renderType: renderKindForDCCC): string {
        return this.scene!.getWGSLOfSystemShader(renderType);
    }

    /**透明透明渲染的四个texture(depth,id,uv,normal)的binding的参数*/
    geTransparentOfUniform(cameraID: string, binding: number): uniformEntries[] {
        return this.scene.geTransparentOfUniform(cameraID, binding);
    }



}