
//start:oneColorCube.position.fs.wgsl
//这个shader 未使用 part定义的VertexShaderOutput结构体，而是用了自定义的VertexShaderOutput_oneCube
//其他不变


@fragment 
fn fs(fsInput: VertexShaderOutput_oneCube) -> ST_GBuffer {
    $deferRender_Depth

    var output: ST_GBuffer;
    $output
    output.color = fsInput.fsPosition;

    return output;
}
//end:oneColorCube.position.fs.wgsl
