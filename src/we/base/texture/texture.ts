import { weResourceTexture } from "../resource/weResource";
import { RootOfGPU } from "../organization/root";

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
export interface optionTextureSource {
    /**纹理名称 */
    name?: string,
    /**纹理来源 */
    texture: textureType,
    /**采样器 */
    samplerFilter?: GPUMipmapFilterMode,
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

export class Texture {
    device: GPUDevice;

    input: optionTextureSource;
    name!: string;
    sampler!: GPUSampler;

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
    _already: boolean;
    constructor(input: optionTextureSource, device: GPUDevice) {
        //初始化参数
        this.device = device;
        this.input = input;
        if (input.format == undefined) {
            this.input.format = 'rgba8unorm';
        }
        this._already = false;
        this._upsideDownY = input.upsideDownY || true;
        this.name = input.name || "";
        //是否上下翻转Y轴
        this._upsideDownY = true;
        if (input.upsideDownY != undefined) {
            this._upsideDownY = input.upsideDownY;
        }
        if (input.texture == undefined) {
            console.error("texture is undefined");
            return;
        }
        // this.init();
    }
    async init() {
        let kind = "texture";
        let source = this.input.texture;
        //url
        if (typeof source == "string") {
            await this.generateTextureByString(source);
        }
        //GPUTexture
        else if (typeof source == "object" && "usage" in source) {
            this.texture = source;
            this._already = true;
        }
        //GPUCopyExternalImageSource
        else if (source instanceof ImageBitmap || source instanceof ImageData || source instanceof HTMLImageElement || source instanceof HTMLVideoElement || source instanceof HTMLCanvasElement || source instanceof OffscreenCanvas || source instanceof VideoFrame) {
            await this.generateTextureByImageSource(source);
        }


        let sampler = this.input.samplerFilter ? this.input.samplerFilter : 'linear';

        this.sampler = this.device.createSampler({
            magFilter: sampler,
            minFilter: sampler,
        });
    }

    destroy() {
        if (this.texture) {
            this.texture.destroy();
            this.texture = undefined as any; } 
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
    /**
     * 
     * @param res 
     */
    async generateTextureByString(res: string) {
        let scope = this;
        let response = await fetch(res);
        let imageBitmap = await createImageBitmap(await response.blob());
        await scope.generateTextureByImageSource(imageBitmap);
        // const response =
        // await new Promise((resolve) => {
        //     resolve(fetch(res));
        // }).then(
        //     async (res) => {
        //         return createImageBitmap(await (res as Response).blob());
        //     },
        //     () => { console.log("未能获取：", res) }
        // ).then(
        //     (imageBitmap) => {
        //         if (!imageBitmap) {
        //             console.log("未能获取,不是imageBitmap格式:", res)
        //             return;
        //         };
        //         scope.generateTextureByImageSource(imageBitmap);
        //     }
        // )
    };
    async generateTextureByImageSource(source: GPUCopyExternalImageSource) {
        let width = 0, height = 0;
        if (source instanceof ImageBitmap || source instanceof ImageData || source instanceof HTMLImageElement || source instanceof HTMLVideoElement || source instanceof HTMLCanvasElement || source instanceof OffscreenCanvas) {
            width = source.width;
            height = source.height;
        }
        else if (source instanceof VideoFrame) {
            width = source.displayWidth;
            height = source.displayHeight;
        }
        let scope = this;

        let premultipliedAlpha = false;
        if (this.input.premultipliedAlpha != undefined)//有input.premultipliedAlpha
            premultipliedAlpha = this.input.premultipliedAlpha;
        else {
            premultipliedAlpha = true;
        }


        this.texture = this.device.createTexture({
            size: [width, height, 1],
            format: 'rgba8unorm',//bgra8unorm
            // mipLevelCount: this.numMipLevels([width, height]),
            // sampleCount: 1,
            // dimension: '2d',
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_SRC | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT
        });
        this.device.queue.copyExternalImageToTexture(
            { source: source, flipY: this._upsideDownY }, //webGPU 的UV从左下角开始，所以需要翻转Y轴。
            { texture: this.texture, premultipliedAlpha: premultipliedAlpha },
            [width, height]
        );
        scope._already = true;
    };
}