import { vec3 } from "wgpu-matrix";
import {
    BaseGeometry,
    // geometryWireFrameAttribute,
    optionBaseGemetry,
    xyz,
} from "./baseGeometry";
// import { indexBuffer, vsAttributes } from "../command/DrawCommand";
// import * as coreConst from "../const/coreConst";
// import triangleVS from "../shader/geometry/baseGeometry.vs.wgsl?raw"
// import framelineVS from "../shader/geometry/baseGeometryFrameline.vs.wgsl?raw"



export interface optionCylinderGeometry extends optionBaseGemetry {

    /** 圆柱的顶部半径，默认值是1 */
    radiusTop?: number,
    /** 圆柱的底部半径，默认值是1 */
    radiusBottom?: number,
    /** 圆柱的高度，默认值是1 */
    height?: number,
    /** 圆柱侧面周围的分段数，默认值是32 */
    radialSegments?: number,
    /** 圆柱侧面的分段数，默认值是1 */
    heightSegments?: number,
    /**一个Boolean值，指明该圆锥的底面是开放的还是封顶的。默认值为false，即其底面默认是封顶的。 */
    openEnded?: boolean,
    /** 第一个分段的起始角度，默认为0 */
    thetaStart?: number,
    /** 圆柱底面圆扇区的中心角，通常被称为“θ”（西塔）。默认值是2*Pi，这使其成为一个完整的圆柱。 */
    thetaLength?: number,
}

export class CylinderGeometry extends BaseGeometry {



    /**box的参数 */
    parameters!: optionCylinderGeometry;
    /** 计算过程中使用，应该改为私有模式，todo*/
    numberOfVertices !: number;
    /** 计算过程中使用，应该改为私有模式，todo*/
    groupStart !: number;
    index = 0;

    constructor(input?: optionCylinderGeometry) {
        let defaultValues: optionCylinderGeometry = {
            radiusTop: 1,
            radiusBottom: 1,
            height: 1,
            radialSegments: 32,
            heightSegments: 1,
            openEnded: false,
            thetaStart: 0,
            thetaLength: Math.PI * 2,
        }
        if (input == undefined) {
            input = defaultValues;
        }
        super(input);
        this.type = "CylinderGeometry";
        this.parameters = {
            radiusTop: input.radiusTop ?? defaultValues.radiusTop,
            radiusBottom: input.radiusBottom ?? defaultValues.radiusBottom,
            height: input.height ?? defaultValues.height,
            radialSegments: input.radialSegments ?? defaultValues.radialSegments,
            heightSegments: input.heightSegments ?? defaultValues.heightSegments,
            openEnded: input.openEnded ?? defaultValues.openEnded,
            thetaStart: input.thetaStart ?? defaultValues.thetaStart,
            thetaLength: input.thetaLength ?? defaultValues.thetaLength
        };
        this.parameters.radialSegments = Math.max(3, Math.floor(this.parameters.radialSegments as number));
        this.parameters.heightSegments = Math.floor(this.parameters.heightSegments as number);
        this.init(this.parameters)
    }


    /** copy code from threejs */
    init(input: optionCylinderGeometry) {

        const thetaEnd = Math.min(input.thetaStart! + input.thetaLength!, Math.PI);

        // buffers
        let indices = this.buffer.indeices;
        let vertices = this.buffer.position;
        let normals = this.buffer.normal;
        let uvs = this.buffer.uv;


        // generate vertices, normals and uvs

        this.generateTorso(input);
        if (input.openEnded === false) {

            if (input.radiusTop! > 0) this.generateCap(input, true);
            if (input.radiusBottom! > 0) this.generateCap(input, false);

        }



        this.createWrieFrame();
        this._already = true;


    }

