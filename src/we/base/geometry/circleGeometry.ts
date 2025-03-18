import { vec3 } from "wgpu-matrix";
import {
    BaseGeometry, 
    optionBaseGemetry,
} from "./baseGeometry"; 


export interface optionCircleGeometry extends optionBaseGemetry {
    radius?: number,
    segments?: number,
    thetaStart?: number,
    thetaLength?: number,
}

export class CircleGeometry extends BaseGeometry {



    /**box的参数 */
    parameters!: optionCircleGeometry;
    /** 计算过程中使用，应该改为私有模式，todo*/
    numberOfVertices !: number;
    /** 计算过程中使用，应该改为私有模式，todo*/
    groupStart !: number;

    constructor(input?: optionCircleGeometry) {
        let defaultValues = {
            radius: 1,
            segments: 16,
            thetaStart: 0,
            thetaLength: Math.PI * 2,
        }
        if (input == undefined) {
            input = defaultValues;
        }
        super(input);
        this.type = "CircleGeometry";
        this.parameters = {
            radius: input.radius ?? defaultValues.radius,
            segments: input.segments ?? defaultValues.segments,
            thetaStart: input.thetaStart ?? defaultValues.thetaStart,
            thetaLength: input.thetaLength ?? defaultValues.thetaLength
        };
        this.parameters.segments = Math.max(3, Math.floor(this.parameters.segments as number));
        this.init(this.parameters)
    }

    /** copy code from threejs */
    init(input: optionCircleGeometry) {

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

        let segments = input.segments!; 
        let thetaStart = input.thetaStart!;
        let radius = input.radius!; 
        let thetaLength = input.thetaLength!;
        // generate vertices, normals and uvs

     		// center point

		vertices.push( 0, 0, 0 );
		normals.push( 0, 0, 1 );
		uvs.push( 0.5, 0.5 );

		for ( let s = 0, i = 3; s <= segments; s ++, i += 3 ) {

			const segment = thetaStart + s / segments * thetaLength;

			// vertex

			let x = radius * Math.cos( segment );
			let y = radius * Math.sin( segment );

			vertices.push( x,y, 0);

			// normal

			normals.push( 0, 0, 1 );

			// uvs

			let u = ( vertices[ i ] / radius + 1 ) / 2;
			let v = ( vertices[ i + 1 ] / radius + 1 ) / 2;

			uvs.push( u, v );

		}

		// indices

		for ( let i = 1; i <= segments; i ++ ) {

			indices.push( i, i + 1, 0 );

		}
 

        this.createWrieFrame();
        this._already = true;
    }



}