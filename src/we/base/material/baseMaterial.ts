export var sideOfMaterial = {
    "front": "back",
    "back": "front",
    "all": "none"
}

export interface optionBaseMaterial {
    color?: number[],
    wireFrame?: boolean,
    side?: "front" | "back" | "all",

    /**此材质时启用深度测试。默认为 true */
    depthTest?: boolean,
    /**此材质是否对深度缓冲区有任何影响。默认为true */
    depthWrite?: boolean,

    // /** 不透明度，float32，默认=1.0 */
    // opacity?:number,
    // /**alphaTest时要使用的alpha值。如果不透明度低于此值，则不会渲染材质。默认值为0 */
    // alphaTest?: number,
}

export abstract class BaseMaterial {
    input!: optionBaseMaterial;
    constructor(input?: optionBaseMaterial) {
        if (input)
            this.input = input;
        else
            this.input = {};
    }
    abstract getCodeFS(): string;
}