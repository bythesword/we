// import { Mat4, mat4, vec3, Vec3, Vec2, Vec4, Mat3, mat3,TypedArray } from 'wgpu-matrix';
import { TypedArray } from 'webgpu-utils';
// declare type TypedArray = Int8Array | Uint8Array | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array;
// import * as baseDefine from "../scene/base"


///////////////////////////////////////////////////////////////////
// uniform base interface 
/**
 *   uniformBufferPartWithSystem 是基础的uniform|storage的buffer创建的格式
 * @buffer :TypedArray,通过()=>{return TypedArray }返回TypedArray
 * 
 * @type:buffer 类型，buffer 类型，默认：uniform  
 *     
 * @size :是TypedArray的大小，以byte计算;这个size是需要数据对齐的
 * 
 * @update :是否每帧更新，默认：true 
 */
export interface uniformBufferPartBase {
    /**为创建GPUBuffer使用 */
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

///////////////////////////////////////////////////////////////////////////////////////////////
// for RAW uniform interface
/**
 *  * uniformPart 是RAW模式的格式
 *   是buffer使用的更新，会每帧更新
 * @binding
    * number ,WGSL中的@binding(x)的位置，不能重复;
    * maxUniformBuffersPerShaderStage 在webGPU的最小最大值：12（map模式）,连续模式：1000
    *  
 */
export interface uniformBufferPart extends uniformBufferPartBase {
    /**
     * WGSL中的@binding(x)的位置，不能重复;
     * 
     * 必须是JS中与WGSL中的一定要对应，否则报错
     */
    binding: number,

}

export interface storageBufferPart extends uniformBufferPart {
    /** buffer 类型,storage */
    type: "storage",
    // map?: TypedArray,
    /** 
     * 是否每帧更新，
    */
    update: boolean,
}

export type uniformEntries = GPUBindGroupEntry | uniformBufferPart | storageBufferPart;
/**
 * RAW模式使用，自定义layout绑定组，自定义binding编号，自定义shader code
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
    /** RAW模式下，layout是必须的 */
    layout: number,
    /**
     * type，两种类型
     * 
     * 一个是webGPU的标准的，
     * 
     * 一个是架构的自定义的uniform|storage的TypeArray的interface
     */
    entries: uniformEntries[],
}


//////////////////////////////////////////////////////////////////////////////
//for system uniform interface 
/**
 * 类似GPUBindGroupEntry，binding：需要system进行适配
 */
interface uniformBindingResourceWithSystem {
    name: string,
    wgslType: string,
    resource: GPUBindingResource;
}

/**
 * 定义 uniform 与system 集成的格式
 *  name：必须，对应与bindGroup的slot名称
 *  wgslType:必须，可以是WGSL的固有类型（f32,vec3f,....）,也可以是定义的结构体。此部分的正确性需要保证string与wgsl中的对应，并正确。
 */
export interface uniformBufferPartWithSystem extends uniformBufferPartBase {
    name: string,
    wgslType: string,
}
export interface storageBufferPartWithSystem extends uniformBufferPartWithSystem {
    /** buffer 类型,storage */
    type: "storage",
    /**      * 是否每帧更新，    */
    update: boolean,
    /** storage 的操作
     * var<storage, read_write> //不能在VS中，所以默认是read，如果需要read_write，则写这个属性
     *  var<storage, read>
    */
    wgslStorageReadWrite?: string,
}
export type uniformEntriesWithSystem = uniformBufferPartWithSystem | uniformBindingResourceWithSystem;



///////////////////////////////////////////////////////////////////////////
// option section interface

/**unifrom 适配 引擎的system 创建uniform 使用，非RAW模式 */
// export interface unifromGroupWithSystem {
//     entries: uniformEntriesWithSystem[],
// }
/** 初始化参数 
 * 
 * scene:必须
 * 
 * camera?: any,
 * 
*/
export interface baseOptionOfCommand {
    /** scene object ，必须 */
    parent: any,

