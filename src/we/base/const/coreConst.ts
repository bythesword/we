export type stageIndex = string;

export interface stageName {
    [name: number]: string
}
export var stagesOfSystem: stageName = [
    "UI",
    "Sky",//天空盒
    "World",//静态
    "DynamicEntites",//水、树、草等
    "Actor",//角色
]

// export var stagesOfSystem: stageName = [
//     ////// "Depth",   //这个是必须的，目前不在stage中
//     "World",
//     "worldTransparent",

//     "Actor",//延迟
//     "ActorTransparent",//延迟

//     "Immediate",//Opaque//延迟//立即模式，不进入command
//     "ImmediateTransparent",//延迟

//     "Sky",
//     "UI",//延迟
// ]

export var defaultStage = 2;//stagesOfSystem[0];
export var defaultStageName = stagesOfSystem[defaultStage]

export type stagesOrderByRender = number[];
// export interface stagesOrderByRender {
//     [id: number]: number
// }

export var defaultStageList: stagesOrderByRender = [defaultStage];