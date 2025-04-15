/**
 * 基础纹理材质
 * 1、支持基础颜色
 * 2、支持纹理
 * 3、支持透明
 *    A、alphaTest，alpha值（texture)
 *    B、opacity,整体透明度
 */
import { fromAxisAngle } from "wgpu-matrix/dist/2.x/quat-impl";
import { BaseMaterial, optionBaseMaterial, textureType } from "../baseMaterial";
import { uniformEntries } from "../../command/commandDefine";
import { weResourceTexture, weSamplerKind } from "../../resource/weResource";

import textureFS from "../../shader/material/simple/texture.fs.wgsl?raw"

export interface optionTextureMaterial extends optionBaseMaterial {
    texture: {
        texture?: textureType,
        // normalTexture?: textureType,
        // specularTexture?: textureType,
    },
    samplerFilter?: GPUMipmapFilterMode,
    mipmap?: boolean,
}

export class TextureMaterial extends BaseMaterial {
    getBlend(): GPUBlendState | undefined {
        throw new Error("Method not implemented.");
    }
    sampler!: GPUSampler;
    declare input: optionTextureMaterial;

    textures!: weResourceTexture;
    countOfTextures!: number;
    countOfTexturesOfFineshed!: number;
    constructor(input: optionTextureMaterial) {
        super(input);
        if (input.samplerFilter == undefined) {
            input.samplerFilter = 'linear';
        }
    }
    async __init() {
        if (this.input.texture) {
            let texture = this.input.texture;
            if (texture.texture) {
                let kind = "texture";
                let source = texture.texture;
                //url
                if (typeof texture.texture == "string") {
                    this.generateTextureByString(texture.texture, kind);
                }
                //GPUTexture
                else if (typeof texture.texture == "object" && "usage" in texture.texture) {
                    this.textures.texture = texture.texture;
                    this.countOfTexturesOfFineshed++;
                    if (this.countOfTextures == this.countOfTexturesOfFineshed) {
                        this._already = true;
                    }
                }
                //GPUCopyExternalImageSource
                else if (source instanceof ImageBitmap || source instanceof ImageData || source instanceof HTMLImageElement || source instanceof HTMLVideoElement || source instanceof HTMLCanvasElement || source instanceof OffscreenCanvas || source instanceof VideoFrame) {
                    this.generateTextureByImageSource(texture.texture, kind);
                }
            }
            // if (texture.specularTexture) {
            //     let kind = "specularTexture";
            //     let source = texture.specularTexture;

            //     if (typeof texture.specularTexture == "string") {
            //         this.generateTextureByString(texture.specularTexture, kind);
            //     }
            //     else if (typeof texture.specularTexture == "object" && "usage" in texture.specularTexture) {
            //         this.textures.specularTexture = texture.specularTexture;
            //         this.countOfTexturesOfFineshed++;
            //         if (this.countOfTextures == this.countOfTexturesOfFineshed) {
            //             this._already = true;
            //         }
            //     }
            //     else if (source instanceof ImageBitmap || source instanceof ImageData || source instanceof HTMLImageElement) {
            //         this.generateTextureByImageSource(texture.specularTexture, kind);
            //     }
            // }
            // if (texture.normalTexture) {
            //     let kind = "normalTexture";
            //     let source = texture.normalTexture;

            //     if (typeof texture.normalTexture == "string") {
            //         this.generateTextureByString(texture.normalTexture, kind);
            //     }
            //     else if (typeof texture.normalTexture == "object" && "usage" in texture.normalTexture) {
            //         this.textures.normalTexture = texture.normalTexture;
            //         this.countOfTexturesOfFineshed++;
            //         if (this.countOfTextures == this.countOfTexturesOfFineshed) {
            //             this._already = true;
            //         }
            //     }
            //     else if (source instanceof ImageBitmap || source instanceof ImageData || source instanceof HTMLImageElement) {
            //         this.generateTextureByImageSource(texture.normalTexture, kind);
            //     }
            // }
        }
        else {
            this._already = true;
        }
    }
    getCodeFS(startBinding: number) {
        let code = textureFS;
        let binding = startBinding;

        code = code.replaceAll("$red", this.red.toString());
        code = code.replaceAll("$blue", this.blue.toString());
        code = code.replaceAll("$green", this.green.toString());
        code = code.replaceAll("$alpha", this.alpha.toString());



        // @group(1) @binding(4) var u_Sampler: sampler;
        // @group(1) @binding(5) var u_Texture: texture_2d<f32>;


        code += ` @group(1) @binding(${binding}) var u_Sampler : sampler; \n `;//这个需要与getUniform(startBinding: number)中的sampler对应，都是在texture之前
        binding++;
        code += `@group(1) @binding(${binding}) var u_texture: texture_2d<f32>;\n`;//u_texture是texture的名字，
        code = code.replaceAll("$materialColor", 'materialColor = textureSample(u_texture, u_Sampler, fsInput.uv);\n');


        code += `@group(1) @binding(${binding}) var<uniform> u_bulinphong : bulin_phong; \n`
        return this.shaderCodeProcess(code);
    }

