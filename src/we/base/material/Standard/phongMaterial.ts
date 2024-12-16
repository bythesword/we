
import lightsFS from "../../shader/material/simple/lightsphong.fs.wgsl?raw"
import { uniformEntries } from "../../command/baseCommand";
import { PhongColorMaterial, optionPhongColorMaterial } from "./phongColorMaterial";
import { weSamplerKind } from "../../resource/weResource";
import { optionBaseMaterialStep2 } from "../baseMaterial";

export type textureType = ImageBitmap | string | GPUTexture;
/*
* 这个phong模型是PBR的，结果只是近似
*/
export interface optionPhongMaterial extends optionPhongColorMaterial {
    texture?: {
        texture?: textureType,
        normalTexture?: textureType,
        specularTexture?: textureType,

    },
    samplerFilter?: GPUMipmapFilterMode,
}
interface textures {
    [name: string]: GPUTexture
}

export class PhongMaterial extends PhongColorMaterial {

    declare input: optionPhongMaterial;
    textures!: textures
    countOfTextures!: number;
    countOfTexturesOfFineshed!: number;
    // {
    //     texture: GPUTexture,
    //     normalTexture: GPUTexture,
    //     specularTexture: GPUTexture,
    // }
    sampler!: GPUSampler
    constructor(input?: optionPhongMaterial) {
        super(input);
        this.countOfTextures = 0;
        this.countOfTexturesOfFineshed = 0;
        this._already = false;
        this.textures = {};
        if (this.input.texture)
            this.countOfTextures = Object.keys(this.input.texture!).length;
        // if (this.countOfTextures > 0) {
        //     this.sampler = this.device.createSampler({
        //         magFilter: 'linear',
        //         minFilter: 'linear',
        //     });
        // }

        // if (input?.scene)
        //     this.init();
    }
    // async readyForGPU() {
    //     await this.init();
    // }

    async __init() {
        if (this.input?.texture) {
            let texture = this.input.texture;
            if (texture.texture) {
                let kind = "texture";
                if (typeof texture.texture == "string") {
                    this.generateTextureByString(texture.texture, kind);
                }
                else if (typeof texture.texture == "object" && "usage" in texture.texture) {
                    this.textures.texture = texture.texture;
                    this.countOfTexturesOfFineshed++;
                    if (this.countOfTextures == this.countOfTexturesOfFineshed) {
                        this._already = true;
                    }
                }
                else if (typeof texture.texture == "object" && "width" in texture.texture) {
                    this.generateTextureByBitmap(texture.texture as ImageBitmap, kind);
                }
            }
            if (texture.specularTexture) {
                let kind = "specularTexture";
                if (typeof texture.specularTexture == "string") {
                    this.generateTextureByString(texture.specularTexture, kind);
                }
                else if (typeof texture.specularTexture == "object" && "usage" in texture.specularTexture) {
                    this.textures.specularTexture = texture.specularTexture;
                    this.countOfTexturesOfFineshed++;
                    if (this.countOfTextures == this.countOfTexturesOfFineshed) {
                        this._already = true;
                    }
                }
                else if (typeof texture.specularTexture == "object" && "width" in texture.specularTexture) {
                    this.generateTextureByBitmap(texture.specularTexture as ImageBitmap, kind);
                }
            }
            if (texture.normalTexture) {
                let kind = "normalTexture";
                if (typeof texture.normalTexture == "string") {
                    this.generateTextureByString(texture.normalTexture, kind);
                }
                else if (typeof texture.normalTexture == "object" && "usage" in texture.normalTexture) {
                    this.textures.normalTexture = texture.normalTexture;
                    this.countOfTexturesOfFineshed++;
                    if (this.countOfTextures == this.countOfTexturesOfFineshed) {
                        this._already = true;
                    }
                }
                else if (typeof texture.normalTexture == "object" && "width" in texture.normalTexture) {
                    this.generateTextureByBitmap(texture.normalTexture as ImageBitmap, kind);
                }
            }
        }
        else {
            this._already = true;
        }



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
        const response = new Promise((resolve, reject) => {
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
    generateTextureByBitmap(imageBitmap: ImageBitmap, id: string) {
        let scope = this;
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
        if (scope.countOfTextures == scope.countOfTexturesOfFineshed) {
            scope._already = true;
        }
    };

    /**
     * 
     * @returns  FS code
     */
    getCodeFS(startBinding: number) {
        let code = lightsFS;
        let binding = startBinding;
        
        code = code.replaceAll("$red", this.red.toString());
        code = code.replaceAll("$blue", this.blue.toString());
        code = code.replaceAll("$green", this.green.toString());
        code = code.replaceAll("$alpha", this.alpha.toString());

        let spec = "     ";
        //这里的u_metalness也需要被使用，否则报错，乘上之后就是金属度的增加
        let specTexture = `let specc= textureSample(u_specularTexture, u_Sampler,  uv).rgb ;
            specularColor  = light_atten_coff * u_bulinphong.metalness *specc*    spec * lightColor;\n`;
        // let specTexture = "spec =textureSample(u_specularTexture, u_Sampler,  uv);\n";

        let normal = "  ";
        let normalTexture = "  normal =textureSample(u_normalTexture, u_Sampler,  uv).rgb;\n";

        let flag_spec = false;
        let flag_texture = false;
        let flag_normal = false;

        // @group(1) @binding(4) var u_Sampler: sampler;
        // @group(1) @binding(5) var u_Texture: texture_2d<f32>;

        //判断texture种类，增加对应贴图，增加一个采样（uniform中，binding 4）
        if (this.countOfTextures > 0) {
           
            code += ` @group(1) @binding(${binding}) var u_Sampler : sampler; \n `;
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
                code += `@group(1) @binding(${binding}) var u_${i}: texture_2d<f32>;\n`;
                binding++;
            }
        }
        if (flag_texture) {
            code = code.replaceAll("$materialColor", 'materialColor = textureSample(u_texture, u_Sampler, fsInput.uv);\n');
        }
        else {
            code = code.replaceAll("$materialColor", '');
        }
        if (flag_spec) {
            code = code.replaceAll("$spec", specTexture);
        }
        else {
            code = code.replaceAll("$spec", spec);
        }
        if (flag_normal) {
            code = code.replaceAll("$normal", normalTexture);
        }
        else {
            code = code.replaceAll("$normal", normal);
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
                    resource: this.textures[i].createView(),
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