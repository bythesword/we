//当前光源的信息
struct LightScene {
  lightViewProjMatrix: mat4x4f,
  lightPos: vec3f,
}
//当前顶点对应的物体的矩阵
struct Model {
  modelMatrix: mat4x4f,
}

@group(0) @binding(0) var<uniform> scene : SLightScenecene;
@group(1) @binding(0) var<uniform> model : Model;

@vertex
fn main(
  @location(0) position: vec3f
) -> @builtin(position) vec4f {
  return scene.lightViewProjMatrix * model.modelMatrix * vec4(position, 1.0);
}
