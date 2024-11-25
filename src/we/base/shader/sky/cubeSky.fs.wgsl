
@group(1) @binding(1) var mySampler : sampler;
@group(1) @binding(2) var myTexture : texture_cube < f32>;

@fragment fn fs (fsInput : VertexShaderOutput) -> @location(0) vec4f {
  //Our camera and the skybox cube are both centered at (0, 0, 0)
  //so we can use the cube geomtry position to get viewing vector to sample the cube texture.
  //The magnitude of the vector doesn't matter.
  var cubemapVec = normalize(fsInput.fsPosition.xyz - vec3(0.5));
  return textureSample(myTexture, mySampler, cubemapVec);

  //return textureSample(myTexture, mySampler, fsInput.cubeUV);
}
