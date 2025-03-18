import { optionBaseGemetry } from "./baseGeometry";
import { CylinderGeometry, optionCylinderGeometry } from "./cylinderGeometry";

export interface optionConeGeometry extends optionBaseGemetry {

    /**  半径，默认值是1 */
    radius?: number,
    /**  高度，默认值是1 */
    height?: number,
    /**  周围的分段数，默认值是32 */
    radialSegments?: number,
    /**  侧面的分段数，默认值是1 */
    heightSegments?: number,
    /**一个Boolean值，指明该圆锥的底面是开放的还是封顶的。默认值为false，即其底面默认是封顶的。 */
    openEnded?: boolean,
    /** 第一个分段的起始角度，默认为0 */
    thetaStart?: number,
    /**  底面圆扇区的中心角，通常被称为“θ”（西塔）。默认值是2*Pi，这使其成为一个完整的圆 。 */
    thetaLength?: number,
}
export class ConeGeometry extends CylinderGeometry {
    constructor(input: optionConeGeometry) {

        let defaultValues: optionCylinderGeometry = {
            radiusTop: 0,
            radiusBottom: 1,
            height: 1,
            radialSegments: 32,
            heightSegments: 1,
            openEnded: false,
            thetaStart: 0,
            thetaLength: Math.PI * 2,
        }
        let parameters = {
            radiusTop: 0,
            radiusBottom: input.radius ?? defaultValues.radiusBottom,
            height: input.height ?? defaultValues.height,
            radialSegments: input.radialSegments ?? defaultValues.radialSegments,
            heightSegments: input.heightSegments ?? defaultValues.heightSegments,
            openEnded: input.openEnded ?? defaultValues.openEnded,
            thetaStart: input.thetaStart ?? defaultValues.thetaStart,
            thetaLength: input.thetaLength ?? defaultValues.thetaLength
        };
        parameters.radialSegments = Math.max(3, Math.floor(parameters.radialSegments as number));
        parameters.heightSegments = Math.floor(parameters.heightSegments as number);

        super(parameters);
        this.type="ConeGeometry";
    }

}