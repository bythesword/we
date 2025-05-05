import { uniformEntries } from "../../command/commandDefine";
import { weSamplerKind } from "../../resource/weResource";
import { BaseMaterial,   optionBaseMaterial } from "../baseMaterial";
import FSOfColor from "../../shader/material/simple/oneColorCube/oneColorCube.color.fs.wgsl?raw"
import FSOfposition from "../../shader/material/simple/oneColorCube/oneColorCube.position.fs.wgsl?raw"
import { lifeState } from "../../const/coreConst";


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

        this._already =  lifeState.finished;
    }
    __init() {
        // throw new Error("Method not implemented.");
    }

    getCodeFS(_startBinding: number) {
        if (this.input.code) {
            return this.input.code;
        }

        let code = this._type == "color" ? FSOfColor : FSOfposition;
        return this.shaderCodeProcess(code);
    }

    destroy() {
        this._destroy = true;
    }

    getUniform(startBinding: number): uniformEntries[] | false {
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
    getTransparent(): boolean {
        if (this.alpha < 1.0) {
            return true;
        }
        else if (this.input.transparent?.opacity != undefined && this.input.transparent.opacity < 1.0) {
            return true;
        }
        else {
            return false;
        }
    }

    getBlend(): GPUBlendState | undefined {
        return this._transparent?.blend;
    }
}