import { BaseMaterial, optionBaseMaterial } from "../baseMaterial";
import fragmengCode from "../../shader/sky/cubeSky.fs.wgsl?raw"
import { uniformBufferPart, uniformEntries } from "../../command/baseCommand";

export interface optionCubeSkyMaterial extends optionBaseMaterial {
    cubeTexture: {
        texture: string[],
    },
    samplerFilter?: GPUMipmapFilterMode,
}
interface textures {
    [name: string]: GPUTexture
}



export class CubeSkyMaterial extends BaseMaterial {

    declare input: optionCubeSkyMaterial;
    textures!: textures
    /** cube 天空盒材质，2d array texture */
    skyTexture!: GPUTexture;
    /** cube 的材质数量*/
    countOfTextures!: 6;
    /** 加载完成的数量，动态（异步加载完成的） */
    countOfTexturesOfFineshed!: number;
    /**材质参数 */
    imageWidth!: number;
    /**材质参数 */
    imageHeight!: number;
    /**采样器 */
    sampler!: GPUSampler
    constructor(input: optionCubeSkyMaterial) {
        super(input);
        // this.countOfTextures = 0;
        this.countOfTexturesOfFineshed = 0;
        this._already = false;
        this.textures = {};


        this.sampler = window.weGPUdevice.createSampler({
            magFilter: input.samplerFilter ? input.samplerFilter : 'linear',
            minFilter: input.samplerFilter ? input.samplerFilter : 'linear',
        });

        this.init();
    }

    init() {
        let scope = this;
        let imgSrcs = this.input.cubeTexture.texture;
        let aaa: any[] = [];
        const promises = imgSrcs.map(async (src) => {
            const response = new Promise((resolve, reject) => {
                resolve(fetch(src));
            }).then(
                async (srcR) => {
                    return createImageBitmap(await (srcR as Response).blob());
                },
                () => { console.log("未能获取：", src) }
            );
            aaa.push(response);
        });
        const imageBitmaps1 = Promise.all(aaa).then(imageBitmaps => {
            console.log(imageBitmaps)
            this.skyTexture = window.weGPUdevice.createTexture({
                dimension: '2d',
                // Create a 2d array texture.
                // Assume each image has the same size.
                size: [imageBitmaps[0].width, imageBitmaps[0].height, 6],
                format: 'rgba8unorm',
                usage:
                    GPUTextureUsage.TEXTURE_BINDING |
                    GPUTextureUsage.COPY_DST |
                    GPUTextureUsage.RENDER_ATTACHMENT,
            });
            for (let i = 0; i < imageBitmaps.length; i++) {
                const imageBitmap = imageBitmaps[i];
                window.weGPUdevice.queue.copyExternalImageToTexture(
                    { source: imageBitmap },
                    { texture: scope.skyTexture, origin: [0, 0, i] },
                    [imageBitmap.width, imageBitmap.height]
                );
            }
            scope._already = true;
        }).catch(err => {
            console.log('error', err)
        });



    }
    generateTextureByString(res: string, id: string) {
        let scope = this;
        const response = new Promise((resolve, reject) => {
            resolve(fetch(res));
        }).then(
            async (res) => {
                return createImageBitmap(await (res as Response).blob());
            },
            () => { console.log("未能获取：", res) }
        ).then(
            (imageBitmap) => {
                this.textures[id] = window.weGPUdevice.createTexture({
                    size: [imageBitmap!.width, imageBitmap!.height, 1],
                    format: 'rgba8unorm',
                    usage:
                        GPUTextureUsage.TEXTURE_BINDING |
                        GPUTextureUsage.COPY_DST |
                        GPUTextureUsage.RENDER_ATTACHMENT,
                });
                window.weGPUdevice.queue.copyExternalImageToTexture(
                    { source: imageBitmap as ImageBitmap },
                    { texture: this.textures[id] },
                    [imageBitmap!.width, imageBitmap!.height]
                );
                scope.countOfTexturesOfFineshed++;
                if (scope.countOfTextures == scope.countOfTexturesOfFineshed) {
                    scope._already = true;
                }
            }
        )
            ;
    };
    generateTextureByBitmap(imageBitmap: ImageBitmap, id: string) {
        let scope = this;
        this.textures[id] = window.weGPUdevice.createTexture({
            size: [imageBitmap!.width, imageBitmap!.height, 1],
            format: 'rgba8unorm',
            usage:
                GPUTextureUsage.TEXTURE_BINDING |
                GPUTextureUsage.COPY_DST |
                GPUTextureUsage.RENDER_ATTACHMENT,
        });
        window.weGPUdevice.queue.copyExternalImageToTexture(
            { source: imageBitmap as ImageBitmap },
            { texture: this.textures[id] },
            [imageBitmap!.width, imageBitmap!.height]
        );
        if (scope.countOfTextures == scope.countOfTexturesOfFineshed) {
            scope._already = true;
        }
    };

    getCodeFS() {

        return fragmengCode;
    }

    destroy() {
        this._destroy = true;
    }
    getUniform(): uniformEntries[] {
        let scope = this;
        let phong: uniformEntries[] = [

            {
                binding: 1,
                resource: this.sampler,
            },
            {
                binding: 2,
                resource: this.skyTexture.createView({
                    dimension: 'cube',
                }),
            },
        ];

        return phong;
    }

}