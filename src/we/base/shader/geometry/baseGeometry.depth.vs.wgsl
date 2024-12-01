
 //start:baseGometry.depth.wgls
@vertex fn vs(
@location(0) position : vec3f,
@builtin(instance_index) instanceIndex : u32
) -> @builtin(position) vec4f {
    var pos = matrix_z * projectionMatrix * viewMatrix * modelMatrix * entity.MatrixWorld[instanceIndex] * vec4f(position, 1.0);
    return pos;
}
//end:baseGometry.depth.wgls
