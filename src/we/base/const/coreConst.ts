/** 用户自定义功能接口的update interface */
export interface optionUpdate {
    /**自定义更新functon() */
    update?: (scope: any, deltaTime: number,startTime:number,lastTime:number) => {},
    // update?: (scope: any, deltaTime: number,startTime:number,lastTime:number) => {},
    // update?: (scope: any, deltaTime: number,startTime:number,lastTime:number) => Promise<any>,
}

/** stage 索引类型 */
export type stageIndex = string;

/** stage name的对象接口*/
export interface stageName {
    [name: number]: string
}

/**默认stage层级与名称 */
export var stagesOfSystem: stageName = [
    "UI",
    "Sky",//天空盒
    "World",//静态
    "DynamicEntites",//水、树、草等
    "Actor",//角色
]



export var defaultStage = 2;//stagesOfSystem[0];
export var defaultStageName = stagesOfSystem[defaultStage]

export type stagesOrderByRender = number[];


export var defaultStageList: stagesOrderByRender = [defaultStage];
export var lightNumber = 32;//这个需要同步到“system.wgsl”中的数量

/**
 * RGBA四个数值的颜色interface，0--1
 */
export interface color4F {
    red: number,
    green: number,
    blue: number,
    alpha: number
}
/**
 * * RGBA四个数值的颜色interface，0--255
 */
export interface color4U {
    red: number,
    green: number,
    blue: number,
    alpha: number
}
/**
 * * RGB数值的颜色interface，0--1
 */
export interface color3F {
    red: number,
    green: number,
    blue: number
}
/**
 * RGB三个数值的颜色interface，0--255
 */
export interface color3U {
    red: number,
    green: number,
    blue: number,
}

export var shadowMapSize = 1024;