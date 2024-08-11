export type stageIndex = string;

export interface stageName {
    [name: number]: string
}

export var stagesOfSystem: stageName = [
    ////// "Depth",   
    "World",
    "Sky",
    "worldTransparent",

    // "Actor",
    // "ActorTransparent",
    // "Immediate",//Opaque
    // "ImmediateTransparent",
    "UI",
]

export var defaultStage = stagesOfSystem[0];


export interface stagesOrderByRender {
    [id: number]: number
}

export var defaultStageList: stagesOrderByRender = [
    // 1,2,3,4,5,6,7  //不包含Depth
    2 //world 
]