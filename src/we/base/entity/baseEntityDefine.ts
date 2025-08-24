import { Mat4, Vec3 } from "wgpu-matrix";
import { BaseStage } from "../stage/baseStage";
import { BaseMaterial } from "../material/baseMaterial";
import { optionUpdate, renderKindForDCCC } from "../const/coreConst";




export interface meshConstantsVS {
    uvScale_u?: number,
    uvScale_v?: number,
    uvOffset_x?: number,
    uvOffset_y?: number
}
/**
 * createDCCC的参数
 * 
 */
export interface valuesForCreateDCCC {
    parent: BaseStage,
    id: string,//camera id or light id 
    kind: renderKindForDCCC,//enmu 
    matrixIndex?: number,//matrix of light MVP[]
}


export type positionArray = Float32Array | Float64Array | Uint8Array | Uint16Array | Uint32Array;


export interface geometryBufferOfEntity {
    /**索引buffer
     * 非必须 
     * 索引模型应该有2的256次方的大小限制，todo(webGPU 是否相同，20240813)
     */
    index?: Uint32Array,
    /** 
     * 可以是一个，也可以是多个属性合一的buffer
           三角形：多属性合一的概念示例
                position: positionArray,float32x3          
                normal?: Float32Array,float32x3
                uv?: Float32Array,     float32x2
                color?: Uint8Array,    Uint8x4
            线段：
                position
                color?
                uv?
            点：
                position
                color?
     */
    position: positionArray,
    /** 单个数据宽度 */
    arrayStride: number,
    /**
     * 多种primitive 模式
     *  数据匹配性与正确性由具体调用负责保障
     */
    type: "triangles" | "lines" | "points",
}


export type entityID = number;


// /**
//  * 顶点和材质一对一
//  */
// export interface entityContentOfVertexAndMaterial {
//     vertexes: geometryBufferOfEntity,
//     material: BaseMaterial,
// }


// /** entity的顶点与材质的group */
// export interface entityContentGroup {
//     [name: string]: entityContentOfVertexAndMaterial
// }



// /**
//  * todo
//  * LOD定义
//  * 默认 ：0
//  */
// export interface LOD {
//     /**
//      * interface索引，对应于this._VM.(通过name进行索引)
//     //  * 简单化，只有一对一
//      */
//     //合批问题再议，延迟
//     objects: entityContentGroup,
//     mimapLevel: number,
//     distance: number,
// }



/**
 * 阴影选项
 * 是否接受与是否产生阴影
 * 默认时：全部都是true
 */
export interface optionShadowEntity {
    /**是否接收阴影 
     * 
     * 默认true
    */
    accept: boolean,
    /**是否产生阴影     
     * 
     * 默认true
    */
    generate: boolean,
}


/**三段式初始化的第一步： input参数 */
export interface optionBaseEntity extends optionUpdate {
    /**
     * 两种情况：
     * 
     * 1、代码实时构建，延迟GPU device相关的资源建立需要延迟。需要其顶级使用者被加入到stage中后，才能开始。有其上级类的readyForGPU() 给材料进行GPUDevice的传值
     * 
     * 2、代码实时构建，可以显示的带入scene，则不用等待
     * 
     * 3、加载场景模式，原则上是通过加载器带入scene参数。todo
     * 
     * 20241129,类型从any 改为BaseStage
     */
    parent?: BaseStage,
    name?: string,

    //todo
    /** 顶点和材质组一对一 */
    // vertexAndMaterialGroup?: entityContentGroup,

    /**阴影选项 */
    shadow?: optionShadowEntity,
    /**初始化的参数matrix  ，这个mesh的   */
    matrix?: Mat4,
    /**初始化的参数scale     */
    scale?: Vec3,
    /**初始化的参数position     */
    position?: Vec3,
    /**初始化的参数rotatae     */
    rotate?: {
        axis: Vec3,
        angleInRadians: number,
    },
    /**是否每帧更新Matrix，默认=false */
    updateMatrixPerFrame?: boolean,
    // /** side,显示的面，默认:front */
    // side?: "front" | "back" | "all",
    /**剔除面 */
    cullmode?: GPUCullMode,
    /**
     * 实体是否为动态，boolean
     * 默认=false
     */
    dynamicPostion?: boolean,
    /**
     * 是否未动态形变物体
     * 默认=false
     */
    dynamicMesh?: boolean,
    /**实例化数量，默认为1 */
    numInstances?: number,
    /**
     * 这里是实例化的每个实例的位置，默认是[0,0,0]
     * 
     * 一个可以使用默认，多个就会重叠
     */
    instancesPosition?: Vec3[],
    /**自定义shader代码，包括VS和FS */
    shaderCode?: string,
}
/**三段式初始化的第二步：init */
export interface optionBaseEntityStep2 {
    stage: BaseStage,
    /**render id */
    renderID: number,
    deferRenderDepth: boolean,
    deferRenderColor: boolean,
    reversedZ: boolean,
}
