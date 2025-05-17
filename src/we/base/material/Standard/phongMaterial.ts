/**
 * 基础Bulin-Phong光照模型
 * 1、顶点颜色
 * 2、纹理
 * 3、光照（三种光源）
 * 4、阴影（三种光源）
 * 5、透明：todo
  */
import lightsFS from "../../shader/material/simple/lightsphong.fs.wgsl?raw"

import { PhongColorMaterial, optionPhongColorMaterial } from "./phongColorMaterial";
import { weResourceTexture, weSamplerKind } from "../../resource/weResource";
import { optionTextureSource, Texture, textureType } from "../../texture/texture";
import { uniformEntries } from "../../command/commandDefine";
import { lifeState } from "../../const/coreConst";



/*
* 这个phong模型是PBR的，结果只是近似
*/
export interface optionPhongMaterial extends optionPhongColorMaterial {
    texture?: {
        texture?: optionTextureSource | Texture,
        normalTexture?: optionTextureSource | Texture,
        specularTexture?: optionTextureSource | Texture,
        parallax?: optionTextureSource | Texture,//视差贴图

    },
    samplerFilter?: GPUMipmapFilterMode,
    mipmap?: boolean,
}


export class PhongMaterial extends PhongColorMaterial {

    declare input: optionPhongMaterial;
    textures!: weResourceTexture
    countOfTextures!: number;
    countOfTexturesOfFineshed!: number;
    sampler!: GPUSampler
    constructor(input: optionPhongMaterial) {
        super(input);
        this.countOfTextures = 0;
        this.countOfTexturesOfFineshed = 0;
        this._already = lifeState.unstart;
        this.textures = {};
        if (this.input.texture)
            this.countOfTextures = Object.keys(this.input.texture!).length;

    }


    /** 初始化 ，第二阶段*/
    async __init() {
        if (this.input?.texture) {
            for (let key in this.input.texture) {
                let texture: any = this.input.texture[key as keyof optionPhongMaterial['texture']];
                if (texture instanceof Texture) {
                    this.textures[key] = texture;
                }
                else {
                    // if(key == "normalTexture"){
                    //     if(texture.format == undefined){
                    //         texture.format = 'rgba8unorm';
                    //     }
                    // }
                    // else if(key == "specularTexture"){
                    //     if(texture.format == undefined){
                    //         texture.format = 'rgba8unorm';
                    //     }
                    // }
                    let textureInstace = new Texture(texture, this.device);
                    await textureInstace.init();
                    this.textures[key] = textureInstace;
                }
            }
            this._already = lifeState.finished;
        }
        else {
            this._already = lifeState.finished;
        }
    }


    getCodeFS(startBinding: number) {
        let code = lightsFS;
        let binding = startBinding;

        code = code.replaceAll("$red", this.red.toString());
        code = code.replaceAll("$blue", this.blue.toString());
        code = code.replaceAll("$green", this.green.toString());
        code = code.replaceAll("$alpha", this.alpha.toString());



        let flag_spec = false;
        let flag_texture = false;
        let flag_normal = false;

        // @group(1) @binding(4) var u_Sampler: sampler;
        // @group(1) @binding(5) var u_Texture: texture_2d<f32>;

        //判断texture种类，增加对应贴图，增加一个采样（uniform中，binding 4）
        if (this.countOfTextures > 0) {
            code += ` @group(1) @binding(${binding}) var u_Sampler : sampler; \n `;//这个需要与getUniform(startBinding: number)中的sampler对应，都是在texture之前
            // let binding = 3;
            binding++;
            for (let i in this.textures) {
                if (i == "specularTexture") {
                    flag_spec = true;
                }
                if (i == "texture") {
                    flag_texture = true;
                }
                if (i == "normalTexture") {
                    flag_normal = true;
                }
                code += `@group(1) @binding(${binding}) var u_${i}: texture_2d<f32>;\n`;//u_${i}是texture的名字，指定的三种情况，texture，specularTexture，normalTexture
                binding++;
            }
        }
        //是否有基础纹理，有则使用纹理，没有则使用颜色
        if (code.indexOf("$materialColor") != -1)
            if (flag_texture) {
                code = code.replaceAll("$materialColor", 'materialColor = textureSample(u_texture, u_Sampler, fsInput.uv);\n');
            }
            else {
                code = code.replaceAll("$materialColor", '');
            }

        //是否有高光纹理，有则使用纹理，没有则使用颜色
        if (code.indexOf("spec") != -1)
            if (flag_spec) {
                //这里的u_metalness也需要被使用，否则报错，乘上之后就是金属度的增加
                let specTexture = `let specc= textureSample(u_specularTexture, u_Sampler,  uv).rgb ;
            specularColor  = light_atten_coff * u_bulinphong.metalness *specc*    spec * lightColor;\n`;//spec是高光系数，然后乘以高光纹理，产生高光差异
                // let specTexture = "spec =textureSample(u_specularTexture, u_Sampler,  uv);\n";
                code = code.replaceAll("$spec", specTexture);
            }
            else {
                code = code.replaceAll("$spec", " ");
            }
        //是否有法线纹理，有则使用纹理，没有则使几何体的法线
        if (code.indexOf("$normal") != -1)
            if (flag_normal) {
                let normalTexture = `  normal =textureSample(u_normalTexture, u_Sampler,  uv).rgb;\n
                normal= getNormalFromMap( vNormal ,normal,position, uv);\n`;

                code = code.replaceAll("$normal", normalTexture);
            }
            else {
                code = code.replaceAll("$normal", " ");
            }
        code += `@group(1) @binding(${binding}) var<uniform> u_bulinphong : bulin_phong; \n`





        return this.shaderCodeProcess(code);
    }

    destroy() {
        this._destroy = true;
    }
    getUniform(startBinding: number): uniformEntries[] {
        let scope = this;
        let binding = startBinding;
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
        let phong: uniformEntries[] = []
        if (this.countOfTextures > 0) {
            phong.push({
                binding: binding++,
                resource: this.sampler,
            });
            // let binding = 3;
            for (let i in this.textures) {
                const one = {
                    binding,
                    resource: this.textures[i].texture.createView(),
                };
                phong.push(one);
                binding++;
            }
        }
        phong.push(
            {
                label: "Mesh FS bulin phong",
                binding: binding++,
                size: 4 * 3,
                get: () => {
                    let a = new Float32Array(3);
                    a[0] = scope.input.Shininess as number;
                    a[1] = scope.input.metalness as number;
                    a[2] = scope.input.roughness as number;
                    return a;
                },
            },
        );
        return phong;
    }

}