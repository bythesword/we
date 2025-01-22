import { mat4, Mat4 } from "wgpu-matrix";
import { Scene } from "../scene/scene";
import { BaseStage } from "../stage/baseStage";
import { AmbientLight, optionAmbientLight } from "./ambientLight";
import { BaseLight, lightStructSize, lightStructSizeOfShadowMapMVP, lightType } from "./baseLight";
import { lightNumber, shadowMapSize } from "../const/coreConst";
import { valuesForCreateDCCC } from "../entity/baseEntity";
import { commmandType } from "../scene/baseScene";

export interface optionLightSManagement {
    scene: Scene,
}
/**
 * struct ST_shadowMapMatrix size
 */
var ST_shadowMapMatrix_Size = 80;

/**对应system.wgsl中的结构 ST_shadowMapMatrix的单体结构
 * 
 * @group(0) @binding(2) var<uniform> U_shadowMapMatrix : array<ST_shadowMapMatrix,$shadowNumber>;
 */
interface light_shadowMapMatrix {
    light_id: number,
    index: number,//
    matrix_count: number,//数量：1 or 6,1=一个，6=cube
    matrix_self_index: number,//0-5,//按照cube方式排列 right=0,left=1,up=2,down=3,back=4,front=5
    MVP: Mat4,
    /**每个光源（有shadowmap）的MVP */
    "GPUBuffer": GPUBuffer,
    /**每个光源（有shadowmap）的RPD */
    RPD: GPURenderPassDescriptor,
}



export class LightsManagement {

    scene: Scene;
    device: GPUDevice;

    ////////////////////////////////////////////////////////////////////////////////
    /**所有光源的uniform ,直接生成默认最大光源数的Buffer
     * 对应system.wgsl中的struct ST_Lights
     * scene 的MVP使用中的lights
     */
    lightsUniformGPUBuffer: GPUBuffer;

    /** render scene 用的每个 light 的shadow mvp.
     * 对应system.wgsl中的结构 ST_shadowMapMatrix的GPUBuffer
     * 
     * @group(0) @binding(2) var<uniform> U_shadowMapMatrix : array<ST_shadowMapMatrix,$shadowNumber>;
     */
    ShadowMapUniformGPUBuffer: GPUBuffer;

    ////////////////////////////////////////////////////////////////////////////////
    // shadow map
    /**MVP和depth texture使用，根据增加的光源的shadow而自增,从1开始（ GPUOrigin3DDict 的 depthOrArrayLayers） */
    shadowIndexID: number;

    /** 光源的shadow map 和 MVP的存储结构*/
    shadowArrayOfDepthMapAndMVP: light_shadowMapMatrix[];


    /**
     * todo：20250105，目前写成固定的
     * 
     * 是否动态增加了光源 
     */
    reNewLightsNumberOfShadow: boolean;

    /**shadowmap的depth texture texture_depth_2d_array */
    shadowMapTexture: GPUTexture;

    /////////////////////////////////////////////////////////////
    // about lights
    /** lights array ,only for scene,stage use lightsIndex[]*/
    lights: BaseLight[];
    /**stage 和 scene都可以有
     * scene的是全局的
     * stage的是自己的
     */
    ambientLight: { [name: string]: AmbientLight };
    /**当前scene|stage中起作用的光源索引 */
    lightsIndex: [];
    /***上一帧光源数量，动态增减光源，uniform的光源的GPUBuffer大小会变化，这个值如果与this.lights.length相同，不更新；不同，怎更新GPUBuffer */
    _lastNumberOfLights: number;
    /**最大光源数量 
     * 默认在coreConst.ts 中:lightNumber=32
     * 这个实际上是没有限制的，考虑两个因素
     *  1、渲染：
     *          A、前向渲染，不可能太多
     *          B、延迟渲染，基本不影响
     *  2、阴影
     *          A、这个是主要的影响，由于使用shadow map，还是需要进行一遍灯光视角的渲染，全向光/点光源/spot角度过大的会产生cube shadow map
     *          B、如果光源不产生阴影，就无所谓数量了
    */
    _maxlightNumber: number;


