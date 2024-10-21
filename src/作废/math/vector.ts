import { Vec2, Vec3, Vec4 } from "wgpu-matrix";


class Vector<T> {
    vec!: Vec2 | Vec3 | Vec4;
    // vec!: M;
    constructor(x?: number, y?: number, z?: number, w?: number) { }
}
// declare class Vector2 extends vec<Vector2> { }
// declare class Vector3 extends vec<Vector3> { }
// declare class Vector4 extends vec<Vector4> { }
// declare class Vector3<T extends Vector3<T>>{}
export { Vector };