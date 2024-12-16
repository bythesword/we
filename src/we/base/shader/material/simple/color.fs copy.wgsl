

//start : color.fs.wgsl
@fragment fn fs(fsInput : VertexShaderOutput) -> ST_GBuffer {
  //return vec4f($red,$green,$blue,$alpha);
  var output : ST_GBuffer;
  $output

  output.color = vec4f($red, $green, $blue, $alpha);
  return output;
}
//end : color.fs.wgsl
