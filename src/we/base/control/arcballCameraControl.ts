import {
    // Mat3, mat3, Mat4, mat4, Quat, quat, utils, Vec2, vec2,
    Vec3, vec3,
    //   Vec4, vec4,
} from 'wgpu-matrix';

import {
    // InputHandler,
    // valuesOfCamreaControl,
    optionCamreaControl,
    CamreaControl,
    // Input
} from "./cameracCntrol"

import * as MathFun from "../math/baseFunction"


/**
 * arcball 控制器
 */
export class ArcballCameraControl extends CamreaControl {
    // The current angular velocity
    private angularVelocity = 0;
    private distance = 0;
    // Speed multiplier for camera zoom
    zoomSpeed = 0.1;

    /** Rotation velocity drag coeffient [0 .. 1]
     0: Spins forever
     1: Instantly stops spinning
    */
    frictionCoefficient = 0.999;


    // The current rotation axis，旋转轴
    private axis_ = vec3.create();

    // Speed multiplier for camera rotation，角度旋转系数
    rotationSpeed = 1;


    // Returns the rotation axis
    get axis() {
        return this.axis_;
    }
    // Assigns `vec` to the rotation axis
    set axis(vec: Vec3) {
        vec3.copy(vec, this.axis_);
    }

    constructor(option: optionCamreaControl) {
        super(option)
    }
    init() {
        // throw new Error('Method not implemented.');
    }
    update(deltaTime: number) {
        if (typeof this.camera !== 'boolean') {
            let input = this.inputHandler();

            let position = this.camera.position;
            //计算当前距离，旋转距离不变
            this.distance = vec3.distance(this.camera.position, this.camera.lookAt);
            //阈值，for 旋转角 & 旋转轴
            const epsilon = 0.0000001;

            //角速度
            if (input.analog.touching) {//拖动
                // Currently being dragged.//角速度归零
                this.angularVelocity = 0;
            } else {//衰减角速度
                // Dampen any existing angular velocity
                this.angularVelocity *= Math.pow(1 - this.frictionCoefficient, deltaTime);
                // console.log(this.angularVelocity)
            }

            // Calculate the movement vector，计算移动方向
            const movement = vec3.create();
            vec3.addScaled(movement, this.camera.right, input.analog.x, movement);//X 方向的增量
            vec3.addScaled(movement, this.camera.up, -input.analog.y, movement);//Y 方向的增量
            // if (movement[0] != 0 && movement[1] != 0 && movement[0] != 0) {
            //     console.log(movement[0],movement[1],movement[2],input.analog.x,input.analog.y,this.camera.up,this.camera.right)
            // }
            // Cross the movement vector with the view direction to calculate the rotation axis x magnitude
            // 叉乘出Z轴的增量
            const crossProduct = vec3.cross(movement, this.camera.back);


            // Calculate the magnitude of the drag，计算拖动的量级，Z方向的向量长度
            const magnitude = vec3.len(crossProduct);

            if (magnitude > epsilon) {//如果Z方向的的增量大于 epsilon，重新计算旋转轴
                // Normalize the crossProduct to get the rotation axis，旋转轴
                this.axis = vec3.scale(crossProduct, 1 / magnitude);

                // Remember the current angular velocity. This is used when the touch is released for a fling.
                //更新当前角速度
                this.angularVelocity = magnitude * this.rotationSpeed;
            }
            // The rotation around this.axis to apply to the camera matrix this update
            //计算旋转角 =角速度*时间区间
            const rotationAngle = this.angularVelocity * deltaTime;

            let dir!: Vec3;
            if (rotationAngle > epsilon) {//旋转角度大于阈值
                // Rotate the matrix around axis
                // Note: The rotation is not done as a matrix-matrix multiply as the repeated multiplications
                // will quickly introduce substantial error into the matrix.
                dir = vec3.normalize(MathFun.rotate(this.camera.back, this.axis, rotationAngle));
                // console.log("dir=", dir, "\n back=", this.camera.back, "\n distance=", this.distance);
                // this.camera.update(position, dir, true);
            }
            // recalculate `this.position` from `this.back` considering zoom
            //重新计算在dir方向上的摄像机的position的距离，zoom
            if (input.analog.zoom !== 0) {
                this.distance *= 1 + input.analog.zoom * this.zoomSpeed;

            }
            if (dir) {
                position = vec3.scale(dir, this.distance);//重新计算位置
                this.camera.update(position, dir, true);
            }
        }
        else {
            console.log("arcbalCameraControl's camere didn't defined !,error from update()");
        }
    }
    destroy() {
        // throw new Error('Method not implemented.');
    }

}