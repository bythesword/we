//start system.wgsl //前向渲染的shader header部分
struct ST_SystemMVP {
  model: mat4x4f,
  view: mat4x4f,
  projection: mat4x4f,
  cameraPosition: vec3f,
  reversedZ: u32,
};
struct ST_AmbientLight {
  color: vec3f,
  intensity: f32,
};
struct ST_Light {
  position: vec3f,
  decay: f32,
  color: vec3f,
  intensity: f32,
  direction: vec3f,
  distance: f32,
  angle: vec2f,
  shadow: i32,
  visible: i32,
  size: vec4f,
  kind: i32,           //0=dir,1=point,2=spoint
  id: u32,               //light id  for shadow map, id start from 0
  shadow_map_type: u32,  //1=one depth,6=cube,0=none
  shadow_map_array_index: i32,   //-1 = 没有shadowmap,other number=开始的位置，从0开始
  shadow_map_array_lenght: u32,  //1 or 6
  shadow_map_enable: i32,  //depth texture array 会在light add之后的下一帧生效，这个是标志位
};
struct ST_Lights {
  lightNumber: u32,
  Ambient: ST_AmbientLight,
  //$lightsArray    //这个是变量的化，shader的编译会有问题，会不变的
  lights: array<ST_Light, $lightNumber>, //这在scene.getWGSLOfSystemShader()中进行替换,是默认或者设置的最大值，用不用都是有32lights的buffer
};
struct bulin_phong {
  shininess: f32,
  metalness: f32,
  roughness: f32,
}
//U_shadowMapMatrix（ST_shadowMapMatrix）与  U_shadowMap_depth_texture是一一对应的，此两者与light的关系通过ST_Lights中ST_shadowMap
struct ST_shadowMapMatrix {
  light_id: u32,
  matrix_count: u32,   //数量：1 or 6,1=一个，6=cube
  matrix_self_index: u32,  //0-5,//按照cube方式排列 right=0,left=1,up=2,down=3,back=4,front=5
  MVP: mat4x4f,
}
var<private> weZero = 0.00000001;
//var<private> shadow_DepthTexture : texture_depth_2d_array<f32>;
var<private > defaultCameraPosition : vec3f;
var<private > modelMatrix : mat4x4f;
var<private > viewMatrix : mat4x4f;
var<private > projectionMatrix : mat4x4f;
var<private > MVP : mat4x4f;
var<private > AmbientLight : ST_AmbientLight;
var<private> matrix_z : mat4x4f = mat4x4f(
    1.0, 0.0, 0.0, 0.0,
    0.0, 1.0, 0.0, 0.0,
    0.0, 0.0, 1.0, 0.0,
    0.0, 0.0, 0.0, 1.0
);
@group(0) @binding(0) var<uniform> U_MVP : ST_SystemMVP;
@group(0) @binding(1) var<uniform> U_lights : ST_Lights;
//下面三个是fs中使用的，如果同时有VS和FS，则正确；如果只有VS，则报错（需要使用，SystemOnlyVS.wgsl）
@group(0) @binding(2) var<uniform> U_shadowMapMatrix : array<ST_shadowMapMatrix, $lightNumberShadowNumber >;    //这里shadowNumber是需要和 depth texture一起计算的
@group(0) @binding(3) var U_shadowMap_depth_texture : texture_depth_2d_array;     //按照cube方式排列 right=0,left=1,up=2,down=3,back=4,front=5
@group(0) @binding(4)  var shadowSampler: sampler_comparison;
fn initSystemOfVS() {
    defaultCameraPosition = U_MVP.cameraPosition;
    modelMatrix = U_MVP.model;
    viewMatrix = U_MVP.view;
    projectionMatrix = U_MVP.projection;
    MVP = projectionMatrix * viewMatrix * modelMatrix;
    AmbientLight = U_lights.Ambient;
    if U_MVP.reversedZ == 1 {
        matrix_z = mat4x4f(
            1.0, 0.0, 0.0, 0.0,
            0.0, 1.0, 0.0, 0.0,
            0.0, 0.0, -1.0, 0.0,
            0.0, 0.0, 1.0, 1.0
        );
    }
    let shadowMatrix = U_shadowMapMatrix;
}
fn initSystemOfFS() {
    defaultCameraPosition = U_MVP.cameraPosition;
    modelMatrix = U_MVP.model;
    viewMatrix = U_MVP.view;
    projectionMatrix = U_MVP.projection;
    MVP = projectionMatrix * viewMatrix * modelMatrix;
    AmbientLight = U_lights.Ambient;
    if U_MVP.reversedZ == 1 {
        matrix_z = mat4x4f(
            1.0, 0.0, 0.0, 0.0,
            0.0, 1.0, 0.0, 0.0,
            0.0, 0.0, -1.0, 0.0,
            0.0, 0.0, 1.0, 1.0
        );
    }
    let shadowMatrix = U_shadowMapMatrix;
    let depth0 = textureLoad(U_shadowMap_depth_texture, vec2i(0, 0), 0, 0);
    let depth1 = textureSampleCompare(
        U_shadowMap_depth_texture,                  //t: texture_depth_2d_array
        shadowSampler,                              //s: sampler_comparison,
        vec2f(0, 0),                      //coords: vec2<f32>,
        0,            //array_index: A,
        0.0                         //depth_ref: f32,
    );
}
//常数
const  PI= 3.141592653589793;
const  NUM_SAMPLES: i32=100;
const  NUM_RINGS: i32 = 10;
const FILTER_RADIUS =10.0;
//shadow map  使用 相关
override shadowDepthTextureSize : f32 = 2048.0;
fn rand_0to1(x: f32) -> f32 {
    return fract(sin(x) * 10000.0) * 2.0 - 1.0;//0 - 1
}
fn rand_1to1(x: f32) -> f32 {
    return fract(sin(x) * 10000.0);// -1 -1
}
fn rand_2to1(uv: vec2f) -> f32 { //2D->1D 
    let a = 12.9898;
    let  b = 78.233;
    let  c = 43758.5453;
    let  dt = dot(uv.xy, vec2(a, b));
    let  sn = dt % PI;
    return fract(sin(sn) * c);
}
fn poissonDiskSamples(randomSeed: vec2f) -> array<vec2f,NUM_SAMPLES> {
    let ANGLE_STEP = PI * 2.0 * f32(NUM_RINGS) / f32(NUM_SAMPLES);
    let  INV_NUM_SAMPLES = 1.0 / f32(NUM_SAMPLES);
    var poissonDisk = array<vec2f, NUM_SAMPLES>();
    var angle = rand_2to1(randomSeed) * PI * 2.0;
    var radius = INV_NUM_SAMPLES;
    var radiusStep = radius;
    for (var i = 0; i < NUM_SAMPLES; i ++) {
        poissonDisk[i] = vec2(cos(angle), sin(angle)) * pow(radius, 0.75);
        radius += radiusStep;
        angle += ANGLE_STEP;
    }
    return poissonDisk;
}
fn uniformDiskSamples(randomSeed: vec2f) -> array<vec2f,NUM_SAMPLES> {
    var randNum = rand_2to1(randomSeed);
    var sampleX = rand_1to1(randNum) ;
    var sampleY = rand_1to1(sampleX) ;
    var angle = sampleX * PI * 2.0;
    var radius = sqrt(sampleY);
    var poissonDisk = array<vec2f, NUM_SAMPLES>();
    for (var i = 0; i < NUM_SAMPLES; i ++) {
        poissonDisk[i] = vec2(radius * cos(angle), radius * sin(angle));
        sampleX = rand_1to1(sampleY) ;
        sampleY = rand_1to1(sampleX) ;
        angle = sampleX * PI * 2.;
        radius = sqrt(sampleY);
    }
    return poissonDisk;
}
fn findBlocker(uv: vec2f, zReceiver: f32, depth_texture: texture_depth_2d_array, array_index: i32) -> f32 {
    let disk = poissonDiskSamples(uv);
    var blockerNum = 0;
    var blockDepth = 0.;
    let  NEAR_PLANE = 0.01;
    let  LIGHT_WORLD_SIZE = 5.;
    let  FRUSTUM_SIZE = 400.;
    let  LIGHT_SIZE_UV = LIGHT_WORLD_SIZE / FRUSTUM_SIZE;
    let searchRadius = LIGHT_SIZE_UV * (zReceiver - NEAR_PLANE) / zReceiver;    //约等于1/80
    let searchRadius2 = 50.0 / shadowDepthTextureSize;                            //约等于1/40
    for (var i = 0 ; i <= NUM_SAMPLES; i++) {
        let offset = disk[i] * searchRadius;
        let depth = textureLoad(depth_texture, vec2i(floor((uv + offset) * shadowDepthTextureSize)), array_index, 0);//uv转成vec2i,因为使用textureLoad，uv必须是vec2i
        if zReceiver > depth+0.001  {
            blockerNum += 1;
            blockDepth += depth;
        }
    }
    if blockerNum == 0 {
        return -1.;
    } else {
        return blockDepth / f32(blockerNum);
    }
}
fn getShadowBias(c: f32, filterRadiusUV: f32, normal: vec3f, lightDirection: vec3f) -> f32 {    //自适应Shadow Bias算法 https://zhuanlan.zhihu.com/p/370951892
    let  FRUSTUM_SIZE = 100.;//在系数=400.0是，产生 petter shadow问题，所以这里改为100.0
    let fragSize = (1. + ceil(filterRadiusUV)) * (FRUSTUM_SIZE / shadowDepthTextureSize / 2.);
    return max(fragSize, fragSize * (1.0 - dot(normal, lightDirection))) * c;
}
fn shadowMapVisibilityPCSS(onelight: ST_Light, shadow_map_index:i32,position: vec3f, normal: vec3f, biasC: f32) -> f32 {
    var posFromLight =matrix_z* U_shadowMapMatrix[shadow_map_index].MVP * vec4(position, 1.0);    //光源视界的位置
    if(posFromLight.w < 0.000001   && posFromLight.w > -0.000001){       //posFromLight =posFromLight/posFromLight.w;
    }
    else{
      posFromLight =posFromLight/posFromLight.w; 
    }
    //Convert XY to (0, 1)    //Y is flipped because texture coords are Y-down.
    let shadowPos = vec3(posFromLight.xy * vec2(0.5, -0.5) + vec2(0.5), posFromLight.z);  //这里的z是深度数据,xy是UV在光源depth texture中的位置
    let zReceiver = posFromLight.z;
    let avgBlockerDepth = findBlocker(vec2f(shadowPos.x, shadowPos.y), zReceiver, U_shadowMap_depth_texture, shadow_map_index);
    let EPS = 1e-3;    
    //半影
    let  LIGHT_SIZE_UV = 5. / 400.;
    var  penumbra: f32;//= (zReceiver - avgBlockerDepth) * LIGHT_SIZE_UV / avgBlockerDepth;
    let  pcfBiasC = .08;    // 有PCF时的Shadow Bias
    let oneOverShadowDepthTextureSize = FILTER_RADIUS / shadowDepthTextureSize;
    let bias = getShadowBias(biasC, oneOverShadowDepthTextureSize, normal, onelight.direction);
    let disk = poissonDiskSamples(vec2f(shadowPos.x, shadowPos.y));//todo，改成从findBlocker中获取的结构体
    var visibility = 0.0;
    if avgBlockerDepth < -EPS {
        penumbra = oneOverShadowDepthTextureSize;
    } else {
        penumbra = (zReceiver - avgBlockerDepth) * LIGHT_SIZE_UV / avgBlockerDepth;
    }
    for (var i = 0 ; i <= NUM_SAMPLES; i++) {
        let offset = disk[i] * penumbra;
       //  let offset = disk[i] * oneOverShadowDepthTextureSize;
        visibility += textureSampleCompare(
            U_shadowMap_depth_texture,                  //t: texture_depth_2d_array
            shadowSampler,                              //s: sampler_comparison,
            shadowPos.xy + offset,                      //coords: vec2<f32>,
            shadow_map_index,            //array_index: A,
            shadowPos.z - bias                      //depth_ref: f32,//这个产生的petter shadoww问题比较大，
            // shadowPos.z -0.005                      //depth_ref: f32,//ok
        );
    }
    visibility /= f32(NUM_SAMPLES);
    //无遮挡物
    if avgBlockerDepth < -EPS {
        return 1.0;
    } else {
        return visibility;
    }
}
fn shadowMapVisibilityPCF(onelight: ST_Light,shadow_map_index:i32, position: vec3f, normal: vec3f, biasC: f32) -> f32 {
    let bias = 0.009;// max(0.005 * (1.0 - dot(normal, onelight.direction)), 0.005);
    var posFromLight =matrix_z* U_shadowMapMatrix[shadow_map_index].MVP * vec4(position, 1.0);    //光源视界的位置
    if(posFromLight.w < 0.000001   && posFromLight.w > -0.000001){       //posFromLight =posFromLight/posFromLight.w;
    }
    else{
      posFromLight =posFromLight/posFromLight.w; 
    }
    //Convert XY to (0, 1)    //Y is flipped because texture coords are Y-down.
    let shadowPos = vec3(posFromLight.xy * vec2(0.5, -0.5) + vec2(0.5), posFromLight.z);  //这里的z是深度数据,xy是UV在光源depth texture中的位置
    let oneOverShadowDepthTextureSize = FILTER_RADIUS / shadowDepthTextureSize;
    let disk = poissonDiskSamples(vec2f(shadowPos.x, shadowPos.y));
    var visibility = 0.0;
    for (var i = 0 ; i <= NUM_SAMPLES; i++) {
        let offset = disk[i] * oneOverShadowDepthTextureSize;
        visibility += textureSampleCompare(
            U_shadowMap_depth_texture,                  //t: texture_depth_2d_array
            shadowSampler,                              //s: sampler_comparison,
            shadowPos.xy + offset,                      //coords: vec2<f32>,
            shadow_map_index,            //array_index: A,
            shadowPos.z - bias                      //depth_ref: f32,
        );
    }
    visibility /= f32(NUM_SAMPLES);
    return visibility;
}
fn shadowMapVisibilityPCF_3x3(onelight: ST_Light,shadow_map_index:i32, position: vec3f, normal: vec3f) -> f32 {
    let bias = max(0.05 * (1.0 - dot(normal, onelight.direction)), 0.005);
    var posFromLight =matrix_z* U_shadowMapMatrix[shadow_map_index].MVP * vec4(position, 1.0);    //光源视界的位置
     if(posFromLight.w < 0.000001   && posFromLight.w > -0.000001){
       //posFromLight =posFromLight/posFromLight.w;
    }
    else{
      posFromLight =posFromLight/posFromLight.w; 
    }
    //Convert XY to (0, 1)    //Y is flipped because texture coords are Y-down.
    let shadowPos = vec3(posFromLight.xy * vec2(0.5, -0.5) + vec2(0.5), posFromLight.z);  //这里的z是深度数据,xy是UV在光源depth texture中的位置
    let oneOverShadowDepthTextureSize = 1.0 / shadowDepthTextureSize;
    var visibility = 0.0;
    for (var y = -1; y <= 1; y++) {
        for (var x = -1; x <= 1; x++) {
            let offset = vec2f(vec2(x, y)) * oneOverShadowDepthTextureSize;
            visibility += textureSampleCompare(
                U_shadowMap_depth_texture,                  //t: texture_depth_2d_array
                shadowSampler,                              //s: sampler_comparison,在scene中是：compare: 'less'
                shadowPos.xy + offset,                      //coords: vec2<f32>,
                shadow_map_index,            //array_index: A,
                shadowPos.z - bias                      //depth_ref: f32,
            );
        }
    }
    visibility /= 9.0;
    return visibility;
}
fn shadowMapVisibilityHard(onelight: ST_Light,shadow_map_index:i32, position: vec3f, normal: vec3f) -> f32 {
    var posFromLight =matrix_z* U_shadowMapMatrix[shadow_map_index].MVP * vec4(position, 1.0);    //光源视界的位置
    //var posFromLight =matrix_z* U_shadowMapMatrix[onelight.shadow_map_array_index].MVP * vec4(position, 1.0);    //光源视界的位置
    if(posFromLight.w < 0.000001   && posFromLight.w > -0.000001){     // posFromLight =posFromLight/posFromLight.w;
    }
    else{
      posFromLight =posFromLight/posFromLight.w; 
    }
    //Convert XY to (0, 1)    //Y is flipped because texture coords are Y-down.
    let shadowPos = vec3(
        posFromLight.xy * vec2(0.5, -0.5) + vec2(0.5),
        posFromLight.z
    );
    var visibility = 0.0;
    visibility += textureSampleCompare(
        U_shadowMap_depth_texture,                  //t: texture_depth_2d_array
        shadowSampler,                              //s: sampler_comparison,
        shadowPos.xy,                      //coords: vec2<f32>,
        shadow_map_index,// onelight.shadow_map_array_index,            //array_index: A,
        shadowPos.z - 0.007                         //depth_ref: f32,
    );
    return visibility;
}
//end shadow map  使用 相关
//end system.wgsl
