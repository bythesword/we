/**
 * DCC的预定义部分
 * @author  tom song 
 */



import { TypedArray } from "webgpu-utils";
import { renderKindForDCCC } from "../const/coreConst";
import { BaseStage } from "../stage/baseStage";


///////////////////////////////////////////////////////////////////
// uniform  收集器的定义：

/**20250411,未使用  */
export type TypedArrayString = "Int8Array" | "Uint8Array" | "Int16Array" | "Uint16Array" | "Int32Array" | "Uint32Array" | "Float32Array" | "Float64Array";

/**GPUBuffer的收集器：单个bindGroup范围；
 * 
 * 单个layout的uniformBuffer的GPUBuffer的收集器 
 * 
 * 这相当于@group(x) @binding(y) 的y
*/
export type uniformBuffer = {
    [n in number]: GPUBuffer
}
/**所有bindGroup(4个)layout的uniformBuffer的GPUBuffer的收集器
 * 
 * 这个相当于@group(x) @binding(y)  中的X，其内容相当于Y
 */
export type uniformBufferAll = {
    [n in number]: uniformBuffer
}
/** DC保存 bindGroup的用途的收集器 */
export type localUniformGroups = {
    [n in number]: GPUBindGroup
}

///////////////////////////////////////////////////////////////////////////////////////////////
//  interface：通过数据源创建uniform buffer

/**通过数据(TypedArray)创建uniform buffer的基础格式；
 * uniformBuffer的目标是：uniform|storag
 * 
 * @param label  用于debug的label
 * @param type  buffer 类型，buffer 类型，默认：uniform
 * @param size 是TypedArray的大小，以byte计算;这个size是需要数据对齐的
 * @param get  TypedArray,通过()=>{return TypedArray }返回TypedArray
 * @param update 是否每帧更新，默认：true
 * @returns  uniformBufferPartWithSystem
 */
export interface uniformBufferPartBase {
    /**为创建GPUBuffer使用,用于debug的label */
    label?: string,
    /** buffer 类型,uniform|storage，默认：uniform */
    type?: "uniform" | "storage",//|"sampler"|"textureView"|"ExternalTexture",
    usage?: GPUBufferUsageFlags,//exp:GPUBufferUsage.MAP_READ
    /**TypedArray的大小，以byte计算 ;这个size是需要数据对齐的*/
    size: number,//
    /**TypedArray,通过()=>{return TypedArray }返回TypedArray */
    get: () => TypedArray,
    /** 
     * 是否每帧更新，默认：true 
     * 
     * 至少更新一次
    */
    update?: boolean,
}


/**  uniform buffer的格式  */
export interface uniformBufferPart extends uniformBufferPartBase {
    /**
     * WGSL中的@binding(x)的位置，不能重复;
     * 
     * 必须是JS中与WGSL中的一定要对应，否则报错
     * 
     * number ,WGSL中的@binding(y)的位置，不能重复;
     *          maxUniformBuffersPerShaderStage 在webGPU的最小最大值：12（map模式）,连续模式：1000 
     */
    binding: number,
}
/**  storage buffer的格式 */
export interface storageBufferPart extends uniformBufferPart {
    /** buffer 类型,storage */
    type: "storage",
    // map?: TypedArray,
    /** 
     * 是否每帧更新，
    */
    update: boolean,
}
/**动态返回 uniform的GPUBindingResource
 * 
 * 用于GPUBindingResource资源可以被更新的情况（更新可能是新的texture，或者texture被destroy并重新创建）
 * 
 * 比如：textture的大小变化了等
 */
