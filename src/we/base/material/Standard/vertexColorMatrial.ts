import { uniformEntries } from "../../command/baseCommand";
import { weSamplerKind } from "../../resource/weResource";
import { BaseMaterial, optionBaseMaterial } from "../baseMaterial";
import FSOfColor from "../../shader/material/simple/oneColorCube/oneColorCube.color.fs.wgsl?raw"
import FSOfposition from "../../shader/material/simple/oneColorCube/oneColorCube.position.fs.wgsl?raw"


export interface optionVertexColorMaterial extends optionBaseMaterial {
    type: "color" | "position",
    textures?: GPUTexture
}
/**
 * 展示用材质
 */
export class VertexColorMaterial extends BaseMaterial {
    __init() {
        // throw new Error("Method not implemented.");
    }
    declare input: optionVertexColorMaterial;
    _type: String;
    sampler!: GPUSampler;

    constructor(input?: optionVertexColorMaterial) {
        super(input);
        this._type = "position";
        if (input) {
            this._type = input.type;
        }

        this._already = true;
    }

    getCodeFS(startBinding:number) {
        if (this.input.code) {
            return this.input.code;
        }
 
        let code = this._type == "color" ? FSOfColor : FSOfposition;
        return this.shaderCodeProcess(code);
    }

    destroy() {
        this._destroy = true;
    }

    getUniform(startBinding:number): uniformEntries[] | false {
        // let  sampler=this.scene.resources.
        let binding = startBinding;
        if (this.sampler == undefined) {
            let sampler: GPUMipmapFilterMode = 'linear';
            if (this.scene.resources.sampler[weSamplerKind.linear]) {
                this.sampler = this.scene.resources.sampler[weSamplerKind[sampler]];
            }
            else {
                this.sampler = this.device.createSampler({
                    magFilter: sampler,
                    minFilter: sampler,
                });
            }
        }
        // throw new Error("Method not implemented.");
        if (this.input.textures) {
            let unifomrArray: uniformEntries[] = []
            unifomrArray.push({
                binding: binding++,
                resource: this.sampler,
            });
            unifomrArray.push({
                binding: binding++,
                resource: this.input.textures.createView(),
            });

            return unifomrArray;
        }
        else
            return false;
    }

}