@fragment
fn fs(fsInput : VertexShaderOutput) -> ST_GBuffer {
    $deferRender_Depth    //延迟渲染的深度渲染，在TS中替换字符串
    var output : ST_GBuffer;
    $output     //输出GBuffer的各项值
    output.color = vec4f($red, $green, $blue, $alpha);
    $vertexColor    //替换标识符，顶点颜色，在TS中替换字符串
    //获取GBuffer的depth,uv,normal,id 值
    var depth = textureLoad(u_depth_opacity, vec2i(i32(fsInput.position.x), i32(fsInput.position.y)), 0);
    var id = textureLoad(u_entityID_opacity, vec2i(i32(fsInput.position.x), i32(fsInput.position.y)), 0).r;
    var uvTexture = textureLoad(u_uv_opacity, vec2i(i32(fsInput.position.x), i32(fsInput.position.y)), 0);
    var normalTexture = textureLoad(u_normal_opacity, vec2i(i32(fsInput.position.x), i32(fsInput.position.y)), 0);
    if U_MVP.reversedZ == 1 {    //是否有reveredZ
        if (fsInput.position.z> depth)
        {            //输出depth,uv,normal,id，原来的值,透明的在pickup等操作上是穿透的
            output.depth = depth;
            output.uv = uvTexture;
            output.normal = normalTexture;
            output.id = id;
        } else {
            discard;
        }
    }
    else
    {
        if (fsInput.position.z < depth)
        {            //输出depth,uv,normal,id，原来的值,透明的在pickup等操作上是穿透的
            output.depth = depth;
            output.uv = uvTexture;
            output.normal = normalTexture;
            output.id = id;
        } else {
            discard;
        }
    }
    return output;
}
//end : color.fs.wgsl
