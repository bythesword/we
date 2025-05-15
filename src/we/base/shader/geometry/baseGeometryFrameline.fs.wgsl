
//start:baseGeometryFrameline.fs.wgsl
struct ST_frameline {
    @builtin(frag_depth) depth : f32,
    @location(0) color : vec4f,
    @location(1) id : u32,
}
@fragment fn fs(fsInput : VertexShaderOutput) -> ST_GBuffer {
    var output : ST_GBuffer;
    $output
    //在替换之后，更新了depth的值
    if(U_MVP.reversedZ ==1)
    {
        output.depth = fsInput.position.z + 0.00000025;
    }
    else {
        output.depth = fsInput.position.z - 0.00000025;
    } 
    output.color = vec4f($red, $green, $blue, 1);   //在替换之后，更新了color
    return output;
}
//start:baseGeometryFrameline.fs.wgsl
