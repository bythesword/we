
//start:oneColorCube.color.fs.wgsl
//这个shader 未使用 part定义的VertexShaderOutput结构体，而是用了自定义的VertexShaderOutput_oneCube
//其他不变
@fragment fn fs(fsInput : VertexShaderOutput_oneCube) -> ST_GBuffer {
  var output : ST_GBuffer;

  $output

  output.color = vec4f(fsInput.color, 1.0);
  return output;
}
//end:oneColorCube.color.fs.wgsl
