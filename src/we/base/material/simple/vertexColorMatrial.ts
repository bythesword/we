import { BaseMaterial, optionBaseMaterial } from "../baseMaterial";
 
export interface optionVertexColorMaterial extends optionBaseMaterial {
    type: "color" | "position"
}
export class VertexColorMaterial extends BaseMaterial {

    _type: String;
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
        let FSOfColor = `@fragment fn fs(fsInput : VertexShaderOutput) -> @location(0) vec4f {
            return vec4f(fsInput.color,1.0);
          }          `;
        let FSOfposition = `@fragment fn fs( fsInput : VertexShaderOutput) -> @location(0) vec4f {
            return   fsInput.fsPosition ;
          }          `;

        return FSOfposition;
        // return this._type=="color"?FSOfColor:FSOfposition;
    }

    destroy() {
        this._destroy = true;
    }

    getUniform(): false {
        // throw new Error("Method not implemented.");
        return false;
    }

}