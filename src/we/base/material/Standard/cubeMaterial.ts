/**
 * @author TomSong 2025-05-19
 * @description 基础纹理材质
 * @version 0.0.1
 * @requires CubeMaterial.ts 
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

import textureFS from "../../shader/material/cube/cubetexture.fs.wgsl?raw"
// import textureTransparentFS from "../../shader/material/simple/textureTransparent.fs.wgsl?raw"
import { GBuffersRPDAssemble, lifeState, textureAlphaZero } from "../../const/coreConst";
import { weSamplerKind } from "../../resource/weResource";
import { CubeTexture, optionCubeTexture } from "../../texture/cubeTexxture";


/**
 * 纹理材质的初始化参数 * 
 */
export interface optionCubeTextureMaterial extends optionBaseMaterial {
    textures: {
        cubeTexture: optionCubeTexture | CubeTexture,
    }
}

export class CubeMaterial extends BaseMaterial {

    sampler!: GPUSampler;
    declare input: optionCubeTextureMaterial;
    // /**是否上下翻转Y轴 */
    // _upsideDownY: boolean;
    /**纹理收集器 */
    declare textures: {
        [name: string]: CubeTexture
    };
    /**纹理数量 */
    countOfTextures!: number;
    /**自增，纹理加载计算器 */
    countOfTexturesOfFineshed!: number;


    constructor(input: optionCubeTextureMaterial) {
        super(input);
        this.textures = {};
        this.countOfTextures = 0;
        this.countOfTexturesOfFineshed = 0;
        if (input.textures)
            this.countOfTextures = Object.keys(input.textures!).length;
        this._already = lifeState.unstart;
    
        //cube 需要透明处理的情况少，暂时先不支持了
        // if (input.transparent != undefined) {// && this.input.transparent.opacity != undefined && this.input.transparent.opacity < 1.0)) {//如果是透明的，就设置为透明
        //     //默认混合
        //     let transparent: optionTransparentOfMaterial = {
        //         blend: {
        //             color: {
        //                 srcFactor: "src-alpha",//源
        //                 dstFactor: "one-minus-src-alpha",//目标
        //                 operation: "add"//操作
        //             },
        //             alpha: {
        //                 srcFactor: "one",//源
        //                 dstFactor: "one-minus-src-alpha",//目标
        //                 operation: "add"//操作  
        //             }
        //         }
        //     };

        //     if (input.transparent != undefined) {
        //         this._transparent = input.transparent;
        //     }
        //     else {
        //         this._transparent = transparent;
        //     }

        //     if (input.transparent.blend != undefined) {
        //         this._transparent.blend = input.transparent.blend;
        //     }
        //     else {
        //         this._transparent.blend = transparent.blend;
        //     }

        //     if (input.transparent.alphaTest == undefined && input.transparent.opacity == undefined) {//如果没有设置alphaTest,且没有opacity，就设置为0.0
        //         this._transparent.alphaTest = 0.0;//直接使用texture的alpha，（因为有其他alpha的半透明）；就是不做任何处理。
        //     }
        //     else if (input.transparent.alphaTest != undefined && input.transparent.opacity == undefined) {//如果有设置alphaTest，就设置为alphaTest
        //         this._transparent.alphaTest = input.transparent.alphaTest;//FS 中使用的是alphaTest对应texture的alpha进行比较，小于阈值的= 0.0，大于阈值的不变（因为有可能有大于阈值的半透明）
        //     }
        //     else if (input.transparent.alphaTest == undefined && input.transparent.opacity != undefined) {//如果没有设置alphaTest，就设置为opacity
        //         // this._transparent.alphaTest = input.transparent.opacity;
        //         this._transparent.opacity = input.transparent.opacity;//FS code中使用的是opacity，而不是alphaTest
        //     }

        // }
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
        let texture = this.input.textures.cubeTexture;
        if (texture instanceof CubeTexture) {
            this.textures["cubeTexture"] = texture;
        }
        else {
            texture.upsideDownY =false;//默认不翻转Y轴,否则出错
            let textureInstace = new CubeTexture(texture, this.device);
            await textureInstace.init();
            this.textures["cubeTexture"] = textureInstace;
        }
        this._already = lifeState.finished;
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
        let one = ` @group(1) @binding(${binding}) var mySampler : sampler;`;
        binding++;
        let two = `@group(1) @binding(${binding}) var myTexture : texture_cube < f32>;`
        code = one + two + code;
        return this.shaderCodeProcess(code);
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
                resource: this.textures["cubeTexture"].texture.createView({
                    dimension: 'cube',
                }),
            },
        ];

        return phong;
    }

    getTransparent(): boolean {
        return false;
    }

    getBlend(): GPUBlendState | undefined {
        return undefined;
    }



}