export interface dynGPUBindGroupEntry {
    /**
     * A unique identifier for a resource binding within the {@link GPUBindGroup}, corresponding to a
     * {@link GPUBindGroupLayoutEntry#binding|GPUBindGroupLayoutEntry.binding} and a @binding
     * attribute in the {@link GPUShaderModule}.
     */
    binding: GPUIndex32;
    dynGPUBindGroupEntry: true,
    /**是否更新bindGRoup内容以及重建bindGroup （需要在submit（）中updateUniformBuffer（）进行判断）
     * 1、如果bind的资源有更新，则=true，需要更新bindGroup
     * 2、没有更新，=false
    */
    update: boolean,
    /**
     * The resource to bind, which may be a {@link GPUSampler}, {@link GPUTextureView},
     * {@link GPUExternalTexture}, or {@link GPUBufferBinding}.
     */
    resource: GPUBindingResource,
    getResource: ( ) => GPUBindingResource;//20250519，增加动态获取importExternalTexture的箭头函数
    // getResource: (scope: any) => GPUBindingResource;
}
//////////////////////////////////////////////////////////////////////////////////////////////////
//

/**  unifrom 入口的数组格式  */
export type uniformEntries = GPUBindGroupEntry | uniformBufferPart | storageBufferPart | dynGPUBindGroupEntry;

/** 单个bindGroup的格式定义
 * 1、自定义layout绑定组，自定义binding编号，自定义shader code
 * 2、unifromGroup  只进行绑定，不负责更新，更新在WObject中进行
 * @layout 
    * number
    * 在一个group中绑定的位置，在一个group中，不能重复;
    * 这里的group的id需要与后面的encoder的pipeline中bindgroup的id对应
    * maxBindGroups在webGPU的最小最大值：4
    * 从1--3（最小的最大maxBindGroups），有多少个需要看系统实现（20240705 dawn=4,wgpu=8）
    * 0：被系统占用，剩余1--3
 
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
    /**layout是必须的： number
    * 在一个group中绑定的位置，在一个group中，不能重复;
    * 这里的group的id需要与后面的encoder的pipeline中bindgroup的id对应
    * maxBindGroups在webGPU的最小最大值：4
    * 从1--3（最小的最大maxBindGroups），有多少个需要看系统实现（20240705 dawn=4,wgpu=8）
    * 0：被系统占用，剩余1--3
    */
    layout: number,
    /**
     * type，两种类型
     * 
     * A、GPUBindGroupEntry：是webGPU的标准的，GPUSampler or GPUTextureView or GPUBufferBinding or GPUExternalTexture) 的四种资源之一
     * 
     * B、uniformBufferPart | storageBufferPart  直接使用TypeArray的数据，由DCC创建GPUBuffer；
     * 
     * C、dynGPUBindGroupEntry：动态资源，GPUBindingResource可以被更新的情况（更新可能是新的texture，或者texture被destroy并重新创建） 
     *
     */
    entries: uniformEntries[],
}


//////////////////////////////////////////////////////////////////////////////
//for system uniform interface 
//20250411，未使用
// /**
//  * 类似GPUBindGroupEntry，binding：需要system进行适配
//  */
// interface uniformBindingResourceWithSystem {
//     name: string,
//     wgslType: string,
//     resource: GPUBindingResource;
// }

// /**定义 uniform 与system 集成的格式
//  *  name：必须，对应与bindGroup的slot名称
//  *  wgslType:必须，可以是WGSL的固有类型（f32,vec3f,....）,也可以是定义的结构体。此部分的正确性需要保证string与wgsl中的对应，并正确。
//  */
// export interface uniformBufferPartWithSystem extends uniformBufferPartBase {
//     name: string,
//     wgslType: string,
// }
// export interface storageBufferPartWithSystem extends uniformBufferPartWithSystem {
//     /** buffer 类型,storage */
//     type: "storage",
//     /**      * 是否每帧更新，    */
//     update: boolean,
//     /** storage 的操作
//      * var<storage, read_write> //不能在VS中，所以默认是read，如果需要read_write，则写这个属性
//      *  var<storage, read>
//     */
//     wgslStorageReadWrite?: string,
// }
// export type uniformEntriesWithSystem = uniformBufferPartWithSystem | uniformBindingResourceWithSystem;



