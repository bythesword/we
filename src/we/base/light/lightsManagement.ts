import { mat4, Mat4 } from "wgpu-matrix";
import { Scene } from "../scene/scene";
import { BaseStage } from "../stage/baseStage";
import { AmbientLight, optionAmbientLight } from "./ambientLight";
import { BaseLight, lightStructSize, lightStructSizeOfShadowMapMVP } from "./baseLight";
import { lightNumber } from "../const/coreConst";

export interface optionLightSManagement {
    scene: Scene,

}

export class LightsManagement {
    scene: Scene;
    device: GPUDevice;
    lightsUniformGPUBuffer!: GPUBuffer;
    lightsMVP: { [name: string]: GPUBuffer }
    ////////////////////////////////////////////////////////////////////////////////
    //lights  and  shadow map
    lightsIndexID: number;
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
    _lastNumberOfLights!: number;
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
    _maxlightNumber!: number;


    constructor(input: optionLightSManagement) {
        this.lights = [];
        this.lightsMVP = {};
        this.ambientLight = {};
        this.scene = input.scene;
        this.device = input.scene.device;
        this.lightsUniformGPUBuffer = this.device.createBuffer({
            label: 'lightsGPUBuffer',
            size: 16 + 16 + lightNumber * lightStructSize,
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
        this.lights.push(one);
    }

    getLightNumbers() {
        return this.lights.length;//这个需要进行可见性处理(enable,visible,stage)，todo 20241021
    }
    /**更新所有光源的入口 */
    async update(deltaTime: number, startTime: number, lastTime: number) {
        this.updateLights(deltaTime, startTime, lastTime);
        await this.updateSystemUniformBufferForlights();
        this.updateLightsMVP();
    }
    /** 更新所有光源参数*/
    async updateLights(deltaTime: number, startTime: number, lastTime: number) {
        for (let i of this.lights) {
            await i.update(deltaTime, startTime, lastTime);
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

        if (lightNumber == this._lastNumberOfLights)
            //generate GPUBuffer
            if (this.lightsUniformGPUBuffer) {
                lightsGPUBuffer = this.lightsUniformGPUBuffer;
            }
            else {
                lightsGPUBuffer = this.device.createBuffer({
                    label: 'lightsGPUBuffer',
                    size: 16 + 16 + lightNumber * size,
                    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
                });
            }
        else {//不同，注销并新建
            if (this.lightsUniformGPUBuffer) {
                this.lightsUniformGPUBuffer.destroy();
            }
            lightsGPUBuffer = this.device.createBuffer({
                label: 'lightsGPUBuffer',
                size: 16 + 16 + lightNumber * size,
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
            });
            this._lastNumberOfLights = lightNumber;
        }

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

    ////////////////////////////////////////////////////////////////////////////////////////////////
    //MVP

    /**shadow  map 使用： 更新所有光源生成shadow map 的MVP */
    async updateLightsMVP() {
        for (let i of this.lights) {
            const id = i.id.toString();
            if (this.lightsMVP![id] == undefined) {
                this.lightsMVP![id] = await this.updatePerLightMVP(i);
            }
            else {
                await this.updatePerLightMVP(i);
            }
        }
    }

    /**
     * shadow  map 使用：获取并更新每个light MVP矩阵
     * @param one 
     * @returns  MVP(16*4)
     */
    async updatePerLightMVP(one: BaseLight): Promise<GPUBuffer> {
        let mvp: Mat4 = one.getMVP();
        const id = one.id.toString();
        // const ST_SystemMVPValues = new ArrayBuffer(80);
        // const ST_SystemMVPViews = {
        //     MVP: new Float32Array(ST_SystemMVPValues, 0, 16),
        //     reversedZ: new Uint32Array(ST_SystemMVPValues, 64, 1),
        // };

        const uniformBufferSize = lightStructSizeOfShadowMapMVP;
        let MVP: GPUBuffer;
        let MVP_buffer = new Float32Array([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1,
            0, 0, 0, 0,
        ]);

        if (this.lightsMVP![id]) {
            MVP = this.lightsMVP![id];
        }
        else {
            MVP = this.device.createBuffer({
                label: "lights(" + id + ") MVP",
                size: uniformBufferSize,
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
            });
        }

        if (mvp) {
            let model = new Float32Array(MVP_buffer.buffer, 4 * 4 * 4 * 0, 16);
            mat4.copy(mvp as Mat4, model);

        }

        if (this.scene._isReversedZ) {
            let reversedZ = new Uint32Array(MVP_buffer.buffer, 4 * 4 * 4 * 1, 1);
            reversedZ[0] = 1;
        }
        await this.device.queue.writeBuffer(
            MVP,
            0,
            MVP_buffer.buffer,
            MVP_buffer.byteOffset,
            MVP_buffer.byteLength
        );
        return MVP;
    }

    getOneLightsMVP(id: string): GPUBuffer {
        if (this.lightsMVP[id] == undefined) {
            for (let i of this.lights) {
                if (id == i.id.toString()) {
                    this.updatePerLightMVP(i)
                    break;
                }
            }
        }
        return this.lightsMVP[id];
    }
    /////////////////////////////////////////////////
    /**render perlight's shadowmap  */
    renderShadowMap() {

    }
}