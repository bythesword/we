import { RootOfGPU } from "../scene/root";

//todo:20241126,还有多种组合模式，等待扩展
export enum weSamplerKind {
    nearest,
    linear
}
export type weResourceSampler = {
    [name in weSamplerKind]: GPUSampler;
};

export interface weResourceBuffer {
    [name: string]: GPUBuffer
}

export interface weResourceTexture {
    [name: string]: GPUTexture
}

export interface weResourceImageBitmap {
    [name: string]: ImageBitmap
}


export class WeResource extends RootOfGPU {
    
    sampler!: weResourceSampler;
    buffers: weResourceBuffer;
    textures: weResourceTexture;
    images: weResourceImageBitmap;

    constructor(scene: any) {
        super();
        // this.setRootDevice(device);
        this.setRootENV(scene);
        this.createSampler();
        this.buffers = {};
        this.textures = {};
        this.images = {};

    } 
    createSampler() {
        this.sampler = {
            0: this.device.createSampler({
                label:"WE scene resource sampler : nearest",
                magFilter: 'nearest',
                minFilter: 'nearest',
            }),
            1: this.device.createSampler({
                label:"WE scene resource sampler : linear",
                magFilter: 'linear',
                minFilter: 'linear',
            }),
        };
        // this.sampler[weSamplerKind.linear] = this.device.createSampler({
        // magFilter: 'linear',
        //     minFilter: 'linear',
        // });
        // this.sampler[weSamplerKind.nearest] = this.device.createSampler({
        //     magFilter: "nearest",
        //     minFilter: "nearest",
        // });
    }
    addBuffer(name: string, target: GPUBuffer) {
        this.buffers[name] = target;
    }
    addTexture(name: string, target: GPUTexture) {
        this.textures[name] = target;
    }
    addImage(name: string, target: ImageBitmap) {
        this.images[name] = target;
    }

    destroy(){

    }

}