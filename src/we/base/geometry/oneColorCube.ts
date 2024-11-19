/**
 * 一个彩色立方体，边长=2.0
 */
import { BoxGeometry, optionBoxGemetry } from "./boxGeometry";
// import * as coreConst from "../const/coreConst";
// import triangleVS from "../shader/geometry/baseGeometry.vs.wgsl?raw"
// import framelineVS from "../shader/geometry/baseGeometryFrameline.vs.wgsl?raw"



export class OneColorCube extends BoxGeometry {

    width:number;

    constructor(width = 2) {
       
        let option: optionBoxGemetry = {
            width: width,
            height: width,
            depth: width
        }
        super(option);
        this.width=width;
        this.type = "OneColorCube";
    }
    getCodeVS() {
        let width=this.width/2;
        return `struct VertexShaderOutput {
            @builtin(position) position : vec4f,
            @location(0) uv : vec2f,
            @location(1) normal : vec3f,
            @location(2) color : vec3f,
            @location(3) worldPosition : vec3f,
            @location(4) fsPosition:vec4f,
          };
          
          @group(1) @binding(0) var<uniform> entityMatrixWorld : mat4x4f;
          
          @vertex fn vs(
          @location(0) position : vec3f,
          @location(1) uv : vec2f,
          @location(2) normal : vec3f,
          @location(3) color : vec3f,
          @builtin(vertex_index) vertexIndex : u32
          ) -> VertexShaderOutput {
            var vsOutput : VertexShaderOutput;
            vsOutput.position = projectionMatrix * viewMatrix * modelMatrix * entityMatrixWorld * vec4f(position, 1.0);
            vsOutput.uv = uv;
            //let m3R : mat3x3f = mat3x3f(entityMatrixWorld[0][1], entityMatrixWorld[0][1], entityMatrixWorld[0][2],
            //entityMatrixWorld[1][1], entityMatrixWorld[1][1], entityMatrixWorld[1][2],
            //entityMatrixWorld[2][1], entityMatrixWorld[2][1], entityMatrixWorld[2][2],
            //);
            //let m3S : mat3x3f = mat3x3f(entityMatrixWorld[0][1], entityMatrixWorld[0][1], entityMatrixWorld[0][2],
            //entityMatrixWorld[1][1], entityMatrixWorld[1][1], entityMatrixWorld[1][2],
            //entityMatrixWorld[2][1], entityMatrixWorld[2][1], entityMatrixWorld[2][2],
            //);
            //mat3(transpose(inverse(model))) * aNormal;
            vsOutput.normal = vec4f(entityMatrixWorld * vec4f(normal, 0)).xyz;
            vsOutput.color = color;
            vsOutput.worldPosition = vec4f(entityMatrixWorld * vec4f(position, 1.0)).xyz;
            vsOutput.fsPosition= 0.5*(vec4f(position,1) + vec4(${width}));
            return vsOutput;
          }`;
    }
    
      

    generateColorArray(length: number, color = [1, 1, 1]) {
        let colorsArray = [
            1, 0, 1, 1,
            0, 0, 1, 1,
            0, 0, 0, 1,
            1, 0, 0, 1,
            1, 0, 1, 1,
            0, 0, 0, 1,

            1, 1, 1, 1,
            1, 0, 1, 1,
            1, 0, 0, 1,
            1, 1, 0, 1,
            1, 1, 1, 1,
            1, 0, 0, 1,

            0, 1, 1, 1,
            1, 1, 1, 1,
            1, 1, 0, 1,
            0, 1, 0, 1,
            0, 1, 1, 1,
            1, 1, 0, 1,

            0, 0, 1, 1,
            0, 1, 1, 1,
            0, 1, 0, 1,
            0, 0, 0, 1,
            0, 0, 1, 1,
            0, 1, 0, 1,

            1, 1, 1, 1,
            0, 1, 1, 1,
            0, 0, 1, 1,
            0, 0, 1, 1,
            1, 0, 1, 1,
            1, 1, 1, 1,

            1, 0, 0, 1,
            0, 0, 0, 1,
            0, 1, 0, 1,
            1, 1, 0, 1,
            1, 0, 0, 1,
            0, 1, 0, 1,]
            ;

        return colorsArray;
    }


}