import { uniformEntries } from "../../command/baseCommand";
import { BaseMaterial, optionBaseMaterial } from "../baseMaterial";

export interface optionVertexColorMaterial extends optionBaseMaterial {
    type: "color" | "position",
    textures?: GPUTexture
}
/**
 * 展示用材质
 */
export class VertexColorMaterial extends BaseMaterial {
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
    init() {
        // throw new Error("Method not implemented.");
    }
    getCodeFS() {
        if (this.input.code) {
            return this.input.code;
        }
        let FSOfColor = `@fragment fn fs(fsInput : VertexShaderOutput) -> @location(0) vec4f {
            return vec4f(fsInput.color,1.0);
          }          `;
        let FSOfposition = `@fragment fn fs( fsInput : VertexShaderOutput) -> @location(0) vec4f {
            return   fsInput.fsPosition ;
          }          `;

        // return FSOfposition;
        return this._type == "color" ? FSOfColor : FSOfposition;
    }

    destroy() {
        this._destroy = true;
    }

    getUniform(): uniformEntries[] | false {
        // let  sampler=this.scene.resources.
 
        // throw new Error("Method not implemented.");
        if (this.input.textures) {
            let unifomrArray: uniformEntries[] = []
            unifomrArray.push({
                binding: 1,
                resource: this.sampler,
            });
            unifomrArray.push({
                binding: 2,
                resource: this.input.textures.createView(),
            });

            return unifomrArray;
        }
        else
            return false;
    }

}