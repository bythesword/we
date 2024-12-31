import { BaseMaterial, optionBaseMaterial } from "../baseMaterial";
import colorOnlyFS from "../../shader/material/simple/phongcolor.fs.wgsl?raw"
import { uniformBufferPart, uniformEntries } from "../../command/baseCommand";


/**
 * 这个phong模型是PBR的，结果只是近似
 */
export interface optionPhongColorMaterial extends optionBaseMaterial {
    /**反射指数(高光区域集中程度)：默认：32 */
    Shininess?: number,
    /** 高光反射系数(金属度)，0.0（非金属）--1.0（金属），默认：0.5 */
    metalness?: number,
    /**
     * 粗糙程度。0.0表示平滑的镜面反射，1.0表示完全漫反射。默认值为1.0
     */
    roughness?: number,

}

/**
 * phong 模型的颜色版本，无texture
 */
export class PhongColorMaterial extends BaseMaterial {
    __init() {
        // throw new Error("Method not implemented.");
    }


    declare input: optionPhongColorMaterial;


    constructor(input?: optionPhongColorMaterial) {
        super(input);
        if (this.input.Shininess == undefined) {
            this.input.Shininess = 32;
        }
        if (this.input.metalness == undefined) {
            this.input.metalness = 0.5;
        }
        if (this.input.roughness == undefined) {
            this.input.roughness = 1;
        }
        this._already = true;
    }

    getCodeFS(_startBinding:number) {
        let code = colorOnlyFS
        code = code.replaceAll("$red", this.red.toString());
        code = code.replaceAll("$blue", this.blue.toString());
        code = code.replaceAll("$green", this.green.toString());
        code = code.replaceAll("$alpha", this.alpha.toString());
        return code;
    }

    destroy() {
        this._destroy = true;
    }

    getUniform(startBinding:number): uniformEntries[] {
        let scope = this;
        let binding=startBinding;
        let phong: uniformBufferPart[] = [
            {
                label: "Mesh FS Shininess",
                binding: binding++,
                size: 4 * 1,
                get: () => {
                    let a = new Float32Array(1);
                    a[0] = scope.input.Shininess as number;
                    return a;
                },
            },
            {
                label: "Mesh FS metalness",
                binding: binding++,
                size: 4 * 1,
                get: () => {
                    let a = new Float32Array(1);
                    a[0] = scope.input.metalness as number;
                    return a;
                },
            },
            {
                label: "Mesh FS roughness",
                binding: binding++,
                size: 4 * 1,
                get: () => {
                    let a = new Float32Array(1);
                    a[0] = scope.input.roughness as number;
                    return a;
                },
            },
        ];
        return phong;
    }
}