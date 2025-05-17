/**
 * @author TomSong 2025-04-28
 * @description 基础纹理材质
 * @version 0.0.1
 * @requires BaseMaterial.ts
 * @requires textureMaterial.fs.wgsl
 * @requires textureMaterialTransparent.fs.wgsl
 * @requires textureMaterial.vs.wgsl
 * @requires textureMaterialTransparent.vs.wgsl
 * 
 * 基础纹理材质
 * 1、支持基础颜色
 * 2、支持纹理
 * 3、支持透明
 *    A、alphaTest，alpha值（texture)
 *    B、opacity,整体透明度
 */
import { BaseMaterial, optionBaseMaterial, optionTransparentOfMaterial } from "../baseMaterial";
import { uniformEntries } from "../../command/commandDefine";

import textureFS from "../../shader/material/simple/texture.fs.wgsl?raw"
import textureTransparentFS from "../../shader/material/simple/textureTransparent.fs.wgsl?raw"
import { GBuffersRPDAssemble, lifeState, textureAlphaZero } from "../../const/coreConst";
import { optionTextureSource, Texture } from "../../texture/texture";
import { weSamplerKind } from "../../resource/weResource";

export interface optionTexutresKindOfMaterial {
    texture: optionTextureSource | Texture,
    // normal?: optionTextureSource | Texture,
    // specular?: optionTextureSource | Texture,
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
    textures: optionTexutresKindOfMaterial,
    samplerFilter?: GPUMipmapFilterMode,//缺省的采样器过滤模式，默认为linear    
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
        this._already = lifeState.unstart;


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

            if (input.transparent != undefined) {
                this._transparent = input.transparent;
            }
            else {
                this._transparent = transparent;
            }

            if (input.transparent.blend != undefined) {
                this._transparent.blend = input.transparent.blend;
            }
            else {
                this._transparent.blend = transparent.blend;
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
    destroy() {
        for (let key in this.textures) {
            this.textures[key].destroy();
        }
        this.textures = {};
        this._already = lifeState.destroyed;
        this._destroy = true;
    }

    async __init() {
        if (this.input.samplerFilter == undefined) {
            this.sampler = this.scene.resources.sampler[weSamplerKind.linear];//scene的资源管理器中已经创建了sampler
        }
        else {
            this.sampler = this.device.createSampler({
                magFilter: this.input.samplerFilter,
                minFilter: this.input.samplerFilter,
            });
        }
        for (let key in this.input.textures) {
            // let kkk: keyof optionTexutresKindOfMaterial = key;
            let texture = this.input.textures[key as keyof optionTexutresKindOfMaterial]!;
            if (texture instanceof Texture) {
                this.textures[key] = texture;
            }
            else {
                let textureInstace = new Texture(texture, this.device);
                await textureInstace.init();
                this.textures[key] = textureInstace;
            }
            // this.countOfTexturesOfFineshed++;
            this._already = lifeState.finished;
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
        let binding = startBinding;//如果是透明，这个数值在entity的createDCCCForTransparent（）中已经增加了scene的getRenderPassDescriptorOfTransparent（）的binding数量。



        if (this.getTransparent()) {
            code = textureTransparentFS;
            // code += `@group(1) @binding(${binding}) var u_${key}: texture_2d<f32>;\n`;
            let bindingOfTransparent = 1;;
            Object.entries(GBuffersRPDAssemble).forEach(([key, _value]) => {
                if (key != "color") {// 这个与TransparentRender中的getBindGroupOfTextures()的保持一致，使用的是GBuffersRPDAssemble中的顺序。而且都不需要color的数据。
                    if (key == "depth") {
                        code += `@group(1) @binding(${bindingOfTransparent}) var u_depth_opacity : texture_depth_2d ; `;
                    }
                    else if (key == "entityID") {
                        code += `@group(1) @binding(${bindingOfTransparent}) var u_entityID_opacity : texture_2d<u32> ; `;
                    }
                    else {
                        code += `@group(1) @binding(${bindingOfTransparent}) var u_${key}_opacity : texture_2d<f32> ; `;
                    }
                    bindingOfTransparent++;
                }
            });
        }
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
                    // materialColorAdd = `  materialColor=vec4f(0.5);\n        `;//没有透明 。 

                }
                else {
                    materialColorAdd = `  materialColor.a=1.0;\n        `;//没有透明 。 
                    // materialColorAdd = `if( materialColor.a < ${AlphaZero}){ materialColor.a=1.0;}\n        `;//如果没有透明，就需要进行alphaTest比较。 
                }
                materialColor = materialColor + materialColorAdd;
                code = code.replaceAll("$materialColor", materialColor);
            }

        }
        return this.shaderCodeProcess(code);
    }


    getUniform(startBinding: number): uniformEntries[] {
        let binding = startBinding;
        let uniforms: uniformEntries[] = []
        for (let key in this.textures) {
            let sampler;
            if (this.textures[key].sampler != undefined) {//如果纹理中有sampler
                sampler = this.textures[key].sampler;
            }
            else {//如果没有sampler，就使用默认的sampler
                sampler = this.sampler;
            }
            //先是sampler，与getCodeFS()中的对应
            uniforms.push({
                binding: binding++,
                resource: sampler,
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