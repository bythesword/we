import { BaseMaterial, optionBaseMaterial } from "../baseMaterial";
import colorOnlyFS from "../../shader/material/simple/phongcolor.fs.wgsl?raw"
import { uniformBufferPart, unifromGroup } from "../../command/baseCommand";

export interface optionPhongMaterial extends optionBaseMaterial {
    /**反光度：默认：32 */
    Shininess?: number,

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

    getUniform(): uniformBufferPart {
        let scope = this;
        let phong: uniformBufferPart = {

            label: "Mesh FS Shininess",
            binding: 1,
            size: 4 * 1,
            get: () => {
                let a = new Float32Array(1);
                a[0] = scope.input.Shininess as number;
                return a;
            },

        };
        return phong;
    }
}