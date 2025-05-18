import { uniformEntries } from "../command/commandDefine";
import * as coreConst from "../const/coreConst"
import { RootOfGPU } from "../organization/root";
import { Scene } from "../scene/scene";
import partHead_GBuffer_Add_FS from "../shader/material/part/part_add.st_gbuffer.head.fs.wgsl?raw"
import partOutput_GBuffer_Replace_FS from "../shader/material/part/part_replace.st_gbuffer.output.fs.wgsl?raw"
import defer_depth_replace_FS from "../shader/material/part/defer_depth_replace.fs.wgsl?raw"

import { BaseEntity, optionShadowEntity } from "../entity/baseEntity";
import { optionTexture } from "../texture/texture";
import { lifeState } from "../const/coreConst";

/**材质的初始化状态 */
// export type  lifeState =lifeState;

// type names="texture"|"normal"|"specspecular"|"AO"|"light"|"alpha";
/**透明材质的初始化参数 */
export interface optionTransparentOfMaterial {
    /** 不透明度，float32，默认=1.0 
     * 
     * 如果opacity与alphaTest同时存在，那么alphaTest会覆盖opacity。
    */
    opacity?: number,
    /**alphaTest时要使用的alpha值。如果不透明度低于此值，则不会渲染材质。默认值为0 */
    alphaTest?: number,
    /** blending ，直接使用webGPU的GPUBlendState interface格式
     * 
     * 如果动态更改blending内容，则entity的pipeline需要重新创建
     * opacityopacity
     * The blending behavior for this color target. 
    */
    blend?: GPUBlendState,
    /** color 4f 
     * https://www.w3.org/TR/webgpu/#dom-gpurenderpassencoder-setblendconstant
     * 
     * Sets the constant blend color and alpha values used with "constant" and "one-minus-constant" GPUBlendFactors.
     * If this value is not specified, the value of the color attachment's clear color is used.
     * If the color attachment has no clear color, the value is [0, 0, 0, 0].
    */
    blendConstants?: number[],
}

/**基础材质的初始化参数
     * 
     * 1、代码实时构建，延迟GPU device相关的资源建立需要延迟。需要其顶级使用者被加入到stage中后，才能开始。有其上级类的readyForGPU() 给材料进行GPUDevice的传值
     * 
     * 2、加载场景模式，原则上是通过加载器带入parent参数。todo
     */
export interface optionBaseMaterial {

    /**基础颜色 */
    color?: coreConst.color4F//number[],
    /**顶点颜色，boolean 
     * 
     * 1、如果为true，说明顶点颜色是有效的，会被使用。
     * 2、与color混合使用，color会被忽略。
     * 3、与texture混合使用，texture会被忽略。
    */
    vertexColor?: boolean,

    /**指定的fragment code */
    code?: string,

    /**透明材质的初始化参数
     * 默认不透明：没有此参数
     */
    transparent?: optionTransparentOfMaterial,
}
/**三段式初始化的第二步：init */
export interface optionBaseMaterialStep2 {
    parent: BaseEntity,
    scene: Scene,//为获取在scene中注册的resource
    deferRenderDepth: boolean,
    deferRenderColor: boolean,
    reversedZ: boolean,
}

export abstract class BaseMaterial extends RootOfGPU {
    red: number;
    green: number;
    blue: number;
    alpha: number;
    vertexColor: boolean;
    input: optionBaseMaterial;
    _destroy: boolean;
    /**新的材质，这个是需要处理的（异步数据的加载后，改为true，或没有异步数据加载，在init()中改为true）；
     * constructor中设置为false。 
     * 如果更改为为true，在材质不工作
    */
    _already: lifeState;
    /**
     * blending混合的状态interface
     * 
     * 1、如果是undefined，说明不混合
     * 2、如果是object，说明混合
     */
    _transparent: optionTransparentOfMaterial | undefined;


    deferRenderDepth!: boolean;
    deferRenderColor!: boolean;
    reversedZ!: boolean;
    _shadow!: optionShadowEntity;
    parent!: BaseEntity;

    /**
     * 是否更新过，由entity调用，
     * 1、如果是true，说明已经更新过（比如非uniform的内容，FS code、texture等），entity则需要重新生成command、pipeline。
     * 2、如果是false，说明没有更新过。
     */
    _reBuild: boolean = false;

    constructor(input?: optionBaseMaterial) {
        super();
        this._destroy = false;
        this.red = 1.0;
        this.green = 1.0;
        this.blue = 1.0;
        this.alpha = 1.0;
        this.vertexColor = false;
        // this.reversedZ = false;
        if (input) {
            this.input = input;
            if (input.color) {
                this.red = input.color.red;
                this.green = input.color.green;
                this.blue = input.color.blue;
                this.alpha = input.color.alpha;
            }
            if (input.transparent) {
                this._transparent = input.transparent;
            }
            if (input.vertexColor) {
                this.vertexColor = input.vertexColor;
            }
        }
        else
            this.input = {};
        this._already = lifeState.unstart;
    }
    get needUpdate() { return this._reBuild; }
    set needUpdate(value: boolean) { this._reBuild = value; }

