import { BaseMaterial, optionBaseMaterial } from "../baseMaterial";
import shadowVS from "../../shader/shadow/shadow.vs.wgsl?raw"

export class ShadowMaterial extends BaseMaterial {



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