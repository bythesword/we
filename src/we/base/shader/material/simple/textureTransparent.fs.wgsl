@fragment
fn fs(fsInput : VertexShaderOutput) -> ST_GBuffer {
    //延迟渲染的深度渲染，在TS中替换字符串
    $deferRender_Depth

    //输出的color，在TS中替换字符串
    var materialColor = vec4f($red, $green, $blue, $alpha);

    //替换标识符，材质颜色
    $materialColor

    var output : ST_GBuffer;
    //替换标识符，输出结构体
    $output

    //输出的color
    output.color = materialColor;

    //获取GBuffer的depth,uv,normal,id 值
    var depth = textureLoad(u_depth_opacity, vec2i(i32(fsInput.position.x), i32(fsInput.position.y)), 0);
    var id = textureLoad(u_entityID_opacity, vec2i(i32(fsInput.position.x), i32(fsInput.position.y)), 0).r;
    var uvTexture = textureLoad(u_uv_opacity, vec2i(i32(fsInput.position.x), i32(fsInput.position.y)), 0);
    var normalTexture = textureLoad(u_normal_opacity, vec2i(i32(fsInput.position.x), i32(fsInput.position.y)), 0);


    //透明情况
    if(materialColor.a < 1.0)
    {
        //是否有reveredZ
        if U_MVP.reversedZ == 1 {
            if (fsInput.position.z> depth)
            {
                output.depth = depth;
                output.uv = uvTexture;
                output.normal = normalTexture;
                output.id = id;
                //output.color = vec4f(0.0, 1.0, 0.0, 1.0);
            } else {
                discard;
                //output.color = vec4f(1.0, .0, 0.0, 1.0);

            }
        }
        else
        {
            if (fsInput.position.z < depth)
            {
                output.depth = depth;
                output.uv = uvTexture;
                output.normal = normalTexture;
                output.id = id;
            } else {
                discard;
            }
        }
    }
    //不透明情况
    else
    {
        if U_MVP.reversedZ == 1 {
            if (fsInput.position.z> depth)
            {

            } else {
                discard;

            }
        }
        else
        {
            if (fsInput.position.z < depth)
            {

            } else {
                discard;
            }
        }
    }

    return output;
}
