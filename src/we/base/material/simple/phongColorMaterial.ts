import { BaseMaterial, optionBaseMaterial } from "../baseMaterial";
import colorOnlyFS from "../../shader/material/simple/phongcolor.fs.wgsl?raw"
import { uniformBufferPart, unifromGroup } from "../../command/baseCommand";

/**
 * 这个phong模型是PBR的，结果只是近似
 */
export interface optionPhongMaterial extends optionBaseMaterial {
    /**反射指数(高光区域集中程度)：默认：32 */
    Shininess?: number,
    /** 高光反射系数(金属度)，0.0（非金属）--1.0（金属），默认：0.5 */
    Ks?: number

}

/**
 * phong 模型的颜色版本，无texture
 */
export class PhongColorMaterial extends BaseMaterial {


    declare input: optionPhongMaterial;


    constructor(input?: optionPhongMaterial) {
        super(input);
        if (this.input.Shininess == undefined) {
            this.input.Shininess = 32;
        }
        if (this.input.Ks == undefined) {
            this.input.Ks = 0.5;
        }
    }

    getCodeFS() {
        let code = colorOnlyFS
        code = code.replace("$red", this.red.toString());
        code = code.replace("$blue", this.blue.toString());
        code = code.replace("$green", this.green.toString());
        code = code.replace("$alpha", this.alpha.toString());
        return code;
    }

    destroy() {
        this._destroy = true;
    }

    getUniform(): uniformBufferPart[] {
        let scope = this;
        let phong: uniformBufferPart[] = [
            {
                label: "Mesh FS Shininess",
                binding: 1,
                size: 4 * 1,
                get: () => {
                    let a = new Float32Array(1);
                    a[0] = scope.input.Shininess as number;
                    return a;
                },
            },
            {
                label: "Mesh FS Ks",
                binding: 2,
                size: 4 * 1,
                get: () => {
                    let a = new Float32Array(1); 
                    a[0] = scope.input.Ks as number;
                    return a;
                },
            },
        ];
        return phong;
    }
}