import { lifeState } from "../const/coreConst";
import { BaseTexture, optionBaseTexture, textureType } from "./baseTexture";
import { optionTexture } from "./texture";


export interface optionCubeTexture extends optionBaseTexture {
    /**
    * cube 
    * 6个面
    * 顺序：
    * +x,-x,+y,-y,+z,-z 
    * */
    texture: [string, string, string, string, string, string],
}

export class CubeTexture extends BaseTexture {

    declare input: optionCubeTexture;
    constructor(input: optionCubeTexture, device: GPUDevice) {
        super(input, device);
        this.input = input;
    }

    async init(): Promise<lifeState> {
        let scope = this;
        let source = this.input.texture;
        let allImages: any[] = [];

        let premultipliedAlpha = false;
        if (this.input.premultipliedAlpha != undefined)//有input.premultipliedAlpha
            premultipliedAlpha = this.input.premultipliedAlpha;
        else {
            premultipliedAlpha = true;
        }

        source.map(async (src) => {
            const response = new Promise((resolve) => {
                resolve(fetch(src));
            }).then(
                async (srcR) => {
                    return createImageBitmap(await (srcR as Response).blob());
                },
                () => { console.log("未能获取：", src) }
            );
            allImages.push(response);
        });
        await Promise.all(allImages).then(imageBitmaps => {
            // console.log(imageBitmaps)
            this.texture = this.device.createTexture({
                dimension: '2d',
                // Create a 2d array texture.
                // Assume each image has the same size.
                size: [imageBitmaps[0].width, imageBitmaps[0].height, 6],
                format: this.input.format!,
                usage:
                    GPUTextureUsage.TEXTURE_BINDING |
                    GPUTextureUsage.COPY_DST |
                    GPUTextureUsage.RENDER_ATTACHMENT,
            });
            for (let i = 0; i < imageBitmaps.length; i++) {
                const imageBitmap = imageBitmaps[i];
                this.device.queue.copyExternalImageToTexture(
                    { source: imageBitmap, flipY: this._upsideDownY },
                    { texture: scope.texture, origin: [0, 0, i], premultipliedAlpha: premultipliedAlpha },
                    [imageBitmap.width, imageBitmap.height]
                );
            }
            scope._already = lifeState.finished;
        }).catch(err => {
            console.log('error', err)
        });

        // if (this.texture.mipLevelCount > 1) {
        //     this.generateMips(this.device, this.texture);
        // }
        return this._already;
    }

}