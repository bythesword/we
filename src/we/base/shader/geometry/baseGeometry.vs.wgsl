//start : baseGeometry.vs.wgsl
override uvScale_u : f32 = 1.0;
override uvScale_v : f32 = 1.0;
override uvOffset_x : f32 = 0.0; 
override uvOffset_y : f32 = 0.0; 


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
