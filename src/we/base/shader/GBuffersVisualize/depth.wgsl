//@group(0) @binding(1) var u_Sampler : sampler_comparison;
@group(0) @binding(0) var gBuffer_depth : texture_depth_2d;

struct outpuVertex {
    @builtin(position) position : vec4f,
    @location(0) uv : vec2f,
}

@vertex
fn vs(@builtin(vertex_index) VertexIndex : u32) -> outpuVertex {
    const pos = array(
    vec2(-1.0, -1.0), vec2(1.0, -1.0), vec2(-1.0, 1.0),
    vec2(-1.0, 1.0), vec2(1.0, -1.0), vec2(1.0, 1.0),
    );
    const uv = array(
    vec2(0.0, 1.0), vec2(1.0, 1.0), vec2(0.0, 0.0),
    vec2(0.0, 0.0), vec2(1.0, 1.0), vec2(1.0, 0.0),
    );
    var output : outpuVertex;
    output.position = vec4f(pos[VertexIndex], 0.0, 1.0);
    output.uv = vec2f(uv[VertexIndex]);
    return output;
}

override scaleWidth : f32 = 1.0;
override scaleHeight : f32 = 1.0;
override u32OffsetX : f32=0;
override u32OffsetY : f32=0;

@fragment
fn fs(@location(0) uv : vec2f,
@builtin(position) coord : vec4f
) -> @location(0) vec4f {
    //let depth = textureSample(gBuffer_depth, u_Sampler, uv);
    //var depth1 = textureSampleCompare(gBuffer_depth, u_Sampler, uv, 0.15);//// 输出的是比较后的0 || 1
    //var depth = textureLoad(gBuffer_depth, vec2i(0),0);
    let  a =scaleWidth;
    let b =scaleHeight;
    var depth = textureLoad(gBuffer_depth, vec2i(i32(floor(coord.x + u32OffsetX) *scaleWidth ), i32(floor(coord.y + u32OffsetY) *scaleHeight )), 0);
    //let id = textureLoad(gBuffer_id, vec2i(i32(floor(coord.x + u32OffsetX) * u32Scale), i32(floor(coord.y + u32OffsetY) * u32Scale)), 0).r;//所以调整entityID到0，0的位置，省事

    //var depth = textureLoad(gBuffer_depth, vec2i(i32(floor(coord.x + u32OffsetX*scaleWidth) + u32OffsetX), i32(floor(coord.y*scaleHeight) + u32OffsetX)), 0);
  //  var depth = textureLoad(gBuffer_depth, vec2i(i32(floor((coord.x + u32OffsetX) *scaleWidth) ), i32(floor((coord.y+ u32OffsetY)*scaleHeight) )), 0);//其他正确的
//

    return vec4f(depth, depth, depth, 1);

    //return vec4f(1);
}
