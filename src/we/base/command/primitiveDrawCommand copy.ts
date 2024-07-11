import { Mat4, mat4, vec3, Vec3, Vec2, Vec4, Mat3, mat3 } from 'wgpu-matrix';
import { TypedArray } from 'webgpu-utils';
import * as baseDefine from "../scene/base"


/**
 * 单个VSbuffer的属性，传递给shader的
 */
interface vsAttribute {
    shaderLocation: number,
    offset: number,
    format: GPUVertexFormat,
}
/** VS的buffer的typearray的结构 
 * same as  GPUVertexBufferLayout
 * add vertexArray
*/
interface vsAttributes {
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
interface vsPart {
    code: string,
    entryPoint: string,
    /**todo */
    constants?: any,
    buffers: vsAttributes[],
}

/**
 * pipeline layout  fragment 定义
 */
interface fsPart {
    code: string,
    entryPoint: string,
    /**todo */
    constants?: any,
    targets: GPUColorTargetState[]
}

type TypedArrayString = "Int8Array" | "Uint8Array" | "Int16Array" | "Uint16Array" | "Int32Array" | "Uint32Array" | "Float32Array" | "Float64Array";
/**
 * 返回uniform的数据( maxUniformBuffersPerShaderStage:12,最多12个。建议使用结构体在WGSL和JS之间传递数据)
 *  
    * buffer:TypedArray,通过()=>{return TypedArray }返回TypedArray
    * 
    * size:是TypedArray的大小，以byte计算
    * 
 */
interface uniformPerOne {
    label?: string,
    size: number,//
    buffer: () => TypedArray,
    // buffer: TypedArray,
    // format: "Float32" | "Float64" | "Uint8Array" | "Uint16Array" | "Uint32Array"
    // format: TypedArrayString;
}
// type isUniformPerOne<T> = T extends { format: string } ? true : false;

/**
 * uniformPart  是buffer使用的更新，会每帧更新
 * @binding
    * number ,WGSL中的@binding(x)的位置，不能重复;
    * maxUniformBuffersPerShaderStage 在webGPU的最小最大值：12
    * 0：被系统占用，剩余1--3
 * @buffer :TypedArray,通过()=>{return TypedArray }返回TypedArray
    
 * @size :是TypedArray的大小，以byte计算
 * @resource
     * uniformPerOne
     * GPUSampler or GPUTextureView or GPUBufferBinding or GPUExternalTexture) 的四种资源之一
     * 可以使用()=>{return GPUBindingResource}的形式返回
     * GPUBufferBinding的更新在WObject中进行，由上一级进行维护
 */
interface uniformBufferPart {
    binding: number,
    // resource: uniformPerOne,
    label?: string,
    size: number,//
    buffer: () => TypedArray,
}

// interface uniformEntries {
//     entry: GPUBindGroupEntry | uniformPart,
//     isUniformPart: boolean
// }
type uniformEntries = GPUBindGroupEntry | uniformBufferPart
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
interface unifromGroup {
    layout: number,
    entries: uniformEntries[],
}
/**
 * indexBuffer,非必须，
 */
interface indexBuffer {
    buffer: GPUBuffer | Uint16Array | Uint32Array,
    type: "GPUBuffer" | "Uint16Array" | "Uint32Array",
    indexForat: "uint16" | "uint32",
    offset?: number,
    /**Size in bytes of the index data in buffer */
    size: number,
}
/** 初始化参数 */
declare interface primitiveOption {
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
    //pipeline 使用的 depthStencil的初始化参数
    depthStencil?: GPUDepthStencilState,
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
    draw: "draw" | "index"
}

class PrimitiveCommand {
    /** scene ,必须 */
    scene: any;
    /** 渲染的camera，scene.cameraDefault || 指定的camera */
    camera: any;
    /** webGPU 的device */
    device!: GPUDevice;
    /***pipeline 句柄 */
    pipeline!: GPURenderPipeline;
    /**保存 pipeline 用的buffer ,不超过(maxVertexBuffers:8,maxVertexAttributes:16)*/
    verticesBuffer!: GPUBuffer[]//GPUBuffer[] | undefined;
    /**
     * [0]=系统的uniform参数
     * 其他最多3个绑定组，dawn（4个），wgpu（8个） */
    uniformGroups: GPUBindGroup[] | undefined;
    /** 这个是这个系统的uniform ,camera,lights ,mvp....
     *  也就是uniform0
     */
    uniformSystem: GPUBindGroup[] | undefined;
    /**renderPassDescriptor */
    renderPassDescriptor!: GPURenderPassDescriptor;
    /**这个类的webGPU的 commandEncoder */
    commandEncoder!: GPUCommandEncoder;
    input!: primitiveOption;
    primitive!: GPUPrimitiveState;
    pipelineLayout!: GPUPipelineLayout | "auto";
    depthStencil!: GPUDepthStencilState | undefined;
    label!: string;


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
        if (options.depthStencil) {
            this.depthStencil = options.depthStencil;
        }
        else {
            this.depthStencil = undefined;
        }
        if (options.label) {
            this.label = options.label;
        }
        else {
            this.label = "";
        }
        this.pipeline = this.createPipeline();
        this.uniformSystem = this.scene.getuniformSystem();
        this.uniformGroups = this.createUniformGroups();//在pipeline 之后
        if (options.renderPassDescriptor) {
            this.renderPassDescriptor = options.renderPassDescriptor;
        }
        else {
            this.renderPassDescriptor = this.scene.getRenderPassDescriptor();
        }
        this.init();
    }
    destory() { }
    isDestory() { }
    init() { }

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
                this.verticesBuffer.push(oneGPUBuffer);
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
    creatUniformBuffer(size: number, label: string) {
        let device = this.device;
        const uniformBuffer = device.createBuffer({
            label: label,
            size: size,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        return uniformBuffer;

    }
    createUniformBufferBindGroupDescriptor(perOne: uniformBufferPart) {

        let label = this.input.label as string;
        if ("label" in perOne.resource) {
            label = perOne.resource.label as string;
        }
        const uniformBuffer = this.creatUniformBuffer(perOne.resource.size, label);

        let one: GPUBindGroupEntry = {
            binding: perOne.binding,
            resource: {
                buffer: uniformBuffer
            }
        }
        return one;
    }

    createUniformGroups() {
        let device = this.device;
        let pipeline = this.pipeline;
        let unifromGroupSource = this.input.uniforms;
        let descriptors: GPUBindGroupDescriptor[] = [];
        let bindGroup: GPUBindGroup[] = [];
        for (let perGroup of unifromGroupSource) {
            let entries: GPUBindGroupEntry[] = [];
            for (let perOne of perGroup.entries) {
                if ("size" in perOne) {
                    const perOneBuffer: GPUBindGroupEntry = this.createUniformBufferBindGroupDescriptor(perOne as uniformBufferPart);
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
            descriptors.push(groupDesc);
        }
        for (let perOneGroupDesc of descriptors) {
            //创建bindgroup，以后到group 0的位置
            const uniformBindGroup = device.createBindGroup(perOneGroupDesc);
            bindGroup.push(uniformBindGroup);
        }
        return bindGroup;
    }
    createCommandEncoder() {
        let device = this.device;
        // const now = Date.now();
        // const deltaTime = (now - lastFrameMS) / 1000;
        // lastFrameMS = now;

        // const modelViewProjection = getModelViewProjectionMatrix(deltaTime);

        //每次写摄像机的矩阵
        device.queue.writeBuffer(
            uniformBuffer,
            0,
            modelViewProjection.buffer,
            modelViewProjection.byteOffset,
            modelViewProjection.byteLength
        );

        renderPassDescriptor.colorAttachments[0].view = context
            .getCurrentTexture()
            .createView();

        const commandEncoder = device.createCommandEncoder();
        const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
        passEncoder.setPipeline(pipeline);
        passEncoder.setBindGroup(0, uniformBindGroup); //每次绑定group，buffer已经在GPU memory 中
        passEncoder.setVertexBuffer(0, verticesBuffer);
        passEncoder.draw(cubeVertexCount);
        passEncoder.end();
        device.queue.submit([commandEncoder.finish()]);
    }
    updateUniformBuffer() {
        let device = this.device;
        let pipeline = this.pipeline;
        let unifromGroupSource = this.input.uniforms;
        let descriptors: GPUBindGroupDescriptor[] = [];
        let bindGroup: GPUBindGroup[] = [];
        for (let perGroup of unifromGroupSource) {
            let entries: GPUBindGroupEntry[] = [];
            for (let perOne of perGroup.entries) {
                if ("size" in perOne) {
                    const perOneBuffer: GPUBindGroupEntry = this.createUniformBufferBindGroupDescriptor(perOne as uniformBufferPart);
                    entries.push(perOneBuffer as GPUBindGroupEntry);
                }
            }
        }
    }
    submit() {
        if (this.device && this.commandEncoder)
            this.device.queue.submit([this.commandEncoder.finish()]);
    }

}

export { PrimitiveCommand }

