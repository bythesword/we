import { Mat4, mat4, vec3, Vec3, Vec2, Vec4, Mat3, mat3 } from 'wgpu-matrix';
import { TypedArray } from 'webgpu-utils';
// import * as baseDefine from "../scene/base"



/** VS的buffer的typearray的结构 
 * same as  GPUVertexBufferLayout
 * add vertexArray
*/
export interface vsAttributes {
    /** vs 顶点数组
     * GPUBuffer =传入的GPUBuffer，直接使用
     * 其他TypedArray，需要转换成为GPUbuffer
     */
    vertexArray: Float32Array | Uint8Array | Uint32Array | Float64Array | Uint16Array | GPUBuffer,
    type: "Float32Array" | "Uint8Array" | "Uint32Array" | "Float64Array" | "Uint16Array" | "GPUBuffer",
    /** 单个数据宽度 */
    arrayStride: number,
    attributes: GPUVertexAttribute[],
    /** "vertex" | "instance" ,默认=vertex*/
    stepMode?: GPUVertexStepMode,
}
/**
 * pipeline layout d vertex 定义
 */
export interface vsPart {
    code: string,
    entryPoint: string,
    /**todo */
    constants?: any,
    buffers: vsAttributes[],
}

/**
 * pipeline layout  fragment 定义
 */
export interface fsPart {
    code: string,
    entryPoint: string,
    /**todo */
    constants?: any,
    targets: GPUColorTargetState[]
}

export type TypedArrayString = "Int8Array" | "Uint8Array" | "Int16Array" | "Uint16Array" | "Int32Array" | "Uint32Array" | "Float32Array" | "Float64Array";

// type isUniformPerOne<T> = T extends { format: string } ? true : false;

/**
 * uniformPart  是buffer使用的更新，会每帧更新
 * @binding
    * number ,WGSL中的@binding(x)的位置，不能重复;
    * maxUniformBuffersPerShaderStage 在webGPU的最小最大值：12
    * 0：被系统占用，剩余1--3
 * @buffer :TypedArray,通过()=>{return TypedArray }返回TypedArray
    
 * @size :是TypedArray的大小，以byte计算
 */
export interface uniformBufferPart {
    binding: number,
    // resource: uniformPerOne,
    label?: string,
    size: number,//
    buffer: () => TypedArray,
}


export type uniformEntries = GPUBindGroupEntry | uniformBufferPart
/**
 * unifromGroup  只进行绑定，不负责更新，更新在WObject中进行
 * @layout 
    * number
    * 在一个group中绑定的位置，在一个group中，不能重复;
    * 这里的group的id需要与后面的encoder的pipeline中bindgroup的id对应
    * maxBindGroups在webGPU的最小最大值：4
    * 从1--3（最小的最大maxBindGroups），有多少个需要看系统实现（20240705 dawn=4,wgpu=8）
    * 0：被系统占用，剩余1--3
 * @resource 
    *GPUBindGroupEntry[] | uniformPart[]
     * GPUSampler or GPUTextureView or GPUBufferBinding or GPUExternalTexture) 的四种资源之一
     * 可以使用()=>{return GPUBindingResource}的形式返回
     * GPUBufferBinding的更新在WObject中进行，由上一级进行维护     
 * @entries 
    * 以最小最大值表述
    * uniform :
        * uniform(maxUniformBuffersPerShaderStage) :8
        * texture (maxSampledTexturesPerShaderStage):16
        * sampler (maxSamplersPerShaderStage):16
    * storage 
        * buffer(maxStorageBuffersPerShaderStage):8(Chrome：10,firefox:64)
        * texture(maxStorageTexturesPerShaderStage):4(Chrome:8,firefox:64)
    *          
 */
export interface unifromGroup {
    layout: number,
    entries: uniformEntries[],
}
/**
 * indexBuffer,非必须，
 */
