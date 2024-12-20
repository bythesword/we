import { uniformEntries } from "../command/baseCommand";
import * as coreConst from "../const/coreConst"
import { Root } from "../const/root";
import { Scene } from "../scene/scene";
import partHead_GBuffer_Add_FS from "../shader/material/part/part_add.st_gbuffer.head.fs.wgsl?raw"
import partOutput_GBuffer_Replace_FS from "../shader/material/part/part_replace.st_gbuffer.output.fs.wgsl?raw"
import defer_depth_replace_FS from "../shader/material/part/defer_depth_replace.fs.wgsl?raw"
import { BaseScene } from "../scene/baseScene";

export type textureType = ImageBitmap | string | GPUTexture;

export interface optionBaseMaterial {
    /**
     * 两种情况：
     * 
     * 1、代码实时构建，延迟GPU device相关的资源建立需要延迟。需要其顶级使用者被加入到stage中后，才能开始。有其上级类的readyForGPU() 给材料进行GPUDevice的传值
     * 
     * 2、代码实时构建，可以显示的带入parent，则不用等待
     * 
     * 3、加载场景模式，原则上是通过加载器带入parent参数。todo
     */
    parent?: BaseScene,
    /**基础颜色 */
    color?: coreConst.color4F//number[],
    /**顶点颜色，boolean */
    vertexColor?: boolean,
    /**此材质时启用深度测试。默认为 true */
    depthTest?: boolean,
    /**此材质是否对深度缓冲区有任何影响。默认为true */
    depthWrite?: boolean,

    // /** 不透明度，float32，默认=1.0 */
    opacity?: number,
    // /**alphaTest时要使用的alpha值。如果不透明度低于此值，则不会渲染材质。默认值为0 */
    alphaTest?: number,

    /**指定的fragment code */
    code?: string
}
/**三段式初始化的第二步：init */
export interface optionBaseMaterialStep2 {
    scene: Scene,//为获取在scene中注册的resource
    deferRenderDepth: boolean,
    deferRenderColor: boolean,
    reversedZ: boolean,
}

export abstract class BaseMaterial extends Root {
    red: number;
    green: number;
    blue: number;
    alpha: number;
    input: optionBaseMaterial;
    _destroy: boolean;
    /**新的材质，这个是需要处理的（异步数据的加载后，改为true，或没有异步数据加载，在init()中改为true）；
     * constructor中设置为false。 
     * 如果更改为为true，在材质不工作
    */
    _already: boolean;

    deferRenderDepth!: boolean;
    deferRenderColor!: boolean;
    reversedZ!: boolean;


    constructor(input?: optionBaseMaterial) {
        super();
        this._destroy = false;
        this.red = 1.0;
        this.green = 1.0;
        this.blue = 1.0;
        this.alpha = 1.0;
        // this.reversedZ = false;
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
    async init(values: optionBaseMaterialStep2) {
        this.deferRenderDepth = values.deferRenderDepth;
        this.deferRenderColor = values.deferRenderColor;
        this.reversedZ = values.reversedZ;
        await this.setRootENV(values.scene);//为获取在scene中注册的resource
        await this.__init();
    }
    abstract __init(): any;
    abstract getCodeFS(startBinding: number): string;
    abstract destroy(): any
    abstract getUniform(startBinding: number): uniformEntries[] | false

    getReady() {
        if (this._readyForGPU && this._already) {
            return true;
        }
        else {
            return false;
        }
    }
    isDestroy() {
        return this._destroy;
    }

    /**增加FS中的输出的location的结构体：ST_GBuffer */
    shaderCodeAdd_partOfLocationOfEntityID(code: string): string {
        let shaderCodeAdded = partHead_GBuffer_Add_FS + code;
        return shaderCodeAdded;
    }
    shaderCodeProcess(code: string): string {
        let shaderCode = this.shaderCodeAdd_partOfLocationOfEntityID(code);
        shaderCode = shaderCode.replaceAll("$output", partOutput_GBuffer_Replace_FS.toString());
        if (this.deferRenderDepth) {
            shaderCode = shaderCode.replaceAll("$deferRender_Depth", defer_depth_replace_FS.toString());
        }
        else {
            shaderCode = shaderCode.replaceAll("$deferRender_Depth", "");
        }
        return shaderCode;
    }
}