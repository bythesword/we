struct SystemMVP {
  model : mat4x4f,
  view : mat4x4f,
  projection : mat4x4f,
};
struct AmbientLight {
  color : vec3f,
  intensity : f32,
};
struct Light{
  //0=direction ,1=point,2=spot
  type : i32,
  position : vec3f,
  color : vec3f,
  intensity : f32,
  distance : f32,
  //pointlight dir =[0,0,0]
  direction : vec3f,
  decay : f32,
  //spot is angle ,other default =0,
  angle : f32,
  shadow : bool,
}


struct lights{
  lightNumber : u32,
  Ambient : AmbientLight,
  lights : array<Light, $lightNumber>,
}

@group(0) @binding(0) var<uniform> U_MVP : SystemMVP;

var<private > modelMatrix : mat4x4f;
var<private > viewMatrix : mat4x4f;
var<private > projectionMatrix : mat4x4f;
var<private > MVP : mat4x4f;

fn initSystem()
{
  modelMatrix = U_MVP.model;
  viewMatrix = U_MVP.view;
  projectionMatrix = U_MVP.projection;
  MVP = modelMatrix * viewMatrix * projectionMatrix;
}

fn getLightByID(id)
{

}
