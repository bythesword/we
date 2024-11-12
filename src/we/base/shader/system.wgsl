struct ST_SystemMVP {
  model : mat4x4f,
  view : mat4x4f,
  projection : mat4x4f,
  cameraPosition : vec3f,
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
  kind : i32,
}

struct ST_Lights {
  lightNumber : i32,
  Ambient : ST_AmbientLight,
  $lightsArray
};

var<private > defaultCameraPosition : vec3f;
var<private > modelMatrix : mat4x4f;
var<private > viewMatrix : mat4x4f;
var<private > projectionMatrix : mat4x4f;
var<private > MVP : mat4x4f;
var<private > AmbientLight : ST_AmbientLight;

@group(0) @binding(0) var<uniform> U_MVP : ST_SystemMVP;
@group(0) @binding(1) var<uniform> U_lights : ST_Lights;



fn initSystem()
{
  defaultCameraPosition = U_MVP.cameraPosition;
  modelMatrix = U_MVP.model;
  viewMatrix = U_MVP.view;
  projectionMatrix = U_MVP.projection;
  MVP = modelMatrix * viewMatrix * projectionMatrix;
  AmbientLight = U_lights.Ambient;
}


//fn getLightByID(id) {
//}
