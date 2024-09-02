import { vec3 } from "wgpu-matrix";
import {
    BaseGeometry,
    optionBaseGemetry,
} from "./baseGeometry";

interface parameters {
    width: number,
    height: number,
    depth: number,
    widthSegments: number,
    heightSegments: number,
    depthSegments: number,
}
export interface optionBoxGemetry extends optionBaseGemetry {
    width?: number,
    height?: number,
    depth?: number,
    widthSegments?: number,
    heightSegments?: number,
    depthSegments?: number,

}

export class BoxGeometry extends BaseGeometry {

    parameters!: parameters;
    numberOfVertices !: number;
    groupStart !: number;

    constructor(input?: optionBoxGemetry) {
        if (input == undefined) {
            input = {
                width: 1,
                height: 1,
                depth: 1,
                widthSegments: 1,
                heightSegments: 1,
                depthSegments: 1
            }
        }
        super(input);
    }

    init(input: optionBaseGemetry) {

        this.parameters = {
            width: 1,
            height: 1,
            depth: 1,
            widthSegments: 1,
            heightSegments: 1,
            depthSegments: 1
        };
        if ("width" in input)
            this.parameters.width = Math.floor(input.width as number);
        if ("height" in input)
            this.parameters.height = Math.floor(input.height as number);
        if ("depth" in input)
            this.parameters.depth = Math.floor(input.depth as number);
        if ("widthSegments" in input)
            this.parameters.widthSegments = Math.floor(input.widthSegments as number);
        if ("heightSegments" in input)
            this.parameters.heightSegments = Math.floor(input.heightSegments as number);
        if ("depthSegments" in input)
            this.parameters.depthSegments = Math.floor(input.depthSegments as number);

        this.numberOfVertices = 0;
        this.groupStart = 0;


        let { width, height, depth, widthSegments, heightSegments, depthSegments } = this.parameters;
        let x = 0, y = 1, z = 2;

        this.buildPlane(z, y, x, - 1, - 1, depth, height, width, depthSegments, heightSegments, 0); // px
        this.buildPlane(z, y, x, 1, - 1, depth, height, - width, depthSegments, heightSegments, 1); // nx
        this.buildPlane(x, z, y, 1, 1, width, depth, height, widthSegments, depthSegments, 2); // py
        this.buildPlane(x, z, y, 1, - 1, width, depth, - height, widthSegments, depthSegments, 3); // ny
        this.buildPlane(x, y, z, 1, - 1, width, height, depth, widthSegments, heightSegments, 4); // pz
        this.buildPlane(x, y, z, - 1, - 1, width, height, - depth!, widthSegments, heightSegments, 5); // nz

    }


    /**copy from three.js */
    buildPlane(u: number, v: number, w: number,
        udir: number, vdir: number,
        width: number, height: number, depth: number,
        gridX: number, gridY: number, materialIndex: number,
        // indices: number[], vertices: number[], normals: number[], uvs: number[],
        // numberOfVertices: number, groupStart: number
    ) {
        let indices = this.buffer.indeices;
        let vertices = this.buffer.position;
        let normals = this.buffer.normal;
        let uvs = this.buffer.uv;
        let materialStep = this.buffer.materialStep;

        // let numberOfVertices = this.numberOfVertices;
        // let groupStart = this.groupStart;
        const segmentWidth = width / gridX;
        const segmentHeight = height / gridY;

        const widthHalf = width / 2;
        const heightHalf = height / 2;
        const depthHalf = depth / 2;

        const gridX1 = gridX + 1;
        const gridY1 = gridY + 1;

        let vertexCounter = 0;
        let groupCount = 0;

        const vector = vec3.create();
        // let u = "x", v = "y", w = "z";
        // const vector = new Vector3();

        // generate vertices, normals and uvs

        for (let iy = 0; iy < gridY1; iy++) {

            const y = iy * segmentHeight - heightHalf;

            for (let ix = 0; ix < gridX1; ix++) {

                const x = ix * segmentWidth - widthHalf;

                // set values to correct vector component

                vector[u] = x * udir;
                vector[v] = y * vdir;
                vector[w] = depthHalf;

                // now apply vector to vertex buffer

                vertices.push(vector[0], vector[1], vector[2]);

                // set values to correct vector component

                vector[u] = 0;
                vector[v] = 0;
                vector[w] = depth > 0 ? 1 : - 1;

                // now apply vector to normal buffer

                normals.push(vector[0], vector[1], vector[2]);

                // uvs

                uvs.push(ix / gridX);
                uvs.push(1 - (iy / gridY));

                // counters

                vertexCounter += 1;

            }

        }

        // indices

        // 1. you need three indices to draw a single face
        // 2. a single segment consists of two faces
        // 3. so we need to generate six (2*3) indices per segment

        for (let iy = 0; iy < gridY; iy++) {

            for (let ix = 0; ix < gridX; ix++) {

                const a = this.numberOfVertices + ix + gridX1 * iy;
                const b = this.numberOfVertices + ix + gridX1 * (iy + 1);
                const c = this.numberOfVertices + (ix + 1) + gridX1 * (iy + 1);
                const d = this.numberOfVertices + (ix + 1) + gridX1 * iy;

                // faces

                indices.push(a, b, d);
                indices.push(b, c, d);

                // increase counter

                groupCount += 6;

            }

        }

        // add a group to the geometry. this will ensure multi material support

        materialStep.push([this.groupStart, groupCount, materialIndex]);
        // scope.addGroup(groupStart, groupCount, materialIndex);

        // calculate new start value for groups

        this.groupStart += groupCount;

        // update total number of vertices

        this.numberOfVertices += vertexCounter;

    }
    destory() {
        this._destory = false;
        this.buffer = {
            position: [],
            normal: [],
            uv: [],
            indeices: [],
            materialStep: []
        }
    }

}