    generateTorso(input: optionCylinderGeometry) {
        let indices = this.buffer.indeices;
        let vertices = this.buffer.position;
        let normals = this.buffer.normal;
        let uvs = this.buffer.uv;
        let materialStep = this.buffer.materialStep;

        const normal: xyz = {
            x: 0,
            y: 0,
            z: 0
        };
        const vertex: xyz = {
            x: 0,
            y: 0,
            z: 0
        };

        const indexArray = [];
        let groupCount = 0;

        // helper variables
        // this will be used to calculate the normal
        const slope = (input.radiusBottom! - input.radiusTop!) / input.height!;

        // generate vertices, normals and uvs

        for (let y = 0; y <= input.heightSegments!; y++) {

            const indexRow = [];

            const v = y / input.heightSegments!;

            // calculate the radius of the current row

            const radius = v * (input.radiusBottom! - input.radiusTop!) + input.radiusTop!;

            for (let x = 0; x <= input.radialSegments!; x++) {

                const u = x / input.radialSegments!;

                const theta = u * input.thetaLength! + input.thetaStart!;

                const sinTheta = Math.sin(theta);
                const cosTheta = Math.cos(theta);

                // vertex

                vertex.x = radius * sinTheta;
                vertex.y = - v * input.height! + input.height! / 2;
                vertex.z = radius * cosTheta;
                vertices.push(vertex.x, vertex.y, vertex.z);

                // normal

                // normal.set(sinTheta, slope, cosTheta).normalize();
                const normal_1 = vec3.normalize([sinTheta, slope, cosTheta]);
                normals.push(normal_1[0], normal_1[1], normal_1[2]);

                // uv

                uvs.push(u, 1 - v);

                // save index of vertex in respective row

                indexRow.push(this.index++);

            }

            // now save vertices of the row in our index array

            indexArray.push(indexRow);

        }

        // generate indices

        for (let x = 0; x < input.radialSegments!; x++) {

            for (let y = 0; y < input.heightSegments!; y++) {

                // we use the index array to access the correct indices

                const a = indexArray[y][x];
                const b = indexArray[y + 1][x];
                const c = indexArray[y + 1][x + 1];
                const d = indexArray[y][x + 1];

                // faces

                indices.push(a, b, d);
                indices.push(b, c, d);

                // update group counter

                groupCount += 6;

            }

        }

        // add a group to the geometry. this will ensure multi material support

        // scope.addGroup(this.groupStart, groupCount, 0);
        materialStep.push([this.groupStart, groupCount, 0]);
        // calculate new start value for groups

        this.groupStart += groupCount;

    }

    generateCap(input: optionCylinderGeometry, top: boolean) {
        let indices = this.buffer.indeices;
        let vertices = this.buffer.position;
        let normals = this.buffer.normal;
        let uvs = this.buffer.uv;
        let materialStep = this.buffer.materialStep;
        // save the index of the first center vertex
        const centerIndexStart = this.index;

        const uv: xyz = {
            x: 0,
            y: 0,
            z: 0
        };
        const vertex: xyz = {
            x: 0,
            y: 0,
            z: 0
        };
        let groupCount = 0;

        const radius = (top === true) ? input.radiusTop! : input.radiusBottom!;
        const sign = (top === true) ? 1 : - 1;

        // first we generate the center vertex data of the cap.
        // because the geometry needs one set of uvs per face,
        // we must generate a center vertex per face/segment

        for (let x = 1; x <= input.radialSegments!; x++) {

            // vertex

            vertices.push(0, input.height! / 2 * sign, 0);

            // normal

            normals.push(0, sign, 0);

            // uv

            uvs.push(0.5, 0.5);

            // increase index

            this.index++;

        }

        // save the index of the last center vertex
        const centerIndexEnd = this.index;

        // now we generate the surrounding vertices, normals and uvs

        for (let x = 0; x <= input.radialSegments!; x++) {

            const u = x / input.radialSegments!;
            const theta = u * input.thetaLength! + input.thetaStart!;

            const cosTheta = Math.cos(theta);
            const sinTheta = Math.sin(theta);

            // vertex

            vertex.x = radius * sinTheta;
            vertex.y = input.height! / 2 * sign;
            vertex.z = radius * cosTheta;
            vertices.push(vertex.x, vertex.y, vertex.z);

            // normal

            normals.push(0, sign, 0);

            // uv

            uv.x = (cosTheta * 0.5) + 0.5;
            uv.y = (sinTheta * 0.5 * sign) + 0.5;
            uvs.push(uv.x, uv.y);

            // increase index

            this.index++;

        }

        // generate indices

        for (let x = 0; x < input.radialSegments!; x++) {

            const c = centerIndexStart + x;
            const i = centerIndexEnd + x;

            if (top === true) {

                // face top

                indices.push(i, i + 1, c);

            } else {

                // face bottom

                indices.push(i + 1, i, c);

            }

            groupCount += 3;

        }

        // add a group to the geometry. this will ensure multi material support

        // scope.addGroup(groupStart, groupCount, top === true ? 1 : 2);
        materialStep.push([this.groupStart, groupCount, top === true ? 1 : 2]);
        // calculate new start value for groups

        this.groupStart += groupCount;

    }


}