import { lifeState } from "../const/coreConst";
import { BaseTexture, optionBaseTexture, textureType } from "./baseTexture";

/**
 * copy模式简单，可以mipmap
 * external模式，速度快，没有mipmap
 */
type modelOfVideo = "copy" | "External";
export interface optionVideoTexture extends optionBaseTexture {
    // video: textureType;
    texture: textureType,
    loop?: boolean,
    // autoplay?: boolean,//默认必须的
    muted?: boolean,
    controls?: boolean,
    waitFor?: "canplaythrough" | "loadedmetadata",
    model?: modelOfVideo,
}

export class VideoTexture extends BaseTexture {

    model: modelOfVideo = "copy";
    declare input: optionVideoTexture;
    declare texture: GPUTexture | GPUExternalTexture;
    width!: number;
    height!: number;
    premultipliedAlpha!: boolean;
    video!: HTMLVideoElement | HTMLCanvasElement | OffscreenCanvas | VideoFrame;
    constructor(input: optionVideoTexture, device: GPUDevice) {
        super(input, device);
        this.input = input;
        if (input.model) {
            this.model = input.model;
        }
        if (input.texture instanceof VideoFrame) {
            this.model = "External";
        }
    }


    async init(): Promise<lifeState> {
        let source = this.input.texture;
        this._already = lifeState.initializing;
        //url
        if (typeof source == "string") {
            this._already = await this.generateTextureByString(source);
        }
        //GPUTexture
        // else if (typeof source == "object" && "usage" in source) {
        else if (source instanceof GPUTexture) {
            this.texture = source;
            this._already = lifeState.finished;
        }
        //GPUCopyExternalImageSource
        else if (source instanceof HTMLVideoElement || source instanceof HTMLCanvasElement || source instanceof OffscreenCanvas || source instanceof VideoFrame) {
            this._already = await this.generateTextureBySource(source);
        }
        // else if (source instanceof VideoFrame) {
        // }
        else {
            console.warn("texture init error");
        }

        return this._already;
    }


    async generateTextureByString(res: string): Promise<lifeState> {
        let scope = this;
        let options = this.input;

        const video = document.createElement("video");
        video.crossOrigin = "anonymous";
        video.src = res;
        video.muted = options.muted ?? true;
        video.loop = options.loop ?? true;
        // video.autoplay =  true;  //这个必须

        await video.play();

        //OK
        // video.autoplay =  true;  //这个必须
        // await new Promise((resolve) => {
        //     video.onloadedmetadata = resolve;
        //     video.onerror = () => {
        //         throw new Error(`Video loading error: ${video.error?.message}`);
        //     };
        // });

        // 确保视频可以播放，这个也是必须
        // if (video.readyState < 2) {
        //     await new Promise((resolve) => {
        //         video.oncanplay = resolve;
        //     });
        // }
        // if (video.autoplay)
        //     video.play();


        let ready = await scope.generateTextureBySource(video);
        return ready;
    }

    async generateTextureBySource(source: GPUCopyExternalImageSource): Promise<lifeState> {
        let width = 0, height = 0;
        if (source instanceof HTMLVideoElement) {
            width = source.videoWidth;
            height = source.videoHeight;
            this.video = source;
        }
        else if (source instanceof VideoFrame) {
            width = source.displayWidth;
            height = source.displayHeight;
        }
        else if (source instanceof HTMLCanvasElement || source instanceof OffscreenCanvas) {
            width = source.width;
            height = source.height;
            this.video = source;
        }

        if (width == 0 || height == 0) {
            console.warn("texture init error");
            return lifeState.unstart;
        }
        this.width = width;
        this.height = height;

        let premultipliedAlpha = false;
        if (this.input.premultipliedAlpha != undefined)//有input.premultipliedAlpha
            premultipliedAlpha = this.input.premultipliedAlpha;
        else {
            premultipliedAlpha = true;
        }
        this.premultipliedAlpha = premultipliedAlpha;
        if (this.model == "copy" || source instanceof HTMLCanvasElement || source instanceof OffscreenCanvas) {
            this.texture = this.device.createTexture({
                size: [width, height, 1],
                format: this.input.format!,
                // format: 'rgba8unorm',//bgra8unorm
                mipLevelCount: this.input.mipmap ? this.numMipLevels([width, height]) : 1,
                // sampleCount: 1,
                // dimension: '2d',
                usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_SRC | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT
            });


        }
        else {
            if (source instanceof HTMLVideoElement || source instanceof VideoFrame)
                this.texture = this.device.importExternalTexture({ source })
        }
        // this.device.queue.copyExternalImageToTexture(
        //     { source: source, flipY: this._upsideDownY }, //webGPU 的UV从左下角开始，所以需要翻转Y轴。
        //     { texture: this.texture, premultipliedAlpha: premultipliedAlpha },
        //     [width, height]
        // );
        // if (this.texture.mipLevelCount > 1) {
        //     this.generateMips(this.device, this.texture);
        // }
        this._already = lifeState.finished;
        return this._already;
    }
    getExternalTexture(scopy:any): GPUBindingResource {
        let source: HTMLVideoElement | VideoFrame = scopy.video as HTMLVideoElement | VideoFrame ;
        // if (source instanceof HTMLVideoElement || source instanceof VideoFrame)
        return scopy.device.importExternalTexture({ source: source })

    }
    update(): void {
        super.update();
        let source = this.video;
        if (this.model == "copy" || source instanceof HTMLCanvasElement || source instanceof OffscreenCanvas) {
            this.device.queue.copyExternalImageToTexture(
                { source: source, flipY: this._upsideDownY }, //webGPU 的UV从左下角开始，所以需要翻转Y轴。
                { texture: this.texture as GPUTexture, premultipliedAlpha: this.premultipliedAlpha },
                [this.width, this.height]
            );
            if ((this.texture as GPUTexture).mipLevelCount > 1) {
                this.generateMips(this.device, this.texture as GPUTexture);
            }
        }
        else {
            if (source instanceof HTMLVideoElement || source instanceof VideoFrame)
                this.texture = this.device.importExternalTexture({ source })
        }

    }
}