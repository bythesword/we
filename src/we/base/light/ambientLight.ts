import { Mat4, vec3, Vec3 } from "wgpu-matrix";
import { BaseLight, lightType, optionBaseLight, structBaselight } from "./baseLight";
import * as coreConst from "../const/coreConst";
import { Scene } from "../scene/scene";

export interface optionAmbientLight extends optionBaseLight {
    color: coreConst.color3U,
    intensity: number
}

export class AmbientLight extends BaseLight {
    updateMVP(scene: Scene): Mat4[] {
        throw new Error("Method not implemented.");
    }

    _color: Vec3;
    _intensity: number;
    structBuffer: structBaselight;


    constructor(input: optionAmbientLight) {
        super(input, lightType.ambient);

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