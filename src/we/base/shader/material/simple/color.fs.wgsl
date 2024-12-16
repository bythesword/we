
// override canvasSizeWidth : f32;
// override canvasSizeHeight : f32;

//start : color.fs.wgsl
@fragment 
fn fs(fsInput: VertexShaderOutput) -> ST_GBuffer {
    $deferRender_Depth
    // let depth0 = textureLoad(u_DeferDepth, vec2i(floor(fsInput.position.xy)), 0);
    // if abs(depth0 - fsInput.position.z) > weZero {
    //   discard;
    // }
    // let uv = fsInput.position.xy / vec2f(canvasSizeWidth, canvasSizeHeight);

  //return vec4f($red,$green,$blue,$alpha);
    var output: ST_GBuffer;
    $output

    output.color = vec4f($red, $green, $blue, $alpha);
    // if uv.y > 0.5 {
    //     output.color = vec4f(fsInput.position.z, fsInput.position.z, fsInput.position.z, 1);
    // } else {
    //     output.color = vec4f(depth0, depth0, depth0, 1);
    // }
    return output;
}
//end : color.fs.wgsl
