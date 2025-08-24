/////////////////////////////////////////////////////////////////////////////
// commands 

import { ComputeCommand } from "./ComputeCommand";
import { CopyCommandT2T } from "./copyCommandT2T";
import { DrawCommand } from "./DrawCommand";

export type commmandType = DrawCommand | ComputeCommand | CopyCommandT2T;

/** 不透明渲染的队列类型 */
export interface renderCommands {
    /**前向渲染 */
    forward: commmandType[],
    /**单像素延迟渲染的深度渲染 */
    depth: commmandType[],
    /**20250501未使用， 
     * 延迟渲染的shader合并后的渲染队列，
    */
    color: commmandType[],
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


export type commandsOfTransparentOfEntity = commandsOfShadowOfEntity;

export type commandsOfShadowOfEntityOfTransparent = commandsOfShadowOfEntity;