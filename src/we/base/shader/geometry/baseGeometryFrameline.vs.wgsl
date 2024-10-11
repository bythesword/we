@vertex fn vs(
@location(0) position : vec3f
) -> @builtin(position) vec4f {
    var pos = projectionMatrix * viewMatrix * modelMatrix * vec4f(position, 1.0);
    return pos;
}
struct FragmentOutput {
    @builtin(frag_depth) depth : f32,
    @location(0) color : vec4f
}
@fragment fn fs(
    //) -> @location(0) vec4f {
    //return vec4f(${red},${green},${blue},1);
    //}
@builtin(position) pos : vec4f,
) -> FragmentOutput {
    var output : FragmentOutput;
    output.color = vec4f($red, $green, $blue, 1);
    output.depth = pos.z - 0.000000138;
    return output;
}
