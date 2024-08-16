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
    opaque: BaseStage,
    transparent: BaseStage,
}

export type stageType = stageOne | stageGroup;



export class BaseStage implements stageOne {
    root: BaseEntity[];
    name!: string;
    enable!: boolean;
    visible!: boolean;
    depthTest!: boolean;
    transparent!: boolean;

    /**每个stage的command集合 
     * 一个实体可以由多个command，分布在不同的stage，比如透明，不透明
    */
    command!: commmandType[];
    depthTexture: GPUTexture | undefined;//sky don't has depth texture.
    constructor() {
        this.root = [];
    }
    add(one: BaseEntity) {
        this.root.push(one);
    }
}