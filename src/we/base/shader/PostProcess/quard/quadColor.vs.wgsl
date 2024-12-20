 


@fragment
fn main(fsInput : VertexShaderOutput) -> @location(0) color : vec4f
{
  //faking some kind of checkerboard texture
  let uv = floor(30.0 * fragUV);
  let c = 0.2 + 0.5 * ((uv.x + uv.y) - 2.0 * floor((uv.x + uv.y) / 2.0));

  var output : GBufferOutput;
  output.normal = vec4(normalize(fragNormal), 1.0);
  output.albedo = vec4(c, c, c, 1.0);

  return output;
}
