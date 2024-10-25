import { vec3 } from "wgpu-matrix";
import {
    BaseGeometry,
    // geometryWireFrameAttribute,
    optionBaseGemetry,
} from "./baseGeometry";
// import { indexBuffer, vsAttributes } from "../command/DrawCommand";
// import * as coreConst from "../const/coreConst";
// import triangleVS from "../shader/geometry/baseGeometry.vs.wgsl?raw"
// import framelineVS from "../shader/geometry/baseGeometryFrameline.vs.wgsl?raw"



export interface optionSphereGeometry extends optionBaseGemetry {
    radius?: number,
    widthSegments?: number,
    heightSegments?: number,
    phiStart?: number,
    phiLength?: number,
    thetaStart?: number,
    thetaLength?: number,

}

export class SphereGeometry extends BaseGeometry {



    /**box的参数 */
    parameters!: optionSphereGeometry;
    /** 计算过程中使用，应该改为私有模式，todo*/
    numberOfVertices !: number;
    /** 计算过程中使用，应该改为私有模式，todo*/
    groupStart !: number;

    constructor(input?: optionSphereGeometry) {
        let defaultValues = {
            radius: 1,
            widthSegments: 16,
            heightSegments: 16,
            phiStart: 0,
            phiLength: Math.PI * 2,
            thetaStart: 0,
            thetaLength: Math.PI * 2,
        }
        if (input == undefined) {
            input = defaultValues;
        }
        super(input);
        this.parameters = {
            radius: input.radius ?? defaultValues.radius,
            widthSegments: input.widthSegments ?? defaultValues.widthSegments,
            heightSegments: input.heightSegments ?? defaultValues.heightSegments,
            phiStart: input.phiStart ?? defaultValues.phiStart,
            phiLength: input.phiLength ?? defaultValues.phiLength,
            thetaStart: input.thetaStart ?? defaultValues.thetaStart,
            thetaLength: input.thetaLength ?? defaultValues.thetaLength
        };
        this.parameters.widthSegments = Math.max(3, Math.floor(this.parameters.widthSegments as number));
        this.parameters.heightSegments = Math.max(2, Math.floor(this.parameters.heightSegments as number));
        this.init(this.parameters)
    }

    /** copy code from threejs */
    init(input: optionSphereGeometry) {

        const thetaEnd = Math.min(input.thetaStart! + input.thetaLength!, Math.PI);
        let index = 0;
        let grid = [];
        let vertex = vec3.create();
        let normal = vec3.create();
        // buffers

        // let indices = [];
        // let vertices = [];
        // let normals = [];
        // let uvs = [];
        let indices = this.buffer.indeices;
        let vertices = this.buffer.position;
        let normals = this.buffer.normal;
        let uvs = this.buffer.uv;
        let materialStep = this.buffer.materialStep;

        let heightSegments = input.heightSegments!;
        let widthSegments = input.widthSegments!;
        let thetaStart = input.thetaStart!;
        let radius = input.radius!;
        let phiStart = input.phiStart!;
        let phiLength = input.phiLength!;
        let thetaLength = input.thetaLength!;
        // generate vertices, normals and uvs

        for (let iy = 0; iy <= heightSegments; iy++) {

            const verticesRow = [];

            const v = iy / heightSegments;

            // special case for the poles

            let uOffset = 0;

            if (iy === 0 && thetaStart === 0) {

                uOffset = 0.5 / widthSegments;

            } else if (iy === heightSegments && thetaEnd === Math.PI) {

                uOffset = - 0.5 / widthSegments;

            }

            for (let ix = 0; ix <= widthSegments; ix++) {

                const u = ix / widthSegments;

                // vertex

                vertex[0] = - radius * Math.cos(phiStart + u * phiLength) * Math.sin(thetaStart + v * thetaLength);
                vertex[1] = radius * Math.cos(thetaStart + v * thetaLength);
                vertex[2] = radius * Math.sin(phiStart + u * phiLength) * Math.sin(thetaStart + v * thetaLength);

                vertices.push(vertex[0], vertex[1], vertex[2]);

                // normal

                normal = vec3.normalize(vertex);
                normals.push(normal[0], normal[1], normal[2]);

                // uv

                uvs.push(u + uOffset, 1 - v);

                verticesRow.push(index++);

            }

            grid.push(verticesRow);

        }

        // indices

        for (let iy = 0; iy < heightSegments; iy++) {

            for (let ix = 0; ix < widthSegments; ix++) {

                const a = grid[iy][ix + 1];
                const b = grid[iy][ix];
                const c = grid[iy + 1][ix];
                const d = grid[iy + 1][ix + 1];

                if (iy !== 0 || thetaStart > 0) indices.push(a, b, d);
                if (iy !== heightSegments - 1 || thetaEnd < Math.PI) indices.push(b, c, d);

            }

        }

        this.createWrieFrame();
    }


 
}