/**
 * 一个彩色立方体，边长=2.0
 */
import { BoxGeometry, optionBoxGemetry } from "./boxGeometry"; 
import oneColorCubeVS from "../shader/geometry/OneColorCube.vs.wgsl?raw"


export class OneColorCube extends BoxGeometry {

    width: number;

    constructor(width = 2) {

        let option: optionBoxGemetry = {
            width: width,
            height: width,
            depth: width
        }
        super(option);
        this.width = width;
        this.type = "OneColorCube";
    }
    /**覆写了这个function
     * 
     * 增加了@location(4) fsPosition:vec4f, @location(5) cubeUV:vec3f,
     * 
     * 
     * 适用于cube的三维UV
     */
    getCodeVS() {
        let width = this.width / 2;
        //这个比正常的geometry的vs多了fsPosition
        let code=oneColorCubeVS;
        code=code.replaceAll("$width", width.toString());
        return code;
    }



    generateColorArray(_length: number, _color = [1, 1, 1]) {
        /*
          4 ——————————————  1
          / |          / |
         /  |         /  |        
       6 ————————————  0 |          
        |   |        |   |      
        |   |5       |   |        
        | / —————————|——— 3
        |/           |  /
     7  —————————————— / 2  
          
        */
        //这个颜色不能与每个点对应上，todo
        let colorsArray = [
            1, 0, 1, 1,
            0, 0, 1, 1,
            0, 0, 0, 1,
            1, 0, 0, 1,
            1, 0, 1, 1,
            0, 0, 0, 1,

            1, 1, 1, 1,
            1, 0, 1, 1,
            1, 0, 0, 1,
            1, 1, 0, 1,
            1, 1, 1, 1,
            1, 0, 0, 1,

            0, 1, 1, 1,
            1, 1, 1, 1,
            1, 1, 0, 1,
            0, 1, 0, 1,
            0, 1, 1, 1,
            1, 1, 0, 1,

            0, 0, 1, 1,
            0, 1, 1, 1,
            0, 1, 0, 1,
            0, 0, 0, 1,
            0, 0, 1, 1,
            0, 1, 0, 1,

            1, 1, 1, 1,
            0, 1, 1, 1,
            0, 0, 1, 1,
            0, 0, 1, 1,
            1, 0, 1, 1,
            1, 1, 1, 1,

            1, 0, 0, 1,
            0, 0, 0, 1,
            0, 1, 0, 1,
            1, 1, 0, 1,
            1, 0, 0, 1,
            0, 1, 0, 1,]
            ;

        return colorsArray;
    }


}