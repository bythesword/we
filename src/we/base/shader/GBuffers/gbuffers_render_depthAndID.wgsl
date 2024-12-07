//如果是编辑器，这个unifrom 和FS都需要更改;20241206
@group(0) @binding(0) var gBuffer_depth_actor : texture_depth_2d;           //Acotr
@group(0) @binding(1) var gBuffer_depth_dyn : texture_depth_2d;         //DynamicEntities
@group(0) @binding(2) var gBuffer_depth_world : texture_depth_2d;           //World
@group(0) @binding(3) var gBuffer_depth_sky : texture_depth_2d;         //Sky

@group(1) @binding(0) var gBuffer_id_actor : texture_2d<u32>;           //Actor
@group(1) @binding(1) var gBuffer_id_dyn : texture_2d<u32>;         //DynamicEntities
@group(1) @binding(2) var gBuffer_id_world : texture_2d<u32>;           //World
@group(1) @binding(3) var gBuffer_id_sky : texture_2d<u32>;         //Sky

@group(2) @binding(0) var gBuffer_c_actor : texture_2d<f32>;        //Actor
@group(2) @binding(1) var gBuffer_c_dyn : texture_2d<f32>;      //DynamicEntities
@group(2) @binding(2) var gBuffer_c_world : texture_2d<f32>;        //World
@group(2) @binding(3) var gBuffer_c_sky : texture_2d<f32>;      //Sky

@group(3) @binding(0) var gBuffer_n_actor : texture_2d<f32>;        //Actor
@group(3) @binding(1) var gBuffer_n_dyn : texture_2d<f32>;      //DynamicEntities
@group(3) @binding(2) var gBuffer_n_world : texture_2d<f32>;        //World
@group(3) @binding(3) var gBuffer_n_sky : texture_2d<f32>;      //Sky
//override far : f32 = 1.0;
//override count_of_stage : u32 = 4;
override reversedZ : bool = false;
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

struct ST_GBuffer_depthAndID {
    @builtin(frag_depth) depth: f32,
    @location(0) color: vec4f,
    @location(1) id: u32,
    
}
//如果是编辑器，这个需要更改;20241206
@fragment
fn fs(@builtin(position) coord: vec4f) -> ST_GBuffer_depthAndID {
    let uv = coord.xy / vec2f(canvasSizeWidth, canvasSizeHeight);

    let depth0 = textureLoad(gBuffer_depth_actor, vec2i(floor(coord.xy)), 0);
    let depth1 = textureLoad(gBuffer_depth_dyn, vec2i(floor(coord.xy)), 0);
    let depth2 = textureLoad(gBuffer_depth_world, vec2i(floor(coord.xy)), 0);
    let depth3 = textureLoad(gBuffer_depth_sky, vec2i(floor(coord.xy)), 0);

    var depths: array<f32, 4> = array<f32, 4 >(depth0, depth1, depth2, depth3);

    let id0 = textureLoad(gBuffer_id_actor, vec2i(floor(coord.xy)), 0).r;
    let id1 = textureLoad(gBuffer_id_dyn, vec2i(floor(coord.xy)), 0).r;
    let id2 = textureLoad(gBuffer_id_world, vec2i(floor(coord.xy)), 0).r;
    let id3 = textureLoad(gBuffer_id_sky, vec2i(floor(coord.xy)), 0).r;

    let c0 = textureLoad(gBuffer_c_actor, vec2i(floor(coord.xy)), 0);
    let c1 = textureLoad(gBuffer_c_dyn, vec2i(floor(coord.xy)), 0);
    let c2 = textureLoad(gBuffer_c_world, vec2i(floor(coord.xy)), 0);
    let c3 = textureLoad(gBuffer_c_sky, vec2i(floor(coord.xy)), 0);

    let n0 = textureLoad(gBuffer_n_actor, vec2i(floor(coord.xy)), 0);
    let n1 = textureLoad(gBuffer_n_dyn, vec2i(floor(coord.xy)), 0);
    let n2 = textureLoad(gBuffer_n_world, vec2i(floor(coord.xy)), 0);
    let n3 = textureLoad(gBuffer_n_sky, vec2i(floor(coord.xy)), 0);

    var IDS: array<u32, 4> = array<u32, 4 >(id0, id1, id2, id3);

    // var index : u32;
    var index_i: u32 = 0;
    if reversedZ {
        var value = 0.0;
        for (var i: u32 = 0; i < 4; i = i + 1) {
            if depths[i] > value && IDS[i] != 0  {
                value = depths[i];
                index_i = i;
            }
        }
        //  index_i=2;
    } else {
        var value = 1.0;
        for (var i: u32 = 0; i < 4; i = i + 1) {
            if depths[i] < value && IDS[i] != 0 {
                value = depths[i];
                index_i = i;
            }
        }
        // index_i=2;
    }
    var output: ST_GBuffer_depthAndID;

    // var abc: f32 = 0.0;
    // if id2 == 1 {
    //     abc = 0.5;
    // } 
    // else if id2 == 2 {
    //     abc = 0.95;
    // } 
    // output.color = vec4f(abc, 0, 0, 1);

    // output.color = vec4f(f32(id2)/2., 0, 0, 1);//ok
    // output.color = vec4f(f32(IDS[maxIndex]>>14)/2., 0, 0, 1);//ok

    let stageIDMask:u32 = (1 << 29) -1;//ok
    let tt =IDS[index_i];//ok
    let entityID = tt & stageIDMask;//ok
    let realEntityID = entityID >> 14;//ok
    output.color = vec4f(f32(realEntityID) / 2., 0, 0, 1);//ok

    //output.color = c2;
    //output.color = n2;
   
    // output.color = vec4f(f32( id2*10)/50, 0,0,1);//ok
    // output.color = vec4f(depths[index_i], depths[index_i], depths[index_i], 1);

    output.id = IDS[index_i];
    output.depth = depths[index_i];

    return output;
}
//如果是编辑器，这个需要更改;20241206
fn findMinIndex(arr: array<f32, 4>) -> u32 {
    var minIndex = 0u;
    var minValue = arr[0];
    for (var i = 0u; i < 4; i = i + 1u) {
        if arr[i] < minValue {
            minValue = arr[i];
            minIndex = i;
        }
    }
    return minIndex;
}
//如果是编辑器，这个需要更改;20241206
fn findMaxIndex(arr: array<f32, 4>) -> u32 {
    var maxIndex: u32 = 0;
    var maxValue = arr[2];
    for (var i: u32 = 0; i < 4; i = i + 1) {
        if arr[i] > maxValue {
            maxValue = arr[i];
            maxIndex = i;
        }
    }
    return maxIndex;
}
