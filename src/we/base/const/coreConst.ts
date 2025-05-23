/////////////////////////////////////////////////////////////////////////////////////////
//
/** 通用的用户自定义的function */
export type userFN = (scope: any) => any;
/** 通用的用户自定义的function，返回Promise */
export type userPromiseFN = (scope: any) => Promise<any>;
/** 简单的自定义function，没有返回 */
export type SimpleFunction = () => void;

////////////////////////////////////////////////////////////////////////////////////////
//单体对象的用户自定义的interface

/** 用户自定义功能接口的update interface */
export interface optionUpdate {
    /**自定义更新functon() */
    update?: (scope: any, deltaTime?: number, startTime?: number, lastTime?: number, data?: any) => {},
    // update?: (scope: any, deltaTime: number,startTime:number,lastTime:number) => {},
    // update?: (scope: any, deltaTime: number,startTime:number,lastTime:number) => Promise<any>,
}
////////////////////////////////////////////////////////////////////////////////////////
//shadow map

/** 渲染类型，用于shadow map 或者camera */
export enum renderKindForDCCC {
    "camera" = "camrea",
    "light" = "light"
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

//未使用
export var stagesOfSystemDeferRender: boolean[] = [
    true,//角色
    true,//水、树、草等
    true,//静态
    false,//天空盒
    false,//UI
];

/**默认stage */
export var defaultStage = 2;//stagesOfSystem[0];

/**默认stage的名称 */
export var defaultStageName = stagesOfSystem[defaultStage]

/**stage order的数组类型 */
export type stagesOrderByRender = number[];

/**默认stage的顺序*/
export var defaultStageList: stagesOrderByRender = [0, 1, 2, 3];//20250404,[0, 1, 3, 2]后，world的底色出现，在其他stage没有commmand时，texture是空色的；在GBuffer合并时，会出现透明。排除没有commands的stage


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

/**texture的alphaT为0的float的zero值 */
export var textureAlphaZero=0.001

////////////////////////////////////////////////////////////////////////////////////////
//shadowMapSize
/**shadow map的大小 */
export var shadowMapSize = 2048;

/** 最大的light数量 */
export var lightNumber = 8;//在scene.ts中的getWGSLOfSystemShader()进行了shader的替换。

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
    color = "color",        //必须
    depth = "depth",        //必须
    entityID = "entityID",  //必须
    normal = "normal",      //非必须，以后可更改
    uv = "uv",              //非必须，以后可更改
}
/**GBuffer的 GPUTexture集合 */
export interface GBuffers {
    [name: string]: GPUTexture
};
/**多cameras中，多个摄像机对应的GBuffer */
export interface MultiGBuffers {
    /**name= camera  的 id */
    [name: string]: GBuffers,
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
 * 
 * 这里的顺序与GBufferName的顺序一致（强制）
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



////////////////////////////////////////////////////////////
//GBuffer可视化

/**GBuffers viewport集合的类型描述(type) */
export type GBufferLayout = {
    [name in GBufferName]: viewPort;
};
/**GBffers各种类型布局集合 */
export interface GBuffersVisualizeLayout {
    [name: string]: GBufferLayout
}
/**多窗口模式的GBuffer可视化中，实例化的GBffers 的布局类型的集合 */
export var GBuffersVisualizeLayoutAssemble: GBuffersVisualizeLayout = {
    default: {
        [GBufferName.color]: {
            x: 0.25 / 2,
            y: 0.25,
            width: 1 - 0.25,    //是增加多少pixel
            height: 1 - 0.25
        },
        [GBufferName.depth]: {
            x: 0,
            y: 0,
            width: 0.25,
            height: 0.25,
            u32: {
                scale: 4.0,//采样放大
                offsetX: 0.0,
                offsetY: 0.0
            }
        },
        [GBufferName.entityID]: {
            x: 0.25,
            y: 0,
            width: 0.25,
            height: 0.25,
            u32: {
                scale: 4.0,
                offsetX: -0.250,//忘记了为什么是这个值，20250415
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
            height: 0.25,//是增加多少pixel
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

/**定义多窗口模式的GBuffer可视化，每个GBbuffer对应的shader */
export var varOfshaderCodeOfGBuffersVisualizeLayout: shaderCodeOfGBuffersVisualizeLayout = {
    "default": {
        "color": shaderCodeVec4f,
        "depth": shaderCodeDepth,
        "entityID": shaderCodeEID,
        "normal": shaderCodeVec4f,
        "uv": shaderCodeVec4f
    }
}
/**单窗口模式的GBuffer可视化，每个GBbuffer对应的shader */
export var varOfshaderCodeSingleOfGBuffersVisualizeLayout: { [name: string]: string } = {
    "depth": shaderCodeDepth,
    "entityID": shaderCodeEID,
    "normal": shaderCodeVec4f,
    "uv": shaderCodeVec4f
}

/////////////////////////////////////////////////////////////////////////////////////////////////////
//通用

 /**始化状态 */
export enum lifeState {
    /**未开始 */
    unstart,    
    /**正在构造中 */        
    constructing,   
    /**正在初始化中 */        
    initializing,    
    /** 初始化完成     */
    finished,        
    /** 正在更新中 */
    updating,        
    /** 更新完成 */
    updated,         
    /** 销毁 */
    destroyed,       
    /** 错误 */
    error,           
}