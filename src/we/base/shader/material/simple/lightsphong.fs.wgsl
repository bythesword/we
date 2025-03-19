
//start :lightsphong.fs.wgsl
//@group(1) @binding(1) var<uniform> u_bulinphong : bulin_phong;//20241215 转移到TS中

//检查pixel是否在光源的阴影中
//未处理距离
fn checkPixelInPointLightRange(pixelWorldPosition : vec3f, onelight : ST_Light,) -> i32 {
    var index = -1;
    for (var i : i32 = 0; i <6; i = i + 1)
    { 
        var posFromLight = matrix_z * U_shadowMapMatrix[onelight.shadow_map_array_index+i].MVP * vec4(pixelWorldPosition, 1.0);  //光源视界的位置
        if(posFromLight.w < 0.000001 && posFromLight.w > -0.000001)
        {
           //posFromLight =posFromLight/posFromLight.w;
        }
        else{
            posFromLight = posFromLight / posFromLight.w;
        }
        if(posFromLight.x >= -1.0 && posFromLight.x <= 1.0 && posFromLight.y <= 1.0 && posFromLight.y >= -1.0 && posFromLight.z <= 1.0 && posFromLight.z >= 0.0)
        {
            index = i;
            //break;
        }
    }
    return index;
}

@fragment
fn fs(fsInput : VertexShaderOutput) -> ST_GBuffer {
    $deferRender_Depth
    let shininess = u_bulinphong.shininess;
    let metalness = u_bulinphong.metalness;
    let roughness = u_bulinphong.roughness;
    var materialColor = vec4f($red, $green, $blue, $alpha);
    $materialColor

    let colorOfAmbient = PhongAmbientColor();

    var colorOfPhoneOfLights : array<vec3f, 2>;
    colorOfPhoneOfLights[0]= vec3f(0.0);                    //个光源的pixel的总和
    colorOfPhoneOfLights[1]= vec3f(0.0);                    //个光源的pixel的总和
    //以lightRealNumberOfSystem计算
    var depthColor : vec3f;
    var depthVisibility = 0.0;
    var posFromLight : vec4f;
    var depth_sub_z : f32;
    if(U_lights.lightNumber >0)
    {
        for (var i : u32 = 0; i < U_lights.lightNumber; i = i + 1)
        {
            var onelightPhongColor : array<vec3f, 2>;
            let onelight = U_lights.lights[i ];
            var visibility = 0.0;           //是否在阴影中
            var computeShadow = false;
            var shadow_map_index = onelight.shadow_map_array_index;
            var inPointShadow = false;//是否在点光源的阴影中
            if (onelight.kind ==0)
            {
                computeShadow = true;
                onelightPhongColor = phongColorOfDirectionalLight(fsInput.worldPosition, fsInput.normal, onelight.direction, onelight.color, onelight.intensity, defaultCameraPosition, fsInput.uv);
            }
            else if (onelight.kind ==1)
            {
                computeShadow = true;
                 shadow_map_index = checkPixelInPointLightRange(fsInput.worldPosition, onelight);
                onelightPhongColor = phongColorOfPointLight(fsInput.worldPosition, fsInput.normal, onelight.position, onelight.color, onelight.intensity, defaultCameraPosition, fsInput.uv);
            }
            else if (onelight.kind ==2)
            {
                onelightPhongColor = phongColorOfSpotLight(fsInput.worldPosition, fsInput.normal, onelight.position, onelight.direction, onelight.color, onelight.intensity, onelight.angle, defaultCameraPosition, fsInput.uv);
                computeShadow = inShadowRangOfSpotLight(fsInput.worldPosition, onelight.position, onelight.direction, onelight.angle);
            }

            //如果在点光源的阴影中，计算阴影
            if(shadow_map_index >=0){
                inPointShadow = true;
            }
            //如果不在点光源的阴影中，不计算阴影，进行一次统一工作流
            else{
                shadow_map_index = onelight.shadow_map_array_index;
            }
            //测试使用,正确，之前的问题是没有除以W
            //posFromLight = matrix_z* MVP * vec4(fsInput.worldPosition, 1.0);
            //posFromLight = matrix_z* U_shadowMapMatrix[onelight.shadow_map_array_index].MVP * vec4(fsInput.worldPosition, 1.0);
            //posFromLight =posFromLight/posFromLight.w;
            //depthColor = vec3(
            //posFromLight.xy * vec2(0.5, -0.5) + vec2(0.5),
            //posFromLight.z
            //);

            //depthVisibility = textureSampleCompare(
            //U_shadowMap_depth_texture,                  //t: texture_depth_2d_array
            //shadowSampler,                              //s: sampler_comparison,
            //depthColor.xy,                      //coords: vec2<f32>,
            //onelight.shadow_map_array_index,            //array_index: A,
            //depthColor.z - 0.007                         //depth_ref: f32,
            //);
            //// depthVisibility =textureLoad(U_shadowMap_depth_texture, vec2i(depthColor.xy*shadowDepthTextureSize), 0, 0);
            //colorOfPhoneOfLights[0] += colorOfPhoneOfLights[0] +depthVisibility * onelightPhongColor[0];
            //colorOfPhoneOfLights[1] += colorOfPhoneOfLights[1] +depthVisibility * onelightPhongColor[1];

             visibility = shadowMapVisibilityPCSS(onelight, shadow_map_index, fsInput.worldPosition, fsInput.normal, 0.08); 
            //visibility = shadowMapVisibilityPCF_3x3(onelight,shadow_map_index,  fsInput.worldPosition, fsInput.normal);
           // visibility = shadowMapVisibilityPCF(onelight, shadow_map_index, fsInput.worldPosition, fsInput.normal,0.08);
            //visibility = shadowMapVisibilityHard(onelight, shadow_map_index, fsInput.worldPosition, fsInput.normal);
            if (onelight.shadow ==1 && computeShadow)
            {

            }
            else
            {
                visibility = 1.0;
            }
            //如果是点光源，且不在阴影中，visibility = 1.0
            if (inPointShadow ==false && onelight.kind ==1 &&computeShadow ==true){
                visibility = 1.0;
            }
            colorOfPhoneOfLights[0] += colorOfPhoneOfLights[0] +visibility * onelightPhongColor[0];
            colorOfPhoneOfLights[1] += colorOfPhoneOfLights[1] +visibility * onelightPhongColor[1];

        }
    }
    colorOfPhoneOfLights[0] = colorOfPhoneOfLights[0] /f32(U_lights.lightNumber);
    colorOfPhoneOfLights[1] = colorOfPhoneOfLights[1] /f32(U_lights.lightNumber);
    var output : ST_GBuffer;
    $output
    output.color = vec4f((colorOfAmbient + colorOfPhoneOfLights[0]) * materialColor.rgb + colorOfPhoneOfLights[1], materialColor.a);

    //output.color = vec4f(depthColor.xy,0.,1.0);
    //output.color = vec4f( depthVisibility,depthVisibility,depthVisibility ,1.0);
    //output.color = vec4f(posFromLight.z,posFromLight.z,posFromLight.z,1.0);
    return output;
}

