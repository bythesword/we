//start : color.fs.wgsl
@fragment 
fn fs(fsInput: VertexShaderOutput) -> ST_GBuffer {
    $deferRender_Depth
    var output: ST_GBuffer;
    $output
    output.color = vec4f($red, $green, $blue, $alpha);
    $vertexColor
    return output;
}
//end : color.fs.wgsl
