//start : baseGeometry.vs.wgsl
@vertex fn vs(
@location(0) position : vec3f,
@location(1) uv : vec2f,
@location(2) normal : vec3f,
@location(3) color : vec3f,
@builtin(vertex_index) vertexIndex : u32,
@builtin(instance_index) instanceIndex : u32
) -> VertexShaderOutput {
  var vsOutput : VertexShaderOutput;
  $vsOutput
  return vsOutput;
}
//end : baseGeometry.vs.wgsl
