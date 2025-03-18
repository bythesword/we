import { PolyhedronGeometry } from "./polyhedronGeometry";

export class TetrahedronGeometry extends PolyhedronGeometry {
    constructor(radius: number = 1, detail: number = 0) {
        const vertices = [
            1, 1, 1,
            - 1, - 1, 1,
            - 1, 1, - 1,
            1, - 1, - 1
        ];

        const indices = [
            2, 1, 0,
            0, 3, 2,
            1, 3, 0,
            2, 3, 1
        ];
        super({ vertices, indices, radius, detail });
        this.type = 'TetrahedronGeometry';
    }
}