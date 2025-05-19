@fragment
fn fs(fsInput : VertexShaderOutput) -> ST_GBuffer {
    $deferRender_Depth
 
    var materialColor = vec4f($red, $green, $blue, $alpha);
    //替换标识符，材质颜色
    $materialColor

    var output : ST_GBuffer;
    //替换标识符，输出结构体
    $output

    //输出的color
    output.color = materialColor;

    return output;
}
