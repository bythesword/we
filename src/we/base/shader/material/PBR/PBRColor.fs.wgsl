//PBRColor.fs.wgsl   ,start
struct PBRBaseUniform{
    color : vec4f,          //颜色
    albedo : vec3f,             //反射率
    metallic : f32,             //金属度
    roughness : f32,        //粗糙度
    ao : f32,               //环境光遮蔽
}
@fragment
fn fs(fsInput : VertexShaderOutput) -> ST_GBuffer {
    let F0 = vec3(0.04);
    var albedo : vec3f; var metallic : f32; var roughness : f32; var ao : f32; var normal : vec3f; var materialColor : vec4f;   //基础参数
    //占位符,统一工作流在这里处理
    $PBR_Uniform
    $PBR_albedo
    $PBR_metallic
    $PBR_roughness
    $PBR_ao
    $PBR_normal
    $PBR_color
    //normal = normalize(normal); //这里是切线空间的法线，vs插值输出的，需要归一化
    $deferRender_Depth  //延迟渲染的深度比较占位符
    let wo = normalize(defaultCameraPosition - fsInput.worldPosition);
    var Lo = vec3(0.0);
    if(U_lights.lightNumber >0)
    {
        for (var i : u32 = 0; i < U_lights.lightNumber; i = i + 1)
        {
            let lightColor = U_lights.lights[i].color;
            let lightPosition = U_lights.lights[i].position;
            let lightIntensity = U_lights.lights[i].intensity;
            var distance = 0.0;                         //方向光没有距离
            var attenuation = lightIntensity;           //方向光没有衰减
            var wi = U_lights.lights[i].direction;      //方向光
            if(U_lights.lights[i].kind!=0)
            {
                wi = normalize(lightPosition - fsInput.worldPosition);
                distance = length(lightPosition - fsInput.worldPosition);
                attenuation = lightIntensity / (distance * distance);       //光衰减，这里光是平方，todo，需要考虑gamma校正
            }
            //计算光照强度
            let cosTheta = max(dot(normal, wi), 0.0);
            let radiance = lightColor * attenuation * cosTheta;         //光强
            //计算 DFG
            let halfVector = normalize(wi + wo);
            let f0 = mix(F0, albedo, metallic);
            let F = fresnelSchlick(max(dot(halfVector, wo), 0.0), f0);
            let NDF = DistributionGGX(normal, halfVector, roughness);
            let G = GeometrySmith(normal, wo, wi, roughness);
            //计算Cook-Torrance BRDF:
            let numerator = NDF * G * F;
            let denominator = 4.0 * max(dot(normal, wo), 0.0) * max(dot(normal, wi), 0.0) + 0.0001;
            let specular = numerator / denominator;
            //kS is equal to Fresnel
            let kS = F;
            var kD = vec3(1.0) - kS;
            kD *= 1.0 - metallic;
            //scale light by NdotL   L=wi
            let NdotL = max(dot(normal, wi), 0.0);
            //add to outgoing radiance Lo
            let diffuse = (kD * albedo / PI) * radiance * NdotL;//only diffuse light is currently implemented
            //let ambient = getAmbientColor(albedo, ao);
            Lo += (diffuse + specular) * radiance;
            //Lo=vec3f(metallic);
        }
    }
    let ambient = getAmbientColor(albedo, ao);
    var colorOfPBR = (ambient + Lo);
        //HDR tonemapping
    colorOfPBR = colorOfPBR / (colorOfPBR + vec3f(1.0));
    colorOfPBR = pow(colorOfPBR, vec3f(1.0 / 2.2)) * materialColor.rgb;
    var output : ST_GBuffer;
    $output                         //占位符
    //output.color = vec4f(normal*0.5+0.5, 1);    //
    output.color = vec4f(colorOfPBR, 1);    //
    return output;
}
fn getNormalFromMap(normal : vec3f, normalMapValue : vec3f, WorldPos : vec3f, TexCoords : vec2f) -> vec3f
{
    let tangentNormal = normalMapValue * 2.0 - 1.0;

    let Q1 = dpdx(WorldPos);
    let Q2 = dpdy(WorldPos);
    let st1 = dpdx(TexCoords);
    let st2 = dpdy(TexCoords);

    let N = normalize(normal);
    let T = normalize(Q1 * st2.y - Q2 * st1.y);
    let B = normalize(cross(T, N));
    let TBN = mat3x3(T, B, N);

    return normalize(TBN * tangentNormal);
}
fn fresnelSchlick(cosTheta : f32, F0 : vec3f) -> vec3f
{
    return F0 + (1.0 - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}
fn DistributionGGX(normal : vec3f, halfVector : vec3f, roughness : f32) -> f32
{
    let a = roughness * roughness;
    let a2 = a * a;
    let NdotH = max(dot(normal, halfVector), 0.0);
    let NdotH2 = NdotH * NdotH;
    let nom = a2;
    var denom = (NdotH2 * (a2 - 1.0) + 1.0);
    denom = PI * denom * denom;
    return nom / denom;
}
fn GeometrySchlickGGX(NdotV : f32, roughness : f32) -> f32
{
    let r = (roughness + 1.0);
    let k = (r * r) / 8.0;

    let nom = NdotV;
    let denom = NdotV * (1.0 - k) + k;
    return nom / denom;
}

fn GeometrySmith(normal : vec3f, wo : vec3f, wi : vec3f, roughness : f32) -> f32
{
    let NdotV = max(dot(normal, wo), 0.0);
    let NdotL = max(dot(normal, wi), 0.0);
    let ggx2 = GeometrySchlickGGX(NdotV, roughness);
    let ggx1 = GeometrySchlickGGX(NdotL, roughness);

    return ggx1 * ggx2;
}
fn getAmbientColor(albedo : vec3f, ao : f32) -> vec3f
{
    return AmbientLight.color * AmbientLight.intensity * albedo * ao;
}
//PBRColor.fs.wgsl   ,end
