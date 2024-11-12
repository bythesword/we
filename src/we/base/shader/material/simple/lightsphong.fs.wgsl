@group(1) @binding(1) var<uniform> u_Shininess : f32;
@group(1) @binding(2) var<uniform> u_metalness : f32;
@group(1) @binding(3) var<uniform> u_roughness : f32;


@fragment fn fs(fsInput : VertexShaderOutput) -> @location(0) vec4f {
    var materialColor = vec4f($red, $green, $blue, $alpha);
    $materialColor

    let colorOfAmbient = PhongAmbientColor();

    var colorOfPhoneOfLights = vec3f(0);    //个光源的pixel的总和

    $lightsColor
    return vec4f((colorOfAmbient + colorOfPhoneOfLights) * materialColor.rgb, materialColor.a);
}

fn PhongAmbientColor() -> vec3f
{
    return AmbientLight.color * AmbientLight.intensity;
}


fn phongColorOfDirectionalLight(position : vec3f, vNormal : vec3f, lightDir : vec3f, lightColor : vec3f, lightIntensity : f32, viewerPosition : vec3f, uv : vec2f) -> vec3f
{
    $normal
    let light_atten_coff = lightIntensity;  //方向光不衰减

    let diff = max(dot(lightDir, normal), 0.0);
    let diffColor = diff * light_atten_coff * lightColor * u_roughness;

    var spec = 0.0;
    let viewDir = normalize(viewerPosition - position);
    let halfDir = normalize(lightDir + viewDir);
    spec = pow (max(dot(normal, halfDir), 0.0), u_Shininess);
    //var specularColor=vec3f(0);
    $spec

    return diffColor + specularColor;
}

fn phongColorOfPointLight(position : vec3f, vNormal : vec3f, lightPosition : vec3f, lightColor : vec3f, lightIntensity : f32, viewerPosition : vec3f, uv : vec2f) -> vec3f
{
    let lightDir = normalize(lightPosition - position);
    //let normal = normalize(vNormal);  //归一化normal，或法线贴图的值
    $normal
    let light_atten_coff = lightIntensity / length(lightPosition - position);   //光衰减，这里阳光是平方，todo，需要考虑gamma校正

    let diff = max(dot(lightDir, normal), 0.0);
    let diffColor = diff * light_atten_coff * lightColor * u_roughness;

    var spec = 0.0;
    let viewDir = normalize(viewerPosition - position);
    let reflectDir = reflect(-lightDir, normal);
    spec = pow (max(dot(viewDir, reflectDir), 0.0), u_Shininess);
    //var specularColor=vec3f(0);
    $spec

    return diffColor + specularColor;
}

fn phongColorOfSpotLight(position : vec3f, vNormal : vec3f, lightPosition : vec3f, lightColor : vec3f, lightIntensity : f32, viewerPosition : vec3f, uv : vec2f) -> vec3f
{
    let lightDir = normalize(lightPosition - position);
    //let normal = normalize(vNormal);  //归一化normal，或法线贴图的值
    $normal
    let light_atten_coff = lightIntensity / length(lightPosition - position);   //光衰减，这里阳光是平方，todo，需要考虑gamma校正

    let diff = max(dot(lightDir, normal), 0.0);
    let diffColor = diff * light_atten_coff * lightColor * u_roughness;

    var spec = 0.0;
    let viewDir = normalize(viewerPosition - position);
    let reflectDir = reflect(-lightDir, normal);
    spec = pow (max(dot(viewDir, reflectDir), 0.0), u_Shininess);
    //var specularColor=vec3f(0);
    $spec

    return diffColor + specularColor;
}