    destroy() {
        this._destroy = true;
    }
    getUniform(startBinding: number): uniformEntries[] {
        let scope = this;
        let binding = startBinding;
        //sampler初始化
        if (this.sampler == undefined) {
            let sampler = this.input.samplerFilter ? this.input.samplerFilter : 'linear';
            if (this.scene.resources.sampler[weSamplerKind[sampler]]) {
                this.sampler = this.scene.resources.sampler[weSamplerKind[sampler]];
            }
            else {
                this.sampler = this.device.createSampler({
                    magFilter: sampler,
                    minFilter: sampler,
                });
            }
        }
        let uniforms: uniformEntries[] = []
        if (this.countOfTextures > 0) {
            //先是sampler，与getCodeFS()中的对应
            uniforms.push({
                binding: binding++,
                resource: this.sampler,
            });

            // 然后是texture，与getCodeFS()中的对应。这里只有一个texture，所以直接写死了。如果有多个texture，就需要循环写入
            const one = {
                binding: binding++,
                resource: this.textures.texture.createView(),
            };
            uniforms.push(one);


        }

        return uniforms;
    }

    getTransparent(): boolean {
        throw new Error("Method not implemented.");
    }


    generateTextureByString(res: string, id: string) {

        // new Promise((resolve, reject) => {
        //     console.log("1:")
        //     resolve(fetch("50x50.jpg"));
        //   }).then(
        //     async (res) => {
        //       console.log("2:")
        //       return createImageBitmap(await res.blob());
        //     },
        //     () => {},
        //   ).then(
        //     (res)=>{
        //       console.log(typeof res.width)
        //     }    )
        //     ;
        let scope = this;
        // const response =
        new Promise((resolve) => {
            resolve(fetch(res));
        }).then(
            async (res) => {
                return createImageBitmap(await (res as Response).blob());
            },
            () => { console.log("未能获取：", res) }
        ).then(
            (imageBitmap) => {
                this.textures[id] = this.device.createTexture({
                    size: [imageBitmap!.width, imageBitmap!.height, 1],
                    format: 'rgba8unorm',
                    usage:
                        GPUTextureUsage.TEXTURE_BINDING |
                        GPUTextureUsage.COPY_DST |
                        GPUTextureUsage.RENDER_ATTACHMENT,
                });
                this.device.queue.copyExternalImageToTexture(
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
    generateTextureByImageSource(source: GPUCopyExternalImageSource, id: string) {
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
        this.textures[id] = this.device.createTexture({
            size: [width, height, 1],
            format: 'rgba8unorm',
            usage:
                GPUTextureUsage.TEXTURE_BINDING |
                GPUTextureUsage.COPY_DST |
                GPUTextureUsage.RENDER_ATTACHMENT,
        });
        this.device.queue.copyExternalImageToTexture(
            { source: source },
            { texture: this.textures[id] },
            [width, height]
        );
        if (scope.countOfTextures == scope.countOfTexturesOfFineshed) {
            scope._already = true;
        }
    };

}