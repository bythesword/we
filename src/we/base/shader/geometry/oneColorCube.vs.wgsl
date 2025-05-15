

//这个shader 未使用 part定义的VertexShaderOutput结构体，而是用了自定义的VertexShaderOutput_oneCube
struct VertexShaderOutput_oneCube {
    @builtin(position) position : vec4f,
    @location(0) uv : vec2f,
    @location(1) normal : vec3f,
    @location(2) color : vec3f,
    @location(3) worldPosition : vec3f,
    @location(4) @interpolate(flat) entityID : u32,
    @location(5) fsPosition : vec4f,
    @location(6) cubeUV : vec3f,
};
@vertex fn vs(
@location(0) position : vec3f,
@location(1) uv : vec2f,
@location(2) normal : vec3f,
@location(3) color : vec3f,
@builtin(instance_index) instanceIndex : u32,
@builtin(vertex_index) vertexIndex : u32
) -> VertexShaderOutput_oneCube {
    var vsOutput : VertexShaderOutput_oneCube;
    vsOutput.position =matrix_z *  MVP * entity.MatrixWorld[instanceIndex] * vec4f(position, 1.0);
    vsOutput.uv = uv;
    vsOutput.normal = vec4f(entity.MatrixWorld[instanceIndex] * vec4f(normal, 0)).xyz;
    vsOutput.color = color;
    vsOutput.worldPosition = vec4f(entity.MatrixWorld[instanceIndex] * vec4f(position, 1.0)).xyz;
    vsOutput.fsPosition = 0.5 * (vec4f(position, 1) + vec4($width));
    vsOutput.cubeUV = normalize(vsOutput.worldPosition - defaultCameraPosition);
    let entity_id = entity.entity_id << 14;
    let stage_id = entity.stage_id << 29;
    vsOutput.entityID = instanceIndex + entity_id + stage_id;
    return vsOutput;
}
