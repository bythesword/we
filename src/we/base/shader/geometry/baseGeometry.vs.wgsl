struct VertexShaderOutput {
  @builtin(position) position : vec4f,
  @location(0) uv : vec2f,
  @location(1) normal : vec3f,
  @location(2) color : vec3f,
  @location(3) worldPosition : vec3f,
};
@group(1) @binding(0) var<uniform> entityMatrixWorld : mat4x4f;
@vertex fn vs(
@location(0) position : vec3f,
@location(1) uv : vec2f,
@location(2) normal : vec3f,
@location(3) color : vec3f,
@builtin(vertex_index) vertexIndex : u32
) -> VertexShaderOutput {
  var vsOutput : VertexShaderOutput;
  vsOutput.position = projectionMatrix * viewMatrix * modelMatrix * entityMatrixWorld * vec4f(position, 1.0);
  vsOutput.uv = uv;
  //let m3R : mat3x3f = mat3x3f(entityMatrixWorld[0][1], entityMatrixWorld[0][1], entityMatrixWorld[0][2],
  //entityMatrixWorld[1][1], entityMatrixWorld[1][1], entityMatrixWorld[1][2],
  //entityMatrixWorld[2][1], entityMatrixWorld[2][1], entityMatrixWorld[2][2],
  //);
  //let m3S : mat3x3f = mat3x3f(entityMatrixWorld[0][1], entityMatrixWorld[0][1], entityMatrixWorld[0][2],
  //entityMatrixWorld[1][1], entityMatrixWorld[1][1], entityMatrixWorld[1][2],
  //entityMatrixWorld[2][1], entityMatrixWorld[2][1], entityMatrixWorld[2][2],
  //);
  //mat3(transpose(inverse(model))) * aNormal;
  vsOutput.normal = vec4f(entityMatrixWorld * vec4f(normal, 0)).xyz;
  vsOutput.color = color;
  vsOutput.worldPosition = vec4f(entityMatrixWorld * vec4f(position, 1.0)).xyz;
  return vsOutput;
}