    lightsCommands: {
        [name: string]: commmandType[]
    }

    constructor(input: optionLightSManagement) {
        this.scene = input.scene;
        this.device = input.scene.device;
        this.reNewLightsNumberOfShadow = false;
        this._lastNumberOfLights = 0;
        this.lights = [];
        this.lightsCommands = {};
        this.ambientLight = {};
        this.shadowArrayOfDepthMapAndMVP = [];
        this.lightsUniformGPUBuffer = this.device.createBuffer({
            label: 'lightsGPUBuffer',
            size: 16 + 16 + lightNumber * lightStructSize,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        this._maxlightNumber = lightNumber;

        this.shadowIndexID = 1;//MVP and depth texture index;
        this.shadowMapTexture = this.generateShadowMapTexture();//todo 20250105,目前是固定的，后期改成动态
        this.ShadowMapUniformGPUBuffer = this.createShadowMapUniformGPUBuffer();
    }
    /**生成shadow map 的 texture_depth_2d_array
     * 
     * 1、用途两种：
     * 
     *      A、render 每个light的 shadow map 的RPD使用     
     *  
     *      B、scene render的system uniform 使用，@group(0)@binding(3) var U_shadowMap_depth_texture
     * 
     * 2、目前是使用固定光源数量*6的最大array（point light 需要6个depth texture）
     * 
     * 3、后期更改为动态
     * 
     * @returns GPUTexture
     */
    generateShadowMapTexture(): GPUTexture {
        if (this.shadowMapTexture) {
            this.shadowMapTexture.destroy();
        }
        const shadowmapTextureDesc: GPUTextureDescriptor = {
            label: "LightsManagement create shadow map depth texture",
            size: {
                width: shadowMapSize,
                height: shadowMapSize,
                // depthOrArrayLayers: lightNumber * 6,
            },
            format: "depth32float",
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC | GPUTextureUsage.TEXTURE_BINDING,
        }
        this.reNewLightsNumberOfShadow = false;//动态更新用，目前没有用途
        return this.device.createTexture(shadowmapTextureDesc);
        //todo 20250105,目前是固定的，后期改成动态
        // this.shadowIndexID++;
    }
    /**生成shadow map 的所有光源的MVP，是MVP*lightNumber的大小
     * 
     * 1、在scene render 中system uniform 使用：@group(0)@binding(2) var<uniform> U_shadowMapMatrix 
     * @returns GPUBuffer
     */
    createShadowMapUniformGPUBuffer(): GPUBuffer {
        return this.device.createBuffer({
            label: 'Shadow Map GPUBuffer',
            size: lightNumber * ST_shadowMapMatrix_Size,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
    }
    /////////////////////////////////////////////////////////////////////////
    /**环境光设置，更新环境光
     * 
     * @param values optionAmbientLight,默认强度=0，即不存在环境光
     * @param stageName stage 名称，每个stage可以有不同的环境光，,默认=default
     */
    setAmbientLight(values: optionAmbientLight = { color: { red: 1, green: 1, blue: 1 }, intensity: 0 }, stageName?: string) {
        let light = new AmbientLight(values)
        if (stageName)
            this.ambientLight[stageName] = light;
        else
            this.ambientLight["default"] = light;
    }
    /**获取环境光
     * 
     * @param stageName ,stage名称，默认=default
     * @returns 
     */
    getAmbientLight(stageName?: string) {
        if (stageName && this.ambientLight[stageName]) {

        }
        return this.ambientLight["default"];
    }
    ////////////////////////////////////////////////////////////////////////////
    /**增加光源 */
    addLights(one: BaseLight, stage?: BaseStage) {
        if (one.shadow) {
            let count = 1;//point 有6个matrix，其他1个
            this.reNewLightsNumberOfShadow = true;//动态更新用，目前没有用途
            if (one.getKind() == lightType.point) {//point light
                count = 6
                one.setShdowMapValues(this.shadowIndexID, count, count);
                // this.shadowIndexID += 6;
            }
            else {//other
                one.setShdowMapValues(this.shadowIndexID, count, count);
                // this.shadowIndexID ++;
            }
            //这里有个问题，即使是使用async/await，也出现得不到matrixp[],所以更改为现在的初始化为单位矩阵
            // let MVPs = one.getMVP();//获取MVP，并for

            for (let i = 0; i < count; i++) {
                let oneGPUBuffer = this.createGPUBufferForMatrix(one.id.toString());
                const oneMVP: light_shadowMapMatrix = {
                    light_id: one.id,
                    index: this.shadowIndexID,//在shadowMapTexture中的开始位置
                    matrix_count: count,
                    matrix_self_index: i,
                    MVP: mat4.identity(),//GPUBuffer的来源MVP
                    GPUBuffer: oneGPUBuffer,//每个light的shadow map的MVP
                    RPD: this.createShadowMapRPD(this.shadowIndexID, i),//每个light的render shadow map 的RPD
                }
                this.shadowArrayOfDepthMapAndMVP.push(oneMVP)
            }
            if (one.getKind() == lightType.point) {//point light

                this.shadowIndexID += 6;
            }
            else {//other
                this.shadowIndexID++;
            }
        }
        this.lights.push(one);
    }
    createShadowMapRPD(index: number, selfIndex: number): GPURenderPassDescriptor {
        const renderPassDescriptor: GPURenderPassDescriptor = {
            depthStencilAttachment: {
                view: this.shadowMapTexture.createView(
                    //     {
                    //     label: "lights management shadowMapTexture array ,the index is :" + index + " offset is :" + selfIndex,
                    //     dimension: "2d",//"2d-array",
                    //     arrayLayerCount: index + selfIndex,

                    // }
                ),
                depthClearValue: this.scene._isReversedZ ? this.scene.depthClearValueOfReveredZ : this.scene.depthClearValueOfZ, // 1.0,                
                depthLoadOp: 'clear', // depthLoadOp: 'load',//这个可能有问题，如果clear的清空
                depthStoreOp: 'store',
            },
            colorAttachments: []
        };
        return renderPassDescriptor;
    }
    gettShadowMapRPD(values: valuesForCreateDCCC): GPURenderPassDescriptor | false {
        for (let i of this.shadowArrayOfDepthMapAndMVP) {
            if (i.light_id == parseInt(values.id) && i.matrix_self_index == values.matrixIndex!) {
                return i.RPD;
            }
        }
        return false;
    }
    gettShadowMapRPDByIdAndSelfIndex(id: number, matrixIndex: number): GPURenderPassDescriptor | false {
        for (let i of this.shadowArrayOfDepthMapAndMVP) {
            if (i.light_id == id && i.matrix_self_index == matrixIndex!) {
                return i.RPD;
            }
        }
        return false;
    }
    getLightNumbers() {
        return this.lights.length;//这个需要进行可见性处理(enable,visible,stage)，todo 20241021
    }
    /**更新所有光源的入口 */
    async update(deltaTime: number, startTime: number, lastTime: number) {
        this.lightsCommands = {};
        this.updateLights(deltaTime, startTime, lastTime);//更新光源属性
        await this.updateSystemUniformBufferForlights();//更新lights的system uniform ；@group(0) @binding(1)
        this.updateSytemUniformOfShadowMap();//更新shadowmap  uniform，@group(0) @binding(2)；同步更新每个光源生成shadow map用的MVP

    }
    /** 更新所有光源参数*/
    async updateLights(deltaTime: number, startTime: number, lastTime: number) {
        for (let i of this.lights) {
            await i.update(this.scene, deltaTime, startTime, lastTime);
        }
    }
    /**
     * 更新所有光源在主渲染过程中的system uniform 的GPUBuffe
    */
    async updateSystemUniformBufferForlights() {
        this.lightsUniformGPUBuffer = await this.getUniformOfSystemLights();
    }
    /**
     * 在WGSL是一个struct ，参见“system.wgsl”中的 ST_Lights结构。
     * 
     * @returns 光源的GPUBuffer,大小=16 + 16 + lightNumber * lightStructSize,
     */
    async getUniformOfSystemLights(stageName: string = "default"): Promise<GPUBuffer> {
        let size = lightStructSize;
        // let lightNumber = lightNumber;
        let lightRealNumberOfSystem = this.getLightNumbers();

        let lightsGPUBuffer: GPUBuffer;

        // if (lightNumber == this._lastNumberOfLights)
        //generate GPUBuffer
        if (this.lightsUniformGPUBuffer) {//20250105，目前是最大数量
            lightsGPUBuffer = this.lightsUniformGPUBuffer;
        }
        else {
            lightsGPUBuffer = this.device.createBuffer({
                label: 'lightsGPUBuffer',
                size: 16 + 16 + lightNumber * size,
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
            });
        }
        // else {//不同，注销并新建
        //     if (this.lightsUniformGPUBuffer) {
        //         this.lightsUniformGPUBuffer.destroy();
        //     }
        //     lightsGPUBuffer = this.device.createBuffer({
        //         label: 'lightsGPUBuffer',
        //         size: 16 + 16 + lightNumber * size,
        //         usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        //     });
        //     this._lastNumberOfLights = lightNumber;
        // }

        //总arraybuffer
        let buffer = new ArrayBuffer(16 + 16 + lightNumber * size);

        //第一个16，是光源数量
        let ST_lightNumber = new Uint32Array(buffer, 0, 1);
        ST_lightNumber[0] = lightRealNumberOfSystem;

        //第二个16，是当前的环境光参数（每个stage的环境光可能不同，室内外）
        let ST_AmbientLightViews = {
            color: new Float32Array(buffer, 16, 3),
            intensity: new Float32Array(buffer, 16 + 12, 1),
        };
        ST_AmbientLightViews.color[0] = this.ambientLight[stageName]._color[0];
        ST_AmbientLightViews.color[1] = this.ambientLight[stageName]._color[1];
        ST_AmbientLightViews.color[2] = this.ambientLight[stageName]._color[2];
        ST_AmbientLightViews.intensity[0] = this.ambientLight[stageName]._intensity;

        //第三部分，lightNumber * size
        //映射到每个viewer上，并写入新的数据（无论是否有变化）
        for (let i = 0; i < this.lights.length; i++) {
            let StructBuffer = new Float32Array(buffer, 16 + 16 + size * i, size / 4);//todo，20241117，需要确认是否/4(byte*4 -->float32*1)
            let lightStructBuffer = this.lights[i].getStructBuffer();
            for (let j = 0; j < size; j++) {
                StructBuffer[i * size + j] = lightStructBuffer[j];
            }
        }

        //生成浮点数据队列
        let bufferFloat32Array = new Float32Array(buffer);
        // let bufferFloat32Array = buffer;
        //将新生成的浮点数据写入到GPUBuffer中，
        this.device.queue.writeBuffer(
            lightsGPUBuffer,
            0,
            bufferFloat32Array.buffer,
            bufferFloat32Array.byteOffset,
            bufferFloat32Array.byteLength
        );
        return lightsGPUBuffer;
    }

    /**1、更新所有光源的shadow map的uniform :@group(0)@binding(2) var<uniform> U_shadowMapMatrix
     * 2、同步更新每个光源生成shadow map用的MVP
    */
    updateSytemUniformOfShadowMap(): GPUBuffer {
        const ST_shadowMapMatrixValues = new ArrayBuffer(ST_shadowMapMatrix_Size * lightNumber);

        //for 所有MVP，是动态的（addlight中增加的）
        for (let i = 0; i < this.shadowArrayOfDepthMapAndMVP.length; i++) {
            const ST_shadowMapMatrixViews = {
                light_id: new Uint32Array(ST_shadowMapMatrixValues, i * ST_shadowMapMatrix_Size + 0, 1),
                matrix_count: new Uint32Array(ST_shadowMapMatrixValues, i * ST_shadowMapMatrix_Size + 4, 1),
                matrix_index: new Uint32Array(ST_shadowMapMatrixValues, i * ST_shadowMapMatrix_Size + 8, 1),
                MVP: new Float32Array(ST_shadowMapMatrixValues, i * ST_shadowMapMatrix_Size + 16, 16),
            };
            const oneST: light_shadowMapMatrix = this.shadowArrayOfDepthMapAndMVP[i];
            // ST_shadowMapMatrixViews.light_id[0] = oneST.light_id;
            // ST_shadowMapMatrixViews.matrix_count[0] = oneST.matrix_count;
            // ST_shadowMapMatrixViews.matrix_index[0] = oneST.matrix_self_index;
            const m4 = this.getLightMVPByID(oneST.light_id, oneST.matrix_self_index);
            mat4.copy(m4, oneST.MVP);
            mat4.copy(m4, ST_shadowMapMatrixViews.MVP);
            this.writeToGPUBuffer(oneST.MVP, oneST.GPUBuffer);//同步更新每个光源的MVP
        }

        let buffer = new Float32Array(ST_shadowMapMatrixValues)

        this.device.queue.writeBuffer(
            this.ShadowMapUniformGPUBuffer,
            0,
            buffer.buffer,
            buffer.byteOffset,
            buffer.byteLength
        );
        return this.ShadowMapUniformGPUBuffer;
    }
    getLightMVPByID(id: number, matrix_index: number): Mat4 {
        let m4 = mat4.identity();
        let one = this.getLightByID(id);
        if (one) {
            m4 = (one as BaseLight).getMVPByIndex(matrix_index);
        }
        return m4;
    }

    getLightByID(id: number): BaseLight | boolean {
        for (let i of this.lights) {
            if (id = i.ID) {
                return i;
            }
        }
        return false;
    }

    writeToGPUBuffer(m4: Mat4, oneGPUBuffer: GPUBuffer) {
        let MVP_buffer = new Float32Array([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1,
            0, 0, 0, 0,//reversedZ: u32,
        ]);
        let MVP = new Float32Array(MVP_buffer.buffer, 4 * 4 * 4 * 0, 16);//与ArrayBuffer不同，这里是有.buffer的
        mat4.copy(m4, MVP);
        if (this.scene._isReversedZ) {
            let reversedZ = new Uint32Array(MVP_buffer.buffer, 4 * 4 * 4 * 1, 1);
            reversedZ[0] = 1;
        }
        this.device.queue.writeBuffer(
            oneGPUBuffer,
            0,
            MVP_buffer.buffer,
            MVP_buffer.byteOffset,
            MVP_buffer.byteLength
        );
    }
    createGPUBufferForMatrix(id: string, m4?: Mat4,) {
        let MVP_buffer = new Float32Array([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1,
            0, 0, 0, 0,//reversedZ: u32,
        ]);
        let MVP = new Float32Array(MVP_buffer.buffer, 4 * 4 * 4 * 0, 16);
        if (m4)
            mat4.copy(m4, MVP);
        if (this.scene._isReversedZ) {
            let reversedZ = new Uint32Array(MVP_buffer.buffer, 4 * 4 * 4 * 1, 1);
            reversedZ[0] = 1;
        }
        let oneGPUBuffer: GPUBuffer = this.device.createBuffer({
            label: "Light Management create buffer for lights MVP ,lights id :" + id,
            size: MVP_buffer.byteLength,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        this.device.queue.writeBuffer(
            oneGPUBuffer,
            0,
            MVP_buffer.buffer,
            MVP_buffer.byteOffset,
            MVP_buffer.byteLength
        );
        return oneGPUBuffer;
    }
    ////////////////////////////////////////////////////////////////////////////////////////////////
    //MVP

    // /**shadow  map 使用： 更新所有光源生成shadow map 的MVP */
    // async updatePerLightMVPForGenerate() {
    //     for (let i of this.lights) {
    //         const id = i.id.toString();
    //         if (this.lightsMVP![id] == undefined) {
    //             this.lightsMVP![id] = await this.updatePerLightMVP(i);
    //         }
    //         else {
    //             await this.updatePerLightMVP(i);
    //         }
    //     }
    // }

    // /**
    //  * shadow  map 使用：获取并更新每个light MVP矩阵
    //  * @param one 
    //  * @returns  MVP(16*4)
    //  */
    // async updatePerLightMVP(one: BaseLight): Promise<GPUBuffer> {
    //     let mvp: Mat4 = one.getMVP();
    //     const id = one.id.toString();
    //     // const ST_SystemMVPValues = new ArrayBuffer(80);
    //     // const ST_SystemMVPViews = {
    //     //     MVP: new Float32Array(ST_SystemMVPValues, 0, 16),
    //     //     reversedZ: new Uint32Array(ST_SystemMVPValues, 64, 1),
    //     // };

    //     const uniformBufferSize = lightStructSizeOfShadowMapMVP;
    //     let MVP: GPUBuffer;
    //     let MVP_buffer = new Float32Array([
    //         1, 0, 0, 0,
    //         0, 1, 0, 0,
    //         0, 0, 1, 0,
    //         0, 0, 0, 1,
    //         0, 0, 0, 0,
    //     ]);

    //     if (this.lightsMVP![id]) {
    //         MVP = this.lightsMVP![id];
    //     }
    //     else {
    //         MVP = this.device.createBuffer({
    //             label: "lights(" + id + ") MVP",
    //             size: uniformBufferSize,
    //             usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    //         });
    //     }

    //     if (mvp) {
    //         let model = new Float32Array(MVP_buffer.buffer, 4 * 4 * 4 * 0, 16);
    //         mat4.copy(mvp as Mat4, model);

    //     }

    //     if (this.scene._isReversedZ) {
    //         let reversedZ = new Uint32Array(MVP_buffer.buffer, 4 * 4 * 4 * 1, 1);
    //         reversedZ[0] = 1;
    //     }
    //     await this.device.queue.writeBuffer(
    //         MVP,
    //         0,
    //         MVP_buffer.buffer,
    //         MVP_buffer.byteOffset,
    //         MVP_buffer.byteLength
    //     );
    //     return MVP;
    // }

    /**获取光源的shadow map 对应的light 的MVP
     * 
     * @param id string, light id
     * @param matrixIndex number, 光源的矩阵index，0-5，点光源有6个shadow map
     * @returns GPUBuffer | false 
     */
    getOneLightsMVP(id: string, matrixIndex: number): GPUBuffer | false {
        for (let i of this.shadowArrayOfDepthMapAndMVP) {
            if (i.light_id.toString() == id && i.matrix_self_index == matrixIndex) {
                return i.GPUBuffer;
            }
        }
        return false;
    }
    /**获取shadowmap的结构数组
     * 
     * @returns light_shadowMapMatrix[]
     */
    getShdowMapsStructArray(): light_shadowMapMatrix[] {
        return this.shadowArrayOfDepthMapAndMVP;
    }
    /////////////////////////////////////////////////
    /**render perlight's shadowmap  */
    render() {
        for (let oneLightID_i in this.lightsCommands) {
            let ID = oneLightID_i.split("_");
            let id: number = parseInt(ID[0]);
            let matrixIndex: number = parseInt(ID[1]);
            for (let i in this.lightsCommands[oneLightID_i]) {
                let RPD = this.gettShadowMapRPDByIdAndSelfIndex(id, matrixIndex);
                if (RPD) {
                    if (i == "0") {
                        RPD.depthStencilAttachment!.depthLoadOp = "clear";
                    }
                    else if (i == "1") {
                        RPD.depthStencilAttachment!.depthLoadOp = "load";
                    }
                    this.lightsCommands[oneLightID_i][i].update();
                }
            }
        }
    } 
}