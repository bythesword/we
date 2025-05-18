import { lifeState } from "../const/coreConst";

/**纹理的输入类型，可以是url，图片，也可以是GPUTexture */
export type textureType = string | GPUTexture | GPUCopyExternalImageSource;

 

/**
 * 纹理材质的初始化参数
 * 
 * 1、texture：纹理来源
 * 
 * 2、samplerFilter：采样器过滤模式，默认为linear
 * 
 * 3、mipmap：是否生成mipmap，默认为true
 * 
 * 4、premultipliedAlpha：是否预乘alpha，默认为true,只有在有透明的情况下有效。
 * 
 * 5、upsideDownY：是否上下翻转Y轴，默认为true
 */
export interface optionBaseTexture {
    /**纹理名称 */
    name?: string,
    /**纹理来源 */
    texture?: any,
    /** 简单设置采样器模式，如果有samplerDescriptor设置 ，则忽略此设置 
     * 采样器过滤模式，默认为linear
     */
    samplerFilter?: GPUFilterMode,
    /**采样器 */
    samplerDescriptor?: GPUSamplerDescriptor,
    /**是否生成纹理的mipmap
     * */
    mipmap?: boolean,
    /**纹理的premultipliedAlpha，只在有透明的情况下有效。
     * 1、如果为true，说明纹理的premultipliedAlpha为true，需要预乘alpha。
     * 2、如果为false，说明纹理的premultipliedAlpha为false，不需要预乘alpha。
     */
    premultipliedAlpha?: boolean,
    /**是否上下翻转Y轴
     * 默认=true；
     */
    upsideDownY?: boolean,

    /**
     * 纹理的格式，默认=rgba8unorm
     */
    format?: GPUTextureFormat,
    /**
     * 纹理的使用方式：使用GPUTextureUsage
     * COPY_SRC，COPY_DST，TEXTURE_BINDING，STORAGE_BINDING，RENDER_ATTACHMENT
     * 默认为:GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_SRC | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT 
     *
     */
    usage?: GPUTextureUsageFlags,
}
export abstract class BaseTexture {
    device: GPUDevice;

    input: optionBaseTexture;
    name!: string;
    sampler: GPUSampler | undefined;

    /**是否上下翻转Y轴 */
    _upsideDownY: boolean;

    /**纹理 
     * 外部访问对象
    */
    texture!: GPUTexture;

    /**纹理是否完成，这个是需要处理的（异步数据的加载后，改为true，或没有异步数据加载，在init()中改为true）；
     * constructor中设置为false。 
     * 如果更改为为true，在材质不工作
    */
    _already: lifeState;
    constructor(input: any, device: GPUDevice) {
        this.device = device;
        this.input = input;
        //是否上下翻转Y轴
        this._upsideDownY = true;
        if (input.samplerDescriptor != undefined) {
            this.sampler = this.device.createSampler(input.samplerDescriptor);
        }
        else if (this.input.samplerFilter != undefined) {
            let sampler = this.input.samplerFilter;
            this.sampler = this.device.createSampler({
                magFilter: sampler,
                minFilter: sampler,
            });
        }
        else {
            this.sampler = this.device.createSampler({
                magFilter: 'linear',
                minFilter: 'linear',
            });
        }
        this._already = lifeState.unstart;
    }

    abstract init(): Promise<void>;
    destroy() {
        if (this.texture) {
            this.texture.destroy();
            this.texture = undefined as any;
        }
    }
    /**
     * 
     * @returns 是否已经准备好
     */
    getReady() {
        return this._already;
    }
    /**
     * 计算mipmap的层级
     * @param sizes 纹理的大小,[width,height]
     * @returns mipmap的层级
     */
    numMipLevels(sizes: number[]): number {
        const maxSize = Math.max(...sizes);
        return 1 + Math.log2(maxSize) | 0;
    };


    generateMips(device: GPUDevice, texture: GPUTexture) {
        let sampler: GPUSampler = device.createSampler({
            minFilter: 'linear',
        });
        let module = device.createShaderModule({
            label: 'textured quad shaders for mip level generation',
            code: `
            struct VSOutput {
              @builtin(position) position: vec4f,
              @location(0) texcoord: vec2f,
            };

            @vertex fn vs(
              @builtin(vertex_index) vertexIndex : u32
            ) -> VSOutput {
              let pos = array(

                vec2f( 0.0,  0.0),  // center
                vec2f( 1.0,  0.0),  // right, center
                vec2f( 0.0,  1.0),  // center, top

                // 2st triangle
                vec2f( 0.0,  1.0),  // center, top
                vec2f( 1.0,  0.0),  // right, center
                vec2f( 1.0,  1.0),  // right, top
              );

              var vsOutput: VSOutput;
              let xy = pos[vertexIndex];
              vsOutput.position = vec4f(xy * 2.0 - 1.0, 0.0, 1.0);
              vsOutput.texcoord = vec2f(xy.x, 1.0 - xy.y);
              return vsOutput;
            }

            @group(0) @binding(0) var ourSampler: sampler;
            @group(0) @binding(1) var ourTexture: texture_2d<f32>;

            @fragment fn fs(fsInput: VSOutput) -> @location(0) vec4f {
              return textureSample(ourTexture, ourSampler, fsInput.texcoord);
            }
          `,
        });

        const pipeline = device.createRenderPipeline({
            label: 'mip level generator pipeline',
            layout: 'auto',
            vertex: {
                module,
            },
            fragment: {
                module,
                targets: [{ format: texture.format }],
            },
        });

        const encoder = device.createCommandEncoder({
            label: 'mip gen encoder',
        });

        for (let baseMipLevel = 1; baseMipLevel < texture.mipLevelCount; ++baseMipLevel) {
            const bindGroup: GPUBindGroup = device.createBindGroup({
                layout: pipeline.getBindGroupLayout(0),
                entries: [
                    {
                        binding: 0,
                        resource: sampler
                    },
                    {
                        binding: 1,
                        resource: texture.createView({
                            baseMipLevel: baseMipLevel - 1,
                            mipLevelCount: 1,
                        }),
                    },
                ],
            });

            const renderPassDescriptor: GPURenderPassDescriptor = {
                label: 'our basic canvas renderPass',
                colorAttachments: [
                    {
                        view: texture.createView({
                            baseMipLevel,
                            mipLevelCount: 1,
                        }),
                        loadOp: 'clear',
                        storeOp: 'store',
                    },
                ],
            };

            const pass = encoder.beginRenderPass(renderPassDescriptor);
            pass.setPipeline(pipeline);
            pass.setBindGroup(0, bindGroup);
            pass.draw(6);  // call our vertex shader 6 times
            pass.end();
        }
        const commandBuffer = encoder.finish();
        device.queue.submit([commandBuffer]);
    };
}  