
import { PostProcessEffect } from "./postProcessEffect";
import quadVS from "../shader/PostProcess/quard/quad.vs.wgsl?raw";
import blur3x3FS from "../shader/PostProcess/ConvolutionMatrix/blur3x3.fs.wgsl?raw";
import { DrawCommand, DrawOptionOfCommand } from "../command/DrawCommand";


export class Blur3x3 extends PostProcessEffect {


    constructor() {
        super({});
    }
    _init(): void {
        for (let i in this.GBuffers) {
            let shaderCode = quadVS + blur3x3FS;
            let options: DrawOptionOfCommand = {
                renderPassDescriptor: this.renderPassDescriptor,
                rawUniform: true,
                label: "post process blue 3x3",
                vertex: {
                    code: shaderCode,
                    entryPoint: "vs"
                },
                fragment: {
                    code: shaderCode,
                    entryPoint: "fs",
                    targets: [{ format: this.presentationFormat }],
                    constants: {
                        canvasSizeWidth: this.width,
                        canvasSizeHeight: this.height,
                    }
                },
                draw: {
                    mode: "draw",
                    values: {
                        vertexCount: 6
                    }
                },
                parent: this,
                uniforms: [
                    {
                        layout: 0,
                        entries: [
                            {
                                label: "screen texture binding for PP blur 3x3",
                                binding: 0,
                                resource: this.copyToTarget[i].createView()
                            },
                            // {
                            //     label: "sampler from scene resource ",
                            //     binding: 1,
                            //     resource: this.scene.resources.sampler[weSamplerKind.linear]
                            // }
                        ]
                    }
                ],
                primitive: {
                    topology: 'triangle-list',
                    cullMode: "back",
                },
            }
            let DC = new DrawCommand(options);
            this.commands.push(DC);
            this.copy(this.rawColorTexture, this.copyToTarget[i]);
        }
    }

}