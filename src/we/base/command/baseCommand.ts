// import { Mat4, mat4, vec3, Vec3, Vec2, Vec4, Mat3, mat3,TypedArray } from 'wgpu-matrix';
import { TypedArray } from 'webgpu-utils';
import { baseOptionOfCommand, localUniformGroups, uniformBufferAll, uniformBufferPart, unifromGroup } from './commandDefine';
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
 