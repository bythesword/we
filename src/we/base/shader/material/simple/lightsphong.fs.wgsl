
//start :lightsphong.fs.wgsl
//@group(1) @binding(1) var<uniform> u_bulinphong : bulin_phong;//20241215 转移到TS中


@fragment
fn fs(fsInput : VertexShaderOutput) -> ST_GBuffer {
    $deferRender_Depth
    let shininess = u_bulinphong.shininess;
    let metalness = u_bulinphong.metalness;
    let roughness = u_bulinphong.roughness;
    var materialColor = vec4f($red, $green , $blue, $alpha);
    $materialColor

    let colorOfAmbient = PhongAmbientColor();

    var colorOfPhoneOfLights : array<vec3f, 2>;
    colorOfPhoneOfLights[0]= vec3f(0.0);                    //个光源的pixel的总和
    colorOfPhoneOfLights[1]= vec3f(0.0);                    //个光源的pixel的总和
    //以lightRealNumberOfSystem计算
    if(U_lights.lightNumber >0)
    {
        for (var i : u32 = 0; i < U_lights.lightNumber; i = i + 1)
        {
            var onelightPhongColor : array<vec3f, 2>;
            let onelight = U_lights.lights[i ];
            var visibility = 0.0;           //是否在阴影中
            var computeShadow =false;
            if (onelight.kind ==0)
            {
                computeShadow=true;
                onelightPhongColor = phongColorOfDirectionalLight(fsInput.worldPosition, fsInput.normal, onelight.direction, onelight.color, onelight.intensity, defaultCameraPosition, fsInput.uv);
            }
            else if (onelight.kind ==1)
            {
                onelightPhongColor = phongColorOfPointLight(fsInput.worldPosition, fsInput.normal, onelight.position, onelight.color, onelight.intensity, defaultCameraPosition, fsInput.uv);
            }
            else if (onelight.kind ==2)
            {
                onelightPhongColor = phongColorOfSpotLight(fsInput.worldPosition, fsInput.normal, onelight.position, onelight.direction, onelight.color, onelight.intensity, onelight.angle, defaultCameraPosition, fsInput.uv);
                 computeShadow=inShadowRangOfSpotLight(fsInput.worldPosition,   onelight.position, onelight.direction,  onelight.angle );
            }
            
            // visibility = shadowMapVisibilityHard(onelight, fsInput.worldPosition, fsInput.normal);
            // visibility = shadowMapVisibilityPCF_3x3(onelight, fsInput.worldPosition, fsInput.normal);
            // visibility = shadowMapVisibilityPCF(onelight, fsInput.worldPosition, fsInput.normal,0.08);
            
            visibility = shadowMapVisibilityPCSS(onelight, fsInput.worldPosition, fsInput.normal,0.08);
            if (onelight.shadow ==1 && computeShadow)
            {
               
            }
            else{
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
    return output;
}



fn PhongAmbientColor() -> vec3f
{
    return AmbientLight.color * AmbientLight.intensity;
}


fn phongColorOfDirectionalLight(position : vec3f, vNormal : vec3f, lightDir : vec3f, lightColor : vec3f, lightIntensity : f32, viewerPosition : vec3f, uv : vec2f) ->array<vec3f, 2>
{
    var normal = normalize(vNormal);
    $normal
    let light_atten_coff = lightIntensity;  //方向光不衰减

    let diff = max(dot(lightDir, normal), 0.0);
    let diffColor = diff * light_atten_coff * lightColor * u_bulinphong.roughness;

    var spec = 0.0;
    let viewDir = normalize(viewerPosition - position);
    let halfDir = normalize(lightDir + viewDir);
    spec = pow (max(dot(viewDir, halfDir), 0.0), u_bulinphong.shininess);
    var specularColor = light_atten_coff * u_bulinphong.metalness * spec * lightColor;
    $spec

    var colos_DS : array<vec3f, 2>;
    colos_DS[0]=diffColor;
    colos_DS[1]=specularColor;
    return colos_DS;
    //return diffColor + specularColor;
}

fn phongColorOfPointLight(position : vec3f, vNormal : vec3f, lightPosition : vec3f, lightColor : vec3f, lightIntensity : f32, viewerPosition : vec3f, uv : vec2f) -> array<vec3f, 2>
{
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


    var colos_DS : array<vec3f, 2>;
    colos_DS[0]=diffColor;
    colos_DS[1]=specularColor;
    return colos_DS;
    //return diffColor + specularColor;
}

fn phongColorOfSpotLight(position : vec3f, vNormal : vec3f, lightPosition : vec3f, lightDirection : vec3f, lightColor : vec3f, lightIntensity : f32, angle : vec2f, viewerPosition : vec3f, uv : vec2f) ->array<vec3f, 2>
{

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

    let diff = dot(lightDir, normal);
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
    var colos_DS : array<vec3f, 2>;
    colos_DS[0]=diffColor;
    colos_DS[1]=specularColor;
    return colos_DS;
    //return diffColor + specularColor;
}
fn inShadowRangOfSpotLight(position : vec3f,  lightPosition : vec3f, lightDirection : vec3f,   angle : vec2f ) -> bool
{

    let lightDir = normalize(lightPosition - position);                     //光源到物体的点的方向
 
   

    let limit_inner = cos(angle.x);                                                 //spot内角度的点积域
    let limit_outer = cos(angle.y);                                                 //spot外角度的点积域
    let dotFromDirection = dot(lightDir, normalize(-lightDirection));               //当前点的点积域的值，-是因为光的方向是反的，
    if(dotFromDirection <= limit_outer){
        return true;
    }
    else{
        return false;
    }
}

//end :lightsphong.fs.wgsl
