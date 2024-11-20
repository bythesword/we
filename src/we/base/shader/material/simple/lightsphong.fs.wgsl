@group(1) @binding(1) var<uniform> u_Shininess : f32;
@group(1) @binding(2) var<uniform> u_metalness : f32;
@group(1) @binding(3) var<uniform> u_roughness : f32;


@fragment fn fs(fsInput : VertexShaderOutput) -> @location(0) vec4f {
    let shininess = u_Shininess;
    let metalness = u_metalness;
    let roughness = u_roughness;
    var materialColor = vec4f($red, $green, $blue, $alpha);
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


            if (onelight.kind ==0)
            {
                onelightPhongColor = phongColorOfDirectionalLight(fsInput.worldPosition, fsInput.normal, onelight.direction, onelight.color, onelight.intensity, defaultCameraPosition, fsInput.uv);

            }
            else if (onelight.kind ==1)
            {
                onelightPhongColor = phongColorOfPointLight(fsInput.worldPosition, fsInput.normal, onelight.position, onelight.color, onelight.intensity, defaultCameraPosition, fsInput.uv);
            }
            else if (onelight.kind ==2)
            {
                onelightPhongColor = phongColorOfSpotLight(fsInput.worldPosition, fsInput.normal, onelight.position, onelight.direction, onelight.color, onelight.intensity, onelight.angle, defaultCameraPosition, fsInput.uv);
            }
            colorOfPhoneOfLights[0] = colorOfPhoneOfLights[0] + onelightPhongColor[0];
            colorOfPhoneOfLights[1] = colorOfPhoneOfLights[1] + onelightPhongColor[1];
        }
    }
    //colorOfPhoneOfLights = phongColorOfDirectionalLight(fsInput.worldPosition, fsInput.normal, vec3f(0.0,1.0,0.0), vec3f(1), 2.0, defaultCameraPosition, fsInput.uv);
    //colorOfPhoneOfLights = phongColorOfPointLight(fsInput.worldPosition, fsInput.normal, vec3f(5.0,5.0,8.0), vec3f(1), 5.2, defaultCameraPosition, fsInput.uv);
    //return vec4f((colorOfAmbient + colorOfPhoneOfLights) * materialColor.rgb, materialColor.a);
    return vec4f((colorOfAmbient + colorOfPhoneOfLights[0]) * materialColor.rgb + colorOfPhoneOfLights[1], materialColor.a);
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
    let diffColor = diff * light_atten_coff * lightColor * u_roughness;

    var spec = 0.0;
    let viewDir = normalize(viewerPosition - position);
    let halfDir = normalize(lightDir + viewDir);
    spec = pow (max(dot(viewDir, halfDir), 0.0), u_Shininess);
    var specularColor = light_atten_coff * u_metalness * spec   * lightColor;
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
    let diffColor = diff * light_atten_coff * lightColor * u_roughness;

    var spec = 0.0;
    let viewDir = normalize(viewerPosition - position);
    let reflectDir = reflect(-lightDir, normal);
    spec = pow (max(dot(viewDir, reflectDir), 0.0), u_Shininess);

    var specularColor = light_atten_coff * u_metalness * spec  * lightColor;
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
    let dotFromDirection = dot(lightDir, normalize(-lightDirection));               //当前点的点积域的值

    //let limitRange = limit_inner - limit_outer + 0.0000000001;                  //+ 0.00000001,保证inner-outer!=0.0
    //let inLight = saturate((dotFromDirection - limit_outer) / limitRange);
    let inLight = smoothstep(limit_outer, limit_inner, dotFromDirection);

    let halfVector = normalize(lightDir + viewDir);

    let diff = dot(lightDir, normal);
    diffColor = inLight * diff * light_atten_coff * lightColor * u_roughness;



    let reflectDir = reflect(-lightDir, normal);
        //spec = inLight * pow (max(dot(viewDir, reflectDir), 0.0), u_Shininess);

    let specular = dot(normal, halfVector);
    var spec = inLight * select(
    0.0,                                        //value if condition false
    pow(specular, u_Shininess),             //value if condition is true
    specular > 0.0);                            //condition
     

    var specularColor = light_atten_coff * u_metalness * spec   * lightColor;
    $spec
    var colos_DS : array<vec3f, 2>;
    colos_DS[0]=diffColor;
    colos_DS[1]=specularColor;
    return colos_DS;
    //return diffColor + specularColor;
}
