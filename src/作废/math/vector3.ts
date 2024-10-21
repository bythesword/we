import { Vector } from "./vector"
import { vec2, vec3, vec4 } from "wgpu-matrix";
import { Vec2, Vec3, Vec4 } from "wgpu-matrix";
import { Mat3, Mat4, Quat } from "wgpu-matrix";


class Vector3 extends Vector<Vector3> {
    vec: Vec3;

    constructor(x = 0, y = 0, z = 0) {
        super();
        this.vec = vec3.create(x, y, z);
    }
    clone() {
        return new this.constructor.prototype.constructor(this.vec[0], this.vec[1]);
    }
    get x() {
        return this.vec[0];
    }
    set x(x: number) {
        this.vec[0] = x;
    }

    get y() {
        return this.vec[1];
    }
    set y(x: number) {
        this.vec[1] = x;
    }
    get z() {
        return this.vec[2];
    }
    set z(x: number) {
        this.vec[2] = x;
    }
    set(x: number, y: number, z: number) {
        this.vec = vec3.set(x, y, z);
    }
    ceil(dst?: Vector3) {
        if (dst) {
            dst.vec = vec3.ceil(this.vec, dst.vec);
            return dst;
        }
        else {
            this.vec = vec3.ceil(this.vec);
            return this;
        }
    }
    floor(dst?: Vector3) {
        if (dst) {
            dst.vec = vec3.floor(this.vec, dst.vec);
            return dst;
        }
        else {
            this.vec = vec3.floor(this.vec);
            return this;
        }
    }
    round(dst?: Vector3) {
        if (dst) {
            dst.vec = vec3.round(this.vec, dst.vec);
            return dst;
        }
        else {
            this.vec = vec3.round(this.vec);
            return this;
        }
    }
    clamp(min = 0, max = 1, dst?: Vector3) {
        if (dst) {
            dst.vec = vec3.clamp(this.vec, min, max, dst.vec);
            return dst;
        }
        else {
            this.vec = vec3.clamp(this.vec, min, max);
            return this;
        }
    }

    add(a: Vector3, b: Vector3, dst?: Vector3) {
        if (dst) {
            dst.vec = vec3.add(a.vec, b.vec, dst.vec);
            return dst;
        }
        else {
            this.vec = vec3.add(a.vec, b.vec);
            return this;
        }
    }

    addScaled(a: Vector3, b: Vector3, scale: number, dst?: Vector3) {
        if (dst) {
            dst.vec = vec3.addScaled(a.vec, b.vec, scale, dst.vec);
            return dst;
        }
        else {
            this.vec = vec3.addScaled(a.vec, b.vec, scale);
            return this;
        }
    }
    angle(a: Vector3, b: Vector3) {
        return vec3.angle(a.vec, b.vec);
    }

    subtract(a: Vector3, b: Vector3, dst?: Vector3) {
        if (dst) {
            dst.vec = vec3.subtract(a.vec, b.vec, dst.vec);
            return dst;
        }
        else {
            this.vec = vec3.subtract(a.vec, b.vec);
            return this;
        }
    }
    equalsApproximately(b: Vector3) {
        return vec3.equalsApproximately(this.vec, b.vec);
    }
    equals(b: Vector3) {
        return vec3.equals(this.vec, b.vec);
    }
    lerp(a: Vector3, b: Vector3, t: number, dst?: Vector3) {
        if (dst) {
            dst.vec = vec3.lerp(a.vec, b.vec, t, dst.vec);
            return dst;
        }
        else {
            this.vec = vec3.lerp(a.vec, b.vec, t);
            return this;
        }
    }
    lerpV(a: Vector3, b: Vector3, t: Vector3, dst?: Vector3) {
        if (dst) {
            dst.vec = vec3.lerpV(a.vec, b.vec, t.vec, dst.vec);
            return dst;
        }
        else {
            this.vec = vec3.lerpV(a.vec, b.vec, t.vec);
            return this;
        }
    }
    max(a: Vector3, b: Vector3, dst?: Vector3) {
        if (dst) {
            dst.vec = vec3.max(a.vec, b.vec, dst.vec);
            return dst;
        }
        else {
            this.vec = vec3.max(a.vec, b.vec);
            return this;
        }
    }
    min(a: Vector3, b: Vector3, dst?: Vector3) {
        if (dst) {
            dst.vec = vec3.min(a.vec, b.vec, dst.vec);
            return dst;
        }
        else {
            this.vec = vec3.min(a.vec, b.vec);
            return this;
        }
    }

    mulScalar(v: Vector3, k: number, dst?: Vector3) {
        if (dst) {
            dst.vec = vec3.mulScalar(v.vec, k, dst.vec);
            return dst;
        }
        else {
            this.vec = vec3.mulScalar(v.vec, k);
            return this;
        }
    }
    divScalar(v: Vector3, k: number, dst?: Vector3) {
        if (dst) {
            dst.vec = vec3.divScalar(v.vec, k, dst.vec);
            return dst;
        }
        else {
            this.vec = vec3.divScalar(v.vec, k);
            return this;
        }
    }
    inverse(v: Vector3, dst?: Vector3) {
        if (dst) {
            dst.vec = vec3.inverse(v.vec, dst.vec);
            return dst;
        }
        else {
            this.vec = vec3.inverse(v.vec);
            return this;
        }
    }

    cross(a: Vector3, b: Vector3, dst?: Vector3): Vector3 {
        if (dst) {
            dst.vec = vec3.cross(a.vec, b.vec, dst.vec);
            return dst;
        }
        else {
            let dst1 = new Vector3();
            dst1.vec = vec3.cross(a.vec, b.vec,);
            return dst1;
        }
    }



