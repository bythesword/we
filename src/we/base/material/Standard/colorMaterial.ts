import { BaseMaterial, optionBaseMaterial } from "../baseMaterial";
import colorOnlyFS from "../../shader/material/simple/color.fs.wgsl?raw"
 
export class ColorMaterial extends BaseMaterial {
    __init() {
        // throw new Error("Method not implemented.");
    }

    constructor(input?: optionBaseMaterial) {
        super(input);
        this._already=true;
    }

    getCodeFS(startBinding:number) {
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

    getUniform(startBinding:number): false {
        // throw new Error("Method not implemented.");
        return false;
    }

}