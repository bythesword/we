/**
 * 颜色材质，测试为主，没有动态更改颜色的功能（如果有，需要重新创建pipeline，或者在shader中添加uniform，在另外一个颜色动态材质中实现）
 * 1、颜色
 * 2、透明：
 *      A、alpha值，颜色的入参
 *      B、opacity值,整体透明度
 */

import { BaseMaterial, optionBaseMaterial, optionTransparentOfMaterial } from "../baseMaterial";
import colorOnlyFS from "../../shader/material/simple/color.fs.wgsl?raw"
import { color4F } from "../../const/coreConst";

export interface optionColorMaterial extends optionBaseMaterial {
    color: color4F
}

export class ColorMaterial extends BaseMaterial {

    declare input: optionColorMaterial;
    constructor(input: optionColorMaterial) {
        super(input);
        if (input.color.alpha < 1.0 || (this.input.transparent != undefined && this.input.transparent.opacity != undefined && this.input.transparent.opacity < 1.0)) {//如果是透明的，就设置为透明
            let transparent: optionTransparentOfMaterial = {
                blend: {
                    color: {
                        srcFactor: "src-alpha",//源
                        dstFactor: "one-minus-src-alpha",//目标
                        operation: "add"//操作
                    },
                    alpha: {
                        srcFactor: "one",//源
                        dstFactor: "one-minus-src-alpha",//目标
                        operation: "add"//操作  
                    }
                }
            };
            this._transparent = transparent;
            if (this.alpha < 1.0) {//如果alpha<1.0，就设置为alpha
                //预乘
                this.red = this.red * this.alpha;
                this.green = this.green * this.alpha;
                this.blue = this.blue * this.alpha;
            }
            else if (this.input.transparent != undefined && this.input.transparent.opacity != undefined && this.input.transparent.opacity < 1.0) {//如果alpha=1.0，就设置为opacity
                //预乘
                this.red = this.red * this.input.transparent.opacity;
                this.green = this.green * this.input.transparent.opacity;
                this.blue = this.blue * this.input.transparent.opacity;
                this.alpha = this.input.transparent.opacity;
            }
        }

        this._already = true;
    }
    /** 获取混合状态
     * 
     * @returns  GPUBlendState | undefined  混合状态，undefined表示不混合
     */

    getBlend(): GPUBlendState | undefined {
        return this._transparent?.blend;
    }
    getCodeFS(_startBinding: number) {
        let code = colorOnlyFS
        code = code.replaceAll("$red", this.red.toString());
        code = code.replaceAll("$blue", this.blue.toString());
        code = code.replaceAll("$green", this.green.toString());
        code = code.replaceAll("$alpha", this.alpha.toString());
        // return code;

        return this.shaderCodeProcess(code);
    }

    destroy() {
        this._destroy = true;
    }

    getUniform(_startBinding: number): false {
        // throw new Error("Method not implemented.");
        return false;
    }

    getTransparent(): boolean {
        if (this.alpha < 1.0) {
            return true;
        }
        else if (this.input.transparent?.opacity != undefined && this.input.transparent.opacity < 1.0) {
            return true;
        }
        else {
            return false;
        }
        // return this.alpha != 1.0 ? true : false;
    }
    __init() {
        // throw new Error("Method not implemented.");
    }
}