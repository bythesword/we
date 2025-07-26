import { color4F, lifeState } from "../../const/coreConst";
import { BaseGeometry } from "../../geometry/baseGeometry";
import { BaseMaterial } from "../../material/baseMaterial";
import { BaseEntity, optionBaseEntity, valuesForCreateDCCC } from "../baseEntity"

 
export interface optionPointEntity extends optionBaseEntity {
    /**几何体 */
    geometry: BaseGeometry,
    /**材质 */
    material: BaseMaterial, //| BaseMaterial[],
    /**剔除面 */
    cullmode?: GPUCullMode, 
    /**  */
       pointSize?: number,
}


export class Point extends BaseEntity {
    _geometry!: BaseGeometry;
    _material!: BaseMaterial;
    constructor(input: optionPointEntity) {
        super(input);
    }
    destroy() {
        throw new Error("Method not implemented.");
    }
    checkStatus(): boolean {
        throw new Error("Method not implemented.");
    }

    createDCCC(values: valuesForCreateDCCC): lifeState {
        throw new Error("Method not implemented.");
    }
    createDCCCDeferRenderDepth(values: valuesForCreateDCCC): lifeState {
        throw new Error("Method not implemented.");
    }
    createDCCCForShadowMap(values: valuesForCreateDCCC): lifeState {
        throw new Error("Method not implemented.");
    }
    createDCCCForShadowMapOfTransparent(values: valuesForCreateDCCC): lifeState {
        throw new Error("Method not implemented.");
    }
    createDCCCForTransparent(values: valuesForCreateDCCC): lifeState {
        throw new Error("Method not implemented.");
    }

    getBlend(): GPUBlendState | undefined {
        return this._material.getBlend();
    }
    getTransparent(): boolean {
        // throw new Error("Method not implemented.");
        return this._material.getTransparent();
    }
    generateBoxAndSphere() {
        if (this.checkStatus()) {
            this.boundingBox = this.generateBox(this._geometry.buffer.position);
            this.boundingSphere = this.generateSphere(this.boundingBox);
        }
    }
}