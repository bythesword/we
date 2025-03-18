import { vec3 } from "wgpu-matrix";
import {
    BaseGeometry,
    optionBaseGemetry,
    xyz,
} from "./baseGeometry";



export interface optionRingGeometry extends optionBaseGemetry {
    /** 内部半径，默认值为0.5*/
    innerRadius?: number,
    /**  外部半径，默认值为1*/
    outerRadius?: number,
    /**  圆环的分段数。这个值越大，圆环就越圆。最小值为3，默认值为32。 */
    thetaSegments?: number,
    /**phiSegments — 最小值为1，默认值为8 */
    phiSegments?: number,
    /** 开始角度，默认值为0 */
    thetaStart?: number,
    /** 结束角度，默认值为2*Math.PI */
    thetaLength?: number,
}

export class RingGeometry extends BaseGeometry {



    /**box的参数 */
    parameters!: optionRingGeometry;
    /** 计算过程中使用，应该改为私有模式，todo*/
    numberOfVertices !: number;
    /** 计算过程中使用，应该改为私有模式，todo*/
    groupStart !: number;

    constructor(input?: optionRingGeometry) {
        let defaultValues = {
            innerRadius: 0.5,
            outerRadius: 1,
            thetaSegments: 32,
            phiSegments: 8,
            thetaStart: 0,
            thetaLength: Math.PI * 2,
        }
        if (input == undefined) {
            input = defaultValues;
        }
        super(input);
        this.type = "RingGeometry";
        this.parameters = {
            innerRadius: input.innerRadius ?? defaultValues.innerRadius,
            outerRadius: input.outerRadius ?? defaultValues.outerRadius,
            thetaSegments: input.thetaSegments ?? defaultValues.thetaSegments,
            phiSegments: input.phiSegments ?? defaultValues.phiSegments,
            thetaStart: input.thetaStart ?? defaultValues.thetaStart,
            thetaLength: input.thetaLength ?? defaultValues.thetaLength,
        };
        this.parameters.thetaLength = Math.max(3, this.parameters.thetaLength as number);
        this.parameters.phiSegments = Math.max(1, this.parameters.phiSegments as number);
        this.init(this.parameters)
    }

    /** copy code from threejs */
    init(input: optionRingGeometry) {
        // buffers         
        let indices = this.buffer.indeices;
        let vertices = this.buffer.position;
        let normals = this.buffer.normal;
        let uvs = this.buffer.uv;

        let radius = input.innerRadius!;
        const radiusStep = ((input.outerRadius! - input.innerRadius!) / input.phiSegments!);
        const phiSegments = input.phiSegments!;
        const thetaStart = input.thetaStart!;
        const thetaLength = input.thetaLength!;
        const thetaSegments = input.thetaSegments!;
        const outerRadius = input.outerRadius!; 

        // helper variables
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

 		// generate vertices, normals and uvs

         for ( let j = 0; j <= phiSegments; j ++ ) {

			for ( let i = 0; i <= thetaSegments; i ++ ) {

				// values are generate from the inside of the ring to the outside

				const segment = thetaStart + i / thetaSegments * thetaLength;

				// vertex

				vertex.x = radius * Math.cos( segment );
				vertex.y = radius * Math.sin( segment );

				vertices.push( vertex.x, vertex.y, vertex.z );

				// normal

				normals.push( 0, 0, 1 );

				// uv

				uv.x = ( vertex.x / outerRadius + 1 ) / 2;
				uv.y = ( vertex.y / outerRadius + 1 ) / 2;

				uvs.push( uv.x, uv.y );

			}

			// increase the radius for next row of vertices

			radius += radiusStep;

		}

		// indices

		for ( let j = 0; j < phiSegments; j ++ ) {

			const thetaSegmentLevel = j * ( thetaSegments + 1 );

			for ( let i = 0; i < thetaSegments; i ++ ) {

				const segment = i + thetaSegmentLevel;

				const a = segment;
				const b = segment + thetaSegments + 1;
				const c = segment + thetaSegments + 2;
				const d = segment + 1;

				// faces

				indices.push( a, b, d );
				indices.push( b, c, d );

			}

		}       


        this.createWrieFrame();
        this._already = true;
    }



}