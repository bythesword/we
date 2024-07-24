import { matrix } from "./matrix"
import { Vec2, Vec3, Vec4, vec2, vec3, vec4, mat3, mat4, Mat3, Mat4, Quat } from "wgpu-matrix";

import { Vector3 } from "./vector3"
import { Vector2 } from "./vector2"


class Matrix4 extends matrix<Matrix4> {

    constructor(v0?: number, v1?: number, v2?: number, v3?: number,
        v4?: number, v5?: number, v6?: number, v7?: number,
        v8?: number, v9?: number, v10?: number, v11?: number,
        v12?: number, v13?: number, v14?: number, v15?: number) {
        super(); ``
        this.mat = mat4.create(v0, v1, v2, v3,
            v4, v5, v6, v7,
            v8, v9, v10, v11,
            v12, v13, v14, v15
        );
    }
    set(
        v0: number, v1: number, v2: number, v3: number,
        v4: number, v5: number, v6: number, v7: number,
        v8: number, v9: number, v10: number, v11: number,
        v12: number, v13: number, v14: number, v15: number,) {
        this.mat = mat4.set(v0, v1, v2, v3,
            v4, v5, v6, v7,
            v8, v9, v10, v11,
            v12, v13, v14, v15
        );
    }

    fromMat3(m: Mat3) {
        this.mat = mat4.fromMat3(m);
    }

    fromQuat(q: Quat) {
        this.mat = mat4.fromQuat(q);
    }
    negate(dst?: Matrix4) {
        if (dst) {
            dst.mat = mat4.negate(this.mat);
            return dst;
        }
        else {
            this.mat = mat4.negate(this.mat);
            return this;
        }
    }

    copy(m: Matrix4) {
        this.mat = mat4.copy(m.mat);
    }
    equalsApproximately(m: Matrix4) {
        return mat4.equalsApproximately(this.mat, m.mat);
    }
    equals(m: Matrix4) {
        return mat4.equals(this.mat, m.mat);
    }
    identity() {
        this.mat = mat4.identity(this.mat);
    }
    transpose(dst?: Matrix4) {
        if (dst) {
            dst.mat = mat4.transpose(this.mat);
            return dst;
        }
        else {
            this.mat = mat4.transpose(this.mat);
            return this;
        }
    }
    inverse(dst?: Matrix4) {
        if (dst) {
            dst.mat = mat4.inverse(this.mat);
            return dst;
        }
        else {
            this.mat = mat4.inverse(this.mat);
            return this;
        }
    }
    determinant() {
        return mat4.determinant(this.mat);
    }
    multiply(m: Matrix4, dst?: Matrix4) {
        if (dst) {
            dst.mat = mat4.multiply(this.mat, m.mat);
            return dst;
        }
        else {
            this.mat = mat4.multiply(this.mat, m.mat);
            return this;
        }
    }
    /**
     *  3D位移
     * @param v Vector2
     * @param dst Matrix4
     * @returns Matrix4
     */
    setTranslation(v: Vector3, dst?: Matrix4) {
        if (dst) {
            dst.mat = mat4.setTranslation(this.mat, v.vec);
            return dst;
        }
        else {
            this.mat = mat4.setTranslation(this.mat, v.vec);
            return this;
        }
    }
    getTranslation(dst?: Vector3) {
        if (dst) {
            dst.vec = mat4.getTranslation(this.mat);
            return dst;
        }
        else {
            let v = new Vector2();
            v.vec = mat4.getTranslation(this.mat);
            return v;
        }
    }
    getAxis(axis: number, dst?: Vector3) {
        if (dst) {
            dst.vec = mat4.getAxis(this.mat, axis);
            return dst;
        }
        else {
            let v = new Vector2();
            v.vec = mat4.getAxis(this.mat, axis);
            return v;
        }
    }
    setAxis(v: Vector3, axis: number, dst: Matrix4) {
        dst.mat = mat4.setAxis(this.mat, v.vec, axis, dst.mat);
        return dst;
    }
    getScaling(dst?: Vector3) {
        if (dst) {
            dst.vec = mat4.getScaling(this.mat, dst.vec);
            return dst;
        }
        else {
            let v = new Vector2();
            v.vec = mat4.getScaling(this.mat, v.vec);
            return v;
        }
    }
    perspective(fieldOfViewYInRadians: number, aspect: number, zNear: number, zFar: number) {
        this.mat = mat4.perspective(fieldOfViewYInRadians, aspect, zNear, zFar)
    }
    ortho(left: number, right: number, bottom: number, top: number, near: number, far: number) {
        this.mat = mat4.ortho(left, right, bottom, top, near, far);
    }
    frustum(left: number, right: number, bottom: number, top: number, near: number, far: number, dst?: Mat4) {
        this.mat = mat4.frustum(left, right, bottom, top, near, far);
    }
    aim(position: Vector3, target: Vector3, up: Vector3,) {
        this.mat = mat4.aim(position.vec, target.vec, up.vec)
    }
    cameraAim(position: Vector3, target: Vector3, up: Vector3,) {
        this.mat = mat4.cameraAim(position.vec, target.vec, up.vec)
    }

