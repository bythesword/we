import { uniformEntries } from "../command/baseCommand";
import * as coreConst from "../const/coreConst"


export interface optionBaseMaterial {
    color?: coreConst.color4F//number[],
    vertexColor?: boolean,
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
    red!: number;
    green!: number;
    blue!: number;
    alpha!: number;
    input!: optionBaseMaterial;
    _destroy: boolean;
    /**新的材质，这个是需要处理的（异步数据的加载后，改为true，或没有异步数据加载，在init()中改为true）；
     * constructor中设置为false。 
     * 如果更改为为true，在材质不工作
    */
    _already: boolean;

    constructor(input?: optionBaseMaterial) {
        this._destroy = false;
        this.red = 1.0;
        this.green = 1.0;
        this.blue = 1.0;
        this.alpha = 1.0;
        if (input) {
            this.input = input;
            if (input.color) {
                this.red = input.color.red;
                this.green = input.color.green;
                this.blue = input.color.blue;
                this.alpha = input.color.alpha;
            }
        }
        else
            this.input = {};
        this._already = false;
    }
    abstract init(): any;
    abstract getCodeFS(): string;
    abstract destroy(): any
    abstract getUniform(): uniformEntries[] | false

    isDestroy() {
        return this._destroy;
    }
}