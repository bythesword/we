import { Vector } from "./vector"
import { vec2, vec3, vec4 } from "wgpu-matrix";
import { Vec2, Vec3, Vec4 } from "wgpu-matrix";
import { Mat3, Mat4, Quat } from "wgpu-matrix";


class Vector4 extends Vector<Vector4> {
    vec: Vec4;

    constructor(x = 0, y = 0, z = 0, w = 0) {
        super();
        this.vec = vec4.create(x, y, z, w);
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
    get w() {
        return this.vec[3];
    }
    set w(x: number) {
        this.vec[3] = x;
    }
    set(x: number, y: number, z: number, w: number) {
        this.vec = vec4.set(x, y, z, w);
    }
    ceil(dst?: Vector4) {
        if (dst) {
            dst.vec = vec4.ceil(this.vec, dst.vec);
            return dst;
        }
        else {
            this.vec = vec4.ceil(this.vec);
            return this;
        }
    }
    floor(dst?: Vector4) {
        if (dst) {
            dst.vec = vec4.floor(this.vec, dst.vec);
            return dst;
        }
        else {
            this.vec = vec4.floor(this.vec);
            return this;
        }
    }
    round(dst?: Vector4) {
        if (dst) {
            dst.vec = vec4.round(this.vec, dst.vec);
            return dst;
        }
        else {
            this.vec = vec4.round(this.vec);
            return this;
        }
    }
    clamp(min = 0, max = 1, dst?: Vector4) {
        if (dst) {
            dst.vec = vec4.clamp(this.vec, min, max, dst.vec);
            return dst;
        }
        else {
            this.vec = vec4.clamp(this.vec, min, max);
            return this;
        }
    }

    add(a: Vector4, b: Vector4, dst?: Vector4) {
        if (dst) {
            dst.vec = vec4.add(a.vec, b.vec, dst.vec);
            return dst;
        }
        else {
            this.vec = vec4.add(a.vec, b.vec);
            return this;
        }
    }

    addScaled(a: Vector4, b: Vector4, scale: number, dst?: Vector4) {
        if (dst) {
            dst.vec = vec4.addScaled(a.vec, b.vec, scale, dst.vec);
            return dst;
        }
        else {
            this.vec = vec4.addScaled(a.vec, b.vec, scale);
            return this;
        }
    }


    subtract(a: Vector4, b: Vector4, dst?: Vector4) {
        if (dst) {
            dst.vec = vec4.subtract(a.vec, b.vec, dst.vec);
            return dst;
        }
        else {
            this.vec = vec4.subtract(a.vec, b.vec);
            return this;
        }
    }
    equalsApproximately(b: Vector4) {
        return vec4.equalsApproximately(this.vec, b.vec);
    }
    equals(b: Vector4) {
        return vec4.equals(this.vec, b.vec);
    }
    lerp(a: Vector4, b: Vector4, t: number, dst?: Vector4) {
        if (dst) {
            dst.vec = vec4.lerp(a.vec, b.vec, t, dst.vec);
            return dst;
        }
        else {
            this.vec = vec4.lerp(a.vec, b.vec, t);
            return this;
        }
    }
    lerpV(a: Vector4, b: Vector4, t: Vector4, dst?: Vector4) {
        if (dst) {
            dst.vec = vec4.lerpV(a.vec, b.vec, t.vec, dst.vec);
            return dst;
        }
        else {
            this.vec = vec4.lerpV(a.vec, b.vec, t.vec);
            return this;
        }
    }
    max(a: Vector4, b: Vector4, dst?: Vector4) {
        if (dst) {
            dst.vec = vec4.max(a.vec, b.vec, dst.vec);
            return dst;
        }
        else {
            this.vec = vec4.max(a.vec, b.vec);
            return this;
        }
    }
    min(a: Vector4, b: Vector4, dst?: Vector4) {
        if (dst) {
            dst.vec = vec4.min(a.vec, b.vec, dst.vec);
            return dst;
        }
        else {
            this.vec = vec4.min(a.vec, b.vec);
            return this;
        }
    }

    mulScalar(v: Vector4, k: number, dst?: Vector4) {
        if (dst) {
            dst.vec = vec4.mulScalar(v.vec, k, dst.vec);
            return dst;
        }
        else {
            this.vec = vec4.mulScalar(v.vec, k);
            return this;
        }
    }
    divScalar(v: Vector4, k: number, dst?: Vector4) {
        if (dst) {
            dst.vec = vec4.divScalar(v.vec, k, dst.vec);
            return dst;
        }
        else {
            this.vec = vec4.divScalar(v.vec, k);
            return this;
        }
    }
    inverse(v: Vector4, dst?: Vector4) {
        if (dst) {
            dst.vec = vec4.inverse(v.vec, dst.vec);
            return dst;
        }
        else {
            this.vec = vec4.inverse(v.vec);
            return this;
        }
    }





    dot(a: Vector4, b: Vector4) {
        return vec4.dot(a.vec, b.vec);
    }
    length() {
        return vec4.length(this.vec);
    }
    lengthSq() {
        return vec4.lengthSq(this.vec);
    }
    distance(a: Vector4) {
        return vec4.dot(this.vec, a.vec);
    }
    distanceSq(a: Vector4) {
        return vec4.distanceSq(this.vec, a.vec);
    }

    normalize(dst?: Vector4) {
        if (dst) {
            dst.vec = vec4.normalize(this.vec, dst.vec);
            return dst;
        }
        else {
            this.vec = vec4.normalize(this.vec);
            return this;
        }
    }
    negate(dst?: Vector4) {
        if (dst) {
            dst.vec = vec4.negate(this.vec, dst.vec);
            return dst;
        }
        else {
            this.vec = vec4.negate(this.vec);
            return this;
        }
    }

    copy(dst: Vector4) {
        dst.vec = vec4.copy(this.vec, dst.vec);
        return dst;
    }
    multiply(b: Vector4, dst?: Vector4) {
        if (dst) {
            dst.vec = vec4.multiply(this.vec, b.vec, dst.vec);
            return dst;
        }
        else {
            this.vec = vec4.multiply(this.vec, b.vec,);
            return this;
        }
    }
    divide(b: Vector4, dst?: Vector4) {
        if (dst) {
            dst.vec = vec4.divide(this.vec, b.vec, dst.vec);
            return dst;
        }
        else {
            this.vec = vec4.divide(this.vec, b.vec,);
            return this;
        }
    }

    zero() {
        this.vec = vec4.zero();
    }
    transformMat4(m: Mat4, dst?: Vector4) {
        if (dst) {
            dst.vec = vec4.transformMat4(this.vec, m, dst.vec);
            return dst;
        }
        else {
            this.vec = vec4.transformMat4(this.vec, m,);
            return this;
        }
    }




    setLength(len: number, dst?: Vector4) {
        if (dst) {
            dst.vec = vec4.setLength(this.vec, len, dst.vec);
            return dst;
        }
        else {
            this.vec = vec4.setLength(this.vec, len);
            return this;
        }
    }
    truncate(maxLen: number, dst?: Vector4) {
        if (dst) {
            dst.vec = vec4.truncate(this.vec, maxLen, dst.vec);
            return dst;
        }
        else {
            this.vec = vec4.truncate(this.vec, maxLen);
            return this;
        }
    }
    midpoint(b: Vector4, dst?: Vector4) {
        if (dst) {
            dst.vec = vec4.midpoint(this.vec, b.vec, dst.vec);
            return dst;
        }
        else {
            this.vec = vec4.midpoint(this.vec, b.vec);
            return this;
        }
    }

}

export { Vector4 }