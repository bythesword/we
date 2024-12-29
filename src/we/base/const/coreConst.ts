/////////////////////////////////////////////////////////////////////////////////////////
//
export type userFN = (scope: any) => any;
export type userPromiseFN = (scope: any) => Promise<any>;


////////////////////////////////////////////////////////////////////////////////////////
//单体对象的用户自定义的interface
/** 用户自定义功能接口的update interface */
export interface optionUpdate {
    /**自定义更新functon() */
    update?: (scope: any, deltaTime: number, startTime: number, lastTime: number, data?: any) => {},
    // update?: (scope: any, deltaTime: number,startTime:number,lastTime:number) => {},
    // update?: (scope: any, deltaTime: number,startTime:number,lastTime:number) => Promise<any>,
}


////////////////////////////////////////////////////////////////////////////////////////
//stage 
/** stage 索引类型 */
export type stageIndex = string;
/** stage name的对象接口*/
export interface stageName {
    [name: number]: string
};
/**默认stage层级与名称 */
export var stagesOfSystem: stageName = [
    "Actor",//角色
    "DynamicEntities",//水、树、草等
    "World",//静态
    "Sky",//天空盒
    "UI",//UI
];
export var stagesOfSystemDeferRender: boolean[] = [
    true,//角色
    true,//水、树、草等
    true,//静态
    false,//天空盒
    false,//UI
];
export var defaultStage = 2;//stagesOfSystem[0];
export var defaultStageName = stagesOfSystem[defaultStage]
export type stagesOrderByRender = number[];
// export var defaultStageList: stagesOrderByRender = [defaultStage];
// export var defaultStageList: stagesOrderByRender = [2,3];
export var defaultStageList: stagesOrderByRender = [0, 1, 2, 3];


////////////////////////////////////////////////////////////////////////////////////////
//color define
/**RGBA四个数值的颜色interface，0--1 */
export interface color4F {
    red: number,
    green: number,
    blue: number,
    alpha: number
}
/**RGBA四个数值的颜色interface，0--255 */
export type color4U = color4F
/**RGB数值的颜色interface，0--1 */
export interface color3F {
    red: number,
    green: number,
    blue: number
}
/** RGB三个数值的颜色interface，0--255 */
export type color3U = color3F;


////////////////////////////////////////////////////////////////////////////////////////
//shadowMapSize
export var shadowMapSize = 1024;
export var lightNumber = 32;//这个需要同步到“system.wgsl”中的数量

////////////////////////////////////////////////////////////////////////////////////////
//GBuffer

/**这里的number是百分比，因为canvas的size会变化 */
interface viewPort {
    x: number,
    y: number,
    width: number,
    height: number,
    fs?: string,
    u32?: {
        scale: number,//这个是给u32类型的缩小图用的
        offsetX: number,//向右=负数，向左=正数
        offsetY: number,//向下=负数，向上=正数
    }
}
/**固定的GBuffer名称 */
export enum GBufferName {
    color = "color",
    depth = "depth",
    entityID = "entityID",
    normal = "normal",
    uv = "uv",
}


/**GBuffer的 GPUTexture集合 */
export interface GBuffers {
    [name: string]: GPUTexture
};

/**GBuffers viewport集合的类型描述(type) */
export type GBufferLayout = {
    [name in GBufferName]: viewPort;
};
/**GBffers各种类型布局集合 */
export interface GBuffersVisualizeLayout {
    [name: string]: GBufferLayout
}
/** 实例化的GBffers 的布局类型的集合 */
export var GBuffersVisualizeLayoutAssemble: GBuffersVisualizeLayout = {
    default: {
        [GBufferName.color]: {
            x: 0.25 / 2,
            y: 0.25,
            width: 1 - 0.25,//是到多少pixel
            height: 1 - 0.25
        },
        [GBufferName.depth]: {
            x: 0.25,
            y: 0,
            width: 0.25,
            height: 0.25
        },
        [GBufferName.entityID]: {
            x: 0,
            y: 0,
            width: 0.25,
            height: 0.25,
            u32: {
                scale: 4.0,
                offsetX: 0.0,
                offsetY: 0.0
            }
        },
        [GBufferName.normal]: {
            x: 0.5,
            y: 0,
            width: 0.25,
            height: 0.25
        },
        [GBufferName.uv]: {
            x: 0.75,
            y: 0,
            width: 0.25,
            height: 0.25
        }
    }
}
/**默认的GBuffer 可视化布局名称 */
export var GBuffersVisualizeLayoutDefaultName = "top";

