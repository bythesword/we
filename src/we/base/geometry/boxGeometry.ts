import { vec3 } from "wgpu-matrix";
import {
    BaseGeometry,
    optionBaseGemetry,
} from "./baseGeometry";

interface boxParameters {
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


    /**box的参数 */
    parameters!: boxParameters;
    /** 计算过程中使用，应该改为私有模式，todo*/
    numberOfVertices !: number;
    /** 计算过程中使用，应该改为私有模式，todo*/
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
        this.type = "box";
        this.init(input)
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

        this.createWrieFrame();
        this._already = true;
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
    destroy() {
        this._destroy = false;
        this.buffer = {
            position: [],
            normal: [],
            uv: [],
            indeices: [],
            materialStep: [],
            color:[],
        }
    }

    // /**
    //  * 获取线框shaderCode
    //  * @param color 线框颜色
    //  * @returns shader code
    //  */
    // getWireFrameShdaerCode(color: coreConst.color4F): string {
    //     let red = color.red;
    //     let green = color.green;
    //     let blue = color.blue;
    //     let alpha = 1.0;
    //     if ("alpha" in color) {
    //         color.alpha;
    //     }
    //     let code = framelineVS;
    //     code = code.replace("$red", red.toString());
    //     code = code.replace("$blue", blue.toString());
    //     code = code.replace("$green", green.toString());
    //     code = code.replace("$alpha", alpha.toString());
    //     return code;
    // }
    // /**
    //  * 创建线框数据结构
    //  */
    // createWrieFrame() {
    //     let list: { [name: string]: number[] };
    //     list = {};
    //     for (let i = 0; i < this.buffer.indeices.length; i += 3) {
    //         let A = this.buffer.indeices[i];
    //         let B = this.buffer.indeices[i + 1];
    //         let C = this.buffer.indeices[i + 2];
    //         let AB = [A, B].sort().toString();
    //         let BC = [B, C].sort().toString();
    //         let CA = [C, A].sort().toString();
    //         list[AB] = [A, B];
    //         list[BC] = [B, C];
    //         list[CA] = [C, A];
    //     }
    //     let indeices: number[] = [];
    //     for (let i in list) {
    //         indeices.push(list[i][0], list[i][1]);
    //     }
    //     let output: geometryWireFrameAttribute = {
    //         indeices: indeices
    //     };
    //     this.wireFrame = output;
    // }
    // /**
    //  * 返回线框索引
    //  * @returns indexBuffer 结构
    //  */
    // getWireFrameIndeices(): indexBuffer {
    //     let indeices: indexBuffer = {
    //         buffer: new Uint32Array(this.wireFrame.indeices),
    //         indexForat: "uint32"
    //     };
    //     return indeices;
    // }
    // /**
    //  * 返回线框索引绘制的数量
    //  * @returns number
    //  */
    // getWireFrameDrawCount(): number {
    //     return this.wireFrame.indeices.length;
    // }
    // /***
    //  * 返回顶点属性，索引模式
    //  */
    // getWireFrame(): vsAttributes[] {
    //     let position: vsAttributes = {
    //         vertexArray: new Float32Array(this.buffer.position),
    //         type: "Float32Array",
    //         arrayStride: 4 * 3,
    //         attributes: [
    //             {
    //                 shaderLocation: 0,
    //                 offset: 0,
    //                 format: "float32x3"
    //             }
    //         ]
    //     };
    //     let vsa: vsAttributes[] = [position];
    //     return vsa;
    // }

    // /**
    //  * 返回片面的索引模式的绘制数量
    //  * @returns number
    //  */
    // getDrawCount(): number {

    //     return this.buffer.indeices.length;
    // }

    // /**
    //  * 返回片面的索引数据跟上
    //  * @returns indeBuffer 格式
    //  */
    // getIndeices(): indexBuffer {
    //     let indeices: indexBuffer = {
    //         buffer: new Uint32Array(this.buffer.indeices),
    //         indexForat: "uint32"
    //     };
    //     return indeices;
    // }
    // /**
    //  * 返回shader的VS部分的code
    //  * @returns string
    //  */
    // getCodeVS() {
    //     return triangleVS;
    // }
    // /**
    //  * 输出顶点信息
    //  * @returns sAttributes[]
    //  */
    // getAttribute(): vsAttributes[] {

    //     let position: vsAttributes = {
    //         vertexArray: new Float32Array(this.buffer.position),
    //         type: "Float32Array",
    //         arrayStride: 4 * 3,
    //         attributes: [
    //             {
    //                 shaderLocation: 0,
    //                 offset: 0,
    //                 format: "float32x3"
    //             }
    //         ]
    //     };
    //     let uv: vsAttributes = {
    //         vertexArray: new Float32Array(this.buffer.uv),
    //         type: "Float32Array",
    //         arrayStride: 4 * 2,
    //         attributes: [
    //             {
    //                 shaderLocation: 1,
    //                 offset: 0,
    //                 format: "float32x2"
    //             }
    //         ]
    //     };
    //     let normal: vsAttributes = {
    //         vertexArray: new Float32Array(this.buffer.normal),
    //         type: "Float32Array",
    //         arrayStride: 4 * 3,
    //         attributes: [
    //             {
    //                 shaderLocation: 2,
    //                 offset: 0,
    //                 format: "float32x3"
    //             }
    //         ]
    //     }
    //     let vsa: vsAttributes[] = [position, uv, normal];
    //     return vsa;
    // }

}