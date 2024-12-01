import { DrawCommand } from "../command/DrawCommand"
import { ComputeCommand } from '../command/ComputeCommand';
import { BaseEntity } from "../entity/baseEntity";
import { BaseScene, sceneJson } from "../scene/baseScene";
import { BaseLight } from "../light/baseLight";
import { BaseCamera } from "../camera/baseCamera";
import * as coreConst from "../const/coreConst"
import { Scene } from "../scene/scene";
export type commmandType = DrawCommand | ComputeCommand;


declare type lights = BaseLight[];
declare interface lightUniform { }
declare interface BVH { }
/**system  uniform 时间结构体 */
declare interface timeUniform {
    deltaTime: number, startTime: number, lastTime: number,
    time: number,
}


/**
 * 透明和不透明stage组合
 */
// export interface stageGroup {
//     opaque?: BaseStage,
//     transparent?: BaseStage,
// }

export class stageGroup {
    opaque: BaseStage | undefined;
    transparent: BaseStage | undefined;
}



/**stage input option */
export interface optionBaseStage extends sceneJson {
    name: string,
    enable?: boolean,
    visible?: boolean,
    depthTest?: boolean,
    transparent?: boolean,
    // scene: BaseScene;
    scene: Scene;
}

/**
 * stage的目标
 * 多stage的renderToTexture，形成color和depth的texture
 * cache使用：BVH，摄像机视锥，静态
 * 为scene的多层stage合并加速
 * 分开处理不透明和透明，并分别处理depth信息，再合并texture，混合透明（颜色+深度）
 */
export class BaseStage extends BaseScene {


    root: BaseEntity[];


    // start todo ,20241020,不同的stage可能存在不同light的可见情况，不同的环境光，比如：室外，室内，
    // light ,camera 的数组为空，或为undefined，则使用全局（Scene）的。
    /**cameras 默认摄像机 */
    defaultCamera: BaseCamera | undefined;

    //end todo

    enable!: boolean;
    visible!: boolean;
    depthTest!: boolean;
    transparent!: boolean;
    scene!: Scene;
    _cache: boolean;



    /** stage d context 为 GPUTexture */
    declare context: GPUTexture;

    /**stage 缓存，是否需要需要 todo */
    colorTextureCache!: GPUTexture;
    /**stage 缓存，是否需要需要 todo */
    depthTextureCache!: GPUTexture;
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
    /**ID color texture */
    colorTextureForID!: GPUTexture;
    /**仅仅输出深度的纹理，非前向渲染的depth buffer */
    depthTextureOnly!: GPUTexture;
    /**color attachment 的 view 数组 */
    colorTextureViews!: GPUTextureView[];

    /**延迟单像素渲染：第一遍的深度渲染通道描述 */
    RPD_ForDeferOnePixelDepth!: GPURenderPassDescriptor


    /**   @param input optionBaseStage     */
    constructor(input: optionBaseStage) {
        super(input.scene.input);//采用与scene相同的初始化参数,主要考虑的ReversedZ
        this.device = input.scene!.device;
        this.scene = input.scene;
        this.presentationFormat = this.scene.presentationFormat;
        // this.depthDefaultFormat=this.scene.depthDefaultFormat;
        this._cache = false;
        if (input.scene)
            this.scene = input.scene;

        this.root = [];
        this.enable = true;
        this.visible = true;
        this.depthTest = true;
        this.transparent = false;

        if (input.enable != undefined && input.enable === false) {
            this.enable = input.enable;
        }
        if (input.visible != undefined && input.visible === false) {
            this.visible = input.visible;
        }
        if (input.depthTest != undefined && input.depthTest === false) {
            this.depthTest = input.depthTest;
        }
        if (input.transparent != undefined && input.transparent === true) {
            this.transparent = input.transparent;
        }
        let name = input.name;

        /**设置stage id，不透明=数组下标*2，透明=数组下标*2+1 */
        for (let i in coreConst.stagesOfSystem) {
            if (name == coreConst.stagesOfSystem[i]) {
                this.ID = parseInt(i) * 2;//+ 1;
                if (input.transparent)
                    this.ID++;
                break;
            }
        }
        //this.init();
    }
    async init() {
        await this.initGBuffers(this.scene!.canvas!.width, this.scene!.canvas.height);
        this.renderPassDescriptor = this.createRenderPassDescriptor();
        if (this.deferRender)
            this.RPD_ForDeferOnePixelDepth = this.createRPD_ForDeferOnePixelDepth();
    }
    /**stage是初始化GBuffer使用
     * 
     * GBuffer有两层初始化，
     * 
     * 1、初始化GBuffer，这个scene 和 stage 通用
     * 
     * 2、stage初始化defer render（单像素模式）使用
      */
    async initGBuffers(width: number, height: number) {
        super.initGBuffers(width, height);


        /////////////gbuffer ，需要整合到BaseScene中
        //输出到texture，而不是canvas
        this.colorTextureForID = this.device.createTexture({
            label: "stage:color attachemnet for entity id",
            size: [width, height],
            format: "r32uint",
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC | GPUTextureUsage.TEXTURE_BINDING

        });
        if (this.deferRender) {
            //深度buffer
            this.depthTextureOnly = this.device.createTexture({
                label: "stage:depth attachemnet of one pixel defer",
                size: [width, height],
                format: this.depthDefaultFormat,            // format: 'depth24plus',
                usage: GPUTextureUsage.RENDER_ATTACHMENT,
            });

        }
    }
    /**延迟单像素depth通道描述 */
    createRPD_ForDeferOnePixelDepth(): GPURenderPassDescriptor {
        // this.depthStencilAttachment = this.depthTexture.createView();
        const renderPassDescriptor: GPURenderPassDescriptor = {
            colorAttachments: [],
            depthStencilAttachment: {
                view: this.depthTextureOnly.createView(),
                depthClearValue: this._isReversedZ ? this.depthClearValueOfReveredZ : this.depthClearValueOfZ,// 根据是否适用Reversed Z而定
                // depthLoadOp: 'load',
                depthLoadOp: 'clear',
                depthStoreOp: 'store',
            },
        };
        return renderPassDescriptor;
    }


