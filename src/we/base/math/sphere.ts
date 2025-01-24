import { Box3 } from "./Box";

export interface Sphere {
    position: [number, number, number],
    radius: number,
}
export type boundingSphere = Sphere;

export function generateSphereFromBox3(box: Box3): Sphere {
    const xR=Math.max(Math.pow(box.min[0],2),Math.pow(box.max[0],2));
    const yR=Math.max(Math.pow(box.min[1],2),Math.pow(box.max[1],2));
    const zR=Math.max(Math.pow(box.min[2],2),Math.pow(box.max[2],2));
    const maxR=Math.max(xR,yR,zR);
    let sphere: Sphere = {
        position: [
            (box.min[0] + box.max[0]) / 2,
            (box.min[1] + box.max[1]) / 2,
            (box.min[2] + box.max[2]) / 2
        ],
        radius: Math.sqrt(maxR+maxR),
    }
    return sphere;
}