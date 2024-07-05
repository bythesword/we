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
    /** vs 顶点数组 */
    vertexArray: Float32Array | Uint8Array | Uint32Array | Float64Array | Uint16Array | GPUBuffer,
    /** 单个数据宽度 */
    arrayStride: Number,
    attributes: vsAttribute[],
    /** "vertex" | "instance" ,默认=vertex*/
    stepMode?: GPUVertexStepMode,
}
/**
 * pipeline layout d vertex 定义
 */
interface vsPart {
    code: string,
    entryPoint?: string,
    /**todo */
    constants?: any,
    buffers: vsAttributes[],
}

/**
 * pipeline layout  fragment 定义
 */
interface fsPart {
    code: string,
    entryPoint?: string,
    /**todo */
    constants?: any,
    targets: GPUColorTargetState[]
}

/**
 * uniformPart 
 * PC只进行绑定，不负责更新，更新在WObject中进行
 */
interface uniformPart {
    // label?: string,
    /** 在一个group中绑定的位置，在一个group中，不能重复 */
    binding: number,
    /**
     * GPUSampler or GPUTextureView or GPUBufferBinding or GPUExternalTexture) 的四种资源之一
     * 可以使用()=>{return GPUBindingResource}的形式返回
     * GPUBufferBinding的更新在WObject中进行，由上一级进行维护
     */
    resource: GPUBindingResource
    /**
     * 相同的number，代表在一个group中
     * 这里的group的id需要与后面的encoder的pipeline中bindgroup的id对应
     * 从1--3（最小的最大maxBindGroups），有多少个需要看系统实现（20240705 dawn=4,wgpu=8）
     * 0被系统占用
     */
    layout: number,
}
interface drawMode {

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
    /**数组会按照1--3进行重组，生成GPUBindGroup */
    uniforms: uniformPart[],
    renderPassDescriptor: GPURenderPassDescriptor,
    /**索引模式 */
    indexBuffer?: {
        buffer: GPUBuffer,
        indexForat: "uint16" | "uint32",
        offset?: number,
        /**Size in bytes of the index data in buffer */
        size: number,
    },
    /**实例化数量，默认=1 */
    instanceCount?: number,
    /** map buffer or texture */

}

class PrimitiveCommand {
    /** scene ,必须 */
    scene: any;
    /** 渲染的camera，scene.cameraDefault || 指定的camera */
    camera: any;
    /** webGPU 的device */
    device: GPUDevice;
    /***pipeline 句柄 */
    pipeline: GPURenderPipeline | undefined;
    /**保存 pipeline 用的buffer ,不超过(maxVertexBuffers:8,maxVertexAttributes:16)*/
    verticesBuffer: GPUBuffer[] | undefined;
    /**
     * [0]=系统的uniform参数
     * 其他最多3个绑定组，dawn（4个），wgpu（8个） */
    uniformGroups: GPUBindGroup[] | undefined;
    /**renderPassDescriptor */
    renderPassDescriptor: GPURenderPassDescriptor | undefined;
    /**这个类的webGPU的 commandEncoder */
    commandEncoder: GPUCommandEncoder | undefined;


    constructor(options: primitiveOption) {
        if (options.camera) this.camera = options.camera;
        else this.camera = this.scene.cameraDefault;
        this.scene = options.scene;
        this.device = options.scene.device;
        this.init();
    }
    destory() { }
    init() {

    }
    createverticesBuffer(VertexArray: TypedArray | any) {
        let device = this.device;
        //创建 顶点buffer Create a vertex buffer from the cube data.
        const verticesBuffer = device.createBuffer({
            size: VertexArray.byteLength,
            usage: GPUBufferUsage.VERTEX,
            mappedAtCreation: true,
        });
        new Float32Array(verticesBuffer.getMappedRange()).set(VertexArray);
        verticesBuffer.unmap();
        return verticesBuffer;
    }
    createPipeline() {
        let device = this.device;
        const pipeline = device.createRenderPipeline({
            layout: 'auto',
            vertex: {
                module: shaderModule,
                entryPoint: 'myVSMain',
                buffers: [
                    // position
                    {
                        arrayStride: 3 * 4, // 3 floats, 4 bytes each
                        attributes: [
                            { shaderLocation: 0, offset: 0, format: 'float32x3' },
                        ],
                    },
                    // normals
                    {
                        arrayStride: 3 * 4, // 3 floats, 4 bytes each
                        attributes: [
                            { shaderLocation: 1, offset: 0, format: 'float32x3' },
                        ],
                    },
                    // texcoords
                    {
                        arrayStride: 2 * 4, // 2 floats, 4 bytes each
                        attributes: [
                            { shaderLocation: 2, offset: 0, format: 'float32x2', },
                        ],
                    },
                ],
            },
            fragment: {
                module: shaderModule,
                entryPoint: 'myFSMain',
                targets: [
                    { format: presentationFormat },
                ],
            },
            primitive: {
                topology: 'triangle-list',
                cullMode: 'back',
            },
            depthStencil: {
                depthWriteEnabled: true,
                depthCompare: 'less',
                format: 'depth24plus',
            },
            ...(canvasInfo.sampleCount > 1 && {
                multisample: {
                    count: canvasInfo.sampleCount,
                },
            }),
        });
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
    // update(){
    // }
    render() {
        if (this.device && this.commandEncoder)
            this.device.queue.submit([this.commandEncoder.finish()]);
    }

}

export { PrimitiveCommand }

