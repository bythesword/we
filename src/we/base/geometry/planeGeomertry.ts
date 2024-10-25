import { vec3 } from "wgpu-matrix";
import {
    BaseGeometry,
    optionBaseGemetry,
} from "./baseGeometry";



export interface optionPlaneGeometry extends optionBaseGemetry {
    width?: number,
    height?: number,
    widthSegments?: number,
    heightSegments?: number,

}

export class PlaneGeometry extends BaseGeometry {



    /**box的参数 */
    parameters!: optionPlaneGeometry;
    /** 计算过程中使用，应该改为私有模式，todo*/
    numberOfVertices !: number;
    /** 计算过程中使用，应该改为私有模式，todo*/
    groupStart !: number;

    constructor(input?: optionPlaneGeometry) {
        let defaultValues:optionPlaneGeometry = {
            width:1,
            height:1,
            widthSegments:1,
            heightSegments:1
        }
        if (input == undefined) {
            input = defaultValues;
        }
        super(input);
        this.parameters = {
            width: input.width ?? defaultValues.width,
            widthSegments: input.widthSegments ?? defaultValues.widthSegments,
            height: input.height ?? defaultValues.height,
            heightSegments: input.heightSegments ?? defaultValues.heightSegments,
        };
        this.parameters.widthSegments = Math.max(3, Math.floor(this.parameters.widthSegments as number));
        this.parameters.heightSegments = Math.max(2, Math.floor(this.parameters.heightSegments as number));
        this.init(this.parameters)
    }

    /** copy code from threejs */
    init(input: optionPlaneGeometry) {

      
        let indices = this.buffer.indeices;
        let vertices = this.buffer.position;
        let normals = this.buffer.normal;
        let uvs = this.buffer.uv;

        let heightSegments = input.heightSegments!;
        let widthSegments = input.widthSegments!;

        const width_half = input.width! / 2;
		const height_half = input.height! / 2;

		const gridX = Math.floor( widthSegments );
		const gridY = Math.floor( heightSegments );

		const gridX1 = gridX + 1;
		const gridY1 = gridY + 1;

		const segment_width = input.width! / gridX;
		const segment_height = input.height! / gridY;


        for ( let iy = 0; iy < gridY1; iy ++ ) {

			const y = iy * segment_height - height_half;

			for ( let ix = 0; ix < gridX1; ix ++ ) {

				const x = ix * segment_width - width_half;

				vertices.push( x, - y, 0 );

				normals.push( 0, 0, 1 );

				uvs.push( ix / gridX );
				uvs.push( 1 - ( iy / gridY ) );

			}

		}

		for ( let iy = 0; iy < gridY; iy ++ ) {

			for ( let ix = 0; ix < gridX; ix ++ ) {

				const a = ix + gridX1 * iy;
				const b = ix + gridX1 * ( iy + 1 );
				const c = ( ix + 1 ) + gridX1 * ( iy + 1 );
				const d = ( ix + 1 ) + gridX1 * iy;

				indices.push( a, b, d );
				indices.push( b, c, d );

			}

		}

        this.createWrieFrame();
    }



}