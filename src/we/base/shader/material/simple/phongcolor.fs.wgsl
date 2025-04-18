//
@group(1) @binding(1) var<uniform> u_Shininess : f32;
@group(1) @binding(2) var<uniform> u_metalness : f32;
@group(1) @binding(3) var<uniform> u_roughness : f32;

@fragment fn fs(fsInput : VertexShaderOutput) -> @location(0) vec4f {
    $deferRender_Depth
    var materialColor = vec4f($red, $green, $blue, $alpha);

    let lightIntensity = 2.0;
    let lightPosition = vec3f(0.0, 0.0, 8.0);
    let lightColor = vec3f(1.0, 1., 1.0);

    let colorOfPhongDS = phongColorDS(fsInput.worldPosition, fsInput.normal, lightPosition, lightColor, lightIntensity, defaultCameraPosition);
    let colorOfAmbient = PhongAmbientColor();

    return vec4f((colorOfAmbient + colorOfPhongDS) * materialColor.rgb, materialColor.a);
}

fn PhongAmbientColor() -> vec3f
{
    return AmbientLight.color * AmbientLight.intensity;
}
fn phongColorDS(position : vec3f, vNormal : vec3f, lightPosition : vec3f, lightColor : vec3f, lightIntensity : f32, viewerPosition : vec3f) -> vec3f
{
    let lightDir = normalize(lightPosition - position);
    let normal = normalize(vNormal);
    let light_atten_coff = lightIntensity / length(lightPosition - position);




    let diff = max(dot(lightDir, normal), 0.0);
    let diffColor = diff * light_atten_coff * lightColor * u_roughness;


    var spec = 0.0;
    let viewDir = normalize(viewerPosition - position);
    let reflectDir = reflect(-lightDir, normal);
    let halfDir = normalize(lightDir + viewDir);
    spec = pow (max(dot(normal, halfDir), 0.0), u_Shininess);
    //spec = pow (max(dot(viewDir, reflectDir), 0.0), u_Shininess);
    let spceularColor : vec3f = light_atten_coff * u_metalness * spec * lightColor;

    return diffColor + spceularColor;

}
