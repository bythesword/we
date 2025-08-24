// import { BaseCommand, uniformBufferAll, baseOptionOfCommand, } from './baseCommand';

import { BaseCommand  } from "./baseCommand";
import { computeOptionOfCommand, uniformBufferAll } from "./commandDefine";





export class ComputeCommand extends BaseCommand {

    declare input: computeOptionOfCommand;

    mapBuffer!: uniformBufferAll;


    /***pipeline 句柄 */
    declare pipeline: GPUComputePipeline;


    constructor(options: computeOptionOfCommand) {
        super(options);
        this.unifromBuffer = [];
        if (options.layout) {
            this.pipelineLayout = options.layout;
        }
        else {
            this.pipelineLayout = "auto";
        }
        if (options.label) {
            this.label = options.label;
        }
        else {
            this.label = "";
        }
        this.pipeline = this.createPipeline();
        // this.uniformSystem = this.scene.getuniformSystem();
        this.uniformGroups = this.createUniformGroups();//在pipeline 之后

        this._isDestroy = false;
        this.init();
    }
    init() {
        // throw new Error('Method not implemented.');
    }
    destroy() {
        let unifromGroupSource = this.input.uniforms;
        for (let perGroup of unifromGroupSource) {
            for (let perOne of perGroup.entries) {
                if ("size" in perOne) {
                    this.unifromBuffer[perGroup.layout][perOne.binding].destroy();
                }
            }
        }
        this.isDestroy = true;
    }

    /**
 * 创建pipeline，并创建vertexBuffer；
 *  并将buffer push 到this.verticesBuffer中;
 *  传入的GPUBuffer 不push
 * @returns GPURenderPipeline
 */
    createPipeline() {
        let label = this.input.label;
        let device = this.device;


        let descriptor: GPUComputePipelineDescriptor = {
            label: label,
            layout: this.pipelineLayout,
            compute: {
                module: device.createShaderModule({
                    code: this.input.compute.code
                }),
                entryPoint: this.input.compute.entryPoint
            },
        };

        const pipeline = device.createComputePipeline(descriptor);
        return pipeline;
    }

    async submit() {
        const device = this.device;
        // this.scene.updateUnifrombufferForPerShader();//更新ystem的uniform ，MVP，camera，lights等
        if (this.rawUniform) {//RAW

        }
        else {//system uniform 
            //创建
            if (this.uniformGroups[0] == undefined) {
                this.uniformGroups[0] = this.parent.createSystemUnifromGroupForPerShader(this.pipeline);//更新ystem的uniform ，MVP，camera，lights等
            }

        }
        this.updateUniformBuffer();


        // Encode commands to do the computation
        const encoder = device.createCommandEncoder({ label: 'compute builtin encoder' });
        const passEncoder = encoder.beginComputePass({ label: 'compute builtin pass' });
        passEncoder.setPipeline(this.pipeline);

        for (let i in this.uniformGroups) {
            let perGroup = this.uniformGroups[i]
            passEncoder.setBindGroup(parseInt(i), perGroup); //每次绑定group，buffer已经在GPU memory 中
        }
        // let x = 1, y = 1, z = 1;
        let [x = 1, y = 1, z = 1] = [...this.input.dispatchCount];
        passEncoder.dispatchWorkgroups(x, y, z);
        // passEncoder.dispatchWorkgroups(...this.input.dispatchCount);
        passEncoder.end();
        if (this.input.map) {
            await this.input.map!(this, encoder)
        }
        // Finish encoding and submit the commands
        const commandBuffer = encoder.finish();
        device.queue.submit([commandBuffer]);
    }
}