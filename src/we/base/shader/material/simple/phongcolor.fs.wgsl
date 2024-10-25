@fragment fn fs(fsInput : VertexShaderOutput) -> @location(0) vec4f {
  var materialColor = vec4f($red, $green, $blue, $alpha);

  let lightIntensity = 20.0;
  let lightPosition = vec3f(0.0,  0.0,8.0);
  let lightColor=vec3f(1.0,1.,1.0);

  let color = phong(materialColor.rgb, fsInput.worldPosition, fsInput.normal, lightPosition,lightColor, lightIntensity,defaultCameraPosition);
  return vec4f(color, materialColor.a);
}


fn phong(color : vec3f, position : vec3f, vNormal : vec3f, lightPosition : vec3f,lightColor:vec3f, lightIntensity : f32,viewerPosition:vec3f) -> vec3f
{
  let lightDir = normalize(lightPosition - position);
  let normal = normalize(vNormal);
  let light_atten_coff = lightIntensity / length(lightPosition - position);

  let ambientColor : vec3f = color.xyz * AmbientLight.intensity + AmbientLight.color * AmbientLight.intensity;


  let diff = max(dot(lightDir, normal), 0.0);
  let diffColor = diff * light_atten_coff * color;


  var spec = 0.0;
  let viewDir = normalize(viewerPosition - position);
  let reflectDir = reflect(-lightDir, normal);
  spec = pow (max(dot(viewDir, reflectDir), 0.0), 35.0);
  var spceularColor : vec3f = lightColor * light_atten_coff * spec;

  let reColor = ambientColor + diffColor + spceularColor;

  return reColor;
}