    /**获取前向渲染通道 */
    getRenderPassDescriptor(): GPURenderPassDescriptor {
        return this.renderPassDescriptor;
    }
    getRenderPassDescriptor_ForDeferOnePixelDepth(): GPURenderPassDescriptor {
        return this.RPD_ForDeferOnePixelDepth;
    }
    updateSystemUniformBuffer() {
        return this.scene.updateSystemUniformBuffer();
    }
    createSystemUnifromGroupForPerShader(pipeline: GPURenderPipeline): GPUBindGroup {
        return this.scene.createSystemUnifromGroupForPerShader(pipeline);
    }
    getMVP(): GPUBuffer {
        return this.scene.getMVP();
    }

    updateToDepth(deltaTime: number, startTime: number, lastTime: number) {

    }

    //todo 20241020，未进行距离、方向、可见性、视锥、BVH等的剔除


    /**stage的调用入口 */
    update(deltaTime: number, startTime: number, lastTime: number) {
        if (this.cache === false) {//无缓存模式
            this.updateOfRoot(deltaTime, startTime, lastTime);//更新command
            if (this.deferRender) {
                this.renderOfDepth(deltaTime, startTime, lastTime);
            }
            this.renderOfForward(deltaTime, startTime, lastTime);//进行前向渲染，在这个stage中
            this.copyForTAA();
        }
    }
    //todo
    copyForTAA() { }
    /**
     * render延迟单像素渲染的第一遍depth
     * @param deltaTime 
     * @param startTime 
     * @param lastTime 
     */
    renderOfDepth(deltaTime: number, startTime: number, lastTime: number) {

    }
    /**
     * 前向渲染或是延迟单像素渲染的第二遍
     * @param deltaTime 
     * @param startTime 
     * @param lastTime 
     */
    renderOfForward(deltaTime: number, startTime: number, lastTime: number) {
        if (this.command.length > 0) {
            //如果有延迟渲染，这个是第二遍渲染，前向则是就一遍
            for (let i in this.command) {
                if (i == "0") {
                    for (let i in this.renderPassDescriptor.colorAttachments as GPURenderPassColorAttachment[]) {
                        let perOne = (<GPURenderPassColorAttachment[]>this.renderPassDescriptor.colorAttachments)[i];
                        perOne.loadOp = "clear";
                        //202411290014:不需要每个更新,但canvas需要,copytexturetotextur,只是copy,也不需要
                        // perOne.view = this.colorTextureViews[i];////20241128：这一步在canvas中式必须的，texture 是否必须，测试后给出定论
                    }
                    // (<GPURenderPassColorAttachment[]>this.renderPassDescriptor.colorAttachments)[0].loadOp = "clear";
                    this.renderPassDescriptor.depthStencilAttachment!.depthLoadOp = "clear";
                    // (<GPURenderPassColorAttachment[]>this.renderPassDescriptor.colorAttachments)[0].view =
                    //     this.colorAttachment;
                }
                else if (i == "1") {
                    for (let i in this.renderPassDescriptor.colorAttachments as GPURenderPassColorAttachment[]) {
                        let perOne = (<GPURenderPassColorAttachment[]>this.renderPassDescriptor.colorAttachments)[i];
                        perOne.loadOp = "load";
                    }
                    //(<GPURenderPassColorAttachment[]>this.renderPassDescriptor.colorAttachments)[0].loadOp = "load";
                    this.renderPassDescriptor.depthStencilAttachment!.depthLoadOp = "load";
                }
                this.command[i].update();
            }
        }
    }
    /**更新entities容器RooT的每个entity */
    updateOfRoot(deltaTime: number, startTime: number, lastTime: number) {
        let scene;
        //Draw Command 适用谁的renderPassDescriptor
        // if (this.scene)
        //     scene = this.scene;
        // else
        scene = this;
        this.command = [];
        for (let i of this.root) {
            let dcc = i.update(scene, deltaTime, startTime, lastTime);
            for (let j of dcc)
                this.command.push(j);
        }
    }

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
    async add(one: BaseEntity) {
        await one.setRootENV(this.scene);
        this.root.push(one);
        one.ID = this.root.length
        one.stage = this;
        one.stageID = this.ID;
    }
    get cache() {
        return this._cache;
    }
    set cache(enable: boolean) {
        this._cache = enable;
    } 
    getWGSLOfSystemShader(): string {
        return this.scene!.getWGSLOfSystemShader();

    }
}