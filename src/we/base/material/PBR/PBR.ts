import { uniformEntries } from "../../command/commandDefine";
import { optionTextureSource, Texture } from "../../texture/texture";
import { BaseMaterial, optionBaseMaterial } from "../baseMaterial";
import PBRFS from "../../shader/material/PBR/PBRColor.fs.wgsl?raw"
import { color4F, lifeState } from "../../const/coreConst";
import { weSamplerKind } from "../../resource/weResource";


/** PBR 收入参数*/
export interface valuesOfPBR {

    albedo: {
        value?: [number, number, number],
        texture?: optionTextureSource | Texture,
    }
    metallic: {
        value?: number,
        texture?: optionTextureSource | Texture,
    }
    roughness: {
        value?: number,
        texture?: optionTextureSource | Texture,
    }
    ao?: {
        texture?: optionTextureSource | Texture,
    }
    normal?: {
        texture: optionTextureSource | Texture,
    }
    /**
     * 非金属可以有颜色和纹理
     * 金属可以使用albedo代替，可以不设置
     */
    color?: {
        value?: color4F,
        texture?: optionTextureSource | Texture,
    }
}
/** PBR 纹理 */
export interface valuesOfPBR_Texture {
    albedoTexture?: Texture,
    metallicTexture?: Texture,//u_metallicTexture
    roughnessTexture?: Texture,
    aoTexture?: Texture,
    normalTexture?: Texture,
    colorTexture?: Texture,
}
export interface optionPBRMaterial extends optionBaseMaterial {
    PBR: valuesOfPBR,
    samplerFilter?: GPUMipmapFilterMode,
    mipmap?: boolean,
}

export class PBRMaterial extends BaseMaterial {

    declare input: optionPBRMaterial;
    textures: valuesOfPBR_Texture;
    uniform: ArrayBuffer;
    uniformSize: number = 48;
    sampler!: GPUSampler

