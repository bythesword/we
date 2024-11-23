/**
 * 一个彩色立方体，边长=2.0
 */
import { BoxGeometry, optionBoxGemetry } from "./boxGeometry";
// import * as coreConst from "../const/coreConst";
// import triangleVS from "../shader/geometry/baseGeometry.vs.wgsl?raw"
// import framelineVS from "../shader/geometry/baseGeometryFrameline.vs.wgsl?raw"



export class OneColorCube extends BoxGeometry {

    width: number;

    constructor(width = 2) {

        let option: optionBoxGemetry = {
            width: width,
            height: width,
            depth: width
        }
        super(option);
        this.width = width;
        this.type = "OneColorCube";
    }
    /**覆写了这个function
     * 
     * 增加了@location(4) fsPosition:vec4f, @location(5) cubeUV:vec3f,
     * 
     * 
     * 适用于cube的三维UV
     */
    getCodeVS() {
        let width = this.width / 2;
        //这个比正常的geometry的vs多了fsPosition
        return `
        override instance_num_matrix : u32 = 1;
        struct VertexShaderOutput {
            @builtin(position) position : vec4f,
            @location(0) uv : vec2f,
            @location(1) normal : vec3f,
            @location(2) color : vec3f,
            @location(3) worldPosition : vec3f,
            @location(4) fsPosition:vec4f,
            @location(5) cubeUV:vec3f,
          };
          
          @group(1) @binding(0) var<uniform> entityMatrixWorld : array<mat4x4f, $instacnce>;
          
          @vertex fn vs(
          @location(0) position : vec3f,
          @location(1) uv : vec2f,
          @location(2) normal : vec3f,
          @location(3) color : vec3f,
          @builtin(instance_index) instanceIndex : u32,
          @builtin(vertex_index) vertexIndex : u32
          ) -> VertexShaderOutput {
            var vsOutput : VertexShaderOutput;
            vsOutput.position = projectionMatrix * viewMatrix * modelMatrix * entityMatrixWorld[instanceIndex] * vec4f(position, 1.0);
            vsOutput.uv = uv;
        
            
            vsOutput.normal = vec4f(entityMatrixWorld[instanceIndex] * vec4f(normal, 0)).xyz;
            vsOutput.color = color;
            vsOutput.worldPosition = vec4f(entityMatrixWorld[instanceIndex] * vec4f(position, 1.0)).xyz;
            vsOutput.fsPosition= 0.5*(vec4f(position,1) + vec4(${width}));
            vsOutput.cubeUV=normalize(vsOutput.worldPosition  - defaultCameraPosition);
            return vsOutput;
          }`;
    }



    generateColorArray(length: number, color = [1, 1, 1]) {
        /*
          4 ——————————————  1
          / |          / |
         /  |         /  |        
       6 ————————————  0 |          
        |   |        |   |      
        |   |5       |   |        
        | / —————————|——— 3
        |/           |  /
     7  —————————————— / 2  
          
        */
        //这个颜色不能与每个点对应上，todo
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