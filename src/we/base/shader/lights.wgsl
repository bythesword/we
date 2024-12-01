//未使用，作废
let light_number = U_lights.lightNumber;
var light_i = 0;
for(var i = 0; i < light_number; i++)
{
    let one = U_lights.lights[i];           //没有光源，则没有这个，所以这个移到material的TS中
    if(one.kind ==0)
    {
        let lightIntensity = one.intensity;
        let lightDir = normalize (one.direction);
        let lightColor = one.color;
        let colorOfPhong = phongColorOfDirectionalLight(fsInput.worldPosition, fsInput.normal, lightDir, lightColor, lightIntensity, defaultCameraPosition, fsInput.uv);
        colorOfPhoneOfLights += colorOfPhong;
    }
    else if(one.kind ==1)
    {
        let lightIntensity = one.intensity;
        let lightPosition = one.position;
        let lightColor = one.color;
        let colorOfPhong = phongColorOfPointLight(fsInput.worldPosition, fsInput.normal, lightPosition, lightColor, lightIntensity, defaultCameraPosition, fsInput.uv);
        colorOfPhoneOfLights += colorOfPhong;
    }
    else if(one.kind ==2)
    {

    }
}
