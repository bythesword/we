

import * as coreConst from "../const/coreConst";
import { DrawCommand, drawOptionOfCommand } from "../command/DrawCommand";
import { Scene } from "./scene";


export class GBuffersVisualize {
    /**GBuffer的GPUTexture的集合 */
    GBuffers!: coreConst.GBuffers;
    /**GBuffer的布局格式集合，这个在实现默认布局， */
    GBuffersViewport!: coreConst.GBufferLayout;
    scene!: Scene;
    /**GBuffer 布局格式的名称，比如：top，bottom，around...
     * 
     * 详见：coreConst.viewportLayoutOfGBuffers
     */
    layout!: string;
    quadDrawCommands!: DrawCommand[];


    constructor(scene: Scene, layout: string) {
        this.scene = scene;
    }


    init() {
        Object.entries(coreConst.GBufferName).forEach(([key, value]) => {
            if (typeof key === "string")
                console.log(`Key: ${key}, Value: ${value}`);
        });
        // Object.keys(GBufferName).forEach((key) => {
        //     const value = GBufferName[key as keyof typeof GBufferName];
        //     console.log(`Key: ${key}, Value: ${value}`);
        // });
    }
    
    /**observer resize 使用 */
    reInit() {

    }
    destory() { }
    async renderTextureToTexture(type: string,
        A: GPUTexture, B: GPUTexture,
        size: { width: number, height: number },
        viewportsize: { width: number, height: number }) {
        // this.renderPassDescriptor 
        if (this.quadDrawCommands) {
            return this.quadDrawCommands;
        }
        else {


        }
    }
}