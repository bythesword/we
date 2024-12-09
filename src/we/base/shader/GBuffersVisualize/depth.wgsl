@group(0) @binding(1) var u_Sampler : sampler;
@group(0) @binding(0) var gBuffer_depth : texture_depth_2d;           

struct outpuVertex {
    @builtin(position) position: vec4f,
    @location(0) uv: vec2f,
}

@vertex
fn vs(@builtin(vertex_index) VertexIndex: u32) -> outpuVertex {
    const pos = array(
        vec2(-1.0, -1.0), vec2(1.0, -1.0), vec2(-1.0, 1.0),
        vec2(-1.0, 1.0), vec2(1.0, -1.0), vec2(1.0, 1.0),
    );
    const uv = array(
        vec2(0.0, 1.0), vec2(1.0, 1.0), vec2(0.0, 0.0),
        vec2(0.0, 0.0), vec2(1.0, 1.0), vec2(1.0, 0.0),
    );
    var output:outpuVertex;
    output.position = vec4f(pos[VertexIndex], 0.0, 1.0);
    output.uv= vec2f(uv[VertexIndex]);
    return output;
}


@fragment
fn fs(@location(0) uv: vec2f) -> @location(0)  vec4f {
    let depth = textureSample(gBuffer_depth, u_Sampler, uv);
    // return vec4f(depth, depth, depth, 1);
    return vec4f(depth, depth, depth, 1);
}