//////////////////////////////////////////////////////////////////////////////
//DCC 初始化  options的定义
/** 初始化参数  */
export interface baseOptionOfCommand {
    /** scene object ，必须 */
    parent: any,
    name?: string,
    /** label */
    label?: string,
    layout?: GPUPipelineLayout | "auto",
    /**数组会按照1--3进行重组，生成GPUBindGroup */
    //20241021 增加并注释掉
    uniforms: unifromGroup[],// | uniformEntriesWithSystem[],//20241021,还是12限制的问题，结构体同样受限，将12个bindgroup扩展为12大盒子
    /**是否使用system 的group 0 */
    rawUniform?: boolean,

    /** callback function 
     * 
     * 正确性由上级程序保障
     * 
     *一、 如果是map操作，需要copy和unmap两步：
     * 
     * 1、  await Promise.all([
            workgroupReadBuffer.mapAsync(GPUMapMode.READ),
            localReadBuffer.mapAsync(GPUMapMode.READ),
            globalReadBuffer.mapAsync(GPUMapMode.READ),
        ]);

      2、  workgroupReadBuffer.unmap();
     * 
     */
    afterUpdate?: (scope: any) => Promise<any>,
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Draw

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
    /**
     *  GPUVertexAttribute[] 
     * 示例exp:
     * 
     * [
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
    */
    attributes: GPUVertexAttribute[],
    /** "vertex" | "instance" ,默认=vertex*/
    stepMode?: GPUVertexStepMode,
}
/** * pipeline layout   vertex 定义 */
export interface vsPart {
    code: string,
    entryPoint: string,
    /**GPU 的常数替换*/
    constants?: any,
    buffers?: vsAttributes[],
}

/** pipeline layout  fragment 定义 */
export interface fsPart {
    code: string,
    entryPoint: string,
    /**GPU 的常数替换*/
    constants?: any,
    /**采用webGPU的GPUColorTargetState[]
     * 1、前向渲染需要format[],需要与RPD保持一致
     * 2、透明渲染需要 blend?: GPUBlendState;
     * 3、writeMask?: GPUColorWriteFlags; todo
     */
    targets: GPUColorTargetState[]
}

/** indexBuffer,非必须*/
export interface indexBuffer {
    buffer: Uint32Array,
    type?: "Uint32Array",
    indexForat?: "uint16" | "uint32",
    offset?: number,
    /**Size in bytes of the index data in buffer */
    size?: number,
}
/** 非索引模式的draw mode定义
 * @vertexCount 绘制的顶点数量
 * @instanceCount 实例化数量，默认=1
 * @firstVertex  从第几个顶点开始绘制，默认=0
 * @firstInstance 从第几个实例开始，默认=0
 */
export interface drawMode {
    vertexCount: number,
    /**实例化数量，默认=1 
     * intance 的其他参数可以通过unform 或 storage buffer 传递，
     *          A、比如scale，position ，color，matrix等
     *          B、这些参数在shader中操作
     *          C、也可以通过shader生成random,进行随机（上述）操作，比如花草的摇曳的matrix
    */
    instanceCount?: number,
    firstVertex?: number
    firstInstance?: number
}
/**索引模式的draw mode定义
 * @indexCount The number of indices to draw.
 * @instanceCount 多少个，默认=1
 * @firstIndex ,从第几个index开始绘制，默认=0
 * @baseVertex ,Added to each index value before indexing into the vertex buffers.
 * @firstInstance 从第几个实例开始，默认=0
 */
export interface drawModeIndexed {
    indexCount: number,
    instanceCount?: number,
    firstIndex?: number,
    baseVertex?: number,
    firstInstance?: number,
}
/**索引非|索引 组合定义
 * 注意：mode 和 values的关系需要一一对应
 *  draw-->drawMode
 *  index-->drawModeIndexed
 */
