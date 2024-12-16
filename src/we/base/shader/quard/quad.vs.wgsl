struct VertexOutput {
  @builtin(position) Position : vec4f,
  //@location(0) uv : vec2f,
}
override far : f32 = 1.0;
@vertex
fn main(@builtin(vertex_index) VertexIndex : u32) -> @builtin(position) vec4f
{
  var output : VertexOutput;
  const pos = array(
  vec2(-1.0, -1.0), vec2(1.0, -1.0), vec2(-1.0, 1.0),
  vec2(-1.0, 1.0), vec2(1.0, -1.0), vec2(1.0, 1.0),
  );
  output.Position = vec4f(pos[VertexIndex], far, 1.0);
  //output.uv = vec2f(pos[VertexIndex]);
  return output;
}