    constructor(input: optionPBRMaterial) {
        super(input);
        this.textures = {};
        this.uniform = new ArrayBuffer(this.uniformSize);
        if (this.input.PBR.color == undefined) {
            this.input.PBR.color = { value: { red: 1, green: 1, blue: 1, alpha: 1 } };
        }
    }
    async __init() {
        if (this.input.PBR.albedo.texture) {
            if (this.input.PBR.albedo.texture instanceof Texture) {
                this.textures["albedoTexture"] = this.input.PBR.albedo.texture;
            }
            else {
                if (this.input.PBR.albedo.texture.format == undefined) {
                    this.input.PBR.albedo.texture.format = "rgba8unorm";
                }
                if (this.input.PBR.albedo.texture.premultipliedAlpha == undefined) {
                    this.input.PBR.albedo.texture.premultipliedAlpha = false;
                }
                let textureInstace = new Texture(this.input.PBR.albedo.texture, this.device);
                await textureInstace.init();
                this.textures["albedoTexture"] = textureInstace;
            }
        }
        if (this.input.PBR.color?.texture) {
            if (this.input.PBR.color.texture instanceof Texture) {
                this.textures["colorTexture"] = this.input.PBR.color.texture;
            }
            else {
                if (this.input.PBR.color.texture.format == undefined) {
                    this.input.PBR.color.texture.format = "rgba8unorm";
                }
                if (this.input.PBR.color.texture.premultipliedAlpha == undefined) {
                    this.input.PBR.color.texture.premultipliedAlpha = false;
                }
                let textureInstace = new Texture(this.input.PBR.color.texture, this.device);
                await textureInstace.init();
                this.textures["colorTexture"] = textureInstace;
            }
        }
        if (this.input.PBR.normal?.texture) {
            if (this.input.PBR.normal.texture instanceof Texture) {
                this.textures["normalTexture"] = this.input.PBR.normal.texture;
            }
            else {
                if (this.input.PBR.normal.texture.format == undefined) {
                    this.input.PBR.normal.texture.format = "rgba8unorm";
                }
                if (this.input.PBR.normal.texture.premultipliedAlpha == undefined) {
                    this.input.PBR.normal.texture.premultipliedAlpha = false;
                }
                let textureInstace = new Texture(this.input.PBR.normal.texture, this.device);
                await textureInstace.init();
                this.textures["normalTexture"] = textureInstace;
            }
        }
        if (this.input.PBR.ao?.texture) {
            if (this.input.PBR.ao.texture instanceof Texture) {
                this.textures["aoTexture"] = this.input.PBR.ao.texture;
            }
            else {
                if (this.input.PBR.ao.texture.format == undefined) {
                    this.input.PBR.ao.texture.format = "r8unorm";
                }
                if (this.input.PBR.ao.texture.premultipliedAlpha == undefined) {
                    this.input.PBR.ao.texture.premultipliedAlpha = false;
                }
                let textureInstace = new Texture(this.input.PBR.ao.texture, this.device);
                await textureInstace.init();
                this.textures["aoTexture"] = textureInstace;
            }
        }
        if (this.input.PBR.metallic.texture) {
            if (this.input.PBR.metallic.texture instanceof Texture) {
                this.textures["metallicTexture"] = this.input.PBR.metallic.texture;
            }
            else {
                if (this.input.PBR.metallic.texture.format == undefined) {
                    this.input.PBR.metallic.texture.format = "r8unorm";
                }
                if (this.input.PBR.metallic.texture.premultipliedAlpha == undefined) {
                    this.input.PBR.metallic.texture.premultipliedAlpha = false;
                }
                let textureInstace = new Texture(this.input.PBR.metallic.texture, this.device);
                await textureInstace.init();
                this.textures["metallicTexture"] = textureInstace;
            }
        }
        if (this.input.PBR.roughness.texture) {
            if (this.input.PBR.roughness.texture instanceof Texture) {
                this.textures["roughnessTexture"] = this.input.PBR.roughness.texture;
            }
            else {
                if (this.input.PBR.roughness.texture.format == undefined) {
                    this.input.PBR.roughness.texture.format = "r8unorm";
                }
                if (this.input.PBR.roughness.texture.premultipliedAlpha == undefined) {
                    this.input.PBR.roughness.texture.premultipliedAlpha = false;
                }
                let textureInstace = new Texture(this.input.PBR.roughness.texture, this.device);
                await textureInstace.init();
                this.textures["roughnessTexture"] = textureInstace;
            }
        }
        this._already = lifeState.finished;
        console.log("PBRMaterial: __init");

    }
    getCodeFS(startBinding: number): string {


        let binding = startBinding;

        let addonCode = ""
        //uniform
        addonCode += `\n @group(1) @binding(${binding})  var<uniform> u_PBR : PBRBaseUniform;  `;
        binding++;

        //sampler ++
        addonCode += `\n @group(1) @binding(${binding}) var u_Sampler : sampler;  \n`
        binding++;

        // 遍历textures，生成对应的uniform和binding
        for (let key in this.textures) {

            //u_texture是texture的名字，
            addonCode += `@group(1) @binding(${binding}) var u_${key}: texture_2d<f32>;\n`;
            binding++;

        }
        let code = addonCode + "\n" + PBRFS;
        //uniform replace
        if (code.indexOf("$PBR_Uniform") != -1) {
            let replaceUniform = "let pbrUniform = u_PBR;";
            code = code.replace("$PBR_Uniform", replaceUniform);
        }
        else {
            console.error("$PBR_Uniform is not defined");
        }
        // albedo
        if (code.indexOf("$PBR_albedo") != -1) {
            let replaceAlbedo = "";
            if (this.input.PBR.albedo.value != undefined) {
                replaceAlbedo = `albedo = u_PBR.albedo;`;
            }
            else if (this.input.PBR.albedo.texture) {
                replaceAlbedo = `albedo =pow( textureSample(u_albedoTexture,u_Sampler,fsInput.uv.xy).rgb,vec3f(2.2));`;
            }
            else {
                console.error("PBRMaterial: albedo value or texture is not defined");
            }
            code = code.replace("$PBR_albedo", replaceAlbedo);
        }
        else {
            console.error("$PBR_albedo is not defined");
        }

        // metallic
        if (code.indexOf("$PBR_metallic") != -1) {
            let replaceMetallic = "";
            if (this.input.PBR.metallic.value != undefined) {
                replaceMetallic = `metallic = u_PBR.metallic;`;
            }
            else if (this.input.PBR.metallic.texture) {
                replaceMetallic = `metallic = textureSample(u_metallicTexture,u_Sampler,fsInput.uv.xy).r;`;
            }
            else {
                console.error("PBRMaterial: metallic  value or texture is not defined");
            }
            code = code.replace("$PBR_metallic", replaceMetallic);
        }
        else {
            console.error("PBR_metallic is not defined");
        }

        // roughness
        if (code.indexOf("$PBR_roughness") != -1) {
            let replaceRoughness = "";
            if (this.input.PBR.roughness.value != undefined) {
                replaceRoughness = `roughness = u_PBR.roughness;`;
            }
            else if (this.input.PBR.roughness.texture) {
                replaceRoughness = `roughness = textureSample(u_roughnessTexture,u_Sampler,fsInput.uv.xy).r;`;
            }
            else {
                console.error("PBRMaterial: roughness  value or texture is not defined");
            }
            code = code.replace("$PBR_roughness", replaceRoughness);
        }
        else {
            console.error("PBR_metallic is not defined");
        }

        // ao
        if (code.indexOf("$PBR_ao") != -1) {
            let replaceAO = "";
            if (this.input.PBR.ao) {
                if (this.input.PBR.ao.texture) {
                    replaceAO = `ao = textureSample(u_aoTexture, u_Sampler,fsInput.uv.xy).r;`;
                }
                else {
                    console.error("PBRMaterial: ao is not defined");
                }
            }
            else {
                replaceAO = `ao = 1.0;`;
            }
            code = code.replace("$PBR_ao", replaceAO);
        }
        else {
            console.error("$PBR_ao is not defined");
        }

        if (code.indexOf("$PBR_normal") != -1) {
            let replaceNormal = "";
            if (this.input.PBR.normal) {
                if (this.input.PBR.normal.texture) {
                    replaceNormal = `normal = textureSample(u_normalTexture, u_Sampler,fsInput.uv.xy).rgb;
                                    normal= getNormalFromMap(normalize(fsInput.normal),normal,fsInput.worldPosition,fsInput.uv);
                                    // normal = normal*2.0-1.0;
                                    // normal = normalize(normal);
                    `;
                }
                else {
                    console.error("PBRMaterial: normal is not defined");
                }
            }
            else {
                replaceNormal = `normal = normalize(fsInput.normal);`;
            }
            code = code.replace("$PBR_normal", replaceNormal);

        }
        else {
            console.error("$PBR_normal is not defined");
        }

        if (code.indexOf("$PBR_color") != -1) {
            let replaceColor = "";
            if (this.input.PBR.color?.value) {
                replaceColor = `materialColor =vec4f(${this.input.PBR.color.value.red},${this.input.PBR.color.value.green},${this.input.PBR.color.value.blue},${this.input.PBR.color.value.alpha});`;
            }
            else if (this.input.PBR.color?.texture) {
                replaceColor = `materialColor = textureSample(u_colorTexture, u_Sampler,fsInput.uv.xy);`;
            }
            else {
                console.error("PBRMaterial: color value or texture is not defined");
            }
            code = code.replace("$PBR_color", replaceColor);
        }
        else {
            console.error("$PBR_color is not defined");
        }

        return this.shaderCodeProcess(code);
    }
    destroy() {
        for (let key in this.textures) {
            this.textures[key as keyof valuesOfPBR_Texture]!.destroy();
        }
        this.textures = {};
        this._already = lifeState.destroyed;
        this._destroy = true;
    }
    getUniform(startBinding: number): uniformEntries[] | false {
        const PBRBaseUniformValues = this.uniform;
        const PBRBaseUniformViews = {
            color: new Float32Array(PBRBaseUniformValues, 0, 4),
            albedo: new Float32Array(PBRBaseUniformValues, 16, 3),
            metallic: new Float32Array(PBRBaseUniformValues, 28, 1),
            roughness: new Float32Array(PBRBaseUniformValues, 32, 1),
            ao: new Float32Array(PBRBaseUniformValues, 36, 1),
        };

        //颜色值

        if (this.input.PBR.color?.value) {
            PBRBaseUniformViews.color.set([this.input.PBR.color.value.red, this.input.PBR.color.value.green, this.input.PBR.color.value.blue, this.input.PBR.color.value.alpha]);
        }
        //albedo 值 
        if (this.input.PBR.albedo.value) {
            PBRBaseUniformViews.albedo.set(this.input.PBR.albedo.value);
        }
        //metallic 值
        if (this.input.PBR.metallic.value) {
            PBRBaseUniformViews.metallic.set([this.input.PBR.metallic.value]);
        }
        //roughness 值
        if (this.input.PBR.roughness.value) {
            PBRBaseUniformViews.roughness.set([this.input.PBR.roughness.value]);
        }
        //ao 值为设置
        if (this.input.PBR.ao == undefined) {
            PBRBaseUniformViews.ao.set([1]);
        }

        let binding = startBinding;
        // PBR Base Uniforms ，这个是必须的，所以放在最前面
        let uniforms: uniformEntries[] = [
            {
                label: "PBR Base Uniforms",
                binding: binding++,
                size: 4 * this.uniformSize,
                get: () => {
                    let a = new Float32Array(this.uniform);
                    return a;
                },
                // update: false,  //todo 20250515 ,这个参数有问题，会造成uniform 不传递，待解决
            },
        ]
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
        if (Object.keys(this.textures).length > 0) {
            uniforms.push({
                binding: binding++,
                resource: this.sampler,
            });
        }
        for (let key in this.textures) {
            //先是sampler，与getCodeFS()中的对应
            uniforms.push({
                label: key,
                binding: binding++,
                resource: this.textures[key as keyof valuesOfPBR_Texture]!.texture.createView(),
            });
        }

        return uniforms;
    }

    getTransparent(): boolean {
        if (this._transparent) {
            return true;
        }
        else {
            return false;
        }
    }

    getBlend(): GPUBlendState | undefined {
        return this._transparent?.blend;
    }

}