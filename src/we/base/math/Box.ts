export interface Box2 {
    min: [number, number],//{ x: number, y: number },
    max: [number, number],//{ x: number, y: number },
}

export interface Box3 {
    min: [number, number, number],
    max: [number, number, number]
}
export type boundingBox = Box3;


export function generateBox2(position: number[]): Box2 {
    let box: Box2 = {
        min: [0, 0],
        max: [0, 0]
    };
    for (let i = 0; i < position.length; i += 3) {
        if (i == 0) {
            box.min[0] = position[i];
            box.min[1] = position[i + 1];

            box.max[0] = position[i];
            box.max[1] = position[i + 1];
        }
        if (position[i] > box.max[0]) {
            box.max[0] = position[i]
        }
        if (position[i] < box.min[0]) {
            box.min[0] = position[i]
        }
        if (position[i + 1] > box.max[1]) {
            box.max[1] = position[i + 1]
        }
        if (position[i + 1] < box.min[1]) {
            box.min[1] = position[i + 1]
        }
    }
    return box
}

export function generateBox3(position: number[]): Box3 {
    let box: Box3 = {
        min: [0, 0, 0],
        max: [0, 0, 0],
    }
    for (let i = 0; i < position.length; i += 3) {
        if (i == 0) {
            box.min[0] = position[i];
            box.min[1] = position[i + 1];

            box.max[0] = position[i];
            box.max[1] = position[i + 1];
        }
        if (position[i] > box.max[0]) {
            box.max[0] = position[i]
        }
        if (position[i] < box.min[0]) {
            box.min[0] = position[i]
        }
        if (position[i + 1] > box.max[1]) {
            box.max[1] = position[i + 1]
        }
        if (position[i + 1] < box.min[1]) {
            box.min[1] = position[i + 1]
        }
        if (position[i + 2] > box.max[2]) {
            box.max[2] = position[i + 2]
        }
        if (position[i + 2] < box.min[2]) {
            box.min[2] = position[i + 2]
        }
    }
    return box;
}

export function generateBox3ByArrayBox3s(Box3s: Box3[]): Box3 {
    let box: Box3 = {
        min: [0, 0, 0],
        max: [0, 0, 0],
    };
    for (let i = 0; i < Box3s.length; i++) {
        if (i == 0) {
            box = Box3s[i];
        }
        if (Box3s[i].max[0] > box.max[0]) box.max[0]=Box3s[i].max[0];
        if (Box3s[i].max[1] > box.max[1]) box.max[1]=Box3s[i].max[1];
        if (Box3s[i].max[2] > box.max[2]) box.max[2]=Box3s[i].max[2];

        if (Box3s[i].min[0] < box.min[0]) box.min[0]=Box3s[i].min[0];
        if (Box3s[i].min[1] < box.min[1]) box.min[1]=Box3s[i].min[1];
        if (Box3s[i].min[2] < box.min[2]) box.min[2]=Box3s[i].min[2];
    }
    return box;
}
export function generateBox2ByArrayBox2s(Box2s: Box2[]): Box2 {
    let box: Box2 = {
        min: [0,  0],
        max: [0,  0],
    };
    for (let i = 0; i < Box2s.length; i++) {
        if (i == 0) {
            box = Box2s[i];
        }
        if (Box2s[i].max[0] > box.max[0]) box.max[0]=Box2s[i].max[0];
        if (Box2s[i].max[1] > box.max[1]) box.max[1]=Box2s[i].max[1];

        if (Box2s[i].min[0] < box.min[0]) box.min[0]=Box2s[i].min[0];
        if (Box2s[i].min[1] < box.min[1]) box.min[1]=Box2s[i].min[1];
    }
    return box;
}