import { vec3 } from "wgpu-matrix";
import { BaseGeometry, optionBaseGemetry, xyz } from "./baseGeometry";


export interface optionPolyhedronGeometry extends optionBaseGemetry {
    /**一个顶点Array（数组）：[1,1,1, -1,-1,-1, ... ] */
    vertices: number[],
    /**一个构成面的索引Array（数组）， [0,1,2, 2,3,0, ... ]*/
    indices: number[],
    /**最终形状的半径*/
    radius: number,
    /**将对这个几何体细分多少个级别。细节越多，形状就越平滑。*/
    detail?: number,

}

export class PolyhedronGeometry extends BaseGeometry {
    /**box的参数 */
    parameters!: optionPolyhedronGeometry;
    /** 计算过程中使用，应该改为私有模式，todo*/
    numberOfVertices !: number;
    /** 计算过程中使用，应该改为私有模式，todo*/
    groupStart !: number;

    declare input: optionPolyhedronGeometry;
    _already: boolean = false;
    constructor(input: optionPolyhedronGeometry) {

        super(input);
        this.input = input;
        this.type = 'PolyhedronGeometry';

        this.init(input)
    }
    init(input: optionPolyhedronGeometry) {
        // let indices = this.buffer.indeices;
        let vertices = this.buffer.position;
        let normals = this.buffer.normal;
        // let uvs = this.buffer.uv;
        const vertices_ = input.vertices;
        const indices_ = input.indices;
        const radius = input.radius;
        const detail = input.detail ?? 0;

        // this.buffer.indeices = this.input.indices;

        // the subdivision creates the vertex buffer data

        this.subdivide(detail);

        // all vertices should lie on a conceptual sphere with a given radius

        this.applyRadius(radius);

        // finally, create the uv data

        this.generateUVs();
        if (detail === 0) {

            this.computeVertexNormals(); // flat normals

        } else {

            this.normalizeNormals(); // smooth normals

        }
        normals = vertices.slice();

        this.createWrieFrame();
        this._already = true;
    }