    dot(a: Vector3, b: Vector3) {
        return vec3.dot(a.vec, b.vec);
    }
    length() {
        return vec3.length(this.vec);
    }
    lengthSq() {
        return vec3.lengthSq(this.vec);
    }
    distance(a: Vector3) {
        return vec3.dot(this.vec, a.vec);
    }
    distanceSq(a: Vector3) {
        return vec3.distanceSq(this.vec, a.vec);
    }

    normalize(dst?: Vector3) {
        if (dst) {
            dst.vec = vec3.normalize(this.vec, dst.vec);
            return dst;
        }
        else {
            this.vec = vec3.normalize(this.vec);
            return this;
        }
    }
    negate(dst?: Vector3) {
        if (dst) {
            dst.vec = vec3.negate(this.vec, dst.vec);
            return dst;
        }
        else {
            this.vec = vec3.negate(this.vec);
            return this;
        }
    }

    copy(dst: Vector3) {
        dst.vec = vec3.copy(this.vec, dst.vec);
        return dst;
    }
    multiply(b: Vector3, dst?: Vector3) {
        if (dst) {
            dst.vec = vec3.multiply(this.vec, b.vec, dst.vec);
            return dst;
        }
        else {
            this.vec = vec3.multiply(this.vec, b.vec,);
            return this;
        }
    }
    divide(b: Vector3, dst?: Vector3) {
        if (dst) {
            dst.vec = vec3.divide(this.vec, b.vec, dst.vec);
            return dst;
        }
        else {
            this.vec = vec3.divide(this.vec, b.vec,);
            return this;
        }
    }
    random(scale = 1, dst?: Vector3) {
        if (dst) {
            dst.vec = vec3.random(scale, dst.vec);
            return dst;
        }
        else {
            this.vec = vec3.random(scale);
            return this;
        }
    }
    zero() {
        this.vec = vec3.zero();
    }
    transformMat4(m: Mat4, dst?: Vector3) {
        if (dst) {
            dst.vec = vec3.transformMat4(this.vec, m, dst.vec);
            return dst;
        }
        else {
            this.vec = vec3.transformMat4(this.vec, m,);
            return this;
        }
    }
    transformMat4Upper3x3(m: Mat4, dst?: Vector3) {
        if (dst) {
            dst.vec = vec3.transformMat4Upper3x3(this.vec, m, dst.vec);
            return dst;
        }
        else {
            this.vec = vec3.transformMat4Upper3x3(this.vec, m,);
            return this;
        }
    }
    transformMat3(m: Mat4, dst?: Vector3) {
        if (dst) {
            dst.vec = vec3.transformMat3(this.vec, m, dst.vec);
            return dst;
        }
        else {
            this.vec = vec3.transformMat3(this.vec, m,);
            return this;
        }
    }
    transformQuat(q: Quat, dst?: Vector3) {
        if (dst) {
            dst.vec = vec3.transformQuat(this.vec, q, dst.vec);
            return dst;
        }
        else {
            this.vec = vec3.transformQuat(this.vec, q,);
            return this;
        }
    }
    getTranslation(m: Mat3, dst?: Vector3) {
        if (dst) {
            dst.vec = vec3.getTranslation(m, dst.vec);
            return dst;
        }
        else {
            this.vec = vec3.getTranslation(m);
            return this;
        }
    }
    getAxis(m: Mat4, axis: number, dst?: Vector3) {
        if (dst) {
            dst.vec = vec3.getAxis(m, axis, dst.vec);
            return dst;
        }
        else {
            this.vec = vec3.getAxis(m, axis);
            return this;
        }
    }
    getScaling(m: Mat4) {
        this.vec = vec3.getScaling(m, this.vec);
    }

    rotateX(b: Vector3, rad: number, dst?: Vector3) {
        if (dst) {
            dst.vec = vec3.rotateX(this.vec, b.vec, rad, dst.vec);
            return dst;
        }
        else {
            this.vec = vec3.rotateX(this.vec, b.vec, rad);
            return this;
        }
    }
    rotateY(b: Vector3, rad: number, dst?: Vector3) {
        if (dst) {
            dst.vec = vec3.rotateY(this.vec, b.vec, rad, dst.vec);
            return dst;
        }
        else {
            this.vec = vec3.rotateY(this.vec, b.vec, rad);
            return this;
        }
    }
    rotateZ(b: Vector3, rad: number, dst?: Vector3) {
        if (dst) {
            dst.vec = vec3.rotateZ(this.vec, b.vec, rad, dst.vec);
            return dst;
        }
        else {
            this.vec = vec3.rotateZ(this.vec, b.vec, rad);
            return this;
        }
    }

    setLength(len: number, dst?: Vector3) {
        if (dst) {
            dst.vec = vec3.setLength(this.vec, len, dst.vec);
            return dst;
        }
        else {
            this.vec = vec3.setLength(this.vec, len);
            return this;
        }
    }
    truncate(maxLen: number, dst?: Vector3) {
        if (dst) {
            dst.vec = vec3.truncate(this.vec, maxLen, dst.vec);
            return dst;
        }
        else {
            this.vec = vec3.truncate(this.vec, maxLen);
            return this;
        }
    }
    midpoint(b: Vector3, dst?: Vector3) {
        if (dst) {
            dst.vec = vec3.midpoint(this.vec, b.vec, dst.vec);
            return dst;
        }
        else {
            this.vec = vec3.midpoint(this.vec, b.vec);
            return this;
        }
    }

}

export { Vector3 }