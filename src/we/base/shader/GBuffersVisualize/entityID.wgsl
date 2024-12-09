
@group(0) @binding(0) var  gBuffer_id : texture_2d<u32>;            
// @group(0) @binding(1) var u_Sampler : sampler;

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
    var output: outpuVertex;
    output.position = vec4f(pos[VertexIndex], 0.0, 1.0);
    output.uv = vec2f(uv[VertexIndex]);
    return output;
}

override u32OffsetX : f32=0;
override u32OffsetY : f32=0;
override u32Scale : f32=1;

@fragment
fn fs(@builtin(position) coord: vec4f) -> @location(0)  vec4f {

    // let uv = coord.xy / vec2f(canvasSizeWidth, canvasSizeHeight);
    let id = textureLoad(gBuffer_id, vec2i(i32(floor(coord.x + u32OffsetX) * u32Scale), i32(floor(coord.y + u32OffsetY) * u32Scale)), 0).r;//所以调整entityID到0，0的位置，省事
    // let id = textureLoad(gBuffer_id, vec2i(i32(floor(coord.x-150)*4),i32(floor(coord.y)*4)), 0).r;
    //u32的texture的采样，与uv的不同，放大n倍坐标，就是缩小n被采样；反之，则放大
    //另外，偏移则是+-，-+上pixel的整数量

    let stageIDMask: u32 = (1 << 29) -1;//ok

    let entityID = id & stageIDMask;//ok
    let realEntityID = entityID >> 14;//ok



    var instanceID = id & 0x3fffu;
    // var instanceID = ttt <<18 ;////ok
    //  instanceID = instanceID >>18 ;////ok

    let stageID = id >> 29;//ok
    // // output.color = vec4f(0, 0, f32(instanceID) / 20, 1);//ok
    // // output.color = vec4f(f32(realEntityID) / 2., f32(stageID + 1) / 16, f32(instanceID)/20., 1);//ok
    // output.color = vec4f(0, f32(stageID + 1) / 16, 0, 1);//ok

    // return vec4f(f32(realEntityID)/2., 0, 0, 1);//ok
    return vec4f(f32(realEntityID) / 255., f32(stageID + 1) / 16, f32(instanceID) / 255., 1);//ok
}
