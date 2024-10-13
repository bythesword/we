import { BaseMaterial, optionBaseMaterial } from "../baseMaterial";
import colorOnlyFS from "../../shader/material/simple/color.fs.wgsl?raw"

export class PhongColorMaterial extends BaseMaterial {



    constructor(input?: optionBaseMaterial) {
        super(input);
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
}