export interface indexBuffer {
    buffer: GPUBuffer | Uint16Array | Uint32Array,
    type: "GPUBuffer" | "Uint16Array" | "Uint32Array",
    indexForat: "uint16" | "uint32",
    offset?: number,
    /**Size in bytes of the index data in buffer */
    size: number,
}
/**
 * @vertexCount 绘制的顶点数量
 * @instanceCount 实例化数量，默认=1
 * @firstVertex  从第几个顶点开始绘制，默认=0
 * @firstInstance 从第几个实例开始，默认=0
 */
export interface drawMode {
    vertexCount: number,
    instanceCount?: number,
    firstVertex?: number
    firstInstance?: number
}
/**
 * @indexCount The number of indices to draw.
 * @instanceCount 多少个，默认=1
 * @firstIndex ,从第几个index开始绘制，默认=0
 * @baseVertex ,Added to each index value before indexing into the vertex buffers.
 * @firstInstance 从第几个实例开始，默认=0
 */
export interface drawModeIndexed {
    indexCount: number,
    instanceCount: number,
    firstIndex: number,
    baseVertex: number,
    firstInstance: number,
}

/** 初始化参数 
 * 
 * scene:必须
 * 
 * camera?: any,
 * 
*/
export interface primitiveOption {
    /** scene object ，必须 */
    scene: any,
    /** todo ,摄像机对象或default,也可以是光源的，比如shadow map */
    camera?: any,
    /** label */
    label?: string,
    vertex: vsPart,
    fragment: fsPart,
    primitive?: GPUPrimitiveState,
    layout?: GPUPipelineLayout | "auto",
    /**数组会按照1--3进行重组，生成GPUBindGroup */
    uniforms: unifromGroup[],
    /** 如果没有，使用scene的默认设置，需要 */
    renderPassDescriptor?: GPURenderPassDescriptor,
    /**索引模式 */
    indexBuffer?: indexBuffer,
    /**实例化数量，默认=1 
     * intance 的其他参数可以通过unform 或 storage buffer 传递，
     *          A、比如scale，position ，color，matrix等
     *          B、这些参数在shader中操作
     *          C、也可以通过shader生成random,进行随机（上述）操作，比如花草的摇曳的matrix
    */
    instanceCount?: number,

    /** draw mode:  */
    draw: {
        mode: "draw" | "index",
        values: drawMode | drawModeIndexed,
    }


}

/**单个layout的uniformBuffer的GPUBuffer的收集器 */
export type uniformBuffer = {
    [n in number]: GPUBuffer
}
/** 所有layout的uniformBuffer的GPUBuffer的收集器 */
export type uniformBufferAll = {
    [n in number]: uniformBuffer
}

export type localUniformGroups = {
    [n in number]: GPUBindGroup
}

export class DrawCommand {
    /** scene ,必须,cavas or texture */
    scene: any;
    /** 渲染的camera，scene.cameraDefault || 指定的camera */
    camera: any;
    /** webGPU 的device */
    device!: GPUDevice;
    /***pipeline 句柄 */
    pipeline!: GPURenderPipeline;
    /**保存 pipeline 用的buffer ,不超过(maxVertexBuffers:8,maxVertexAttributes:16)*/
    verticesBuffer!: GPUBuffer[]//GPUBuffer[] | undefined;
    unifromBuffer!: uniformBufferAll;
    /**
     * [0]=系统的uniform参数
     * 其他最多3个绑定组，dawn（4个），wgpu（8个） */
    uniformGroups!: localUniformGroups;
    /** 这个是这个系统的uniform ,camera,lights ,mvp....
     *  也就是uniform0
     */
    // uniformSystem!: GPUBindGroup ;
    /**renderPassDescriptor */
    renderPassDescriptor!: GPURenderPassDescriptor;
    /**这个类的webGPU的 commandEncoder */
    input!: primitiveOption;
    primitive!: GPUPrimitiveState;
    pipelineLayout!: GPUPipelineLayout | "auto";
    depthStencil!: GPUDepthStencilState | undefined;
    label!: string;
    _isDestory!: boolean;


