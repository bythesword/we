/**
 * 20250423
 * 未使用
 */
import { GBuffers, GBuffersRPDAssemble } from "../const/coreConst";


export interface optionGBuffer {
    device: GPUDevice,
    surfaceSize: { width: number, height: number },
    // options: { premultipliedAlpha?: boolean, format?: GPUTextureFormat },
    presentationFormat: GPUTextureFormat,
    depthDefaultFormat: GPUTextureFormat,
}
export class GBuffer {
    device: GPUDevice;
    surfaceSize: { width: number, height: number };
    // options: { premultipliedAlpha?: boolean, format?: GPUTextureFormat };
    GBuffers: GBuffers;
    presentationFormat: GPUTextureFormat;
    depthDefaultFormat: GPUTextureFormat;
    constructor(input: optionGBuffer) {
        this.device = input.device;
        this.surfaceSize = { width: input.surfaceSize.width, height: input.surfaceSize.height };

        this.presentationFormat = input.presentationFormat;
        this.depthDefaultFormat = input.depthDefaultFormat;
        this.GBuffers = this.initGBuffer(this.device, this.surfaceSize.width, this.surfaceSize.height );
    }
    initGBuffer(device: GPUDevice, width: number, height: number) {
        let localGBuffers: GBuffers = {};
        Object.entries(GBuffersRPDAssemble).forEach(([key, value]) => {
            // console.log(`Key: ${key}, Value: ${value}`);
            let format: GPUTextureFormat;
            if (value.format == "WEsystem") {
                format = this.presentationFormat;
            }
            else if (value.format == "WEdepth") {
                format = this.depthDefaultFormat;
            }
            else {
                format = value.format;
            }
            let gbuffer = device.createTexture({
                size: [width, height],
                format: format,
                usage: value.usage,
            });

            localGBuffers[key] = gbuffer;
            // if (key === "color") {
            //     this.colorTexture = gbuffer;
            // }
            // else if (key === "depth") {
            //     this.depthTexture = gbuffer;
            // }
        });

        // this.GBuffers = localGBuffers;
        return localGBuffers;
    }
}