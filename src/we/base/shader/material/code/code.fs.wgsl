//start : code.fs.wgsl
@fragment 
fn fs(fsInput: VertexShaderOutput) -> ST_GBuffer {
    $deferRender_Depth
    var output: ST_GBuffer;
    $output
    output.color = colorOfFS(fsInput);
    return output;
}
struct LightData {
  position: vec4f,
  color: vec3f,
  radius: f32,
}
struct LightsBuffer {
  lights: array<LightData>,
}
struct Config {
  numLights: u32,
}
@group(1) @binding(2) var<storage, read> lightsBuffer : LightsBuffer;
@group(1) @binding(3) var<uniform> config : Config;
fn colorOfFS(fsInput: VertexShaderOutput) -> vec4f {
    let position = fsInput.worldPosition.xyz;
    let normal = fsInput.normal;
    let uv = fsInput.uv;
    let c = 0.2 + 0.5 * ((uv.x + uv.y) - 2.0 * floor((uv.x + uv.y) / 2.0));
    let albedo = vec3(c, c, c);
    var result: vec3f;
    for (var i = 0u; i < config.numLights; i++) {
        let L = lightsBuffer.lights[i].position.xyz - position.xyz;
        let distance = length(L);
        if distance > lightsBuffer.lights[i].radius {
      continue;
        }
        let lambert = max(dot(normal, normalize(L)), 0.0);
        result += vec3f(
            lambert * pow(1.0 - distance / lightsBuffer.lights[i].radius, 2.0) * lightsBuffer.lights[i].color * albedo
        );
    }
    result += vec3(0.2);
    return vec4(result, 1.0);
}
//end : code.fs.wgsl
