@group(0) @binding(0) var gBuffer_color : texture_2d<f32>;
@group(0) @binding(1) var gBuffer_depth : texture_depth_2d;
@group(0) @binding(2) var gBuffer_ID : texture_2d<f32>;
//@group(0) @binding(0) var gBuffer_Normal : texture_2d<f32>;

override canvasSizeWidth : f32;
override canvasSizeHeight : f32;


@fragment
fn main(fsInput : VertexShaderOutput) -> @location(0) color : vec4f
{
  let uv = coord.xy / vec2f(canvasSizeWidth, canvasSizeHeight);
  let rawDepth = textureLoad(u_depth, vec2i(floor(coord.xy)), 0);
  let depth = (1.0 - rawDepth) * 50.0;
  result = vec4(depth);
  return output;
}
