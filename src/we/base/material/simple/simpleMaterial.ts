import { BaseMaterial, optionBaseMaterial } from "../baseMaterial";


export class SimpleMaterial extends BaseMaterial {


    constructor(input?: optionBaseMaterial) {
        super(input);
    }

    getCodeFS() {
        const fs = `
        @fragment fn fs( ) -> @location(0) vec4f {
        return vec4f(1,0,0,1);
      }
      `;
        return fs;
    }

    destroy() {
        this._destroy = true;
    }
}