    lookAt(position: Vector3, target: Vector3, up: Vector3,) {
        this.mat = mat4.lookAt(position.vec, target.vec, up.vec)
    }








    translation(v: Vector3) {
        this.mat = mat4.translation(v.vec);
    }


    translate(v: Vector3, dst?: Matrix4) {
        if (dst) {
            dst.mat = mat4.translate(this.mat, v.vec);
            return dst;
        }
        else {
            this.mat = mat4.translate(this.mat, v.vec);
            return this;
        }
    }
    rotationX(angleInRadians: number, dst?: Matrix4) {
        if (dst) {
            dst.mat = mat4.rotationX(angleInRadians);
            return dst;
        }
        else {
            this.mat = mat4.rotationX(angleInRadians);
            return this;
        }
    }
    rotateX(angleInRadians: number, dst?: Matrix4) {
        if (dst) {
            dst.mat = mat4.rotateX(this.mat, angleInRadians);
            return dst;
        }
        else {
            this.mat = mat4.rotateX(this.mat, angleInRadians);
            return this;
        }
    }
    rotationY(angleInRadians: number, dst?: Matrix4) {
        if (dst) {
            dst.mat = mat4.rotationY(angleInRadians);
            return dst;
        }
        else {
            this.mat = mat4.rotationY(angleInRadians);
            return this;
        }
    }
    rotateY(angleInRadians: number, dst?: Matrix4) {
        if (dst) {
            dst.mat = mat4.rotateY(this.mat, angleInRadians);
            return dst;
        }
        else {
            this.mat = mat4.rotateY(this.mat, angleInRadians);
            return this;
        }
    }
    rotationZ(angleInRadians: number, dst?: Matrix4) {
        if (dst) {
            dst.mat = mat4.rotationZ(angleInRadians);
            return dst;
        }
        else {
            this.mat = mat4.rotationZ(angleInRadians);
            return this;
        }
    }
    rotateZ(angleInRadians: number, dst?: Matrix4) {
        if (dst) {
            dst.mat = mat4.rotateZ(this.mat, angleInRadians);
            return dst;
        }
        else {
            this.mat = mat4.rotateZ(this.mat, angleInRadians);
            return this;
        }
    }
    axisRotation(axis: Vector3, angleInRadians: number) {
        this.mat = mat4.axisRotation(axis.vec, angleInRadians);
    }
    axisRotate(axis: Vector3, angleInRadians: number, dst?: Matrix4) {

        if (dst) {
            dst.mat = mat4.axisRotate(this.mat, axis.vec, angleInRadians);
            return dst;
        }
        else {
            this.mat = mat4.axisRotate(this.mat, axis.vec, angleInRadians);
            return this;
        }
    }





    scaling(v: Vector3) {

        this.mat = mat4.scaling(v.vec);

    }
    scale(v: Vector3) {

        this.mat = mat4.scale(this.mat, v.vec);

    }
    uniformScaling(s: number) {

        this.mat = mat4.uniformScaling(s);

    }
    uniformScale(s: number, dst?: Matrix4) {
        if (dst) {
            dst.mat = mat4.uniformScale(this.mat, s);
            return dst;
        }
        else {
            this.mat = mat4.uniformScale(this.mat, s);
            return this;
        }
    }
}

export { Matrix4 }