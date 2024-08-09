import {
    DrawCommand,
    // primitiveOption,
    // drawModeIndexed,
    // drawMode,
    // indexBuffer,
    // unifromGroup,
    // uniformEntries,
    // uniformBufferPart,
    // fsPart,
    // vsPart,
    // vsAttributes
} from "../command/DrawCommand"

import { ComputeCommand } from '../command/ComputeCommand';

export type commmandType = DrawCommand | ComputeCommand;

export declare interface stageType {
    root: [],
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

export class Stage implements stageType{
    root!: [];
    name!: string;
    enable!: boolean;
    visible!: boolean;
    depthTest!: boolean;
    transparent!: boolean;
    command!: commmandType[];
    
}