fn dotNormal(normal : vec3f, lightDir : vec3f) -> bool{
    let diff = max(dot(lightDir, normal), 0.0);
    if(diff ==0.0)
    {
        return false;
    }
    else{
        return true;
    }
}


fn PhongAmbientColor() -> vec3f
{
    return AmbientLight.color * AmbientLight.intensity;
}


fn phongColorOfDirectionalLight(position : vec3f, vNormal : vec3f, lightDir : vec3f, lightColor : vec3f, lightIntensity : f32, viewerPosition : vec3f, uv : vec2f) ->array<vec3f, 2>
{
    var colos_DS : array<vec3f, 2>;
    var normal = normalize(vNormal);
    $normal
    let light_atten_coff = lightIntensity;  //方向光不衰减

    let diff = max(dot(lightDir, normal), 0.0);


    let diffColor = diff * light_atten_coff * lightColor * u_bulinphong.roughness;

    var spec = 0.0;
    let viewDir = normalize(viewerPosition - position);
    let halfDir = normalize(lightDir - viewDir);//半角向量，
    //let halfDir = normalize(lightDir + viewDir);//半角向量，这个再确认一下，相加会产生问题（box有小视角阴影有问题）
    spec = pow (max(dot(viewDir, halfDir), 0.0), u_bulinphong.shininess);
    var specularColor = light_atten_coff * u_bulinphong.metalness * spec * lightColor;
    $spec


    colos_DS[0]=diffColor;
    colos_DS[1]=specularColor;
    if(diff ==0.0)
    {
        colos_DS[0]=vec3f(0.0);
        colos_DS[1]=vec3f(0.0);
        return colos_DS;
    }
    return colos_DS;
    //return diffColor + specularColor;
}

