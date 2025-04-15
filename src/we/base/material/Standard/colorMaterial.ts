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
        if (input.color.alpha < 1.0 && input.transparent == undefined) {//如果是透明的，就设置为透明
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
            this.input.transparent = transparent;
        }
        this._already = true;
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
        return this.alpha != 1.0 ? true : false;
    }
    __init() {
        // throw new Error("Method not implemented.");
    }
}