    subdivide(detail: number) {
        const indices = this.input.indices;
        let a: xyz = {
            x: 0,
            y: 0,
            z: 0
        };
        let b: xyz = {
            x: 0,
            y: 0,
            z: 0
        };
        let c: xyz = {
            x: 0,
            y: 0,
            z: 0
        };

        // iterate over all faces and apply a subdivision with the given detail value

        for (let i = 0; i < indices.length; i += 3) {

            // get the vertices of the face

            a = this.getVertexByIndex(indices[i + 0]);
            b = this.getVertexByIndex(indices[i + 1]);
            c = this.getVertexByIndex(indices[i + 2]);

            // perform subdivision

            this.subdivideFace(a, b, c, detail);

        }

    }
    subdivideFace(a: xyz, b: xyz, c: xyz, detail: number) {

        const cols = detail + 1;

        // we use this multidimensional array as a data structure for creating the subdivision

        const v: xyz[][] = [];

        // construct all of the vertices for this subdivision

        for (let i = 0; i <= cols; i++) {

            v[i] = [];

            const aj = vec3.lerp(vec3.fromValues(a.x, a.y, a.z), vec3.fromValues(c.x, c.y, c.z), i / cols);
            // const aj = a.clone().lerp( c, i / cols );
            const bj = vec3.lerp(vec3.fromValues(b.x, b.y, b.z), vec3.fromValues(c.x, c.y, c.z), i / cols);
            // const bj = b.clone().lerp( c, i / cols );

            const rows = cols - i;

            for (let j = 0; j <= rows; j++) {

                if (j === 0 && i === cols) {
                    //v[ i ][ j ] = aj;
                    v[i][j] = { x: aj[0], y: aj[1], z: aj[2] };
                } else {
                    const cj = vec3.lerp(vec3.fromValues(aj[0], aj[1], aj[2]), vec3.fromValues(bj[0], bj[1], bj[2]), j / rows);
                    v[i][j] = { x: cj[0], y: cj[1], z: cj[2] };
                    //v[ i ][ j ] = aj.clone().lerp( bj, j / rows );
                }

            }

        }

        // construct all of the faces

        for (let i = 0; i < cols; i++) {

            for (let j = 0; j < 2 * (cols - i) - 1; j++) {

                const k = Math.floor(j / 2);

                if (j % 2 === 0) {

                    this.pushVertex(v[i][k + 1]);
                    this.pushVertex(v[i + 1][k]);
                    this.pushVertex(v[i][k]);

                } else {

                    this.pushVertex(v[i][k + 1]);
                    this.pushVertex(v[i + 1][k + 1]);
                    this.pushVertex(v[i + 1][k]);

                }

            }

        }

    }
    applyRadius(radius: number) {
        let vertexBuffer = this.buffer.position;
        let uvBuffer = this.buffer.uv;
        const vertex: xyz = {
            x: 0,
            y: 0,
            z: 0
        };

        // iterate over the entire buffer and apply the radius to each vertex

        for (let i = 0; i < vertexBuffer.length; i += 3) {

            vertex.x = vertexBuffer[i + 0];
            vertex.y = vertexBuffer[i + 1];
            vertex.z = vertexBuffer[i + 2];

            let vector_1 = vec3.scale(vec3.fromValues(vertex.x, vertex.y, vertex.z), radius);
            // vertex.normalize().multiplyScalar( radius );
            vertex.x = vector_1[0];
            vertex.y = vector_1[1];
            vertex.z = vector_1[2];
            vertexBuffer[i + 0] = vertex.x;
            vertexBuffer[i + 1] = vertex.y;
            vertexBuffer[i + 2] = vertex.z;

        }

    }
    generateUVs() {
        let vertexBuffer = this.buffer.position;
        let uvBuffer = this.buffer.uv;
        const vertex: xyz = {
            x: 0,
            y: 0,
            z: 0
        };

        for (let i = 0; i < vertexBuffer.length; i += 3) {

            vertex.x = vertexBuffer[i + 0];
            vertex.y = vertexBuffer[i + 1];
            vertex.z = vertexBuffer[i + 2];

            const u = this.azimuth(vertex) / 2 / Math.PI + 0.5;
            const v = this.inclination(vertex) / Math.PI + 0.5;
            uvBuffer.push(u, 1 - v);

        }

        this.correctUVs();

        this.correctSeam();

    }
    correctSeam() {
        let uvBuffer = this.buffer.uv
        // handle case when face straddles the seam, see #3269

        for (let i = 0; i < uvBuffer.length; i += 6) {

            // uv data of a single face

            const x0 = uvBuffer[i + 0];
            const x1 = uvBuffer[i + 2];
            const x2 = uvBuffer[i + 4];

            const max = Math.max(x0, x1, x2);
            const min = Math.min(x0, x1, x2);

            // 0.9 is somewhat arbitrary

            if (max > 0.9 && min < 0.1) {

                if (x0 < 0.2) uvBuffer[i + 0] += 1;
                if (x1 < 0.2) uvBuffer[i + 2] += 1;
                if (x2 < 0.2) uvBuffer[i + 4] += 1;

            }

        }

    }

    pushVertex(vertex: xyz) {
        this.buffer.position.push(vertex.x, vertex.y, vertex.z);
    }

