
import { Vec2, Vec3, Vec4, vec2, vec3, vec4, mat3, mat4, Mat3, Mat4, Quat, quat, } from "wgpu-matrix";
export type RotationOrder = 'xyz' | 'xzy' | 'yxz' | 'yzx' | 'zxy' | 'zyx';
import { Vector3 } from "./vector3"
import { Vector2 } from "./vector2"
import { Matrix3 } from "./matrix3";
import { Matrix4 } from "./matrix4";


class Quatemion<T extends Quatemion<T>> {
    quat!: Quat;
    constructor(x?: number, y?: number, z?: number, w?: number) {
        this.quat = quat.create(x, y, z, w);
    }
    set(x: number, y: number, z: number, w: number) {
        this.quat = quat.set(x, y, z, w);
    }
    fromAxisAngle(axis: Vec3, angleInRadians: number) {
        this.quat = quat.fromAxisAngle(axis, angleInRadians);
    }
    toAxisAngle(): { angle: number, axis: Vector3 } {
        let v = new Vector3();
        let a = quat.toAxisAngle(this.quat);
        v.vec = a.axis;
        let b = { angle: a.angle, axis: v };
        return b;
    }

    angle(b: Quatemion<T>) {
        return quat.angle(this.quat, b.quat);
    }
    multiply(b: Quatemion<T>, dst?: Quatemion<T>) {
        let Q = quat.multiply(this.quat, b.quat);
        if (dst) {
            dst.quat = Q;
            return Q;
        }
        else {
            this.quat = Q;
            return this;
        }
    }
    rotateX(angleInRadians: number, dst?: Quatemion<T>) {
        let Q = quat.rotateX(this.quat, angleInRadians);
        if (dst) {
            dst.quat = Q;
            return Q;
        }
        else {
            this.quat = Q;
            return this;
        }
    }
    rotateY(angleInRadians: number, dst?: Quatemion<T>) {
        let Q = quat.rotateY(this.quat, angleInRadians);
        if (dst) {
            dst.quat = Q;
            return Q;
        }
        else {
            this.quat = Q;
            return this;
        }
    }
    rotateZ(angleInRadians: number, dst?: Quatemion<T>) {
        let Q = quat.rotateZ(this.quat, angleInRadians);
        if (dst) {
            dst.quat = Q;
            return Q;
        }
        else {
            this.quat = Q;
            return this;
        }
    }
    slerp(b: Quatemion<T>, t: number, dst?: Quatemion<T>) {
        let Q = quat.slerp(this.quat, b.quat, t);
        if (dst) {
            dst.quat = Q;
            return Q;
        }
        else {
            this.quat = Q;
            return this;
        }
    }
    inverse(dst?: Quatemion<T>) {
        let Q = quat.inverse(this.quat);
        if (dst) {
            dst.quat = Q;
            return Q;
        }
        else {
            this.quat = Q;
            return this;
        }
    }
    conjugate(dst?: Quatemion<T>) {
        let Q = quat.conjugate(this.quat);
        if (dst) {
            dst.quat = Q;
            return Q;
        }
        else {
            this.quat = Q;
            return this;
        }
    }
    fromMat(m: Matrix3 | Matrix4) {
        this.quat = quat.fromMat(m.mat)
    }
    fromEuler(
        xAngleInRadians: number,
        yAngleInRadians: number,
        zAngleInRadians: number,
        order: RotationOrder) {
        this.quat = quat.fromEuler(
            xAngleInRadians,
            yAngleInRadians,
            zAngleInRadians,
            order)
    }
    copy(dst: Quatemion<T>) {
        dst.quat = quat.copy(this.quat);
        return dst;
    }

    add(b: Quatemion<T>, dst?: Quatemion<T>) {
        let Q = quat.add(this.quat, b.quat);
        if (dst) {
            dst.quat = Q;
            return Q;
        }
        else {
            this.quat = Q;
            return this;
        }
    }
    subtract(b: Quatemion<T>, dst?: Quatemion<T>) {
        let Q = quat.subtract(this.quat, b.quat);
        if (dst) {
            dst.quat = Q;
            return Q;
        }
        else {
            this.quat = Q;
            return this;
        }
    }
    mulScalar(k: number, dst?: Quatemion<T>) {
        let Q = quat.mulScalar(this.quat, k);
        if (dst) {
            dst.quat = Q;
            return Q;
        }
        else {
            this.quat = Q;
            return this;
        }
    }
    divScalar(k: number, dst?: Quatemion<T>) {
        let Q = quat.divScalar(this.quat, k);
        if (dst) {
            dst.quat = Q;
            return Q;
        }
        else {
            this.quat = Q;
            return this;
        }
    }
    dot(b: Quatemion<T>): number {
        return quat.dot(this.quat, b.quat);
    }

    lerp(b: Quatemion<T>, t: number, dst?: Quatemion<T>) {
        let Q = quat.lerp(this.quat, b.quat, t);
        if (dst) {
            dst.quat = Q;
            return Q;
        }
        else {
            this.quat = Q;
            return this;
        }
    }
    length(): number {
        return quat.length(this.quat);
    }
    lengthSq(): number {
        return quat.lengthSq(this.quat);
    }
    normalize(dst?: Quatemion<T>) {
        let Q = quat.normalize(this.quat);
        if (dst) {
            dst.quat = Q;
            return Q;
        }
        else {
            this.quat = Q;
            return this;
        }
    }
    equalsApproximately(b: Quatemion<T>) {
        return quat.equalsApproximately(this.quat, b.quat);
    }
    equals(b: Quatemion<T>) {
        return quat.equals(this.quat, b.quat);
    }

    identity() {
        this.quat = quat.identity();
    }

    rotationTo(aUnit: Vector3, bUnit: Vector3) {
        this.quat = quat.rotationTo(aUnit.vec, bUnit.vec)
    }
    sqlerp(
        b: Quatemion<T>,
        c: Quatemion<T>,
        d: Quatemion<T>,
        t: number,
        dst?: Quatemion<T>) {
        let Q = quat.sqlerp(this.quat, b.quat, c.quat, d.quat, t);
        if (dst) {
            dst.quat = Q;
            return Q;
        }
        else {
            this.quat = Q;
            return this;
        }
    }


}

export { Quatemion }