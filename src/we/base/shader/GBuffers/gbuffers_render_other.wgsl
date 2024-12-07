//override far : f32 = 1.0;
//override count_of_stage : u32 = 4;
//override reversedZ : bool = false;
override canvasSizeWidth : f32;
override canvasSizeHeight : f32;


@vertex 
fn vs(@builtin(vertex_index) VertexIndex: u32) -> @builtin(position) vec4f {
    const pos = array(
        vec2(-1.0, -1.0), vec2(1.0, -1.0), vec2(-1.0, 1.0),
        vec2(-1.0, 1.0), vec2(1.0, -1.0), vec2(1.0, 1.0),
    );
    let position = vec4f(pos[VertexIndex], 0.0, 1.0);
    return position;
}

struct ST_GBuffer_other {
    @location(0) color: vec4f,
    @location(1) normal: vec4f,
    @location(2) uv: vec4f,
}
@group(0) @binding(0) var gBuffer_id : texture_2d<u32>;

@group(1) @binding(0) var gBuffer_stage_id : texture_2d<u32>;
@group(1) @binding(1) var gBuffer_stage_color : texture_2d<f32>;
@group(1) @binding(2) var gBuffer_stage_normal : texture_2d<f32>;
@group(1) @binding(3) var gBuffer_stage_uv : texture_2d<f32>;

@fragment
fn fs(@builtin(position) coord: vec4f) -> ST_GBuffer_other {
    var output: ST_GBuffer_other;

    let uv = coord.xy / vec2f(canvasSizeWidth, canvasSizeHeight);
    let id_end = textureLoad(gBuffer_id, vec2i(floor(coord.xy)), 0).r;
    let id_stage = textureLoad(gBuffer_stage_id, vec2i(floor(coord.xy)), 0).r;

    if id_end != id_stage {
        discard;
    }



    output.color = textureLoad(gBuffer_stage_color, vec2i(floor(coord.xy)), 0);
    
    // output.color = textureLoad(gBuffer_stage_color, vec2i(floor(coord.xy)), 0);
    output.normal = textureLoad(gBuffer_stage_normal, vec2i(floor(coord.xy)), 0);
    output.uv = textureLoad(gBuffer_stage_uv, vec2i(floor(coord.xy)), 0);
    return output;
}