    //作废，camera和DC没有关系，20240825
    // /** todo ,摄像机对象或default,也可以是光源的，比如shadow map */
    // camera?: any,

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
////////////////////////////////////////////////////////////
// class attribute section interface 
/**
 * 单个layout的uniformBuffer的GPUBuffer的收集器 
 * 
 * 这相当于@group(x) @binding(y) 的y
*/
export type uniformBuffer = {
    [n in number]: GPUBuffer
}
/** 
 * 所有layout的uniformBuffer的GPUBuffer的收集器
 * 
 * 这个相当于@group(x) @binding(y)  中的X，其内容相当于Y
 */
export type uniformBufferAll = {
    [n in number]: uniformBuffer
}
/**
 * DC保存 bindGroup的用途的收集器
 */
export type localUniformGroups = {
    [n in number]: GPUBindGroup
}


//////////////////////////////////////////////////////////////////
// class 

export abstract class BaseCommand {
    /** parent ,必须,cavas or texture */
    parent: any;

    //作废，camera和DC没有关系，20240825
    // /** 渲染的camera，scene.cameraDefault || 指定的camera */
    // camera: any;

    /** webGPU 的device */
    device!: GPUDevice;

    rawUniform!: boolean;
    /***pipeline 句柄 */
    pipeline!: GPURenderPipeline | GPUComputePipeline;

    pipelineLayout!: GPUPipelineLayout | "auto";

    /**
     * [0]=系统的uniform参数
     * 其他最多3个绑定组，dawn（4个），wgpu（8个）
     */
    uniformGroups!: localUniformGroups;

    unifromBuffer!: uniformBufferAll;


    //bindingGroup 计数器
    bindingIdOfGroup0: number;
    bindingIdOfGroup1: number;
    bindingIdOfGroup2: number;
    bindingIdOfGroup3: number;
    label!: string;

    /**注销标志位 */
    _isDestroy!: boolean;

    /**这个类的webGPU的 commandEncoder */
    input!: baseOptionOfCommand;

    constructor(options: baseOptionOfCommand) {
        this.bindingIdOfGroup0 = 0;
        this.bindingIdOfGroup1 = 0;
        this.bindingIdOfGroup2 = 0;
        this.bindingIdOfGroup3 = 0;
        // this.KVofuniformGroup0 = {};//20241021 ，增加并注释掉
        this.input = options;
        this.parent = options.parent;
        this.device = options.parent.device;
        this.rawUniform = false;
        if (options.rawUniform) this.rawUniform = true;
        this.label = this.input.label == undefined ? "no name" : this.input.label;
        return this;
    }
    abstract init(): any
    /**
     * 销毁本DrawCommand中的资源
     */
    abstract destroy(): any
    set isDestroy(visable: boolean) {
        this._isDestroy = visable;
    }
    get isDestroy() {
        return this._isDestroy;
    }

    abstract submit(): any
    /** 创建uniform Buffer，  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST*/
    creatUniformBuffer(size: number, label: string, usage: GPUBufferUsageFlags | boolean = false) {
        let device = this.device;
        if (usage === false) {
            usage = GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST;
        }
        const uniformBuffer = device.createBuffer({
            label: label,
            size: size,
            usage: usage as number
        });
        return uniformBuffer;

    }
    /** 创建uniform Buffer，  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST*/
    creatUniformStorageBuffer(size: number, label: string, usage: GPUBufferUsageFlags | boolean = false) {
        let device = this.device;
        if (usage === false) {
            usage = GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC;
        }
        const uniformBuffer = device.createBuffer({
            label: label,
            size: size,
            usage: usage as GPUBufferUsageFlags
        });
        return uniformBuffer;
    }