    async init(values: optionBaseMaterialStep2) {
        this.parent = values.parent;
        this._shadow = values.parent._shadow;
        this.deferRenderDepth = values.deferRenderDepth;
        this.deferRenderColor = values.deferRenderColor;
        this.reversedZ = values.reversedZ;
        await this.setRootENV(values.scene);//为获取在scene中注册的resource
        await this.__init();
    }
    /**第二阶段初始化，由init()调用，需要每个材质自己实现 */
    abstract __init(): any;

    /**由entity调用，获取FS code
     *   @param startBinding  入参 ：startBinding： 从这个位置开始，为这个材质的所有texture分配binding。
     *  返回值：FS code 
     */
    abstract getCodeFS(startBinding: number): string;

    abstract destroy(): any
    /**获取uniform
     * 
     * 绑定的顺序：需要由getCodeFS()的顺序一致
     * 
     * 入参 ：startBinding： 从这个位置开始，为这个材质的所有texture分配binding。
     * 
     * @param startBinding 
     */
    abstract getUniform(startBinding: number): uniformEntries[] | false

    /**
     * 是否为透明材质
     * @returns boolean  true：是透明材质，false：不是透明材质
     */
    abstract getTransparent(): boolean;

    /**
     * 获取混合状态
     * @returns  GPUBlendState | undefined  混合状态，undefined表示不混合
     */
    abstract getBlend(): GPUBlendState | undefined;


    /**设置状态 */
    set LifeState(state: lifeState) { this._already = state; }
    /**获取状态 */
    get LifeState(): lifeState { return this._already; }

    /**设置透明状态 
     * @param transparent  optionTransparentOfMaterial 透明状态
     * 1、如果是undefined，说明不透明
     * 2、如果是object，说明透明
     * 3、如果是object，并且object中没有alphaTest，那么alphaTest会被设置为0
    */
    setTransParent(transparent: optionTransparentOfMaterial) {
        this._transparent = transparent;
        this._already = lifeState.updated;
    }
    /**
     * 设置混合状态
     * @param blend GPUBlendState 混合状态
     */
    setBlend(blend: GPUBlendState) {
        this._transparent = {
            blend: blend
        }
        this._already = lifeState.updated;
    }

    setblendConstants(blendConstants: number[]) {
        if (this._transparent) {
            this._transparent.blendConstants = blendConstants;
            this._already = lifeState.updated;
        }
    }
    /**
     * 材质是否已经准备好，
     * 判断两个值，
     * 1、this._readyForGPU：延迟GPU device相关的资源建立需要延迟。 需要其顶级使用者被加入到stage中后，才能开始。
     * 2、this._already：材质自身的初始化是否完成。
     * 
     * @returns true：可以使用，false：需要等待。     
     */
    getReady(): lifeState {
        if (this._readyForGPU) {
            return this._already;
        }
        else {
            return lifeState.unstart;
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
    /**
     * 替换一些固定的代码，
     * 1、$output：替换为输出的结构体ST_GBuffer，
     * 2、$deferRender_Depth：替换为深度输出的代码。
     * */
    shaderCodeProcess(code: string): string {
        let shaderCode = this.shaderCodeAdd_partOfLocationOfEntityID(code);

        //FS 输出
        if (code.indexOf("$output"))//替换output结构体的输出。就是GBuffer的多个attachement的输出(color,id,depth,uv,normal)。
            shaderCode = shaderCode.replaceAll("$output", partOutput_GBuffer_Replace_FS.toString());

        //延迟渲染的深度输出
        if (this.deferRenderDepth) {//如果需要深度输出，就需要替换深度输出的代码。
            if (code.indexOf("$deferRender_Depth"))
                shaderCode = shaderCode.replaceAll("$deferRender_Depth", defer_depth_replace_FS.toString());
        }
        else {//如果不需要深度输出，就需要替换空的代码。
            if (code.indexOf("$deferRender_Depth"))
                shaderCode = shaderCode.replaceAll("$deferRender_Depth", "");
        }

        //顶点着色
        if (this.vertexColor && code.indexOf("$vertexColor")) {//如果需要顶点颜色，就需要替换顶点颜色的代码。
            let tempCode = ``;
            if (this._transparent) {//如果是透明材质，就需要预乘alpha。
                tempCode = `output.color = vec4f(fsInput.color * ${this.alpha},${this.alpha}); `;
            }
            else {//如果不是透明材质，就不需要预乘alpha。
                tempCode = "output.color =vec4f(fsInput.color,1.0);";
            }
            shaderCode = shaderCode.replaceAll("$vertexColor", tempCode);
        } else {//如果不需要顶点颜色，就需要替换空的代码。
            if (code.indexOf("$vertexColor"))
                shaderCode = shaderCode.replaceAll("$vertexColor", "");
        }


        return shaderCode;
    }
}