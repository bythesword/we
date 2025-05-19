import { lifeState } from "../const/coreConst";
import { BaseTexture, optionBaseTexture, textureType } from "./baseTexture";



export interface optionTexture extends optionBaseTexture {
    /**纹理来源 */
    texture: textureType,
}

export class Texture extends BaseTexture {
    declare input: optionTexture;
    constructor(input: optionTexture, device: GPUDevice) {
        super(input, device);
        //初始化参数
        this.device = device;
        this.input = input;
        if (input.texture == undefined) {
            console.error("texture is undefined");
            return;
        } 
    }
    async init(): Promise<lifeState> {
        let source = this.input.texture;
        //url
        if (typeof source == "string") {
            await this.generateTextureByString(source);
        }
        //GPUTexture
        // else if (typeof source == "object" && "usage" in source) {
        else if (source instanceof GPUTexture) {
            this.texture = source;
            this._already = lifeState.finished;
        }
        //GPUCopyExternalImageSource
        else if (source instanceof ImageBitmap || source instanceof ImageData || source instanceof HTMLImageElement || source instanceof HTMLVideoElement || source instanceof HTMLCanvasElement || source instanceof OffscreenCanvas || source instanceof VideoFrame) {
            await this.generateTextureByImageSource(source);
        }
        return this._already;
    }

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
            format: this.input.format!,
            // format: 'rgba8unorm',//bgra8unorm
            mipLevelCount: this.input.mipmap ? this.numMipLevels([width, height]) : 1,
            // sampleCount: 1,
            // dimension: '2d',
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_SRC | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT
        });
        this.device.queue.copyExternalImageToTexture(
            { source: source, flipY: this._upsideDownY }, //webGPU 的UV从左下角开始，所以需要翻转Y轴。
            { texture: this.texture, premultipliedAlpha: premultipliedAlpha },
            [width, height]
        );
        if (this.texture.mipLevelCount > 1) {
            this.generateMips(this.device, this.texture);
        }
        scope._already = lifeState.finished;
    }

}