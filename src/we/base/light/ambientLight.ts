import { vec3, Vec3 } from "wgpu-matrix";
import { BaseLight, optionBaseLight, structBaselight } from "./baseLight";
import * as coreConst from "../const/coreConst";

export interface optionAmbientLight extends optionBaseLight {
    color: coreConst.color3U,
    intensity: number
}

export class AmbientLight extends BaseLight {
    generateShadowMap(device: GPUDevice): false {
        return false;
    }


    _color: Vec3;
    _intensity: number;
    structBuffer: structBaselight;


    constructor(input: optionAmbientLight) {
        super(input);
        this._color = [0, 0, 0];
        this._intensity = 0;
        if (input.color)
            this._color = vec3.fromValues(input.color.red, input.color.green, input.color.blue);
        if (input.intensity)
            this._intensity = input.intensity
        this.structBuffer = new Float32Array(4 * 4);
        // this.structBuffer.buffer[0] = this._color[0];
        // this.structBuffer.buffer[1] = this._color[1];
        // this.structBuffer.buffer[2] = this._color[2];
        // this.structBuffer.buffer[3] = this._intensity;

    }
    getStructBuffer(): structBaselight {
        return this.structBuffer;
    }

}