    getVertexByIndex(index: number) {
        let vertices = this.input.vertices;
        const stride = index * 3;
        let vertex: xyz = {
            x: 0,
            y: 0,
            z: 0
        };
        vertex.x = vertices[stride + 0];
        vertex.y = vertices[stride + 1];
        vertex.z = vertices[stride + 2];
        return vertex;
    }
    correctUVs() {
        let vertexBuffer = this.buffer.position;
        let uvBuffer = this.buffer.uv;
        const a: xyz = {
            x: 0,
            y: 0,
            z: 0
        };
        const b: xyz = {
            x: 0,
            y: 0,
            z: 0
        };
        const c: xyz = {
            x: 0,
            y: 0,
            z: 0
        };

        const centroid: xyz = {
            x: 0,
            y: 0,
            z: 0
        };

        const uvA: xyz = {
            x: 0,
            y: 0,
            z: 0
        };
        const uvB: xyz = {
            x: 0,
            y: 0,
            z: 0
        };
        const uvC: xyz = {
            x: 0,
            y: 0,
            z: 0
        };

        for (let i = 0, j = 0; i < vertexBuffer.length; i += 9, j += 6) {
            a.x = vertexBuffer[i + 0];
            a.y = vertexBuffer[i + 1];
            a.z = vertexBuffer[i + 2];
            b.x = vertexBuffer[i + 3];
            b.y = vertexBuffer[i + 4];
            b.z = vertexBuffer[i + 5];
            c.x = vertexBuffer[i + 6];
            c.y = vertexBuffer[i + 7];
            c.z = vertexBuffer[i + 8];
            // a.set(vertexBuffer[i + 0], vertexBuffer[i + 1], vertexBuffer[i + 2]);
            // b.set(vertexBuffer[i + 3], vertexBuffer[i + 4], vertexBuffer[i + 5]);
            // c.set(vertexBuffer[i + 6], vertexBuffer[i + 7], vertexBuffer[i + 8]);

            // uvA.set(uvBuffer[j + 0], uvBuffer[j + 1]);
            // uvB.set(uvBuffer[j + 2], uvBuffer[j + 3]);
            // uvC.set(uvBuffer[j + 4], uvBuffer[j + 5]);
            uvA.x = uvBuffer[j + 0];
            uvA.y = uvBuffer[j + 1];
            uvB.x = uvBuffer[j + 2];
            uvB.y = uvBuffer[j + 3];
            uvC.x = uvBuffer[j + 4];
            uvC.y = uvBuffer[j + 5];

            const centroid_1 = vec3.divScalar(
                vec3.add(
                    vec3.add(
                        vec3.fromValues(
                            a.x,
                            a.y,
                            a.z
                        ),
                        vec3.fromValues(
                            b.x,
                            b.y,
                            b.z
                        ),
                    ),
                    vec3.fromValues(
                        c.x,
                        c.y,
                        c.z
                    ),
                ), 3);

            centroid.x, centroid.y, centroid.z = centroid_1[0], centroid_1[1], centroid_1[2];
            // centroid.copy(a).add(b).add(c).divideScalar(3);

            const azi = this.azimuth(centroid);

            this.correctUV(uvBuffer, uvA, j + 0, a, azi);
            this.correctUV(uvBuffer, uvB, j + 2, b, azi);
            this.correctUV(uvBuffer, uvC, j + 4, c, azi);

        }

    }

    correctUV(uvBuffer: number[], uv: xyz, stride: number, vector: xyz, azimuth: number) {
        if ((azimuth < 0) && (uv.x === 1)) {
            uvBuffer[stride] = uv.x - 1;
        }
        if ((vector.x === 0) && (vector.z === 0)) {
            uvBuffer[stride] = azimuth / 2 / Math.PI + 0.5;
        }
    }


    // Angle around the Y axis, counter-clockwise when looking from above.
    azimuth(vector: xyz) {
        return Math.atan2(vector.z, - vector.x);
    }


