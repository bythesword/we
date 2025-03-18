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



export interface optionLatheGeometry extends optionBaseGemetry {

    /** 一个Vector2对象数组。每个点的X坐标必须大于0。 Default is an array with (0,-0.5), (0.5,0) and (0,0.5) which creates a simple diamond shape. */
    points: number[][],
    /** 要生成的车削几何体圆周分段的数量，默认值是12 */
    segments: number,
    /** 以弧度表示的起始角度，默认值为0 */
    phiStart: number,
    /**  车削部分的弧度（0-2PI）范围，2PI将是一个完全闭合的、完整的车削几何体，小于2PI是部分的车削。默认值是2PI。 */
    phiLength: number,
}

export class LatheGeometry extends BaseGeometry {



    /**box的参数 */
    parameters!: optionLatheGeometry;
    /** 计算过程中使用，应该改为私有模式，todo*/
    numberOfVertices !: number;
    /** 计算过程中使用，应该改为私有模式，todo*/
    groupStart !: number;
    index = 0;

    constructor(input: optionLatheGeometry) {

        super(input);
        this.type = "LatheGeometry";
        this.parameters = input
        this.parameters.segments = Math.floor(this.parameters.segments);
        this.parameters.phiLength = Math.max(Math.PI * 2, Math.min(this.parameters.phiLength, 0));
        this.init(this.parameters)
    }


    /** copy code from threejs */
    init(input: optionLatheGeometry) {
        let points = input.points;
        let segments = input.segments;
        let phiStart = input.phiStart;
        let phiLength = input.phiLength;
        // buffers
        let indices = this.buffer.indeices;
        let vertices = this.buffer.position;
        let normals = this.buffer.normal;
        let uvs = this.buffer.uv;
        let initNormals = [];
        // helper variables

        const inverseSegments = 1.0 / input.segments;
        const vertex: xyz = { x: 0, y: 0, z: 0 };
        const uv: xyz = { x: 0, y: 0, z: 0 };
        const normal: xyz = { x: 0, y: 0, z: 0 };
        const curNormal: xyz = { x: 0, y: 0, z: 0 };
        const prevNormal: xyz = { x: 0, y: 0, z: 0 };
        let dx = 0;
        let dy = 0;

        // pre-compute normals for initial "meridian"

		for ( let j = 0; j <= ( points.length - 1 ); j ++ ) {

			switch ( j ) {

				case 0:				// special handling for 1st vertex on path

                
					dx = points[ j + 1 ][0] - points[ j ][0];
					dy = points[ j + 1 ][1] - points[ j ][1];
					

					normal.x = dy * 1.0;
					normal.y = - dx;
					normal.z = dy * 0.0;

                    prevNormal.x = normal.x;
					prevNormal.y = normal.y;
					prevNormal.z = normal.z;
					// prevNormal.copy( normal );
                    const normal_1 = vec3.normalize([normal.x, normal.y, normal.z]);
                    normal.x,normal.y,normal.z = normal_1[0],normal_1[1],normal_1[2];  
					// normal.normalize();

					initNormals.push( normal.x, normal.y, normal.z );

					break;

				case ( points.length - 1 ):	// special handling for last Vertex on path

					initNormals.push( prevNormal.x, prevNormal.y, prevNormal.z );

					break;

				default:			// default handling for all vertices in between

                    dx = points[ j + 1 ][0] - points[ j ][1];
					dy = points[ j + 1 ][1] - points[ j ][1];
					// dx = points[ j + 1 ].x - points[ j ].x;
					// dy = points[ j + 1 ].y - points[ j ].y;

					normal.x = dy * 1.0;
					normal.y = - dx;
					normal.z = dy * 0.0;
                    curNormal.x = normal.x;
					curNormal.y = normal.y;
					curNormal.z = normal.z;
					// curNormal.copy( normal );

					normal.x += prevNormal.x;
					normal.y += prevNormal.y;
					normal.z += prevNormal.z;
                    const normal_2 = vec3.normalize([normal.x, normal.y, normal.z]);
                    normal.x,normal.y,normal.z = normal_2[0],normal_2[1],normal_2[2];  
					// normal.normalize();

					initNormals.push( normal.x, normal.y, normal.z );

					prevNormal.x = curNormal.x;
					prevNormal.y = curNormal.y;
					prevNormal.z = curNormal.z;
					// prevNormal.copy( curNormal );

			}

		}

		// generate vertices, uvs and normals

		for ( let i = 0; i <= segments; i ++ ) {

			const phi = phiStart + i * inverseSegments * phiLength;

			const sin = Math.sin( phi );
			const cos = Math.cos( phi );

			for ( let j = 0; j <= ( points.length - 1 ); j ++ ) {

				// vertex   
                vertex.x = points[ j ][0] * sin;
				vertex.y = points[ j ][1];
				vertex.z = points[ j ][0] * cos
                ;
				// vertex.x = points[ j ].x * sin;
				// vertex.y = points[ j ].y;
				// vertex.z = points[ j ].x * cos;

				vertices.push( vertex.x, vertex.y, vertex.z );

				// uv

				uv.x = i / segments;
				uv.y = j / ( points.length - 1 );

				uvs.push( uv.x, uv.y );

				// normal

				const x = initNormals[ 3 * j + 0 ] * sin;
				const y = initNormals[ 3 * j + 1 ];
				const z = initNormals[ 3 * j + 0 ] * cos;

				normals.push( x, y, z );

			}

		}

		// indices

		for ( let i = 0; i < segments; i ++ ) {

			for ( let j = 0; j < ( points.length - 1 ); j ++ ) {

				const base = j + i * points.length;

				const a = base;
				const b = base + points.length;
				const c = base + points.length + 1;
				const d = base + 1;

				// faces

				indices.push( a, b, d );
				indices.push( c, d, b );

			}

		}


        this.createWrieFrame();
        this._already = true;


    }
 


}