/**GBuffersVisualize的shader集合 */
export interface shaderCodeOfGBuffersVisualize {
    [name: string]: string
}
/**GBuffersVisualizeLayout布局的shader集合的接口*/
export interface shaderCodeOfGBuffersVisualizeLayout {
    [name: string]: shaderCodeOfGBuffersVisualize
};

import shaderCodeDepth from "../shader/GBuffersVisualize/depth.wgsl?raw";
import shaderCodeEID from "../shader/GBuffersVisualize/entityID.wgsl?raw";
import shaderCodeVec4f from "../shader/GBuffersVisualize/vec4f.wgsl?raw";
export var varOfshaderCodeOfGBuffersVisualizeLayout: shaderCodeOfGBuffersVisualizeLayout = {
    "default": {
        "color": shaderCodeVec4f,
        "depth": shaderCodeDepth,
        "entityID": shaderCodeEID,
        "normal": shaderCodeVec4f,
        "uv": shaderCodeVec4f
    }
}
export var varOfshaderCodeSingleOfGBuffersVisualizeLayout: { [name: string]: string } = {
    "depth": shaderCodeDepth,
    "entityID": shaderCodeEID,
    "normal": shaderCodeVec4f,
    "uv": shaderCodeVec4f
}
/**GBuffer 的render Pass Descriptor ,对应GPURenderPassDescriptor
 * 
 * format: GPUTextureFormat|"system"; 
 *      
 *      WEsystem:表示当前OS/浏览器/canvas支持的首选格式
 *      
 *      WEdepth:WE使用的depth描述格式，统一的
 * 
 * usage :GPUTextureUsage 
 */
export interface GBufferRenderPassDescriptor {
    label: string,
    format: GPUTextureFormat | "WEsystem" | "WEdepth",
    usage: number,
    clearValue?: []
}
/**GBuffers 的RenderPassDescriptor的集合的类型描述(type) */
export type GBuffersRPD = {
    [name in GBufferName]: GBufferRenderPassDescriptor;
};

/** 实例化的 GBufferRenderPassDescriptor 的集合
 * 
 * (GBuffer 合并使用的Render Pass Descriptor)
 */
export var GBuffersRPDAssemble: GBuffersRPD = {
    [GBufferName.color]: {
        label: "color texture of colorAttachments",
        format: "WEsystem",
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC | GPUTextureUsage.COPY_DST | GPUTextureUsage.TEXTURE_BINDING
    },
    [GBufferName.depth]: {
        label: "color texture of colorAttachments",
        format: "WEdepth",
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC | GPUTextureUsage.COPY_DST | GPUTextureUsage.TEXTURE_BINDING
    },
    [GBufferName.entityID]: {
        label: "color texture of colorAttachments",
        format: "r32uint",
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC | GPUTextureUsage.COPY_DST | GPUTextureUsage.TEXTURE_BINDING
    },
    [GBufferName.normal]: {
        label: "color texture of colorAttachments",
        format: "WEsystem",
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC | GPUTextureUsage.COPY_DST | GPUTextureUsage.TEXTURE_BINDING
    },
    [GBufferName.uv]: {
        label: "color texture of colorAttachments",
        format: "WEsystem",
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC | GPUTextureUsage.COPY_DST | GPUTextureUsage.TEXTURE_BINDING
    }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////
//