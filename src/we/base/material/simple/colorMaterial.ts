import { BaseMaterial, optionBaseMaterial } from "../baseMaterial";
import colorOnlyFS from "../../shader/material/simple/color.fs.wgsl?raw"
import { unifromGroup } from "../../command/baseCommand";

export class ColorMaterial extends BaseMaterial {



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

    getUniform(): false {
        // throw new Error("Method not implemented.");
        return false;
    }

}