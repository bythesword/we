import {
    // Mat3, mat3, Mat4, mat4, Quat, quat, utils, Vec2, vec2,
    Vec3, vec3,
    //   Vec4, vec4,
} from 'wgpu-matrix';

import {
    CamreaControl, optionCamreaControl,
} from "./cameracCntrol"

import * as MathFun from "../math/baseFunction"


/**
 * arcball 控制器
 */
export class WASDCameraControl extends CamreaControl {

    // The camera absolute pitch angle
    pitch!: number;
    // The camera absolute yaw angle
    yaw!: number;

    // The movement veloicty
    private readonly velocity_ = vec3.create();

    // Speed multiplier for camera movement
    movementSpeed = 10;

    // Speed multiplier for camera rotation
    rotationSpeed = 1;

    // Movement velocity drag coeffient [0 .. 1]
    // 0: Continues forever
    // 1: Instantly stops moving
    frictionCoefficient = 0.99;

    constructor(option: optionCamreaControl) {
        super(option);
        this.pitch = 0;
        this.yaw = 0;
    }

    // Returns velocity vector
    get velocity() {
        return this.velocity_;
    }
    // Assigns `vec` to the velocity vector
    set velocity(vec: Vec3) {
        vec3.copy(vec, this.velocity_);
    }

    // Recalculates the yaw and pitch values from a directional vector
    recalculateAngles(dir: Vec3) {
        this.yaw = Math.atan2(dir[0], dir[2]);
        this.pitch = -Math.asin(dir[1]);
    }
    // constructor(option: optionCamreaControl) {
    //     super(option)
    // }
    init() {

        this.recalculateAngles(this.camera.back);
        // throw new Error('Method not implemented.');
    }
    update( deltaTime: number,startTime:number,lastTime:number) {
        let input = this.inputHandler();
        const sign = (positive: boolean, negative: boolean) =>
            (positive ? 1 : 0) - (negative ? 1 : 0);

        // Apply the delta rotation to the pitch and yaw angles //累计计算增量*旋转速度*时间
        this.yaw -= input.analog.x * deltaTime * this.rotationSpeed;
        this.pitch -= input.analog.y * deltaTime * this.rotationSpeed;

        // Wrap yaw between [0° .. 360°], just to prevent large accumulation.
        this.yaw = MathFun.mod(this.yaw, Math.PI * 2);
        // Clamp pitch between [-90° .. +90°] to prevent somersaults.
        this.pitch = MathFun.clamp(this.pitch, -Math.PI / 2, Math.PI / 2);

        let position = this.camera.position;

        //更新camera的矩阵，通过yaw和pitch的增量，暂缓后边通过camera.update更新
        // Reconstruct the camera's rotation, and store into the camera matrix.
        //        super.matrix = mat4.rotateX(mat4.rotationY(this.yaw), this.pitch);

        // Calculate the new target velocity
        const digital = input.digital;
        const deltaRight = sign(digital.right, digital.left);
        const deltaUp = sign(digital.up, digital.down);
        const targetVelocity = vec3.create();
        const deltaBack = sign(digital.backward, digital.forward);
        vec3.addScaled(targetVelocity, this.camera.right, deltaRight, targetVelocity);
        vec3.addScaled(targetVelocity, this.camera.up, deltaUp, targetVelocity);
        vec3.addScaled(targetVelocity, this.camera.back, deltaBack, targetVelocity);
        vec3.normalize(targetVelocity, targetVelocity);
        vec3.mulScalar(targetVelocity, this.movementSpeed, targetVelocity);

        // Mix new target velocity
        this.velocity = MathFun.lerp(
            targetVelocity,
            this.velocity,
            Math.pow(1 - this.frictionCoefficient, deltaTime,startTime,lastTime)
        );
        // Integrate velocity to calculate new position
        //新位置
        position = vec3.addScaled(position, this.velocity, deltaTime,startTime,lastTime);
        this.camera.updateByPositionYawPitch(position, this.yaw, this.pitch);

    }
    destroy() {
        // throw new Error('Method not implemented.');
    }

}