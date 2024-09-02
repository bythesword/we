import { DrawCommand } from "../command/DrawCommand"
import { ComputeCommand } from '../command/ComputeCommand';
import { BaseEntity } from "../entity/baseEntity";

export type commmandType = DrawCommand | ComputeCommand;

export declare interface stageOne {
    root: BaseEntity[],
    name: string,
    enable: boolean,
    visible: boolean,
    depthTest: boolean,
    transparent: boolean,
    /**每个stage的command集合 
     * 一个实体可以由多个command，分布在不同的stage，比如透明，不透明
    */
    command: commmandType[];
}


/**
 * 透明和不透明stage组合
 */
export interface stageGroup {
    isGroup: true,
    opaque?: BaseStage,
    transparent?: BaseStage,
}

export type stageType = stageOne | stageGroup;


/**stage input option */
export interface optionBaseStage {
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
export class BaseStage implements stageOne {
    input: optionBaseStage;
    root: BaseEntity[];
    name!: string;
    enable!: boolean;
    visible!: boolean;
    depthTest!: boolean;
    transparent!: boolean;

    /**每个stage的command集合 
     * 一个实体可以由多个command，分布在不同的stage，比如透明，不透明
    */
    command: commmandType[];


    //todo 202408
    /**
     * 必须
     * 与其他stage合并texture或shader使用
     * 透明和不透明都需要；
     * 
     */
    depthTexture: GPUTexture | undefined;//sky don't has depth texture.

    //todo 20240825
    /**
     * 必须
     * 充分应用webGPU的texture的理念
     * 每个stage都是一个texture
     * scene，合并stage的texture，可以对stage进行缓存，即不变，就用上一张texture
     * 缓存用（比如world的缓存，镜头不动）
     * */
    colorTexture: GPUTexture | undefined;

    /** */
    constructor(input: optionBaseStage) {
        this.root = [];
        this.command = [];
        this.input = input;
        this.name = input.name;
        if (input.enable === false) {
            this.enable = input.enable;
        }
        else {
            this.enable = true;
        }
        if (input.visible === false) {
            this.visible = input.visible;
        }
        else {
            this.visible = true;
        }
        if (input.depthTest === false) {
            this.depthTest = input.depthTest;
        }
        else {
            this.depthTest = true;
        }
        if (input.transparent === false) {
            this.transparent = input.transparent;
        }
        else {
            this.transparent = true;
        }
    }
    add(one: BaseEntity) {
        this.root.push(one);
    }
}