    /**
     * 创建uniform buffer 用的描述，并将uniformBuffer(GPUBuffer) 存储到this.unifromBuffer中。
     * @param layout  bingdGroup：1--3
     * @param perOne  每个uniform buffer的描述 
     * @returns GPUBindGroupEntry
     */
    createUniformBufferBindGroupDescriptor(layout: number, perOne: uniformBufferPart): GPUBindGroupEntry {

        let label = this.input.label as string;
        if ("label" in perOne) {
            label = perOne.label as string;
        }
        let uniformBuffer: GPUBuffer;
        if ("type" in perOne && perOne.type == "storage") {
            if ("usage" in perOne) {
                uniformBuffer = this.creatUniformStorageBuffer(perOne.size, label, perOne.usage);
            }
            else {
                uniformBuffer = this.creatUniformStorageBuffer(perOne.size, label);
            }
            const buffer = perOne.get();
            this.device.queue.writeBuffer(
                uniformBuffer,
                0,
                buffer,
                // buffer.buffer,
                // buffer.byteOffset,
                // buffer.byteLength
            );
            //   两个都是正确的
            //   this.device.queue.writeBuffer(
            //     uniformBuffer,
            //     0,
            //     // buffer,
            //     buffer.buffer,
            //     buffer.byteOffset,
            //     buffer.byteLength
            //   );
        }
        else {
            uniformBuffer = this.creatUniformBuffer(perOne.size, label);
        }
        if (this.unifromBuffer[layout]) {
            this.unifromBuffer[layout][perOne.binding] = uniformBuffer;
        }
        else {
            let oneUniformBuffer = [];
            oneUniformBuffer[perOne.binding] = uniformBuffer;
            this.unifromBuffer[layout] = oneUniformBuffer;
        }

        const res: GPUBufferBinding =
        {
            buffer: uniformBuffer
        }
        let one: GPUBindGroupEntry = {
            binding: perOne.binding,
            resource: res
        }
        return one;
    }


    /**
     * 创建 bindGroup 1--3 
     * @returns localUniformGroups
     */
    createUniformGroups(): localUniformGroups {
        let device = this.device;
        let pipeline = this.pipeline;
        let bindGroup: localUniformGroups = [];

        let unifromGroupSource = this.input.uniforms as unifromGroup[];
        for (let perGroup of unifromGroupSource) {
            let entries: GPUBindGroupEntry[] = [];
            for (let perOne of perGroup.entries) {
                if ("size" in perOne) {
                    const perOneBuffer = this.createUniformBufferBindGroupDescriptor(perGroup.layout, perOne as uniformBufferPart);
                    entries.push(perOneBuffer);
                }
                else {
                    entries.push(perOne as GPUBindGroupEntry);
                }
            };
            const bindLayout = pipeline.getBindGroupLayout(perGroup.layout);
            let groupDesc: GPUBindGroupDescriptor = {
                label: "bind to " + perGroup.layout,
                layout: bindLayout,
                entries: entries,
            }
            const uniformBindGroup = device.createBindGroup(groupDesc);
            bindGroup[perGroup.layout] = uniformBindGroup;
        }

        return bindGroup;
    }

    /**
     * For RAW 
     * 更新单个layout的uniform buffer的TypedArray
     * @param layout  uniformBindGroup的layout的位置数字
     * @param perOne  在uniformBufferPart ，即单个uniformBuffer的定义
     */
    updataOneUniformBuffer(layout: number, perOne: uniformBufferPart) {
        if ("update" in perOne && perOne.update == false) {
            return;
        }
        else {
            let device = this.device;
            const uniformBuffer = this.unifromBuffer[layout][(perOne as uniformBufferPart).binding];
            const buffer = perOne.get();//定义的uniform数据块中的get()的箭头函数，返回TypedArray
            device.queue.writeBuffer(
                uniformBuffer,
                0,
                buffer.buffer,
                0,//buffer.byteOffset,
                buffer.byteLength
            );

        }
    }

    /**
     * 更新1--3+的 unifrom group的buffer，系统的（0）单独更新，通过scene中的updateSystemUnifrombuffer()进行更调用
     */
    updateUniformBuffer() {
        let unifromGroupSource = this.input.uniforms;
        for (let perGroup of unifromGroupSource) {
            for (let perOne of (perGroup as unifromGroup).entries) {
                if ("size" in perOne) {
                    this.updataOneUniformBuffer((perGroup as unifromGroup).layout, perOne as uniformBufferPart);
                }
            }
        }

    }

    /**
     * command 的调用主入口
     */
    async update() {
        await this.submit();
        await this.afterUpdate()
    }

    /**
     * afterUpdate 
     * 
     * 调用初始化参数中的，afterUpdated (scope)=>{} 
     * 
     * scope=this;
     */
    async afterUpdate() {
        let scope = this;
        if (scope.input.afterUpdate) {
            //  await new Promise((resolve, reject) => {
            //     resolve(scope.input.afterUpdate!(scope))
            // });

            await scope.input.afterUpdate!(scope)

        }
    }
}