    constructor(options: primitiveOption) {
        this.input = options;
        this.scene = options.scene;
        this.device = options.scene.device;
        if (options.camera) this.camera = options.camera;
        else this.camera = this.scene.cameraDefault;
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
            if (this.depthStencil == undefined && "depthStencilAttachment" in this.renderPassDescriptor )
                this.depthStencil = this.scene.depthStencil;
        }
        //todo indexBuffer
        if (options.indexBuffer != undefined) {

        }
        this.pipeline = this.createPipeline();
        // this.uniformSystem = this.scene.getuniformSystem();
        this.uniformGroups = this.createUniformGroups();//在pipeline 之后

        this._isDestory = false;
        this.init();
    }
    /**
     * 销毁本DrawCommand中的资源
     * 
     */
    destory() {
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
        this.isDestory = true;
    }
    set isDestory(visable: boolean) {
        this._isDestory = visable;
    }
    get isDestory() {
        return this._isDestory;
    }
    init() { }

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

        let descriptor: GPURenderPipelineDescriptor = {
            label: label,
            layout: this.pipelineLayout,
            vertex: {
                module: device.createShaderModule({
                    code: this.input.vertex.code,
                }),
                entryPoint: this.input.vertex.entryPoint,
                buffers: buffer,
                // [
                //     // position
                //     {
                //         arrayStride: 3 * 4, // 3 floats, 4 bytes each
                //         attributes: [
                //             { shaderLocation: 0, offset: 0, format: 'float32x3' },
                //         ],
                //     },
                //     // normals
                //     {
                //         arrayStride: 3 * 4, // 3 floats, 4 bytes each
                //         attributes: [
                //             { shaderLocation: 1, offset: 0, format: 'float32x3' },
                //         ],
                //     },
                //     // texcoords
                //     {
                //         arrayStride: 2 * 4, // 2 floats, 4 bytes each
                //         attributes: [
                //             { shaderLocation: 2, offset: 0, format: 'float32x2', },
                //         ],
                //     },
                // ],
            },
            fragment: {
                module: device.createShaderModule({
                    code: this.input.fragment.code,
                }),
                entryPoint: this.input.fragment.entryPoint,
                targets: this.input.fragment.targets,
                // targets: [
                //     { format: navigator.gpu.getPreferredCanvasFormat() },
                // ],
            },
            primitive: this.primitive,
            // depthStencil: {
            //     depthWriteEnabled: true,
            //     depthCompare: 'less',
            //     format: 'depth24plus',
            // },
            // // ...(canvasInfo.sampleCount > 1 && {
            // //     multisample: {
            // //         count: canvasInfo.sampleCount,
            // //     },
            // // }),
        };
        if (this.depthStencil) {
            descriptor.depthStencil = this.depthStencil;
        }
        const pipeline = device.createRenderPipeline(descriptor);
        return pipeline;
    }
    /** 创建uniform Buffer，  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST*/
    creatUniformBuffer(size: number, label: string) {
        let device = this.device;
        const uniformBuffer = device.createBuffer({
            label: label,
            size: size,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        return uniformBuffer;

    }
    /**
     * 创建uniform buffer 用的描述，并将uniformBuffer(GPUBuffer) 存储到this.unifromBuffer中。
     * @param layout  bingdGroup：1--3
     * @param perOne  每个uniform buffer的描述 
     * @returns GPUBindGroupEntry
     */
    createUniformBufferBindGroupDescriptor(layout: number, perOne: uniformBufferPart) {

        let label = this.input.label as string;
        if ("label" in perOne) {
            label = perOne.label as string;
        }
        const uniformBuffer = this.creatUniformBuffer(perOne.size, label);

        this.unifromBuffer[layout][perOne.binding] = uniformBuffer;

        let one: GPUBindGroupEntry = {
            binding: perOne.binding,
            resource: {
                buffer: uniformBuffer
            }
        }
        return one;
    }


    /**
     * 创建 bindGroup 1--3 
     * @returns localUniformGroups
     */
    createUniformGroups() {
        let device = this.device;
        let pipeline = this.pipeline;
        let unifromGroupSource = this.input.uniforms;
        let bindGroup: localUniformGroups = [];
        for (let perGroup of unifromGroupSource) {
            let entries: GPUBindGroupEntry[] = [];
            for (let perOne of perGroup.entries) {
                if ("size" in perOne) {
                    const perOneBuffer: GPUBindGroupEntry = this.createUniformBufferBindGroupDescriptor(perGroup.layout, perOne as uniformBufferPart);
                    entries.push(perOneBuffer as GPUBindGroupEntry);
                }
                else {
                    entries.push(perOne as GPUBindGroupEntry);
                }
            }
            let groupDesc: GPUBindGroupDescriptor = {
                layout: pipeline.getBindGroupLayout(perGroup.layout),
                entries: entries,
            }
            const uniformBindGroup = device.createBindGroup(groupDesc);
            bindGroup[perGroup.layout] = uniformBindGroup;
        }
        return bindGroup;
    }

    /**
     * 更新单个layout的uniform buffer的TypedArray
     * @param layout  uniformBindGroup的layout的位置数字
     * @param perOne  在uniformBufferPart ，即单个uniformBuffer的定义
     */
    updataOneUniformBuffer(layout: number, perOne: uniformBufferPart) {
        let device = this.device;
        const uniformBuffer = this.unifromBuffer[layout][perOne.binding];
        const buffer = perOne.buffer();
        //每次写摄像机的矩阵
        device.queue.writeBuffer(
            uniformBuffer,
            0,
            buffer.buffer,
            0,//buffer.byteOffset,
            buffer.byteLength
        );
    }
    /**
     * 更新1--3+的 unifrom group的buffer，系统的（0）单独更新，通过scene中的updateSystemUnifrombuffer()进行更调用
     */
    updateUniformBuffer() {
        let unifromGroupSource = this.input.uniforms;
        for (let perGroup of unifromGroupSource) {
            for (let perOne of perGroup.entries) {
                if ("size" in perOne) {
                    this.updataOneUniformBuffer(perGroup.layout, perOne as uniformBufferPart);
                }
            }
        }
    }
    /**
     * 目前使用scene的colorAttachments,
     * todo ，增加texture
     */
    submit() {
        const device = this.device;
        this.scene.updateUnifrombufferForPerShader();//更新ystem的uniform ，MVP，camera，lights等
        this.updateUniformBuffer();
        if (this.renderPassDescriptor.colorAttachments != null) {
            // (this.renderPassDescriptor.colorAttachments as GPURenderPassColorAttachment[])[0].view = this.scene.context
            //     .getCurrentTexture()
            //     .createView();
            this.renderPassDescriptor.colorAttachments[0].view = this.scene.context
                .getCurrentTexture()
                .createView();
        }

        const commandEncoder = device.createCommandEncoder();
        const passEncoder = commandEncoder.beginRenderPass(this.renderPassDescriptor);
        passEncoder.setPipeline(this.pipeline);
        for (let i in this.uniformGroups) {
            let perGroup = this.uniformGroups[i]
            passEncoder.setBindGroup(parseInt(i), perGroup); //每次绑定group，buffer已经在GPU memory 中
        }
        for (let i in this.verticesBuffer) {
            const verticesBuffer = this.verticesBuffer[i];
            passEncoder.setVertexBuffer(parseInt(i), verticesBuffer);
        }
        if (this.input.draw.mode == "draw") {
            const count = (this.input.draw.values as drawMode).vertexCount
            passEncoder.draw(count);
        }
        else if (this.input.draw.mode == "index") {
            //todo 
            // passEncoder.setIndexBuffer(GPUBuffer buffer, GPUIndexFormat indexFormat, optional GPUSize64 offset = 0, optional GPUSize64 size)
            // passEncoder.draw(cubeVertexCount);
        }
        else {
            throw new Error("draw 模式设置错误", this.input.draw.mode);
        }
        passEncoder.end();
        const commandBuffer = commandEncoder.finish();
        device.queue.submit([commandBuffer]);
    }
}


