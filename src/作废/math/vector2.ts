import { Vector } from "./vector"
import { Vector3 } from "./vector3"
import { vec2, vec3, vec4 } from "wgpu-matrix";
import { Vec2, Vec3, Vec4 } from "wgpu-matrix";
import { Mat3, Mat4 } from "wgpu-matrix";


class Vector2 extends Vector<Vector2> {
    vec: Vec2;

    constructor(x = 0, y = 0) {
        super();
        this.vec = vec2.create(x, y);
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
    set(x: number, y: number) {
        this.vec = vec2.set(x, y);
    }
    ceil(dst?: Vector2) {
        if (dst) {
            dst.vec = vec2.ceil(this.vec, dst.vec);
            return dst;
        }
        else {
            this.vec = vec2.ceil(this.vec);
            return this;
        }
    }
    floor(dst?: Vector2) {
        if (dst) {
            dst.vec = vec2.floor(this.vec, dst.vec);
            return dst;
        }
        else {
            this.vec = vec2.floor(this.vec);
            return this;
        }
    }
    round(dst?: Vector2) {
        if (dst) {
            dst.vec = vec2.round(this.vec, dst.vec);
            return dst;
        }
        else {
            this.vec = vec2.round(this.vec);
            return this;
        }
    }
    clamp(min = 0, max = 1, dst?: Vector2) {
        if (dst) {
            dst.vec = vec2.clamp(this.vec, min, max, dst.vec);
            return dst;
        }
        else {
            this.vec = vec2.clamp(this.vec, min, max);
            return this;
        }
    }

    add(a: Vector2, b: Vector2, dst?: Vector2) {
        if (dst) {
            dst.vec = vec2.add(a.vec, b.vec, dst.vec);
            return dst;
        }
        else {
            this.vec = vec2.add(a.vec, b.vec);
            return this;
        }
    }

    addScaled(a: Vector2, b: Vector2, scale: number, dst?: Vector2) {
        if (dst) {
            dst.vec = vec2.addScaled(a.vec, b.vec, scale, dst.vec);
            return dst;
        }
        else {
            this.vec = vec2.addScaled(a.vec, b.vec, scale);
            return this;
        }
    }
    angle(a: Vector2, b: Vector2) {
        return vec2.angle(a.vec, b.vec);
    }

    subtract(a: Vector2, b: Vector2, dst?: Vector2) {
        if (dst) {
            dst.vec = vec2.subtract(a.vec, b.vec, dst.vec);
            return dst;
        }
        else {
            this.vec = vec2.subtract(a.vec, b.vec);
            return this;
        }
    }
    equalsApproximately(b: Vector2) {
        return vec2.equalsApproximately(this.vec, b.vec);
    }
    equals(b: Vector2) {
        return vec2.equals(this.vec, b.vec);
    }
    lerp(a: Vector2, b: Vector2, t: number, dst?: Vector2) {
        if (dst) {
            dst.vec = vec2.lerp(a.vec, b.vec, t, dst.vec);
            return dst;
        }
        else {
            this.vec = vec2.lerp(a.vec, b.vec, t);
            return this;
        }
    }
    lerpV(a: Vector2, b: Vector2, t: Vector2, dst?: Vector2) {
        if (dst) {
            dst.vec = vec2.lerpV(a.vec, b.vec, t.vec, dst.vec);
            return dst;
        }
        else {
            this.vec = vec2.lerpV(a.vec, b.vec, t.vec);
            return this;
        }
    }
    max(a: Vector2, b: Vector2, dst?: Vector2) {
        if (dst) {
            dst.vec = vec2.max(a.vec, b.vec, dst.vec);
            return dst;
        }
        else {
            this.vec = vec2.max(a.vec, b.vec);
            return this;
        }
    }
    min(a: Vector2, b: Vector2, dst?: Vector2) {
        if (dst) {
            dst.vec = vec2.min(a.vec, b.vec, dst.vec);
            return dst;
        }
        else {
            this.vec = vec2.min(a.vec, b.vec);
            return this;
        }
    }

    mulScalar(v: Vector2, k: number, dst?: Vector2) {
        if (dst) {
            dst.vec = vec2.mulScalar(v.vec, k, dst.vec);
            return dst;
        }
        else {
            this.vec = vec2.mulScalar(v.vec, k);
            return this;
        }
    }
    divScalar(v: Vector2, k: number, dst?: Vector2) {
        if (dst) {
            dst.vec = vec2.divScalar(v.vec, k, dst.vec);
            return dst;
        }
        else {
            this.vec = vec2.divScalar(v.vec, k);
            return this;
        }
    }
    inverse(v: Vector2, dst?: Vector2) {
        if (dst) {
            dst.vec = vec2.inverse(v.vec, dst.vec);
            return dst;
        }
        else {
            this.vec = vec2.inverse(v.vec);
            return this;
        }
    }

    cross(a: Vector2, b: Vector2, dst?: Vector3): Vector3 {
        if (dst) {
            dst.vec = vec2.cross(a.vec, b.vec, dst.vec);
            return dst;
        }
        else {
            let dst1 = new Vector3();
            dst1.vec = vec2.cross(a.vec, b.vec,);
            return dst1;
        }
    }


    dot(a: Vector2, b: Vector2) {
        return vec2.dot(a.vec, b.vec);
    }
    length() {
        return vec2.length(this.vec);
    }
    lengthSq() {
        return vec2.lengthSq(this.vec);
    }
    distance(a: Vector2) {
        return vec2.dot(this.vec, a.vec);
    }
    distanceSq(a: Vector2) {
        return vec2.distanceSq(this.vec, a.vec);
    }

    normalize(dst?: Vector2) {
        if (dst) {
            dst.vec = vec2.normalize(this.vec, dst.vec);
            return dst;
        }
        else {
            this.vec = vec2.normalize(this.vec);
            return this;
        }
    }
    negate(dst?: Vector2) {
        if (dst) {
            dst.vec = vec2.negate(this.vec, dst.vec);
            return dst;
        }
        else {
            this.vec = vec2.negate(this.vec);
            return this;
        }
    }

    copy(dst: Vector2) {
        dst.vec = vec2.copy(this.vec, dst.vec);
        return dst;
    }
    multiply(b: Vector2, dst?: Vector3) {
        if (dst) {
            dst.vec = vec2.multiply(this.vec, b.vec, dst.vec);
            return dst;
        }
        else {
            this.vec = vec2.multiply(this.vec, b.vec,);
            return this;
        }
    }
    divide( b: Vector2, dst?: Vector3) {
        if (dst) {
            dst.vec = vec2.divide(this.vec, b.vec, dst.vec);
            return dst;
        }
        else {
            this.vec = vec2.divide(this.vec, b.vec,);
            return this;
        }
    }
    random(scale = 1, dst?: Vector3) {
        if (dst) {
            dst.vec = vec2.random(scale, dst.vec);
            return dst;
        }
        else {
            this.vec = vec2.random(scale);
            return this;
        }
    }
    zero() {
        this.vec = vec2.zero();
    }
    transformMat4(m: Mat4, dst?: Vector2) {
        if (dst) {
            dst.vec = vec2.transformMat4(this.vec, m, dst.vec);
            return dst;
        }
        else {
            this.vec = vec2.transformMat4(this.vec, m,);
            return this;
        }
    }
    transformMat3(m: Mat4, dst?: Vector2) {
        if (dst) {
            dst.vec = vec2.transformMat3(this.vec, m, dst.vec);
            return dst;
        }
        else {
            this.vec = vec2.transformMat3(this.vec, m,);
            return this;
        }
    }
    rotate(b: Vector2, rad: number, dst?: Vector2) {
        if (dst) {
            dst.vec = vec2.rotate(this.vec, b.vec, rad, dst.vec);
            return dst;
        }
        else {
            this.vec = vec2.rotate(this.vec, b.vec, rad);
            return this;
        }
    }
    setLength(len: number, dst?: Vector2) {
        if (dst) {
            dst.vec = vec2.setLength(this.vec, len, dst.vec);
            return dst;
        }
        else {
            this.vec = vec2.setLength(this.vec, len);
            return this;
        }
    }
    truncate(maxLen: number, dst?: Vector2) {
        if (dst) {
            dst.vec = vec2.truncate(this.vec, maxLen, dst.vec);
            return dst;
        }
        else {
            this.vec = vec2.truncate(this.vec, maxLen);
            return this;
        }
    }
    midpoint(b: Vector2, dst?: Vector2) {
        if (dst) {
            dst.vec = vec2.midpoint(this.vec, b.vec, dst.vec);
            return dst;
        }
        else {
            this.vec = vec2.midpoint(this.vec, b.vec);
            return this;
        }
    }

}

export { Vector2 }