@group(0) @binding(0) var u_screen_texture : texture_2d<f32>;   
// @group(0) @binding(1) var u_Sampler : sampler;
     

override canvasSizeWidth : f32;
override canvasSizeHeight : f32;

@fragment
fn fs(@builtin(position) coord: vec4f) -> @location(0)  vec4f {
    var left = -1.0;
    var right = 1.0;
    var top = -1.0;
    var bottom = 1.0;
    if coord.x <= 0.0 {
        left = 0.0;
    }
    if coord.x >= canvasSizeWidth {
        right = 0.0;
    }
    if coord.y <= 0.0 {
        top = 0.0;
    }
    if coord.y >= canvasSizeHeight {
        bottom = 0.0;
    }
    var color = //3x3
    textureLoad(u_screen_texture, vec2i(floor(vec2f(coord.x + left, coord.y + top))), 0) + //
    textureLoad(u_screen_texture, vec2i(floor(vec2f(coord.x + 0, coord.y + top))), 0) + //
    textureLoad(u_screen_texture, vec2i(floor(vec2f(coord.x + right, coord.y + top))), 0) + //

    textureLoad(u_screen_texture, vec2i(floor(vec2f(coord.x + left, coord.y))), 0) + //
    textureLoad(u_screen_texture, vec2i(floor(vec2f(coord.x + 0, coord.y))), 0) + //
    textureLoad(u_screen_texture, vec2i(floor(vec2f(coord.x + right, coord.y))), 0) + //
    
    textureLoad(u_screen_texture, vec2i(floor(vec2f(coord.x + left, coord.y + bottom))), 0) + //
    textureLoad(u_screen_texture, vec2i(floor(vec2f(coord.x + 0, coord.y + bottom))), 0) + //
    textureLoad(u_screen_texture, vec2i(floor(vec2f(coord.x + right, coord.y + bottom))), 0) ;

    return  color / 9.0;
    // let color=     textureLoad(u_screen_texture, vec2i(floor(coord.xy)), 0) ;
    // return color;
    // return vec4f(0,1,0,1);
}