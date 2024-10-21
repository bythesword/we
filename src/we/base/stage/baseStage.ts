import { DrawCommand } from "../command/DrawCommand"
import { ComputeCommand } from '../command/ComputeCommand';
import { BaseEntity } from "../entity/baseEntity";
import { BaseScene, sceneJson, renderPassSetting } from "../scene/baseScene";
import { BaseLight } from "../light/baseLight";
import { BaseCamera } from "../camera/baseCamera";
import { AmbientLight } from "../light/ambientLight";

export type commmandType = DrawCommand | ComputeCommand;


declare type lights = BaseLight[];
declare interface lightUniform { }
declare interface BVH { }
/**system  uniform 时间结构体 */
declare interface timeUniform {
    deltaTime: number,
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
    name: string;
    enable?: boolean;
    visible?: boolean;
    depthTest?: boolean;
    transparent?: boolean;
    scene?: BaseScene;
}

/**
 * stage的目标
 * 多stage的renderToTexture，形成color和depth的texture
 * cache使用：BVH，摄像机视锥，静态
 * 为scene的多层stage合并加速
 * 分开处理不透明和透明，并分别处理depth信息，再合并texture，混合透明（颜色+深度）
 */
export class BaseStage extends BaseScene {
    getSystemUnifromGroupForPerShader(): GPUBindGroupEntry[] {
        throw new Error("Method not implemented.");
    }
    getWGSLOfSystemShader(): string {
        throw new Error("Method not implemented.");
    }


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
    scene: BaseScene | undefined;
    _cache: boolean;

    /**每个stage的command集合 
     * 一个实体可以由多个command，分布在不同的stage，比如透明，不透明
    */
    command: commmandType[];

    /** stage d context 为 GPUTexture */
    declare context: GPUTexture;

    /**stage 缓存，是否需要需要 todo */
    colorTextureCache!: GPUTexture;
    /**stage 缓存，是否需要需要 todo */
    depthTextureCache!: GPUTexture;

    /**
     * 
     * @param input optionBaseStage
     */
    constructor(input: optionBaseStage) {
        super(input);
        this._cache = false;
        if (input.scene)
            this.scene = input.scene;
        this.command = [];
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

    }
    init() {
        throw new Error("Method not implemented.");
    }
    createRenderPassDescriptor(): GPURenderPassDescriptor {
        throw new Error("Method not implemented.");
    }
    getRenderPassDescriptor(): GPURenderPassDescriptor {
        throw new Error("Method not implemented.");
    }
    updateSystemUniformBuffer() {
        throw new Error("Method not implemented.");
    }
    createSystemUnifromGroupForPerShader(pipeline: GPURenderPipeline): GPUBindGroup {
        throw new Error("Method not implemented.");
    }
    getMVP(): GPUBuffer {
        throw new Error("Method not implemented.");
    }

    //todo 20241020，未进行距离、方向、可见性、视锥、BVH等的剔除
    update(deltaTime: number) {
        let scene;
        if (this.scene)
            scene = this.scene;
        else
            scene = this;
        //没有应用cache的情况
        if (this.cache === false) {
            this.command = [];
            for (let i of this.root) {
                let dcc = i.update(scene, deltaTime);
                for (let j of dcc)
                    this.command.push(j);
            }
        }

    }
    add(one: BaseEntity) {
        this.root.push(one);
    }
    get cache() {
        return this._cache;
    }
    set cache(enable: boolean) {
        this._cache = enable;
    }
}