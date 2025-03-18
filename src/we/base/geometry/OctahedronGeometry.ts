import { PolyhedronGeometry } from "./polyhedronGeometry"


export class OctahedronGeometry extends PolyhedronGeometry {
    constructor(radius: number = 1, detail: number = 0) {
        const vertices = [
			1, 0, 0, 	- 1, 0, 0,	0, 1, 0,
			0, - 1, 0, 	0, 0, 1,	0, 0, - 1
		];

		const indices = [
			0, 2, 4,	0, 4, 3,	0, 3, 5,
			0, 5, 2,	1, 2, 5,	1, 5, 3,
			1, 3, 4,	1, 4, 2
		];

        super({vertices, indices, radius, detail});

        this.type = 'OctahedronGeometry';

    }

}