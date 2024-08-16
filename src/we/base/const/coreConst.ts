export type stageIndex = string;

export interface stageName {
    [name: number]: string
}

export var stagesOfSystem: stageName = [
    ////// "Depth",   //这个是必须的，目前不在stage中
    "World",
    "worldTransparent",
    "Actor",//延迟
    "ActorTransparent",//延迟
    "Immediate",//Opaque//延迟//立即模式，不进入command
    "ImmediateTransparent",//延迟
    "Sky",
    "UI",//延迟
]

export var defaultStage = 0;//stagesOfSystem[0];
export var defaultStageName = stagesOfSystem[defaultStage]
export var defaultStageTransparent = 1;//stagesOfSystem[2];
export var defaultStageTransparentName = stagesOfSystem[defaultStageTransparent];


export interface stagesOrderByRender {
    [id: number]: number
}

export var defaultStageList: stagesOrderByRender = [
    // 
    0 //world 
]