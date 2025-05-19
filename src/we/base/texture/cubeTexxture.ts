import { lifeState } from "../const/coreConst";
import { BaseTexture, optionBaseTexture } from "./baseTexture";
import { optionTexture } from "./texture";
export type textureTypeForImageOrUrl = string | GPUCopyExternalImageSource;

export interface optionCubeTexture extends optionBaseTexture {
    cubeTexture: {
        positiveX: optionTexture,
        negativeX: optionTexture,
        positiveY: optionTexture,
        negativeY: optionTexture,
        positiveZ: optionTexture,
        negativeZ: optionTexture,
    }
}

export class CubeTexture extends BaseTexture {

    declare input: optionCubeTexture;
    constructor(input: optionCubeTexture, device: GPUDevice) {
        super(input, device); 
    }

    async init(): Promise<lifeState> {
        throw new Error("Method not implemented.");
    }
 
}