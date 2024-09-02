import { DrawCommand } from "../command/DrawCommand"
import { ComputeCommand } from '../command/ComputeCommand';
import { BaseEntity } from "../entity/baseEntity";
import { BaseScene, sceneJson, renderPassSetting } from "../scene/baseScene";

export type commmandType = DrawCommand | ComputeCommand;

 


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
    enable!: boolean;
    visible!: boolean;
    depthTest!: boolean;
    transparent!: boolean;

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


    constructor(input: optionBaseStage) {
        super(input);
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
    update(deltaTime: number) {
        throw new Error("Method not implemented.");
    }
    add(one: BaseEntity) {
        this.root.push(one);
    }
}