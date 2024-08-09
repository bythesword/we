
export interface stageType {
    [name: number]: string
}

export var stagesOfSystem: stageType = [
    "Depth",
    "Sky",
    "World",
    "worldTransparent",
    "ImmediateOpaque",
    "ImmediateTransparent",
    "Actor",
    "UI",
]

export var defaultStage = stagesOfSystem[2];


export interface stagesOrderBy {
    [id: number]: number
}

export var defaultStageList: stagesOrderBy = [
    // 1,2,3,4,5,6,7  //不包含Depth
    2 //world 
]