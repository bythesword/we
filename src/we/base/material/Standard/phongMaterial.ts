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
import { optionTexture, Texture } from "../../texture/texture";
import { uniformEntries } from "../../command/commandDefine";
import { lifeState } from "../../const/coreConst";
import { inverse } from "wgpu-matrix/dist/2.x/vec2-impl";

export interface optionParallaxTexture extends optionTexture {
    scale?: number,//视差贴图的缩放,默认是0.1
    layers?: number,//视差贴图的层数,默认是10
}

/*
* 这个phong模型是PBR的，结果只是近似
*/
export interface optionPhongMaterial extends optionPhongColorMaterial {
    texture?: {
        texture?: optionTexture | Texture,
        normalTexture?: optionTexture | Texture,
        specularTexture?: optionTexture | Texture,
        parallaxTexture?: optionParallaxTexture,//视差贴图
    },
}


export class PhongMaterial extends PhongColorMaterial {

    declare input: optionPhongMaterial;
    declare textures: weResourceTexture;


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
        if (this.input.texture?.parallaxTexture) {
            // if (this.input.texture.parallaxTexture.layers == undefined) {
            //     this.input.texture.parallaxTexture.layers = 10;
            // }
            this.countOfTextures++;
        }
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
        let flag_parallax = false;

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
                if (i == "parallaxTexture") {
                    flag_parallax = true;
                }
                code += `@group(1) @binding(${binding}) var u_${i}: texture_2d<f32>;\n`;//u_${i}是texture的名字，指定的三种情况，texture，specularTexture，normalTexture
                binding++;
            }
        }

        //是否有基础纹理，有则使用纹理，没有则使用颜色
        if (code.indexOf("$materialColor") != -1) {
            if (flag_texture) {
                if (flag_parallax && flag_normal) {
                    let parallaxTexture = ` 
                    let TBN=getTBN(fsInput.normal,fsInput.worldPosition,fsInput.uv);
                    let invertTBN=transpose(TBN );
                    //todo:20250521
                    //这个有噪点问题和高度scale的关系，其实也就是插值与采样的颗粒度问题，目前是128layer，太高了
                    //还有： 视角切顶现象,和height scale的比例有关(比例需要适合，否则有问题)。这个需要有时间仔细看了
                     let viewDir= normalize( defaultCameraPosition- fsInput.worldPosition);//这里的viewDir应该是TBN空间内的，但使用TBN（下面的）有问题，变形+偏移
                     //下面三个都会产生摄像机移动，顶点移动
                     //let viewDir=normalize( invertTBN*normalize( defaultCameraPosition- fsInput.worldPosition));
                    //  let viewDir= normalize(invertTBN*defaultCameraPosition);//这里的TBN是通过偏导数求得,故TBN空间内摄像机位置较为方向
                    //  let viewDir= normalize(invertTBN*defaultCameraPosition-invertTBN*fsInput.worldPosition);//todo,纹理产生了较大便宜，不应该的
                    `;
                    if (this.input.texture!.parallaxTexture!.layers) {
                        parallaxTexture += `uv = parallax_occlusion(fsInput.uv, viewDir, u_bulinphong.parallaxScale,u_parallaxTexture, u_Sampler);\n`;
                    }
                    else {
                        parallaxTexture += ` uv = ParallaxMappingBase(fsInput.uv, viewDir, u_bulinphong.parallaxScale,u_parallaxTexture, u_Sampler);\n`;
                    }
                    parallaxTexture += `
                    if(uv.x > 1.0 || uv.y > 1.0 || uv.x < 0.0 || uv.y < 0.0){
                            discard;
                       }                   
                    materialColor = textureSample(u_texture, u_Sampler, uv);\n`;
                    code = code.replaceAll("$materialColor", parallaxTexture);
                }
                else {
                    code = code.replaceAll("$materialColor", 'materialColor = textureSample(u_texture, u_Sampler, fsInput.uv);\n');
                }
            }
            else {
                code = code.replaceAll("$materialColor", '');
            }
        }
                //是否有法线纹理，有则使用纹理，没有则使几何体的法线
        if (code.indexOf("$normal") != -1)
            if (flag_normal) {
                let normalTexture = ` let  normalMap =textureSample(u_normalTexture, u_Sampler,  uv).rgb;
               normal= getNormalFromMap( normal ,normalMap,fsInput.worldPosition, uv);
            //    normal.x=-normal.x;//todo,不明原因，需要翻转,应该时TBN的问题，待查
            //    normal.y=-normal.y;//todo,不明原因，需要翻转,应该时TBN的问题，待查
                `;


                code = code.replaceAll("$normal", normalTexture);
            }
            else {
                code = code.replaceAll("$normal", " ");
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
        let parallarScale = 0.1;
        if (this.input.texture?.parallaxTexture) {
            if (this.input.texture.parallaxTexture.scale)
                parallarScale = this.input.texture.parallaxTexture.scale ? this.input.texture.parallaxTexture.scale : 0.1;
        }
        phong.push(
            {
                label: "Mesh FS bulin phong",
                binding: binding++,
                size: 4 * 4,
                get: () => {
                    let a = new Float32Array(4);
                    a[0] = scope.input.Shininess as number;
                    a[1] = scope.input.metalness as number;
                    a[2] = scope.input.roughness as number;
                    a[3] = parallarScale;
                    return a;
                },
            },
        );
        return phong;
    }

}