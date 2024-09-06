import {
    BaseCommand,
    // uniformBufferPart,
    // unifromGroup,
    // uniformBuffer,
    // uniformBufferAll,
    // uniformEntries,
    // localUniformGroups,
    baseOptionOfCommand,
} from './baseCommand';
// import { Mat4, mat4, vec3, Vec3, Vec2, Vec4, Mat3, mat3 } from 'wgpu-matrix';
import { TypedArray } from 'webgpu-utils';
// import * as baseDefine from "../scene/base"
import { getReplaceVertexConstants } from './shaderFormat';
import { drawMode, drawModeIndexed, drawOptionOfCommand } from './DrawCommand';



export class MoreDrawCommand extends BaseCommand {

    /***pipeline 句柄 */
    declare pipeline: GPURenderPipeline;
    /**保存 pipeline 用的buffer ,不超过(maxVertexBuffers:8,maxVertexAttributes:16)*/
    verticesBuffer!: GPUBuffer[]//GPUBuffer[] | undefined;
    indexBuffer!: GPUBuffer;
    /**renderPassDescriptor */
    renderPassDescriptor!: GPURenderPassDescriptor;
    /**这个类的webGPU的 commandEncoder */
    declare input: drawOptionOfCommand;
    primitive!: GPUPrimitiveState;
    /** 深度与模板的 参数，pipeline 的描述使用*/
    depthStencil!: GPUDepthStencilState | undefined;


