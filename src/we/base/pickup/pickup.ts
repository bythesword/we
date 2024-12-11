import { Vec3 } from "wgpu-matrix";
import { optionUpdate, stagesOfSystem } from "../const/coreConst";
import { Scene } from "../scene/scene";

export interface optionPickup extends optionUpdate {
    device: GPUDevice;
    parent: Scene
}

export interface pickupTargetOfIDs {
    stage: {
        id: number,
        name: string,
        transparent: boolean,
    };
    entity: number;
    instance: number;
    worldPosition?: Vec3
}
export class Pickup {
    parent: Scene;
    device: GPUDevice;
    input: optionPickup;
    resultBuffer: GPUBuffer
    pickupSize = 4;//u32=4bytes
    GBufferOfID: GPUTexture;
    width: number;
    height: number

    constructor(input: optionPickup) {
        this.input = input;
        this.device = input.device;
        this.parent = input.parent;
        this.width = this.parent.canvas.width;
        this.height = this.parent.canvas.height;
        this.GBufferOfID = this.parent.GBuffers["entityID"];
        this.resultBuffer = this.device.createBuffer({
            label: 'pickup result buffer',
            size: this.pickupSize,
            usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
        });
    }

    async getTargetID(x: number, y: number): Promise<pickupTargetOfIDs | false> {

        if (x && y) {
            const result = await this.copyTextureToBuffer(x, y);

            if (result) {
                let stageID = result[0];
                stageID = stageID >>> 29;

                stageID = (stageID - 1) / 2;
                const realStageID = Math.floor(stageID);
                const stageName = stagesOfSystem[realStageID];

                let stageTransparent = false;
                if (stageID - Math.trunc(stageID) > 0) {
                    stageTransparent = true;
                }
                // stage=stage>>>0;
                let entityIDMask = (1 << 29) - 1;
                let entity = result[0] & entityIDMask;

                entity = entity >> 14;
                let instance = result[0] & 0x3fff;
                let ids: pickupTargetOfIDs = {
                    stage: {
                        id: realStageID,
                        name: stageName,
                        transparent: stageTransparent
                    },
                    entity,
                    instance
                }
                return ids;


            }
            else
                return false;
        }
        return false;
    }
    async copyTextureToBuffer(x: number, y: number): Promise<Uint32Array | false> {
        if (x > this.width || y > this.height) return false;
        const commandEncoder = this.device.createCommandEncoder();
        // Encode a command to copy the results to a mappable buffer.
        let source: GPUImageCopyTexture = {//这里应该是GPUTexelCopyTextureInfo,@webgpu/types没有这个，GPUImageCopyTexture是GPUTexelCopyTextureInfo集成;
            texture: this.GBufferOfID,
            origin: {
                x,
                y
            }
        }
        let destination: GPUImageCopyBuffer = {//GPUTexelCopyBufferInfo,@webgpu/types没有这个,用GPUImageCopyBuffer代替
            buffer: this.resultBuffer
        };
        let size: GPUExtent3DStrict = {
            width: 1,
            height: 1
        }

        commandEncoder.copyTextureToBuffer(source, destination, size);

        const commandBuffer = commandEncoder.finish();
        this.device.queue.submit([commandBuffer]);
        // Read the results
        await this.resultBuffer.mapAsync(GPUMapMode.READ);
        const result = new Uint32Array(this.resultBuffer.getMappedRange().slice(0));
        this.resultBuffer.unmap();
        return result;
    }
}