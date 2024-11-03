import { BaseMaterial, optionBaseMaterial } from "../baseMaterial";
import colorOnlyFS from "../../shader/material/simple/phong.fs.wgsl?raw"
import { uniformBufferPart, uniformEntries } from "../../command/baseCommand";
import { PhongColorMaterial, optionPhongColorMaterial } from "./phongColorMaterial";

export type textureType = ImageBitmap | string | GPUTexture;
/*
* 这个phong模型是PBR的，结果只是近似
*/
export interface optionPhongMaterial extends optionPhongColorMaterial {
    texture: {
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
        this.countOfTextures = Object.keys(this.input.texture!).length;
        if (this.countOfTextures > 0) {
            this.sampler = window.weGPUdevice.createSampler({
                magFilter: 'linear',
                minFilter: 'linear',
            });
        }

        this.init();
    }

    init() {

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
        let code = colorOnlyFS
        code = code.replace("$red", this.red.toString());
        code = code.replace("$blue", this.blue.toString());
        code = code.replace("$green", this.green.toString());
        code = code.replace("$alpha", this.alpha.toString());
        // @group(1) @binding(4) var u_Sampler: sampler;
        // @group(1) @binding(5) var u_Texture: texture_2d<f32>;
        let spec = " let   specularColor  = light_atten_coff * u_metalness * spec * lightColor;\n";
        
        //这里的u_metalness也需要被使用，否则报错，乘上之后就是金属度的增加
        let specTexture = "let specc= textureSample(u_specularTexture, u_Sampler,  uv).rgb ;\n let  specularColor  = light_atten_coff * u_metalness *specc*    spec * lightColor;\n";
        // let specTexture = "spec =textureSample(u_specularTexture, u_Sampler,  uv);\n";

        let normal = "let normal = normalize(vNormal);\n"
        let normalTexture = "let normal =textureSample(u_normalTexture, u_Sampler,  uv).rgb;\n";

        let flag_spec = false;
        let flag_texture = false;
        let flag_normal = false;

        if (this.countOfTextures > 0) {
            code += "@group(1) @binding(4) var u_Sampler : sampler; \n ";
            let binding = 5;
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
            code = code.replace("$materialColor", 'materialColor = textureSample(u_texture, u_Sampler, fsInput.uv);\n');
        }
        else {
            code = code.replace("$materialColor", '');
        }
        if (flag_spec) {
            code = code.replace("$spec", specTexture);
        }
        else {
            code = code.replace("$spec", spec);
        }
        if (flag_normal) {
            code = code.replace("$normal", normalTexture);
        }
        else {
            code = code.replace("$normal", normal);
        }
        return code;
    }

    destroy() {
        this._destroy = true;
    }
    getUniform(): uniformEntries[] {
        let scope = this;
        let phong: uniformEntries[] = [
            {
                label: "Mesh FS Shininess",
                binding: 1,
                size: 4 * 1,
                get: () => {
                    let a = new Float32Array(1);
                    a[0] = scope.input.Shininess as number;
                    return a;
                },
            },
            {
                label: "Mesh FS metalness",
                binding: 2,
                size: 4 * 1,
                get: () => {
                    let a = new Float32Array(1);
                    a[0] = scope.input.metalness as number;
                    return a;
                },
            },
            {
                label: "Mesh FS roughness",
                binding: 3,
                size: 4 * 1,
                get: () => {
                    let a = new Float32Array(1);
                    a[0] = scope.input.roughness as number;
                    return a;
                },
            },
            // {
            //     binding: 4,
            //     resource: this.sampler,
            // },
            // {
            //     binding: 5,
            //     resource: this.textures["texture"].createView(),
            // },
        ];
        if (this.countOfTextures > 0) {
            phong.push({
                binding: 4,
                resource: this.sampler,
            });
            let binding = 5;
            for (let i in this.textures) {
                const one = {
                    binding,
                    resource: this.textures[i].createView(),
                }
                phong.push(one);
                binding++;
            }
        }
        return phong;
    }

}