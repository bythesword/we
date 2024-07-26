

export interface computePart{
    code: string,
    entryPoint: string,
    /**GPU 的常数替换*/
    constants?: any,
}

export interface computeOption {
     /** scene object ，必须 */
    scene:any,
    compute:computePart,
    uniforms:

}


export class DrawCommand { 
    /** scene ,必须,cavas or texture */
    scene: any;
    /** 渲染的camera，scene.cameraDefault || 指定的camera */
    camera: any;
    /** webGPU 的device */
    device!: GPUDevice;
    /***pipeline 句柄 */
    pipeline!:  GPUComputePipeline;


}