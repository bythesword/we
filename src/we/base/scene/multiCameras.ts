import { cameraViewport, Scene } from "./scene";
import { optionSingleRender, SingleRender } from "./singleRender";

export interface optionMulitCameras extends optionSingleRender{
    multiCameraViewport:cameraViewport[],
    copyToTarget: GPUTexture,
}

export class MultiCameras extends SingleRender {


    constructor(input: optionMulitCameras) {
        super(input);
    }
    destroy(): void {
        throw new Error("Method not implemented.");
    }

}