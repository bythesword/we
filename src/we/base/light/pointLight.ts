import { mat4, Mat4, vec3, Vec3, vec4 } from "wgpu-matrix";
import { lightType, optionBaseLight, } from "./baseLight";
import { BaseLight } from "./baseLight";
import { Scene } from "../scene/scene";


export interface optionPointLight extends optionBaseLight {
    /**位置 */
    position: Vec3,

    /**光的强度 ,wgsl，不受距离与立体角影响
     * 默认=1.0
    */
    intensity?: number,
    size?: number//todo
}
export interface shadowMapBox {
    map: GPUTexture,
    map1: GPUTexture,
    map2: GPUTexture,
    map3: GPUTexture,
    map4: GPUTexture,
    map5: GPUTexture,
}

export class PointLight extends BaseLight {
    constructor(input: optionPointLight) {
        super(input, lightType.point);
    }

    // generateShadowMap(_device: GPUDevice): shadowMapBox {
    //     throw new Error("Method not implemented.");
    // }
    updateMVP(scene: Scene): Mat4[] {

        let MVPS = [];
        if (this.shadow) {

            //1、计算光源的包围盒（衰减距离或世界包围球）
            //2、按照cube的顺序，+x,-x,+y,-y,+z,-z,Z轴向上
            //3、建立MVP[]
            //4、生成6个MVP
            //5、返回MVP[]

            //六个MVP的分别计算
            //1、生成光源view的单位矩阵
            //2、计算光源的视图矩阵（包括模型矩阵的合并）
            //3、计算光源的投影矩阵
            //4、计算光源的视图矩阵
            //5、生成单个MVP


            //shader 部分
            //1、是否有shadow
            //2、有：必须按照统一工作流完成一次的shadowmap
            //  无：直接计算光照
            //3、计算光照
            //4、计算阴影的visibility
            //5、计算是否在光源范围内，不在：visibility=0

            //计算阴影部分
            //1、计算当前像素点的世界坐标是否在光源的阴影盒内（在则继续，不在也也需要继续）
            //2、生成6个摄像机视角的的四棱的向量（单机向量）
            //3、当前像素点的世界坐标（normalize）与摄像机视角的四棱的向量的点积，四个结构不同正负（<>0，计算数量）则在阴影盒内

            //计算光源的包围盒（衰减距离或世界包围球）
            //1、获取当前光源的衰减距离（uniform）
            //2、计算当前光源的世界坐标到光源坐标的距离
            //3、如果当前光源的世界坐标到光源坐标的距离大于衰减距离，则不在光源的包围盒内，否则在光源的包围盒内

            const spshere = scene.getBoundingSphere();
            if (!spshere) {
                console.warn("scene not have bounding sphere,wating");
                return [];
            }
            let far = 0;
            let near =1; this.epsilon;
            if (this.inputValues.distance != 0.0) {
                far = this.inputValues.distance!;
            }
            else {
                far = spshere.radius * 2;
            }

            //+x
            {
                let matrix = new Float32Array([
                    1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1,
                ]);

                /** 第一行,X轴 */
                let right = new Float32Array(matrix.buffer, 4 * 0, 4);
                /** 第二行,Y轴 */
                let up = new Float32Array(matrix.buffer, 4 * 4, 4);
                /** 第三行,Z轴 */
                let back = new Float32Array(matrix.buffer, 4 * 8, 4);
                /** 第四行,位置 */
                let position = new Float32Array(matrix.buffer, 4 * 12, 4);
                vec3.copy(this.inputValues.position!, position);


                // let dir = vec3.normalize(vec3.sub(this.inputValues.direction!, vec3.create(0, 0, 0)));//摄像机是position-lookat,光的摄像机方向是lookat-position
                let backdir = vec3.create(-1, 0, 0);//摄像机是position-lookat,光的摄像机方向是（0，0，0）-direction，就是光源的方向看过来
                let upDir = vec3.create(0, 1, 0);
                let rightDir = vec3.create(0, 0, 1);

                vec3.copy(backdir, back);
                vec3.copy(rightDir, right);
                vec3.copy(upDir, up);

                const projectionMatrix = mat4.perspective(Math.PI / 2, 1, near, far);
                const MVP = mat4.multiply(projectionMatrix, mat4.invert(matrix));
                MVPS.push(MVP);
            }  
            //-x
            {
                let matrix = new Float32Array([
                    1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1,
                ]);

                /** 第一行,X轴 */
                let right = new Float32Array(matrix.buffer, 4 * 0, 4);
                /** 第二行,Y轴 */
                let up = new Float32Array(matrix.buffer, 4 * 4, 4);
                /** 第三行,Z轴 */
                let back = new Float32Array(matrix.buffer, 4 * 8, 4);
                /** 第四行,位置 */
                let position = new Float32Array(matrix.buffer, 4 * 12, 4);
                vec3.copy(this.inputValues.position!, position);


                // let dir = vec3.normalize(vec3.sub(this.inputValues.direction!, vec3.create(0, 0, 0)));//摄像机是position-lookat,光的摄像机方向是lookat-position
                let backdir = vec3.create(1, 0, 0);//摄像机是position-lookat,光的摄像机方向是（0，0，0）-direction，就是光源的方向看过来
                let upDir = vec3.create(0, 1, 0);
                let rightDir = vec3.create(0, 0, -1);

                vec3.copy(backdir, back);
                vec3.copy(rightDir, right);
                vec3.copy(upDir, up);

                const projectionMatrix = mat4.perspective(Math.PI / 2, 1, near, far);
                const MVP = mat4.multiply(projectionMatrix, mat4.invert(matrix));
                MVPS.push(MVP);
            }
        
              //+y
            {
                let matrix = new Float32Array([
                    1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1,
                ]);

                /** 第一行,X轴 */
                let right = new Float32Array(matrix.buffer, 4 * 0, 4);
                /** 第二行,Y轴 */
                let up = new Float32Array(matrix.buffer, 4 * 4, 4);
                /** 第三行,Z轴 */
                let back = new Float32Array(matrix.buffer, 4 * 8, 4);
                /** 第四行,位置 */
                let position = new Float32Array(matrix.buffer, 4 * 12, 4);
                vec3.copy(this.inputValues.position!, position);


                // let dir = vec3.normalize(vec3.sub(this.inputValues.direction!, vec3.create(0, 0, 0)));//摄像机是position-lookat,光的摄像机方向是lookat-position
                let backdir = vec3.create(0, 0, 1);//摄像机是position-lookat,光的摄像机方向是（0，0，0）-direction，就是光源的方向看过来
                let upDir = vec3.create(0, 1, 0);
                let rightDir = vec3.create(1, 0, 0);

                vec3.copy(backdir, back);
                vec3.copy(rightDir, right);
                vec3.copy(upDir, up);

                const projectionMatrix = mat4.perspective(Math.PI / 2, 1, near, far);
                const MVP = mat4.multiply(projectionMatrix, mat4.invert(matrix));
                MVPS.push(MVP);
            }
            //-y
            {
                let matrix = new Float32Array([
                    1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1,
                ]);

                /** 第一行,X轴 */
                let right = new Float32Array(matrix.buffer, 4 * 0, 4);
                /** 第二行,Y轴 */
                let up = new Float32Array(matrix.buffer, 4 * 4, 4);
                /** 第三行,Z轴 */
                let back = new Float32Array(matrix.buffer, 4 * 8, 4);
                /** 第四行,位置 */
                let position = new Float32Array(matrix.buffer, 4 * 12, 4);
                vec3.copy(this.inputValues.position!, position);


                // let dir = vec3.normalize(vec3.sub(this.inputValues.direction!, vec3.create(0, 0, 0)));//摄像机是position-lookat,光的摄像机方向是lookat-position
                let backdir = vec3.create(0, 0, -1);//摄像机是position-lookat,光的摄像机方向是（0，0，0）-direction，就是光源的方向看过来
                let upDir = vec3.create(0, 1, 0);
                let rightDir = vec3.create(-1, 0, 0);

                vec3.copy(backdir, back);
                vec3.copy(rightDir, right);
                vec3.copy(upDir, up);

                const projectionMatrix = mat4.perspective(Math.PI / 2, 1, near, far);
                const MVP = mat4.multiply(projectionMatrix, mat4.invert(matrix));
                MVPS.push(MVP);
            }
            //+z
            {
                let matrix = new Float32Array([
                    1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1,
                ]);

                /** 第一行,X轴 */
                let right = new Float32Array(matrix.buffer, 4 * 0, 4);
                /** 第二行,Y轴 */
                let up = new Float32Array(matrix.buffer, 4 * 4, 4);
                /** 第三行,Z轴 */
                let back = new Float32Array(matrix.buffer, 4 * 8, 4);
                /** 第四行,位置 */
                let position = new Float32Array(matrix.buffer, 4 * 12, 4);
                vec3.copy(this.inputValues.position!, position);


                // let dir = vec3.normalize(vec3.sub(this.inputValues.direction!, vec3.create(0, 0, 0)));//摄像机是position-lookat,光的摄像机方向是lookat-position
                let backdir = vec3.create(0, -1, 0);//摄像机是position-lookat,光的摄像机方向是（0，0，0）-direction，就是光源的方向看过来
                let upDir = vec3.create(0, 0, 1);
                let rightDir = vec3.create(1, 0, 0);

                vec3.copy(backdir, back);
                vec3.copy(rightDir, right);
                vec3.copy(upDir, up);

                const projectionMatrix = mat4.perspective(Math.PI / 2, 1, near, far);
                const MVP = mat4.multiply(projectionMatrix, mat4.invert(matrix));
                MVPS.push(MVP);
            }
            //-z
            {
                let matrix = new Float32Array([
                    1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1,
                ]);

                /** 第一行,X轴 */
                let right = new Float32Array(matrix.buffer, 4 * 0, 4);
                /** 第二行,Y轴 */
                let up = new Float32Array(matrix.buffer, 4 * 4, 4);
                /** 第三行,Z轴 */
                let back = new Float32Array(matrix.buffer, 4 * 8, 4);
                /** 第四行,位置 */
                let position = new Float32Array(matrix.buffer, 4 * 12, 4);
                vec3.copy(this.inputValues.position!, position);


                // let dir = vec3.normalize(vec3.sub(this.inputValues.direction!, vec3.create(0, 0, 0)));//摄像机是position-lookat,光的摄像机方向是lookat-position
                let backdir = vec3.create(0, 1, 0);//摄像机是position-lookat,光的摄像机方向是（0，0，0）-direction，就是光源的方向看过来
                let upDir = vec3.create(0, 0, -1);
                let rightDir = vec3.create(1, 0, 0);

                vec3.copy(backdir, back);
                vec3.copy(rightDir, right);
                vec3.copy(upDir, up);

                const projectionMatrix = mat4.perspective(Math.PI / 2, 1, near, far);
                const MVP = mat4.multiply(projectionMatrix, mat4.invert(matrix));
                MVPS.push(MVP);
            }
        }

        return MVPS;
    }




}