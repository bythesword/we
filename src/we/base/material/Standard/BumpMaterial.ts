/**
 * bumpMaterial.ts
 * 凹凸贴图:bulin phong 的非PBR，在光照上使用了normal texture
 * 
 * @author  TomSong
 * @date    2024-5-10
 */
import { optionTextureSource } from "../../texture/texture";
import { optionTextureMaterial, TextureMaterial } from "./textureMaterial";




export class BumpMaterial extends TextureMaterial {
    constructor(input: optionTextureMaterial ) {
        super(input);
    }
}