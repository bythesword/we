/**
 * 基础纹理材质
 * 1、支持基础颜色
 * 2、支持纹理
 * 3、支持透明
 *    A、alphaTest，alpha值（texture)
 *    B、opacity,整体透明度
 */
import { BaseMaterial, optionBaseMaterial, optionTransparentOfMaterial } from "../baseMaterial";
import { uniformEntries } from "../../command/commandDefine";
import { weResourceTexture, weSamplerKind } from "../../resource/weResource";

import textureFS from "../../shader/material/simple/texture.fs.wgsl?raw"
import { textureAlphaZero } from "../../const/coreConst";
import { textureType } from "../../texture/texture";


/**
 * 纹理材质的初始化参数
 * 
 * 1、texture：纹理
 * 
 * 2、samplerFilter：采样器过滤模式，默认为linear
 * 
 * 3、mipmap：是否生成mipmap，默认为true
 * 
 * 4、premultipliedAlpha：是否预乘alpha，默认为true,只有在有透明的情况下有效。
 * 
 * 5、upsideDownY：是否上下翻转Y轴，默认为true
 */
export interface optionTextureMaterial extends optionBaseMaterial {
    /**纹理参数 */
    texture: {
        texture?: textureType,
        // normalTexture?: textureType,
        // specularTexture?: textureType,
    },
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
}

export class TextureMaterial extends BaseMaterial {

    sampler!: GPUSampler;
    declare input: optionTextureMaterial;
    /**是否上下翻转Y轴 */
    _upsideDownY: boolean;
    /**纹理收集器 */
    textures!: weResourceTexture;
    /**纹理数量 */
    countOfTextures!: number;
    /**自增，纹理加载计算器 */
    countOfTexturesOfFineshed!: number;


