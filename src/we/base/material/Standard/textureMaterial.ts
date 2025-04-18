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
import { optionTextureSource, Texture, textureType } from "../../texture/texture";

export interface optionTexutresKindOfMaterial {
    texture?: optionTextureSource,
    normal?: optionTextureSource,
    specular?: optionTextureSource,
}
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
    textures: optionTexutresKindOfMaterial
}

export class TextureMaterial extends BaseMaterial {

    sampler!: GPUSampler;
    declare input: optionTextureMaterial;
    // /**是否上下翻转Y轴 */
    // _upsideDownY: boolean;
    /**纹理收集器 */
    textures!: {
        [name: string]: Texture
    };
    /**纹理数量 */
    countOfTextures!: number;
    /**自增，纹理加载计算器 */
    countOfTexturesOfFineshed!: number;


    constructor(input: optionTextureMaterial) {
        super(input);
        this.textures = {};
        this.countOfTextures = 0;
        this.countOfTexturesOfFineshed = 0;
        if (input.textures)
            this.countOfTextures = Object.keys(input.textures!).length;
        this._already = false;

        // if (input.samplerFilter == undefined) {
        //     input.samplerFilter = 'linear';
        // }
        //是否上下翻转Y轴
        // this._upsideDownY = true;
        // if (input.upsideDownY != undefined) {
        //     this._upsideDownY = input.upsideDownY;
        // }
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
        for (let key in this.input.textures) {
            // let kkk: keyof optionTexutresKindOfMaterial = key;
            let texture = this.input.textures[key as keyof optionTexutresKindOfMaterial]!;
            let textureInstace = new Texture(texture, this.device);
            this.textures[key] = textureInstace;
            await textureInstace.init();
            // this.countOfTexturesOfFineshed++;
            this._already = true;
        }
        //ok
        // if (this.input.textures) {
        //     if (this.input.textures.texture) {
        //         let texture = this.input.textures.texture;
        //         let textureInstace = new Texture(texture, this.device);
        //         this.textures["texture"] = textureInstace;
        //         await textureInstace.init();
        //         this._already = true;
        //     }
        // }



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

        if (code.indexOf("$red")) code = code.replaceAll("$red", this.red.toString());
        if (code.indexOf("$blue")) code = code.replaceAll("$blue", this.blue.toString());
        if (code.indexOf("$green")) code = code.replaceAll("$green", this.green.toString());
        if (code.indexOf("$alpha")) code = code.replaceAll("$alpha", this.alpha.toString());

        for (let key in this.textures) {
            if (key == "texture") {//如果是texture，就使用$materialColor，否则使用$materialColor_${key}
                //这个需要与getUniform(startBinding: number)中的sampler对应，都是在texture之前
                code += ` @group(1) @binding(${binding}) var u_Sampler : sampler; \n `;
                binding++;
                //u_texture是texture的名字，
                code += `@group(1) @binding(${binding}) var u_${key}: texture_2d<f32>;\n`;

                //materialColor 替换字符串
                let materialColor = `materialColor = textureSample(u_${key}, u_Sampler, fsInput.uv );\n`;

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
                materialColor = materialColor + materialColorAdd;
                code = code.replaceAll("$materialColor", materialColor);
            }

        }
        return this.shaderCodeProcess(code);
    }

    destroy() {
        this._destroy = true;
    }
    getUniform(startBinding: number): uniformEntries[] {
        let scope = this;
        let binding = startBinding;
        let uniforms: uniformEntries[] = []
        for (let key in this.textures) {

            //先是sampler，与getCodeFS()中的对应
            uniforms.push({
                binding: binding++,
                resource: this.textures[key].sampler,
            });
            // 然后是texture，与getCodeFS()中的对应。这里只有一个texture，所以直接写死了。如果有多个texture，就需要循环写入
            uniforms.push({
                binding: binding++,
                resource: this.textures[key].texture.createView(),
            });
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
        return this._transparent?.blend;
    }



}