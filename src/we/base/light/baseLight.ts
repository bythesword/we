import * as coreConst from "../const/coreConst";
import { 
    //vec3,
     Vec3 } from "wgpu-matrix";

// export interface optionBaseLightSize{

// }

export interface optionBaseLight {
    position: Vec3,
    color:coreConst.color3U,
    intensity:number,
    distance:number,
    decay:number,
    size?:number,
    shadow?:boolean
}
export type typeLight = string;
export abstract class BaseLight { 

}