    constructor(options: drawOptionOfCommand) {
        super(options)
        // this.input = options;
        // this.scene = options.scene;
        // this.device = options.scene.device;
        this.verticesBuffer = [];
        this.unifromBuffer = [];
        //作废，camera和DC没有关系，20240825
        // if (options.camera) this.camera = options.camera;
        // else this.camera = this.scene.cameraDefault;
        if (options.primitive) {
            this.primitive = options.primitive;
        }
        else {
            this.primitive = {
                topology: 'triangle-list',
                cullMode: 'back',
            };
        }
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
        if (options.renderPassDescriptor !== undefined) {
            this.renderPassDescriptor = options.renderPassDescriptor;
        }
        else {
            this.renderPassDescriptor = this.scene.getRenderPassDescriptor();
            if (this.depthStencil == undefined && "depthStencilAttachment" in this.renderPassDescriptor)
                this.depthStencil = this.scene.depthStencil;//scene extend baseScene
        }
        //todo indexBuffer
        if (options.indexBuffer != undefined) {

        }
        this.pipeline = this.createPipeline();
        // this.uniformSystem = this.scene.getuniformSystem();
        this.uniformGroups = this.createUniformGroups();//在pipeline 之后

        this._isDestroy = false;
        this.init();
    }
    /**
     * 销毁本DrawCommand中的资源
     * 
     */
    destroy() {
        for (let i of this.verticesBuffer) {
            i.destroy();
        }
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
    set isDestroy(visable: boolean) {
        this._isDestroy = visable;
    }
    get isDestroy() {
        return this._isDestroy;
    }
    init() {
        if (this.input.draw.mode == "index") {
            this.indexBuffer = this.createIndexBuffer("index buffer");
        }
    }
    /**
     * 创建顶点GPUBuffer
     * @param indexArray ：TypedArray
     * @param type :"Float32Array" | "Uint8Array" | "Uint32Array" | "Float64Array" | "Uint16Array"
     * @param label :string
     * @returns GPUBuffer
     */
    createIndexBuffer(label: string) {
        // if ("indexBuffer" in this.input) {
        if (this.input.indexBuffer) {
            const indexdata = this.input.indexBuffer.buffer;

            let device = this.device;
            //创建 顶点buffer Create a vertex buffer from the cube data.
            const indexBuffer = device.createBuffer({
                label: label,
                size: indexdata.byteLength,
                usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
                // mappedAtCreation: true,
            });

            device.queue.writeBuffer(indexBuffer, 0, indexdata);
            //  new Uint32Array(indexBuffer.getMappedRange()).set(indexdata);
            //  indexBuffer.unmap();
            return indexBuffer;
        }
        else {
            throw new Error("createIndexBuffer 错误,未发现 index 参数");
        }
    }
    /**
     * 创建顶点GPUBuffer
     * @param VertexArray ：TypedArray
     * @param type :"Float32Array" | "Uint8Array" | "Uint32Array" | "Float64Array" | "Uint16Array"
     * @param label :string
     * @returns GPUBuffer
     */
    createverticesBuffer(VertexArray: TypedArray, type: "Float32Array" | "Uint8Array" | "Uint32Array" | "Float64Array" | "Uint16Array", label: string) {
        let device = this.device;
        //创建 顶点buffer Create a vertex buffer from the cube data.
        const verticesBuffer = device.createBuffer({
            label: label,
            size: VertexArray.byteLength,
            usage: GPUBufferUsage.VERTEX,
            mappedAtCreation: true,
        });
        if (type == "Float32Array")
            new Float32Array(verticesBuffer.getMappedRange()).set(VertexArray);
        else if (type == "Float64Array")
            new Float64Array(verticesBuffer.getMappedRange()).set(VertexArray);
        else if (type == "Uint8Array")
            new Uint8Array(verticesBuffer.getMappedRange()).set(VertexArray);
        else if (type == "Uint16Array")
            new Uint16Array(verticesBuffer.getMappedRange()).set(VertexArray);
        else if (type == "Uint32Array")
            new Uint32Array(verticesBuffer.getMappedRange()).set(VertexArray);

        verticesBuffer.unmap();
        return verticesBuffer;
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
        // this.verticesBuffer
        let vsAttribute = this.input.vertex.buffers;
        let buffer: GPUVertexBufferLayout[] = [];
        for (let perLocation of vsAttribute) {
            //判断是否存在stepMode
            let stepMode: GPUVertexStepMode;
            if (perLocation.stepMode) stepMode = perLocation.stepMode;
            else stepMode = "vertex";

            //生成layout
            const oneGPUVertexBufferLayout: GPUVertexBufferLayout = {
                arrayStride: perLocation.arrayStride,
                attributes: perLocation.attributes,
                stepMode: stepMode,
            };
            //push 到buffer
            buffer.push(oneGPUVertexBufferLayout);

            //bind 的 vertexbuffer是按照数组顺序的，location是按照写的位置，人工确保正确
            if (perLocation.type == "GPUBuffer") {
                this.verticesBuffer.push(perLocation.vertexArray as GPUBuffer);
            }
            else {
                const vab = perLocation.vertexArray as Float32Array | Uint8Array | Uint32Array | Float64Array | Uint16Array;
                const oneGPUBuffer = this.createverticesBuffer(vab, perLocation.type, this.label);
                this.verticesBuffer.push(oneGPUBuffer);//这里是buffer[]的数组顺序，入栈
            }
        }
        let constantsVertex = this.input.vertex.constants;
        let constantsFrag = this.input.fragment.constants;
        let descriptor: GPURenderPipelineDescriptor;

        //todo 
        if (typeof this.input.rawUniform == 'undefined' || this.input.rawUniform === false) {

            let codeVS = getReplaceVertexConstants(this.input.vertex.code, this.input.vertex.entryPoint);
            let codeFS = getReplaceVertexConstants(this.input.fragment.code, this.input.fragment.entryPoint);
            descriptor = {
                label: label,
                layout: this.pipelineLayout,
                vertex: {
                    module: device.createShaderModule({
                        code: codeVS,
                    }),
                    entryPoint: this.input.vertex.entryPoint,
                    buffers: buffer,
                    constants: constantsVertex,
                },
                fragment: {
                    module: device.createShaderModule({
                        code: codeFS,
                    }),
                    entryPoint: this.input.fragment.entryPoint,
                    targets: this.input.fragment.targets,
                    constants: constantsFrag,
                },
                primitive: this.primitive,

            };
        }
        else {
            descriptor = {
                label: label,
                layout: this.pipelineLayout,
                vertex: {
                    module: device.createShaderModule({
                        code: this.input.vertex.code,
                    }),
                    entryPoint: this.input.vertex.entryPoint,
                    buffers: buffer,
                    constants: constantsVertex,
                },
                fragment: {
                    module: device.createShaderModule({
                        code: this.input.fragment.code,
                    }),
                    entryPoint: this.input.fragment.entryPoint,
                    targets: this.input.fragment.targets,
                    constants: constantsFrag,
                },
                primitive: this.primitive,

            };
        }

        if (this.depthStencil) {
            descriptor.depthStencil = this.depthStencil;
        }
        const pipeline = device.createRenderPipeline(descriptor);
        return pipeline;
    }

    /**
     * 目前使用scene的colorAttachments,
     * todo ，增加texture
     */
    submit() {
        const device = this.device;
        //是否是raw shader
        if (typeof this.input.rawUniform == 'undefined' || this.input.rawUniform === false) {
            //创建
            if (this.uniformGroups[0] == undefined) {
                this.uniformGroups[0] = this.scene.createSystemUnifromGroupForPerShader(this.pipeline);//更新ystem的uniform ，MVP，camera，lights等
            }
            //更新buffer,scene中update更新
            // else //if (this.uniformGroups[0] != undefined) 
            // {
            //     this.scene.updateSystemUnifromBuffer();//更新ystem的uniform ，MVP，camera，lights等
            // }
        }

        this.updateUniformBuffer();

        //20240722:这里有个问题，1、为什么每次必须写新的，2、depth是否需要每次新的
        /*
        20240723:
            1、如果不更改loadOP的状态，即初始化的"clear",则每个pipeline都clear，则只有一次的draw
            2、如果需要加载之前的，需要将 loadOP = "load"   
        */

        // if (this.renderPassDescriptor.colorAttachments != null) {
        //     //如果 loadOp="clear",则只有一个的绘制结果
        //     (<GPURenderPassColorAttachment[]>this.renderPassDescriptor.colorAttachments)[0].loadOp = "load";
        //     //loadOp = "load",无论是否创建view都是一个效果，可以多次绘制，但底色消失
        //     // (this.renderPassDescriptor.colorAttachments as GPURenderPassColorAttachment[])[0].view = this.scene.context.getCurrentTexture().createView();//ok
        //     (<GPURenderPassColorAttachment[]>this.renderPassDescriptor.colorAttachments)[0].view = this.scene.context.getCurrentTexture().createView();//ok
        //     // this.renderPassDescriptor.colorAttachments[0].view = this.scene.context.getCurrentTexture().createView();//ok
        // }
        // if (this.renderPassDescriptor.depthStencilAttachment != null) {
        //     // this.renderPassDescriptor.depthStencilAttachment.depthLoadOp = "load";
        //     // this.renderPassDescriptor.depthStencilAttachment.depthStoreOp = "discard";
        // }

        const commandEncoder = device.createCommandEncoder();
        const passEncoder = commandEncoder.beginRenderPass(this.renderPassDescriptor);
        passEncoder.setPipeline(this.pipeline);

        //this.uniformGroups 包括了0-3的groups
        for (let i in this.uniformGroups) {
            let perGroup = this.uniformGroups[i]
            passEncoder.setBindGroup(parseInt(i), perGroup); //每次绑定group，buffer已经在GPU memory 中
        }
        for (let i in this.verticesBuffer) {
            const verticesBuffer = this.verticesBuffer[i];
            passEncoder.setVertexBuffer(parseInt(i), verticesBuffer);
        }
        if (this.input.draw.mode == "draw") {
            const count = (this.input.draw.values as drawMode).vertexCount;
            let instanceCount = 1;
            let firstIndex = 0;
            let firstInstance = 0;
            if ("instanceCount" in this.input.draw.values) {
                instanceCount = this.input.draw.values.instanceCount as number;
            }
            if ("firstIndex" in this.input.draw.values) {
                firstIndex = this.input.draw.values.firstIndex as number;
            }
            if ("firstInstance" in this.input.draw.values) {
                firstInstance = this.input.draw.values.firstInstance as number;
            }

            passEncoder.draw(count, instanceCount, firstIndex, firstInstance);

        }
        else if (this.input.draw.mode == "index") {
            const indexCount = (this.input.draw.values as drawModeIndexed).indexCount;
            let instanceCount = 1;
            let firstIndex = 0;
            let firstInstance = 0;
            let baseVertex = 0;
            if ("instanceCount" in this.input.draw.values) {
                instanceCount = this.input.draw.values.instanceCount as number;
            }
            if ("firstIndex" in this.input.draw.values) {
                firstIndex = this.input.draw.values.firstIndex as number;
            }
            if ("firstInstance" in this.input.draw.values) {
                firstInstance = this.input.draw.values.firstInstance as number;
            }
            if ("baseVertex" in this.input.draw.values) {
                baseVertex = this.input.draw.values.baseVertex as number;
            }
            passEncoder.setIndexBuffer(this.indexBuffer, 'uint32');
            passEncoder.drawIndexed(indexCount, instanceCount, firstIndex, baseVertex, firstInstance);
        }
        else {
            throw new Error("draw 模式设置错误");
        }
        passEncoder.end();
        const commandBuffer = commandEncoder.finish();
        device.queue.submit([commandBuffer]);
    }
}


