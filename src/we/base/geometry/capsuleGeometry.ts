import { optionBaseGemetry } from "./baseGeometry";
import { LatheGeometry, optionLatheGeometry } from "./LatheGeometry";

export interface optionCapsuleGeometry extends optionBaseGemetry {
    /** 胶囊半径。可选的; 默认值为1。*/
    radius: number,
    /** 中间区域的长度。可选的; 默认值为1。 */
    length: number,
    /**— 构造盖子的曲线部分的个数。可选的; 默认值为4。 */
    capSegments: number,
    /**— 覆盖胶囊圆周的分离的面的个数。可选的; 默认值为8。 */
    radialSegments: number,


}
class CapsuleGeometry extends LatheGeometry {
   

    constructor(radius = 1, length = 1, capSegments = 4, radialSegments = 8) {

        //todo,20250222
        const path = new Path();
        path.absarc(0, - length / 2, radius, Math.PI * 1.5, 0);
        path.absarc(0, length / 2, radius, 0, Math.PI * 0.5);

        super({
            points: path.getPoints(capSegments),
            segments: radialSegments,
            phiStart: 0,
            phiLength: Math.PI * 2
        });

        this.type = 'CapsuleGeometry';

        // this.parameters = {
        //     radius: radius,
        //     length: length,
        //     capSegments: capSegments,
        //     radialSegments: radialSegments,
        // };

    }


}

export { CapsuleGeometry };