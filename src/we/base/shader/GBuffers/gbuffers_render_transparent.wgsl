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

var<private> epsilon = 0.0000001;


//如果是编辑器，这个unifrom 和FS都需要更改;20241206
@group(0) @binding(0) var gBuffer_depth : texture_depth_2d;
@group(0) @binding(1) var gBuffer_color : texture_2d<f32>;

@group(1) @binding(0) var gBuffer_depth_actor : texture_depth_2d;
@group(1) @binding(1) var gBuffer_depth_dyn : texture_depth_2d;
@group(1) @binding(2) var gBuffer_depth_world : texture_depth_2d;

@group(2) @binding(0) var gBuffer_stage_color_actor : texture_2d<f32>;
@group(2) @binding(1) var gBuffer_stage_color_dyn : texture_2d<f32>;
@group(2) @binding(2) var gBuffer_stage_color_world : texture_2d<f32>;

@fragment 
fn fs(@builtin(position) coord: vec4f) -> @location(0)  vec4f {
    var color: vec4f;
    let uv = coord.xy / vec2f(canvasSizeWidth, canvasSizeHeight);

    let gbuffer_depth = textureLoad(gBuffer_depth, vec2i(floor(coord.xy)), 0);
    color = textureLoad(gBuffer_color, vec2i(floor(coord.xy)), 0);

    let gbuffer_actor = textureLoad(gBuffer_depth_actor, vec2i(floor(coord.xy)), 0);
    let gbuffer_dyn = textureLoad(gBuffer_depth_dyn, vec2i(floor(coord.xy)), 0);
    let gbuffer_world = textureLoad(gBuffer_depth_world, vec2i(floor(coord.xy)), 0);

    let color_world = textureLoad(gBuffer_stage_color_world, vec2i(floor(coord.xy)), 0);
    let color_dyn = textureLoad(gBuffer_stage_color_dyn, vec2i(floor(coord.xy)), 0);
    let color_actor = textureLoad(gBuffer_stage_color_actor, vec2i(floor(coord.xy)), 0);

    color = textureLoad(gBuffer_color, vec2i(floor(coord.xy)), 0);

    if reversedZ {
        if gbuffer_depth > gbuffer_world {
            color = color * (1.0 - color_world.a) + color_world;
        }
        if gbuffer_depth > gbuffer_dyn {
            color = color * (1.0 - color_dyn.a) + color_dyn;
        }
        if gbuffer_depth > gbuffer_actor {
            color = color * (1.0 - color_actor.a) + color_actor;
        }
    } else {
        if gbuffer_depth < gbuffer_world {
            color = color * (1.0 - color_world.a) + color_world;
        }
        if gbuffer_depth < gbuffer_dyn {
            color = color * (1.0 - color_dyn.a) + color_dyn;
        }
        if gbuffer_depth < gbuffer_actor {
            color = color * (1.0 - color_actor.a) + color_actor;
        }
    }
    color = textureLoad(gBuffer_color, vec2i(floor(coord.xy)), 0);
    // color=vec4f(1);
    return color;
}
