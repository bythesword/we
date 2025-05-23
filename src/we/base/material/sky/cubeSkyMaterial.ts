import { BaseMaterial, optionBaseMaterial } from "../baseMaterial";
import cubeSky from "../../shader/sky/cubeSky.fs.wgsl?raw"
import { uniformEntries } from "../../command/commandDefine";
import { weSamplerKind } from "../../resource/weResource";
import { lifeState } from "../../const/coreConst";
import { CubeTexture, optionCubeTexture } from "../../texture/cubeTexxture";

interface skyCubeTextureUrl {
    /**
     * cube 天空盒
     * 6个面
     * 顺序：
     * +x,-x,+y,-y,+z,-z 
     * */
    texture: [string, string, string, string, string, string],
}
export interface optionCubeSkyMaterial extends optionBaseMaterial {
    cubeTexture?: skyCubeTextureUrl,
    texture?: optionCubeTexture | CubeTexture,
    samplerFilter?: GPUMipmapFilterMode,
}
 


export class CubeSkyMaterial extends BaseMaterial {
    getBlend(): GPUBlendState | undefined {
        // throw new Error("Method not implemented.");
        return undefined;
    }
    getTransparent(): boolean {
        // throw new Error("Method not implemented.");
        return false;
    }


    declare input: optionCubeSkyMaterial;
    // declare textures!: textures
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
        this._already = lifeState.constructing;
        this.textures = {};


        // this.sampler =  this.device.createSampler({
        //     magFilter: input.samplerFilter ? input.samplerFilter : 'linear',
        //     minFilter: input.samplerFilter ? input.samplerFilter : 'linear',
        // });

        // if (input.scene)
        //     this.init();
    }
    // async readyForGPU() {
    //     await this.init();
    // }

    async __init() {
        let scope = this;

        let aaa: any[] = [];

        if (this.input.texture) {
            if (this.input.cubeTexture instanceof CubeTexture) {
                this.skyTexture = this.input.cubeTexture.texture;
                this._already = lifeState.finished;
                return;
            }
            else {
                let cubeTexture = new CubeTexture(this.input.texture as optionCubeTexture, this.device);
                await cubeTexture.init();
                this.skyTexture = cubeTexture.texture;
                this._already = lifeState.finished;
                return;
            }
        }
        else if (this.input.cubeTexture) {
            let imgSrcs = this.input.cubeTexture.texture;
            imgSrcs.map(async (src) => {
                const response = new Promise((resolve) => {
                    resolve(fetch(src));
                }).then(
                    async (srcR) => {
                        return createImageBitmap(await (srcR as Response).blob());
                    },
                    () => { console.log("未能获取：", src) }
                );
                aaa.push(response);
            });

            Promise.all(aaa).then(imageBitmaps => {
                // console.log(imageBitmaps)
                this.skyTexture = this.device.createTexture({
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
                    this.device.queue.copyExternalImageToTexture(
                        { source: imageBitmap },
                        { texture: scope.skyTexture, origin: [0, 0, i] },
                        [imageBitmap.width, imageBitmap.height]
                    );
                }
                scope._already = lifeState.finished;
            }).catch(err => {
                console.log('error', err)
            });

        }

    }
    // generateTextureByString(res: string, id: string) {
    //     let scope = this;
    //     // const response = 
    //     new Promise((resolve) => {
    //         resolve(fetch(res));
    //     }).then(
    //         async (res) => {
    //             return createImageBitmap(await (res as Response).blob());
    //         },
    //         () => { console.log("未能获取：", res) }
    //     ).then(
    //         (imageBitmap) => {
    //             this.textures[id] = this.device.createTexture({
    //                 size: [imageBitmap!.width, imageBitmap!.height, 1],
    //                 format: 'rgba8unorm',
    //                 usage:
    //                     GPUTextureUsage.TEXTURE_BINDING |
    //                     GPUTextureUsage.COPY_DST |
    //                     GPUTextureUsage.RENDER_ATTACHMENT,
    //             });
    //             this.device.queue.copyExternalImageToTexture(
    //                 { source: imageBitmap as ImageBitmap },
    //                 { texture: this.textures[id] },
    //                 [imageBitmap!.width, imageBitmap!.height]
    //             );
    //             scope.countOfTexturesOfFineshed++;
    //             if (scope.countOfTextures == scope.countOfTexturesOfFineshed) {
    //                 scope._already = lifeState.finished;
    //             }
    //         }
    //     )
    //         ;
    // };
    // generateTextureByBitmap(imageBitmap: ImageBitmap, id: string) {
    //     let scope = this;
    //     this.textures[id] = this.device.createTexture({
    //         size: [imageBitmap!.width, imageBitmap!.height, 1],
    //         format: 'rgba8unorm',
    //         usage:
    //             GPUTextureUsage.TEXTURE_BINDING |
    //             GPUTextureUsage.COPY_DST |
    //             GPUTextureUsage.RENDER_ATTACHMENT,
    //     });
    //     this.device.queue.copyExternalImageToTexture(
    //         { source: imageBitmap as ImageBitmap },
    //         { texture: this.textures[id] },
    //         [imageBitmap!.width, imageBitmap!.height]
    //     );
    //     if (scope.countOfTextures == scope.countOfTexturesOfFineshed) {
    //         scope._already = lifeState.finished;
    //     }
    // };

    getCodeFS(startBinding: number) {
        let binding = startBinding;

        let one = ` @group(1) @binding(${binding}) var mySampler : sampler;`;
        binding++;
        let two = `@group(1) @binding(${binding}) var myTexture : texture_cube < f32>;`
        let code = one + two + cubeSky;
        return this.shaderCodeProcess(code);
    }

    destroy() {
        this._destroy = true;
    }
    getUniform(startBinding: number): uniformEntries[] {
        let binding = startBinding;
        // let scope = this;
        if (this.sampler == undefined) {
            let sampler = this.input.samplerFilter ? this.input.samplerFilter : 'linear';
            if (this.scene.resources.sampler[weSamplerKind.linear]) {
                this.sampler = this.scene.resources.sampler[weSamplerKind[sampler]];
            }
            else {
                this.sampler = this.device.createSampler({
                    magFilter: sampler,
                    minFilter: sampler,
                });
            }
        }
        let phong: uniformEntries[] = [

            {
                binding: binding++,
                resource: this.sampler,
            },
            {
                binding: binding++,
                resource: this.skyTexture.createView({
                    dimension: 'cube',
                }),
            },
        ];

        return phong;
    }

}