fn phongColorOfPointLight(position : vec3f, vNormal : vec3f, lightPosition : vec3f, lightColor : vec3f, lightIntensity : f32, viewerPosition : vec3f, uv : vec2f) -> array<vec3f, 2>
{
    var colos_DS : array<vec3f, 2>;
    let lightDir = normalize(lightPosition - position);
    var normal = normalize(vNormal);            //归一化normal，或法线贴图的值
    $normal
    let light_atten_coff = lightIntensity / length(lightPosition - position);   //光衰减，这里阳光是平方，todo，需要考虑gamma校正

    let diff = max(dot(lightDir, normal), 0.0);

    let diffColor = diff * light_atten_coff * lightColor * u_bulinphong.roughness;

    var spec = 0.0;
    let viewDir = normalize(viewerPosition - position);
    let reflectDir = reflect(-lightDir, normal);
    spec = pow (max(dot(viewDir, reflectDir), 0.0), u_bulinphong.shininess);

    var specularColor = light_atten_coff * u_bulinphong.metalness * spec * lightColor;
    $spec


    if(diff ==0.0)
    {
        colos_DS[0]=vec3f(0.0);
        colos_DS[1]=vec3f(0.0);
        return colos_DS;
    }
    colos_DS[0]=diffColor;
    colos_DS[1]=specularColor;
    return colos_DS;
    //return diffColor + specularColor;
}

fn phongColorOfSpotLight(position : vec3f, vNormal : vec3f, lightPosition : vec3f, lightDirection : vec3f, lightColor : vec3f, lightIntensity : f32, angle : vec2f, viewerPosition : vec3f, uv : vec2f) ->array<vec3f, 2>
{
    var colos_DS : array<vec3f, 2>;
    let lightDir = normalize(lightPosition - position);                     //光源到物体的点的方向
    let viewDir = normalize(viewerPosition - position);
    var normal = normalize(vNormal);                //归一化normal，或法线贴图的值
    $normal
    let light_atten_coff = lightIntensity / length(lightPosition - position);               //光衰减，这里阳光是平方，todo，需要考虑gamma校正


    var diffColor = vec3f(0);


    let limit_inner = cos(angle.x);                                                 //spot内角度的点积域
    let limit_outer = cos(angle.y);                                                 //spot外角度的点积域
    let dotFromDirection = dot(lightDir, normalize(-lightDirection));               //当前点的点积域的值，-是因为光的方向是反的，

    //let limitRange = limit_inner - limit_outer + 0.0000000001;                  //+ 0.00000001,保证inner-outer!=0.0
    //let inLight = saturate((dotFromDirection - limit_outer) / limitRange);
    let inLight = smoothstep(limit_outer, limit_inner, dotFromDirection);       //平滑step

    let halfVector = normalize(lightDir + viewDir);

    let diff = max(dot(lightDir, normal), 0.0);

    diffColor = inLight * diff * light_atten_coff * lightColor * u_bulinphong.roughness;



    let reflectDir = reflect(-lightDir, normal);
        //spec = inLight * pow (max(dot(viewDir, reflectDir), 0.0), u_bulinphong.shininess);

    let specular = dot(normal, halfVector);
    var spec = inLight * select(
    0.0,                                        //value if condition false
    pow(specular, u_bulinphong.shininess),          //value if condition is true
    specular > 0.0);                            //condition


    var specularColor = light_atten_coff * u_bulinphong.metalness * spec * lightColor;
    $spec
    if(diff ==0.0)
    {
        colos_DS[0]=vec3f(0.0);
        colos_DS[1]=vec3f(0.0);
        return colos_DS;
    }
    colos_DS[0]=diffColor;
    colos_DS[1]=specularColor;
    return colos_DS;
    //return diffColor + specularColor;
}

//spot light 判断点是否在spot light的范围内
fn inShadowRangOfSpotLight(position : vec3f, lightPosition : vec3f, lightDirection : vec3f, angle : vec2f) -> bool
{
    let ligh2PostDir = normalize(lightPosition - position);                     //光源到物体的点的方向
    let limit_inner = cos(angle.x);                                                 //spot内角度的点积域
    let limit_outer = cos(angle.y);                                                 //spot外角度的点积域
    let dotFromDirection = dot(ligh2PostDir, normalize(-lightDirection));               //当前点的点积域的值，-是因为光的方向是反的，
    if(dotFromDirection >= limit_outer)
    {
        return true;
    }
    else{
        return false;
    }
}

//end :lightsphong.fs.wgsl
