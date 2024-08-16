import { BaseEntity, initStateEntity, optionBaseEntity } from "../baseEntity";
import { BaseMaterial } from "../../material/baseMaterial";
import {
    BaseGeometry,
} from "../../geometry/baseGeometry";
import { DrawCommand } from "../../command/DrawCommand";
import { cameraRayValues } from "../../camera/baseCamera";



/**mesh的顶点结构与材质，各有一个，一一对应 */
export interface optionMeshEntity extends optionBaseEntity {
    geometry: BaseGeometry,
    material: BaseMaterial,
}


export class Mesh extends BaseEntity {
    createDCC(): initStateEntity {
        throw new Error("Method not implemented.");
    }
    updateUniformBuffer(deltaTime: number) {
        throw new Error("Method not implemented.");
    }
    checkStatus(): boolean {
        throw new Error("Method not implemented.");
    }
    updateDCC(deltaTime: number): DrawCommand[] {
        throw new Error("Method not implemented.");
    }
    destory() {
        throw new Error("Method not implemented.");
    }


}