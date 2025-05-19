// import { Mat4, mat4, vec3, Vec3, Vec2, Vec4, Mat3, mat3,TypedArray } from 'wgpu-matrix';
import { TypedArray } from 'webgpu-utils';
import { baseOptionOfCommand, localUniformGroups, uniformBufferAll, uniformBufferPart, unifromGroup, dynGPUBindGroupEntry } from './commandDefine';
// declare type TypedArray = Int8Array | Uint8Array | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array;
// import * as baseDefine from "../scene/base"


///////////////////////////////////////////////////////////////////////////
// option section interface

/**unifrom 适配 引擎的system 创建uniform 使用，非RAW模式 */
// export interface unifromGroupWithSystem {
//     entries: uniformEntriesWithSystem[],
// }



//////////////////////////////////////////////////////////////////
// class 

export abstract class BaseCommand {
    /** parent ,必须,cavas or texture */
    parent: any;
    /**在GBuffer的后处理合并中，通过name（就是stage的string）和Gbuffer的command的length联合判断是否为空，优化合并渲染，解决多GBuffer的透明背景问题 */
    name!: string;

    /** webGPU 的device */
    device!: GPUDevice;

    rawUniform!: boolean;
    /***pipeline 句柄 */
    pipeline!: GPURenderPipeline | GPUComputePipeline;

    pipelineLayout!: GPUPipelineLayout | "auto";

    /**
     * todo：20250414
     * bindGroupLayout 句柄 
     * 先创建 bindGroupLayout  */
    bindGroupLayout!: GPUBindGroupLayout;
    /**
     * bindingGroup 描述 
     * 
     * [0]=系统的uniform参数
     * 
     * 其他最多3个绑定组，dawn（4个），wgpu（8个）
     */
    uniformGroups!: localUniformGroups;

    /**
     * 所有的uniform 中使用的Buffer的收集器 ，
     *  0：系统的uniform参数
     *  1-3：用户的uniform参数
     */
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

    /**是否动态更新bindGroup */
    dynamicBindGroup:boolean=false;

