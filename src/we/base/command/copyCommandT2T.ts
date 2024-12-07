
export interface optionCopyT2T {
    A: GPUTexture,
    B: GPUTexture,
    size: { width: number, height: number },
    device: GPUDevice
}

export class CopyCommandT2T {

    device: GPUDevice;
    input: optionCopyT2T;
    constructor(input: optionCopyT2T) {
        this.device = input.device;
        this.input = input;
    }

    async update() {
        const commandEncoder = this.device.createCommandEncoder();
        commandEncoder.copyTextureToTexture(
            {
                texture: this.input.A
            },
            {
                texture: this.input.B,
            },
            [this.input.size.width, this.input.size.height]
        );
        const commandBuffer = commandEncoder.finish();
        this.device.queue.submit([commandBuffer]);
    }
}