import { matrix } from "./matrix"
import { Mat3, Mat4, Quat } from "wgpu-matrix";
import { mat3, mat4 } from "wgpu-matrix";

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
    getAxis(axis: number,dst?: Vector2) {
        if (dst) {
            dst.vec = mat3.getAxis(this.mat);
            return dst;
        }
        else {
            let v = new Vector2();
            v.vec = mat3.getAxis(this.mat);
            return v;
        }
    }
    setAxis(axis: number,dst?: Vector2) {
        if (dst) {
            dst.vec = mat3.setAxis(this.mat);
            return dst;
        }
        else {
            let v = new Vector2();
            v.vec = mat3.setAxis(this.mat);
            return v;
        }
    }


}


export { Matrix3 }