    // Angle above the XZ plane.
    inclination(vector: xyz) {
        return Math.atan2(- vector.y, Math.sqrt((vector.x * vector.x) + (vector.z * vector.z)));
    }
    computeVertexNormals() {

        const index = this.buffer.indeices;
        const positionAttribute = this.buffer.position;
        let normalAttribute = this.buffer.normal;
        // normalAttribute = [];
        for (let i = 0; i < positionAttribute.length; i += 3) {
            normalAttribute.push(0, 0, 0);
        }

        if (positionAttribute !== undefined) {

            // const pA = new Vector3(), pB = new Vector3(), pC = new Vector3();
            // const nA = new Vector3(), nB = new Vector3(), nC = new Vector3();
            // const cb = new Vector3(), ab = new Vector3();

            // indexed elements

            if (index) {

                for (let i = 0, il = index.length; i < il; i += 3) {

                    const vA = vec3.fromValues(positionAttribute[index[i + 0] * 3 + 0], positionAttribute[index[i + 0] * 3 + 1], positionAttribute[index[i + 0] * 3 + 2]);
                    const vB = vec3.fromValues(positionAttribute[index[i + 1] * 3 + 0], positionAttribute[index[i + 1] * 3 + 1], positionAttribute[index[i + 1] * 3 + 2]);
                    const vC = vec3.fromValues(positionAttribute[index[i + 2] * 3 + 0], positionAttribute[index[i + 2] * 3 + 1], positionAttribute[index[i + 2] * 3 + 2]);




                    let cb = vec3.sub(vC, vB);
                    let ab = vec3.sub(vA, vB);
                    cb = vec3.cross(cb, ab);
                    // cb = vec3.cross(cb, ab);



                    let nA = vec3.fromValues(normalAttribute[index[i + 0] * 3 + 0], normalAttribute[index[i + 0] * 3 + 1], normalAttribute[index[i + 0] * 3 + 2]);
                    let nB = vec3.fromValues(normalAttribute[index[i + 1] * 3 + 0], normalAttribute[index[i + 1] * 3 + 1], normalAttribute[index[i + 1] * 3 + 2]);
                    let nC = vec3.fromValues(normalAttribute[index[i + 2] * 3 + 0], normalAttribute[index[i + 2] * 3 + 1], normalAttribute[index[i + 2] * 3 + 2]);

                    nA = vec3.add(nA, cb);
                    nB = vec3.add(nB, cb);
                    nC = vec3.add(nC, cb);

                    normalAttribute[index[i + 0] * 3 + 0], normalAttribute[index[i + 0] * 3 + 1], normalAttribute[index[i + 0] * 3 + 2] = nA[0], nA[1], nA[2];
                    normalAttribute[index[i + 1] * 3 + 0], normalAttribute[index[i + 1] * 3 + 1], normalAttribute[index[i + 1] * 3 + 2] = nB[0], nB[1], nB[2];
                    normalAttribute[index[i + 2] * 3 + 0], normalAttribute[index[i + 2] * 3 + 1], normalAttribute[index[i + 2] * 3 + 2] = nC[0], nC[1], nC[2];

                }

            } else {

                // non-indexed elements (unconnected triangle soup)

                for (let i = 0, il = positionAttribute.length; i < il; i += 3 * 3) {
                    const pA = vec3.fromValues(positionAttribute[i + 0], positionAttribute[i + 1], positionAttribute[i + 2]);
                    const pB = vec3.fromValues(positionAttribute[i + 3], positionAttribute[i + 4], positionAttribute[i + 5]);
                    const pC = vec3.fromValues(positionAttribute[i + 6], positionAttribute[i + 7], positionAttribute[i + 8]);

                    let cb = vec3.sub(pC, pB);
                    let ab = vec3.sub(pA, pB);
                    cb = vec3.cross(cb, ab);

                    normalAttribute[i + 0] = cb[0], normalAttribute[i + 1] = cb[1], normalAttribute[i + 2] = cb[2];
                    normalAttribute[i + 3] = cb[0], normalAttribute[i + 4] = cb[1], normalAttribute[i + 5] = cb[2];
                    normalAttribute[i + 6] = cb[0], normalAttribute[i + 7] = cb[1], normalAttribute[i + 8] = cb[2];

                }

            }

            for (let i = 0, il = normalAttribute.length; i < il; i += 3) {
                let _vector = vec3.normalize(vec3.fromValues(normalAttribute[i + 0], normalAttribute[i + 1], normalAttribute[i + 2]));
                normalAttribute[i + 0] = _vector[0], normalAttribute[i + 1] = _vector[1], normalAttribute[i + 2] = _vector[2];
            }

        }

    }

    normalizeNormals() {

        const normalAttribute = this.buffer.normal;

        for (let i = 0, il = normalAttribute.length; i < il; i += 3) {
            let _vector = vec3.normalize(vec3.fromValues(normalAttribute[i + 0], normalAttribute[i + 1], normalAttribute[i + 2]));
            normalAttribute[i + 0] = _vector[0], normalAttribute[i + 1] = _vector[1], normalAttribute[i + 2] = _vector[2];
        }

    }
}