    constructor(options: baseOptionOfCommand) {
        if (options.name) {
            this.name = options.name;
        }
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


    /**创建 bindGroup 1--3 ,先获取pipelineLayout,auto模式，再创建bindGroup，然后再创建pipeline
     * 
     * layout from a pipeline by calling somePipeline.getBindGroupLayout(groupNumber)
     * 
     * @returns localUniformGroups
     */
    createUniformGroups(): localUniformGroups {
        let device = this.device;
        let pipeline = this.pipeline;
        let bindGroup: localUniformGroups = [];

        let unifromGroupSource = this.input.uniforms as unifromGroup[];
        for (let perGroup of unifromGroupSource) {
            let dyn = false;
            let entries: GPUBindGroupEntry[] = [];
            for (let perOne of perGroup.entries) {//循环entries
                if ("dynGPUBindGroupEntry" in perOne) {
                    dyn = true;
                    this.dynamicBindGroup=true;
                    perOne.resource=perOne.getResource();//动态获取importExternalTexture，20250519
                }
                if ("size" in perOne) {//如果是DCC自定义的uniformBufferPart，即size存在的
                    /**
                     * 1、创建uniform buffer的描述，并将uniformBuffer(GPUBuffer) 存储到this.unifromBuffer中。
                     * 2、创建GPUBindGroupEntry
                     */
                    const perOneBuffer = this.createUniformBufferBindGroupDescriptor(perGroup.layout, perOne as uniformBufferPart);
                    entries.push(perOneBuffer);
                }
                else {//其他的webGPU的1、创建GPUBindGroupEntry，即size不存在的
                    entries.push(perOne as GPUBindGroupEntry);
                }
            };
            //layout from a pipeline by calling somePipeline.getBindGroupLayout(groupNumber)
            //这个是通过pipeline获取的，而不是在构造函数中传入的。从逻辑上看，两种方式都可以（也是一样的）。
            //A、这种形式是获取layout的定义("auto"),然后再创建bindGroup。
            //B、另外的一种，就是创建bindGroupLayout 和createPipelineLayout，两种保持格式一致即可。

            const bindLayout = pipeline.getBindGroupLayout(perGroup.layout);
            let groupDesc: GPUBindGroupDescriptor = {
                label: "bind to " + perGroup.layout,
                layout: bindLayout,
                entries: entries,
            }
            if (dyn) {//20250519 ,增加动态dynamic的判断字符串
                groupDesc.label = "dynamic|" + groupDesc.label;
            }
            const uniformBindGroup = device.createBindGroup(groupDesc);
            bindGroup[perGroup.layout] = uniformBindGroup;
        }

        return bindGroup;
    }

    /**
    * todo：20250414
    * 创建 bindGroup 1--3 
    *  
    * 这种先创建descriptor: GPUBindGroupLayoutDescriptor ，再创建bindGroupLayout，再创建pipelineLayout，最后再创建pipeline，
    * 
    *       是因为，在创建pipelineLayout时，需要传入bindGroupLayout，而bindGroupLayout是在创建pipelineLayout时创建的。
    *       所以，需要先创建bindGroupLayout，再创建pipelineLayout，最后再创建pipeline。 
    *       最后，在submit时，绑定对应bindGroup（bindGroupLayout一致的）
    * 
    * 但，这种有个问题，创建descriptor: GPUBindGroupLayoutDescriptor 时，需要传入entries的具体类型，而且具体类型需要具体的程度会非常具体，todo
    * 
    * @returns localUniformGroups
    */
    createUniformGroupsByLayout(): localUniformGroups {
        let device = this.device;
        let pipeline = this.pipeline;
        let bindGroup: localUniformGroups = [];

        let unifromGroupSource = this.input.uniforms as unifromGroup[];
        for (let perGroup of unifromGroupSource) {
            let entries: GPUBindGroupEntry[] = [];
            for (let perOne of perGroup.entries) {//循环entries
                if ("size" in perOne) {//如果是DCC自定义的uniformBufferPart，即size存在的
                    /**
                     * 1、创建uniform buffer的描述，并将uniformBuffer(GPUBuffer) 存储到this.unifromBuffer中。
                     * 2、创建GPUBindGroupEntry
                     */
                    const perOneBuffer = this.createUniformBufferBindGroupDescriptor(perGroup.layout, perOne as uniformBufferPart);
                    entries.push(perOneBuffer);
                }
                else {//其他的webGPU的1、创建GPUBindGroupEntry，即size不存在的
                    entries.push(perOne as GPUBindGroupEntry);
                }
            };
            //layout from a pipeline by calling somePipeline.getBindGroupLayout(groupNumber)
            //这个是通过pipeline获取的，而不是在构造函数中传入的。从逻辑上看，两种方式都可以（也是一样的）。
            //A、这种形式是获取layout的定义("auto"),然后再创建bindGroup。
            //B、另外的一种，就是创建bindGroupLayout 和createPipelineLayout，两种保持格式一致即可。

            /*示例：
            const bindGroupLayout = device.createBindGroupLayout({
                entries: [
                    { binding: 0, visibility: GPUShaderStage.FRAGMENT, sampler: {}, },
                    { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: {} },
                    { binding: 2, visibility: GPUShaderStage.VERTEX, buffer: {} },
                ],
            });
            */

            //这个转换肯定时错的，需要具体展开，visibility项和resoure中对应到GPUBindGroupLayoutEntry的类型一致。
            const bindGroupLayout = device.createBindGroupLayout({
                entries: entries as unknown as GPUBindGroupLayoutEntry[],//todo:20250414，需要验证正确性，未作验证。
            });
            this.bindGroupLayout = bindGroupLayout;
            let groupDesc: GPUBindGroupDescriptor = {
                label: "bind to " + perGroup.layout,
                layout: bindGroupLayout,
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
                /**
                 * size 是DCC自定义的unifrom的参数，即数组的大小,MVP和lights视点GBPBUffer，不是DCC自定义的数值类型
                 * 
                 * 即：MVP和lights的更新是单独的，在system层级进行的，DCC只需要bindGroup即可
                 */
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
