import { vec3 } from "wgpu-matrix";
import { BaseGeometry, optionBaseGemetry, xyz } from "./baseGeometry";


export interface optionTorusGeometry extends optionBaseGemetry {
    /**环面的半径，从环面的中心到管道横截面的中心。默认值是1 */
    radius?: number,
    /**管道的半径。默认值是0.4。*/
    tube?: number,
    /**环面的半径细分段数。默认值是12。*/
    radialSegments?: number,
    /**管道的半径细分段数。默认值是48。*/
    tubularSegments?: number,
    /**圆环的中心角。默认值是2* Math.PI。*/
    arc?: number,

}

export class TorusGeometry extends BaseGeometry {
    /**box的参数 */
    parameters!: optionTorusGeometry;
    /** 计算过程中使用，应该改为私有模式，todo*/
    numberOfVertices !: number;
    /** 计算过程中使用，应该改为私有模式，todo*/
    groupStart !: number;
    constructor(input?: optionTorusGeometry) {
        let defaultValues = {
            radius: 1,
            tube: 0.4,
            radialSegments: 12,
            tubularSegments: 48,
            arc: Math.PI * 2,
        }
        if (input == undefined) {
            input = defaultValues;
        }
        super(input);
        this.type = 'TorusGeometry';
        this.parameters = {
            radius: input.radius ?? defaultValues.radius,
            tube: input.tube ?? defaultValues.tube,
            radialSegments: input.radialSegments ?? defaultValues.radialSegments,
            tubularSegments: input.tubularSegments ?? defaultValues.tubularSegments,
            arc: input.arc ?? defaultValues.arc,
        };
        this.parameters.radialSegments = Math.floor(this.parameters.radialSegments as number);
        this.parameters.tubularSegments = Math.floor(this.parameters.tubularSegments as number);
        this.init(this.parameters)
    }
    init(input: optionTorusGeometry) {
        let indices = this.buffer.indeices;
        let vertices = this.buffer.position;
        let normals = this.buffer.normal;
        let uvs = this.buffer.uv;

        const radius = input.radius!;
        const tube = input.tube!;
        const radialSegments = input.radialSegments!;
        const tubularSegments = input.tubularSegments!;
        const arc = input.arc!;

        // helper variables
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
        const center: xyz = {
            x: 0,
            y: 0,
            z: 0
        };
        // generate vertices, normals and uvs

        for (let j = 0; j <= radialSegments; j++) {

            for (let i = 0; i <= tubularSegments; i++) {

                const u = i / tubularSegments * arc;
                const v = j / radialSegments * Math.PI * 2;

                // vertex

                vertex.x = (radius + tube * Math.cos(v)) * Math.cos(u);
                vertex.y = (radius + tube * Math.cos(v)) * Math.sin(u);
                vertex.z = tube * Math.sin(v);

                vertices.push(vertex.x, vertex.y, vertex.z);

                // normal

                center.x = radius * Math.cos(u);
                center.y = radius * Math.sin(u);
                // normal.subVectors(vertex, center).normalize();
                let normal_1 = vec3.normalize(vec3.sub(vec3.fromValues(vertex.x, vertex.y, vertex.z), vec3.fromValues(center.x, center.y, center.z)));
                normal.x, normal.y, normal.z = normal_1[0], normal_1[1], normal_1[2];
                normals.push(normal.x, normal.y, normal.z);

                // uv

                uvs.push(i / tubularSegments);
                uvs.push(j / radialSegments);

            }

        }
        // generate indices

        for (let j = 1; j <= radialSegments; j++) {

            for (let i = 1; i <= tubularSegments; i++) {

                // indices

                const a = (tubularSegments + 1) * j + i - 1;
                const b = (tubularSegments + 1) * (j - 1) + i - 1;
                const c = (tubularSegments + 1) * (j - 1) + i;
                const d = (tubularSegments + 1) * j + i;

                // faces

                indices.push(a, b, d);
                indices.push(b, c, d);

            }

        }
        this.createWrieFrame();
        this._already = true;
    }


}