@group(0) @binding(0) var gBuffer_color : texture_2d<f32>;
@group(0) @binding(1) var gBuffer_depth : texture_depth_2d;
@group(0) @binding(2) var gBuffer_ID : texture_2d<f32>;
@group(0) @binding(3) var gBuffer_normal : texture_2d<f32>;
@group(0) @binding(4) var gBuffer_uv : texture_2d<f32>;
//@group(0) @binding(0) var gBuffer_Normal : texture_2d<f32>;

override canvasSizeWidth : f32;
override canvasSizeHeight : f32;
struct ST_GBuffer{
  @builtin(frag_depth) depth : f32,
  @location(0) color : vec4f,
  @location(1) id : u32,
  @location(2) normal : vec4f,
  @location(3) uv : vec4f,
}

@fragment
fn main(fsInput : VertexShaderOutput) -> @location(0) color : vec4f
{
  var output : ST_GBuffer;
  let uv = coord.xy / vec2f(canvasSizeWidth, canvasSizeHeight);
  let rawDepth = textureLoad(u_depth, vec2i(floor(coord.xy)), 0);
  let depth = (1.0 - rawDepth) * 50.0;
  result = vec4(depth);

  output.color = vec4f(1);
  output.id = fsInput.entityID;
  output.depth = fsInput.position.z;
  output.uv = vec4f(fsInput.uv, 0, 1);
  output.normal = vec4f(fsInput.normal, 1);

  return output;
}
