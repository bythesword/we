import { BaseMaterial, optionBaseMaterial } from "../baseMaterial";
import shadowVS from "../../shader/shadow/shadow.vs.wgsl?raw"
import { uniformBufferPart } from "../../command/baseCommand";

export class ShadowMaterial extends BaseMaterial {
    getUniform(): false | uniformBufferPart {
        throw new Error("Method not implemented.");
    }



    constructor(input?: optionBaseMaterial) {
        super(input);
    }

    getCodeFS() {
        return '';
    }

    getCodeVS() {
        return shadowVS;
    }
    destroy() {
        this._destroy = true;
    }
}