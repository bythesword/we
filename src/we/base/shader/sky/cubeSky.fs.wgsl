

//start:cubeSky.fs.wgsl
//这个用VS output的结构体是：VertexShaderOutput_oneCube
@group(1) @binding(1) var mySampler : sampler;
@group(1) @binding(2) var myTexture : texture_cube < f32>;

@fragment fn fs (fsInput : VertexShaderOutput_oneCube) -> ST_GBuffer {
  var output : ST_GBuffer;
  $output
  var cubemapVec = normalize(fsInput.fsPosition.xyz - vec3(0.5));
  output.color = textureSample(myTexture, mySampler, cubemapVec);

  return output;
}
//end:cubeSky.fs.wgsl
