////////////////////////////////////////////////////////////////////////////////////////
//单体对象的用户自定义的interface
/** 用户自定义功能接口的update interface */
export interface optionUpdate {
    /**自定义更新functon() */
    update?: (scope: any, deltaTime: number, startTime: number, lastTime: number) => {},
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
    "DynamicEntites",//水、树、草等
    "World",//静态
    "Sky",//天空盒
    "UI",
];
export var defaultStage = 2;//stagesOfSystem[0];
export var defaultStageName = stagesOfSystem[defaultStage]
export type stagesOrderByRender = number[];
export var defaultStageList: stagesOrderByRender = [defaultStage];
export var lightNumber = 32;//这个需要同步到“system.wgsl”中的数量

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
export interface color4U {
    red: number,
    green: number,
    blue: number,
    alpha: number
}
/**RGB数值的颜色interface，0--1 */
export interface color3F {
    red: number,
    green: number,
    blue: number
}
/** RGB三个数值的颜色interface，0--255 */
export interface color3U {
    red: number,
    green: number,
    blue: number,
}
export var shadowMapSize = 1024;

////////////////////////////////////////////////////////////////////////////////////////
//viewport
/**这里的number是百分比，因为canvas的size会变化 */
export interface viewPort {
    x: number,
    y: number,
    width: number,
    height: number,
    fs?: string,
}

////////////////////////////////////////////////////////////////////////////////////////
//GBuffer
/**固定的GBuffer名称 */
export enum GBufferName {
    color = "color",
    depth = "depth",
    entityID = "entityID",
    normal = "normal",
    uv = "uv",
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
    clearValue?:[]
}
/**GBuffers 的RenderPassDescriptor的集合的类型描述(type) */
export type GBuffersRPD = {
    [name in GBufferName]: GBufferRenderPassDescriptor;
};

/**GBuffer的 GPUTexture集合 */
export interface GBuffers {
    [name: string]: GPUTexture
};

/**GBuffers viewport集合的类型描述(type) */
export type GBufferLayout = {
    [name in GBufferName]: viewPort;
};
/**GBffers各种类型布局集合 */
export interface GBuffersViewport {
    [name: string]: GBufferLayout
}
/** 实例化的GBffers 的布局类型的集合 */
export var GBuffersViewportAssemble: GBuffersViewport = {
    top: {
        [GBufferName.color]: {
            x: 0.25 / 2,
            y: 0.25,
            width: 1 - 0.25 / 2,
            height: 1
        },
        [GBufferName.depth]: {
            x: 0,
            y: 0,
            width: 0.25,
            height: 0.25
        },
        [GBufferName.entityID]: {
            x: 0.25,
            y: 0,
            width: 0.5,
            height: 0.25
        },
        [GBufferName.normal]: {
            x: 0.5,
            y: 0,
            width: 0.75,
            height: 0.25
        },
        [GBufferName.uv]: {
            x: 0.75,
            y: 0,
            width: 1,
            height: 0.25
        }
    }
}
/** 实例化的 GBufferRenderPassDescriptor 的布局类型的集合 */
export var GBuffersRPDAssemble: GBuffersRPD = {
    [GBufferName.color]: {
        label: "color texture of colorAttachments",
        format: "WEsystem",
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC | GPUTextureUsage.COPY_DST | GPUTextureUsage.TEXTURE_BINDING
    },
    [GBufferName.depth]: {
        label: "color texture of colorAttachments",
        format: "WEdepth",
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC | GPUTextureUsage.COPY_DST
    },
    [GBufferName.entityID]: {
        label: "color texture of colorAttachments",
        format: "r32uint",
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC | GPUTextureUsage.COPY_DST
    },
    [GBufferName.normal]: {
        label: "color texture of colorAttachments",
        format: "WEsystem",
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC | GPUTextureUsage.COPY_DST
    },
    [GBufferName.uv]: {
        label: "color texture of colorAttachments",
        format: "WEsystem",
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC | GPUTextureUsage.COPY_DST
    }
}