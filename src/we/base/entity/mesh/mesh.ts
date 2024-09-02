import { BaseEntity, initStateEntity, optionBaseEntity } from "../baseEntity";
import { BaseMaterial } from "../../material/baseMaterial";
import {
    BaseGeometry,
} from "../../geometry/baseGeometry";
import { DrawCommand, drawOption } from "../../command/DrawCommand";
import { cameraRayValues } from "../../camera/baseCamera";



/**mesh的顶点结构与材质，各有一个，一一对应 */
export interface optionMeshEntity extends optionBaseEntity {
    geometry: BaseGeometry,
    material: BaseMaterial | BaseMaterial[],
}


/**
 * Mesh 输出三角形和网格线
 * 可以有两种方式输出网格线
 * 1、三角形+一个像素的lines
 * 2、三角形（shader网格线，线宽可定义）
 * 
 * 
 */
export class Mesh extends BaseEntity {
    init() {
        throw new Error("Method not implemented.");
    }
    checkStatus(): boolean {
        throw new Error("Method not implemented.");
    }
    updateUniformBuffer(scene: any, deltaTime: number) {
        throw new Error("Method not implemented.");
    }
    updateDCC(scene: any, deltaTime: number): DrawCommand[] {
        throw new Error("Method not implemented.");
    }
    destory() {
        throw new Error("Method not implemented.");
    }







    constructor(input: optionMeshEntity) {
        super(input);
    }
    /**
     * 创建Draw Compute Commands
     */
    createDCC(scene: any): initStateEntity {
        let shader = `
        @group(1) @binding(0) var<uniform> u_c : vec4f;
        @group(2) @binding(0) var<uniform> u_color : vec4f;
  
        struct OurVertexShaderOutput {
          @builtin(position) position: vec4f,
          @location(0) color: vec4f,
        };
  
        @vertex fn vs(
           @location(0) position : vec3f,
           @location(1) color : vec4f
        ) -> OurVertexShaderOutput {
          var vsOutput: OurVertexShaderOutput;
  
          vsOutput.position = projectionMatrix *viewMatrix * modelMatrix *     vec4f(position,  1.0);
          // vsOutput.position = U_MVP.model * U_MVP.view * U_MVP.projection * vec4f(position,  1.0);
  
          vsOutput.color = color;
          return vsOutput;
        }
  
        @fragment fn fs(@location(0) color: vec4f) -> @location(0) vec4f {
         let abc=u_c;
          return u_color;
        }
  `;
        const oneTriangleVertexArray = [
            0.0, 0.5, 1.1, 1, 0, 0, 1,
            -0.5, -0.5, 0, 0, 1, 0, 1,
            0.5, -0.5, 0, 0, 0, 1, 1
        ];
        const oneTriangleVertexF32A = new Float32Array(oneTriangleVertexArray);

        const uniformOneColor = new Float32Array([1, 0, 1, 1]);


        let options: drawOption = {
            label: "a triangle",
            scene: scene,
            vertex: {
                code: shader,
                entryPoint: "vs",
                buffers: [
                    {
                        vertexArray: oneTriangleVertexF32A,
                        type: "Float32Array",
                        arrayStride: 4 * 7,
                        attributes: [
                            {
                                shaderLocation: 0,
                                offset: 0,
                                format: 'float32x3',
                            },
                            {
                                shaderLocation: 1,
                                offset: 12,
                                format: 'float32x4',
                            },
                        ]
                    }
                ]
            },
            fragment: {
                code: shader,
                entryPoint: "fs",
                targets: [{ format: scene.presentationFormat }]
            },
            primitive: {
                topology: 'triangle-list',
                cullMode: 'none',
            },
            // uniforms: [],
            uniforms: [
                {
                    layout: 1,
                    entries: [
                        {
                            label: "test color",
                            binding: 0,
                            size: 4 * 4,
                            get: () => { return uniformOneColor },
                        }
                    ]
                },
                {
                    layout: 2,
                    entries: [
                        {
                            label: "test color",
                            binding: 0,
                            size: 4 * 4,
                            get: () => { return uniformOneColor },
                        }
                    ]
                }
            ],
            // rawUniform: true,
            draw: {
                mode: "draw",
                values: {
                    vertexCount: 3
                }
            },
        }

        let DC = new DrawCommand(options);
    }



}