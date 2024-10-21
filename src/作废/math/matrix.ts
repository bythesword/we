import { Mat3, Mat4, Quat } from "wgpu-matrix";


class matrix<T> {
    mat!: Mat3 | Mat4;
    // vec!: M;
    constructor(v0?: number, v1?: number, v2?: number, v3?: number,
        v4?: number, v5?: number, v6?: number, v7?: number,
        v8?: number, v9?: number, v10?: number, v11?: number,
        v12?: number, v13?: number, v14?: number, v15?: number) { }
}

export { matrix };