

//start system.wgsl
struct ST_SystemMVP {
  model : mat4x4f,
  view : mat4x4f,
  projection : mat4x4f,
  cameraPosition : vec3f,
  reversedZ : u32,
};
struct ST_AmbientLight {
  color : vec3f,
  intensity : f32,
};
struct ST_Light {
  position : vec3f,
  decay : f32,
  color : vec3f,
  intensity : f32,
  direction : vec3f,
  distance : f32,
  angle : vec2f,
  shadow : i32,
  visible : i32,
  size : vec4f,
  kind : i32,           //0=dir,1=point,2=spoint
  id : u32,               //light id  for shadow map, id start from 0
  shadow_map_type : u32,  //1=one depth,6=cube,0=none
  shadow_map_array_index : i32,   //-1 = 没有shadowmap,other number=开始的位置，从0开始
  shadow_map_array_lenght : u32,  //1 or 6
  shadow_map_enable : i32,  //depth texture array 会在light add之后的下一帧生效，这个是标志位
};
struct ST_Lights {
  lightNumber : u32,
  Ambient : ST_AmbientLight,
  //$lightsArray    //这个是变量的化，shader的编译会有问题，会不变的
  lights : array<ST_Light, $lightNumber>, //这在scene.getWGSLOfSystemShader()中进行替换,是默认或者设置的最大值，用不用都是有32lights的buffer
};
struct bulin_phong {
  shininess : f32,
  metalness : f32,
  roughness : f32,
}



//U_shadowMapMatrix（ST_shadowMapMatrix）与  U_shadowMap_depth_texture是一一对应的，此两者与light的关系通过ST_Lights中ST_shadowMap
struct ST_shadowMapMatrix {
  light_id : u32,
  matrix_count : u32,   //数量：1 or 6,1=一个，6=cube
  matrix_self_index : u32,  //0-5,//按照cube方式排列 right=0,left=1,up=2,down=3,back=4,front=5
  MVP : mat4x4f,
}

//struct ST_shadows {
//shadow: array<ST_shadow,$lightNumber>,//这里与ST_lights保持相同
//}


var<private> weZero = 0.000001;
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
@group(0) @binding(2) var<uniform> U_shadowMapMatrix : array<ST_shadowMapMatrix, 192>;    //$shadowNumber>;//这里shadowNumber是需要和 depth texture一起计算的
@group(0) @binding(3) var U_shadowMap_depth_texture : texture_depth_2d_array;     //按照cube方式排列 right=0,left=1,up=2,down=3,back=4,front=5
@group(0) @binding(4)  var shadowSampler: sampler_comparison;

fn initSystemOfFS()
{
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
  let depth0 = textureLoad(U_shadowMap_depth_texture, vec2i(0,0), 0,0);
  let depth1 =textureSampleCompare(
            U_shadowMap_depth_texture,                  //t: texture_depth_2d_array
            shadowSampler,                              //s: sampler_comparison,
            vec2f(0,0),                      //coords: vec2<f32>,
            0,            //array_index: A,
           0.0                         //depth_ref: f32,
          );
}
//end system.wgsl
