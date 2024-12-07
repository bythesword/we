
//start:baseGeometryFramelines.vs.wgsl
@vertex fn vs(
@location(0) position : vec3f,
@builtin(instance_index) instanceIndex : u32
) -> VertexShaderOutput {
    var vsOutput : VertexShaderOutput;

    //这个没有使用替换内容
    vsOutput.position = matrix_z * projectionMatrix * viewMatrix * modelMatrix * entity.MatrixWorld[instanceIndex] * vec4f(position, 1.0);
    vsOutput.uv = vec2f(1);
    vsOutput.normal = vec3f(1);
    vsOutput.color = vec3f(1);
    vsOutput.worldPosition = vec4f(entity.MatrixWorld[instanceIndex] * vec4f(position, 1.0)).xyz;
    let entity_id = entity.entity_id << 14;
    let stage_id = entity.stage_id << 29;
    vsOutput.entityID =  entity.entity_id ;//instanceIndex + entity_id + stage_id;




    return vsOutput;
}
//start:baseGeometryFramelines.vs.wgsl
