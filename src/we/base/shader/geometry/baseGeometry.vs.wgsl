struct VertexShaderOutput {
  @builtin(position) position : vec4f,
  @location(0) uv : vec2f,
  @location(1) normal : vec3f,
  @location(2) color : vec3f,
  @location(3) worldPosition : vec3f,
};

@group(1) @binding(0) var<uniform> entityMatrixWorld : array<mat4x4f, $instacnce >;

@vertex fn vs(
@location(0) position : vec3f,
@location(1) uv : vec2f,
@location(2) normal : vec3f,
@location(3) color : vec3f,
@builtin(vertex_index) vertexIndex : u32,
@builtin(instance_index) instanceIndex : u32
) -> VertexShaderOutput {
  var vsOutput : VertexShaderOutput;
  let abc = f32(instanceIndex);
  vsOutput.position = projectionMatrix * viewMatrix * modelMatrix * entityMatrixWorld[instanceIndex] * vec4f(position, 1.0);
  vsOutput.uv = uv;

  vsOutput.normal = vec4f(entityMatrixWorld[instanceIndex] * vec4f(normal, 0)).xyz;
  vsOutput.color = color;
  vsOutput.worldPosition = vec4f(entityMatrixWorld[instanceIndex] * vec4f(position, 1.0)).xyz;
  return vsOutput;
}
