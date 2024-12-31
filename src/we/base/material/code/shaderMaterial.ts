import { BaseMaterial, optionBaseMaterial, textureType } from "../baseMaterial";
import codeOnlyFS from "../../shader/material/code/code.fs.wgsl?raw"
import { uniformEntries } from "../../command/baseCommand";


export interface optionShaderMaterial extends optionBaseMaterial {
    code?: string,
    texture?: {
        texture?: textureType,
        normalTexture?: textureType,
        specularTexture?: textureType,

    },
    samplerFilter?: GPUMipmapFilterMode,
    unifroms?: uniformEntries[],
}


export class ShaderMaterial extends BaseMaterial {
    declare input: optionShaderMaterial;
    shaderCodeFS: string;
    constructor(input?: optionShaderMaterial) {
        super(input);
        if (input)
            this.input = input;
        this.shaderCodeFS = '';
        if (input?.code) {
            this.shaderCodeFS = input.code;
        }
    }

    async __init() {
        //获取device后，进行texture，simple，uniform，storage的初始化
        await this.generateForTSUS();
        this._already = true;
    }
    /**texture，simple，uniform，storage */
    async generateForTSUS(): Promise<any> {

    }
    /**用户自定义shader材质，这个获取shader code是必须的，为了格式化code
    * 
    * 主要是，texture，simple，uniform，storage
    */
    getCodeFS(_startBinding: number) {
        let code = this.shaderCodeFS + codeOnlyFS;
        code = this.shaderCodeProcess(code);

        return code;
    }

    destroy() {
        this._destroy = true;
    }

    /**用户自定义shader材质，这个uniform是必须的
     * 
     * 主要是，texture，simple，uniform，storage
     */
    getUniform(_startBinding: number): uniformEntries[] | false {
        if (this.input && this.input.unifroms)
            return this.input.unifroms;
        return false;
    }

}