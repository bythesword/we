import { matrix } from "./matrix"
import { Vec2, Vec3, Vec4, vec2, vec3, vec4, mat3, mat4, Mat3, Mat4, Quat } from "wgpu-matrix";

import { Vector3 } from "./vector3"
import { Vector2 } from "./vector2"


class Matrix3 extends matrix<Matrix3> {

    constructor(v0?: number, v1?: number, v2?: number, v3?: number,
        v4?: number, v5?: number, v6?: number, v7?: number,
        v8?: number, v9?: number, v10?: number, v11?: number,
        v12?: number, v13?: number, v14?: number, v15?: number) {
        super();
        this.mat = mat3.create(v0, v1, v2,
            v3, v4, v5,
            v6, v7, v8
        );
    }
    set(
        v0: number, v1: number, v2: number,
        v3: number, v4: number, v5: number,
        v6: number, v7: number, v8: number) {
        this.mat = mat3.set(v0, v1, v2,
            v3, v4, v5,
            v6, v7, v8
        );
    }

    fromMat4(m4: Mat4) {
        this.mat = mat3.fromMat4(m4);
    }

    fromQuat(q: Quat) {
        this.mat = mat3.fromQuat(q);
    }
    negate(dst?: Matrix3) {
        if (dst) {
            dst.mat = mat3.negate(this.mat);
            return dst;
        }
        else {
            this.mat = mat3.negate(this.mat);
            return this;
        }
    }

    copy(m: Matrix3) {
        this.mat = mat3.copy(m.mat);
    }
    equalsApproximately(m: Matrix3) {
        return mat3.equalsApproximately(this.mat, m.mat);
    }
    equals(m: Matrix3) {
        return mat3.equals(this.mat, m.mat);
    }
    identity() {
        this.mat = mat3.identity(this.mat);
    }
    transpose(dst?: Matrix3) {
        if (dst) {
            dst.mat = mat3.transpose(this.mat);
            return dst;
        }
        else {
            this.mat = mat3.transpose(this.mat);
            return this;
        }
    }
    inverse(dst?: Matrix3) {
        if (dst) {
            dst.mat = mat3.inverse(this.mat);
            return dst;
        }
        else {
            this.mat = mat3.inverse(this.mat);
            return this;
        }
    }
    determinant() {
        return mat3.determinant(this.mat);
    }
    multiply(m: Matrix3, dst?: Matrix3) {
        if (dst) {
            dst.mat = mat3.multiply(this.mat, m.mat);
            return dst;
        }
        else {
            this.mat = mat3.multiply(this.mat, m.mat);
            return this;
        }
    }
    /**
     *  2D平移
     * @param v Vector2
     * @param dst Matrix3
     * @returns Matrix3
     */
    setTranslation(v: Vector2, dst?: Matrix3) {
        if (dst) {
            dst.mat = mat3.setTranslation(this.mat, v.vec);
            return dst;
        }
        else {
            this.mat = mat3.setTranslation(this.mat, v.vec);
            return this;
        }
    }
    getTranslation(dst?: Vector2) {
        if (dst) {
            dst.vec = mat3.getTranslation(this.mat);
            return dst;
        }
        else {
            let v = new Vector2();
            v.vec = mat3.getTranslation(this.mat);
            return v;
        }
    }
    getAxis(axis: number, dst?: Vector2) {
        if (dst) {
            dst.vec = mat3.getAxis(this.mat, axis);
            return dst;
        }
        else {
            let v = new Vector2();
            v.vec = mat3.getAxis(this.mat, axis);
            return v;
        }
    }
    setAxis(v: Vector2, axis: number) {
        this.mat = mat3.setAxis(this.mat, v.vec, axis);
    }
    getScaling(dst?: Vector2) {
        if (dst) {
            dst.vec = mat3.getScaling(this.mat, dst.vec);
            return dst;
        }
        else {
            let v = new Vector2();
            v.vec = mat3.getScaling(this.mat, v.vec);
            return v;
        }
    }
    translation(v: Vector2) {
        this.mat = mat3.translation(v.vec);
    }

    translate(v: Vector2, dst?: Matrix3) {
        if (dst) {
            dst.mat = mat3.translate(this.mat, v.vec);
            return dst;
        }
        else {
            this.mat = mat3.translate(this.mat, v.vec);
            return this;
        }
    }
    rotation(angleInRadians: number, dst?: Matrix3) {
        if (dst) {
            dst.mat = mat3.rotation(angleInRadians);
            return dst;
        }
        else {
            this.mat = mat3.rotation(angleInRadians);
            return this;
        }
    }
    rotate(angleInRadians: number, dst?: Matrix3) {
        if (dst) {
            dst.mat = mat3.rotate(this.mat, angleInRadians);
            return dst;
        }
        else {
            this.mat = mat3.rotate(this.mat, angleInRadians);
            return this;
        }
    }
    scaling(v: Vector2, dst?: Matrix3) {
        if (dst) {
            dst.mat = mat3.scaling(v.vec);
            return dst;
        }
        else {
            this.mat = mat3.scaling(v.vec);
            return this;
        }
    }
    scale(v: Vector2, dst?: Matrix3) {
        if (dst) {
            dst.mat = mat3.scale(this.mat, v.vec);
            return dst;
        }
        else {
            this.mat = mat3.scale(this.mat, v.vec);
            return this;
        }
    }
    uniformScaling(s: number) {

        this.mat = mat3.uniformScaling(s);

    }
    uniformScale(s: number, dst?: Matrix3) {
        if (dst) {
            dst.mat = mat3.uniformScale(this.mat, s);
            return dst;
        }
        else {
            this.mat = mat3.uniformScale(this.mat, s);
            return this;
        }
    }
}


export { Matrix3 }