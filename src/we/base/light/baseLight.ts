import { 
    //vec3,
     Vec3 } from "wgpu-matrix";

export interface optionBaseLight {
    position: Vec3
}
export type typeLight = string;
export abstract class BaseLight { }