export interface drawModeType {
    mode: "draw" | "index",
    values: drawMode | drawModeIndexed,
}
/**DC的Viewport定义
 *   默认是surface的全部,
     * 
     * x,y:≥=0;surface的offset(pixels)
     * 
     * width,height:≥ 0;pixels,x+width,y+height,这个两个不能超过surface的实际值     * 
     * 
     * minDepth,maxDepth是压缩后在NDC中的深度区间
     * 
        *  0.0 ≤ minDepth ≤ 1.0;     
        *  0.0 ≤ maxDepth ≤ 1.0
 */
interface viewport {
    x: number,
    y: number,
    width: number,
    height: number,
    minDepth?: number,
    maxDepth?: number,
}

/** DrawCommand 初始化参数  */
export interface DrawOptionOfCommand extends baseOptionOfCommand {
    /**VS 部分 */
    vertex: vsPart,
    /**FS 部分 */
    fragment?: fsPart,//20241215,若只进行VS输出depth，非必须
    /**图元部分
     * 1、点线面
     * 2、正反面
     * ...(参见GPUPrimitiveState)
     */
    primitive?: GPUPrimitiveState,
    /**  RPD，必须，可能由多种情况，使用不同的RPD
     * 1、前向渲染|前向透明渲染
     * 2、depth渲染
     * 3、shadowmap渲染 
     * 4、shadowmap透明渲染
     */
    renderPassDescriptor: GPURenderPassDescriptor,

    /**索引模式 */
    indexBuffer?: indexBuffer,

    /** draw mode:  */
    draw: drawModeType,

    /**viewport,从标准化设备坐标(NDC)线性映射到视区坐标。    */
    viewport?: viewport,

    /**pipeline中的深度处理描述  GPUDepthStencilState */
    depthStencilState?: GPUDepthStencilState,

    /**获取systemUnifroms的bindGroup
     * 
     *  由多种情况（与RPD基本保持一致）：
     * 
            * 前向渲染forward
            * depth vs only
            * shadowmap vs only
            * shadowmap transparent vs +fs
     *     
     *  入参： 
     * 
            * @param pipeline ,当前已经创建的pipelne，有两种方式，
                    *          1、是目前这种，先创建pipeline，然后将pipeline给bindGroup，获取pipeline的getBindGroupLayout(0),然后创建bindGroup,再回传
                    *          2、是创建grouplayout-->pipeline
                    *                             -->bindGroup
                    *                               保持两者的bindGroupLayout在bindGroup和pipeline中的一致
                    * 
            * @param stage  
            * @param id    camereID or lightID
            * @param kind  
            * @returns 
     */
    systemUniforms?: (pipeline: GPURenderPipeline, stage: BaseStage, id?: string, kind?: renderKindForDCCC) => GPUBindGroup,
    /**camera 或 光源标识（光源id+ "_" + matrixIndex） */
    renderForID: string,//20250411，改为必须
    /**渲染的类型：camera||light */
    renderForType?: renderKindForDCCC,
    /**todo：20250411，MSAA*/
    multisample?: GPUMultisampleState
}


//////////////////////////////////////////////////////////////////////////////////////////
//compute
export interface computePart {
    code: string,
    entryPoint: string,
    /**GPU 的常数替换*/
    constants?: any,
}

export interface computeOptionOfCommand extends baseOptionOfCommand {
    compute: computePart,
    /** 
     * callback function 
     * 
     * 进行map操作，由上级程序保障正确性
     * 
     * examp：
     *  encoder.copyBufferToBuffer(workgroupBuffer, 0, workgroupReadBuffer, 0, size);
     * 
     * workgroupBuffer=this.unifromBuffer[0][0],对应：@group(0)@binding(0)  
     */
    map?: (scope: any, encode: GPUCommandEncoder) => Promise<any>,
    /**
     * 数组 ,长度3
     */
    dispatchCount: number[],
}