    constructor(input: optionTextureMaterial) {
        super(input);
        this.textures = {};
        this.countOfTextures = 0;
        this.countOfTexturesOfFineshed = 0;
        if (this.input.texture)
            this.countOfTextures = Object.keys(this.input.texture!).length;
        this._already = false;

        if (input.samplerFilter == undefined) {
            input.samplerFilter = 'linear';
        }
        //是否上下翻转Y轴
        this._upsideDownY = true;
        if (input.upsideDownY != undefined) {
            this._upsideDownY = input.upsideDownY;
        }
        if (input.transparent != undefined) {// && this.input.transparent.opacity != undefined && this.input.transparent.opacity < 1.0)) {//如果是透明的，就设置为透明

            //默认混合
            let transparent: optionTransparentOfMaterial = {
                blend: {
                    color: {
                        srcFactor: "src-alpha",//源
                        dstFactor: "one-minus-src-alpha",//目标
                        operation: "add"//操作
                    },
                    alpha: {
                        srcFactor: "one",//源
                        dstFactor: "one-minus-src-alpha",//目标
                        operation: "add"//操作  
                    }
                }
            };
            //如果有设置，就使用设置的
            if (input.transparent.blend != undefined) {
                this._transparent = transparent;
            }
            else {
                this._transparent = input.transparent;
            }
            if (input.transparent.alphaTest == undefined && input.transparent.opacity == undefined) {//如果没有设置alphaTest,且没有opacity，就设置为0.0
                this._transparent.alphaTest = 0.0;//直接使用texture的alpha，（因为有其他alpha的半透明）；就是不做任何处理。
            }
            else if (input.transparent.alphaTest != undefined && input.transparent.opacity == undefined) {//如果有设置alphaTest，就设置为alphaTest
                this._transparent.alphaTest = input.transparent.alphaTest;//FS 中使用的是alphaTest对应texture的alpha进行比较，小于阈值的= 0.0，大于阈值的不变（因为有可能有大于阈值的半透明）
            }
            else if (input.transparent.alphaTest == undefined && input.transparent.opacity != undefined) {//如果没有设置alphaTest，就设置为opacity
                // this._transparent.alphaTest = input.transparent.opacity;
                this._transparent.opacity = input.transparent.opacity;//FS code中使用的是opacity，而不是alphaTest
            }

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
    /**
     * 获取FS code
     * 
     * 1、FS code中，需要根据texture的数量，为每个texture分配binding：sampler，texture。
     * 
     * 2、FS code中，需要根据texture的数量，对materialColor进行。
     * 
     * 3、FS code中，需要根据texture的数量，为FS code 分配uniform。
     * 
     * @param startBinding 从这个位置开始，为这个材质的所有texture分配binding。
     * @returns 返回FS  code
     */
    getCodeFS(startBinding: number): string {
        let AlphaZero = textureAlphaZero;
        let code = textureFS;
        let binding = startBinding;

        code = code.replaceAll("$red", this.red.toString());
        code = code.replaceAll("$blue", this.blue.toString());
        code = code.replaceAll("$green", this.green.toString());
        code = code.replaceAll("$alpha", this.alpha.toString());



        // @group(1) @binding(4) var u_Sampler: sampler;
        // @group(1) @binding(5) var u_Texture: texture_2d<f32>;

        //这个需要与getUniform(startBinding: number)中的sampler对应，都是在texture之前
        code += ` @group(1) @binding(${binding}) var u_Sampler : sampler; \n `;
        binding++;
        //u_texture是texture的名字，
        code += `@group(1) @binding(${binding}) var u_texture: texture_2d<f32>;\n`;

        //materialColor 替换字符串
        let materialColor = `materialColor = textureSample(u_texture, u_Sampler, fsInput.uv );\n        `;

        let materialColorAdd = '';
        if (this._transparent) {//如果存在透明，就需要进行alphaTest比较或者opacity的预乘
            if (this._transparent?.alphaTest == 0.0) {
                materialColorAdd = `if( materialColor.a < ${AlphaZero}){discard;}\n        `;//如果alphaTest=0.0，就直接丢弃。
            }
            else if (this._transparent?.alphaTest != undefined) {
                materialColorAdd = `if( materialColor.a < ${this._transparent.alphaTest}){discard;}\n  `;//如果alphaTest!=0.0，就使用alphaTest进行比较,关于预乘：在纹理加载时就决定了是否进行预乘，默认时进行预乘。
            }
            else if (this._transparent?.opacity != undefined) {
                materialColorAdd = `materialColor = materialColor* ${this._transparent.opacity};\n        `;//如果opacity!=0.0，就使用opacity进行再次的预乘。 alpha也会被预乘，透明度进一步降低。
            }
        }
        else {
            materialColorAdd = `if( materialColor.a < ${AlphaZero}){ materialColor.a=1.0;}\n        `;//如果没有透明，就需要进行alphaTest比较。 
        }
        materialColor = materialColorAdd + materialColor;
        code = code.replaceAll("$materialColor", materialColor);


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
        if (this._transparent) {
            return true;
        }
        else return false;
    }

    getBlend(): GPUBlendState | undefined {
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
                //预乘值设置
                let premultipliedAlpha = false;
                if (this._transparent != undefined) {//有混合
                    if (this.input.premultipliedAlpha != undefined)//有input.premultipliedAlpha
                        premultipliedAlpha = this.input.premultipliedAlpha;
                    else {
                        premultipliedAlpha = true;
                    }
                }

                this.textures[id] = this.device.createTexture({
                    size: [imageBitmap!.width, imageBitmap!.height, 1],
                    format: 'rgba8unorm',
                    usage:
                        GPUTextureUsage.TEXTURE_BINDING |
                        GPUTextureUsage.COPY_DST |
                        GPUTextureUsage.RENDER_ATTACHMENT,
                });
                this.device.queue.copyExternalImageToTexture(
                    { source: imageBitmap as ImageBitmap, flipY: this._upsideDownY },//webGPU 的UV从左下角开始，所以需要翻转Y轴。
                    { texture: this.textures[id], premultipliedAlpha: premultipliedAlpha },
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