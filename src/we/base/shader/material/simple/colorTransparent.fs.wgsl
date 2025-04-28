
//override canvasSizeWidth : f32;
//override canvasSizeHeight : f32;

//start : color.fs.wgsl



@fragment
fn fs(fsInput : VertexShaderOutput) -> ST_GBuffer {
    $deferRender_Depth
    //let depth0 = textureLoad(u_DeferDepth, vec2i(floor(fsInput.position.xy)), 0);
    //if abs(depth0 - fsInput.position.z) > weZero {
    //discard;
    //}
    //let uv = fsInput.position.xy / vec2f(canvasSizeWidth, canvasSizeHeight);

    var depth = textureLoad(u_depth_opacity, vec2i(i32(fsInput.position.x), i32(fsInput.position.y)), 0);

    var output : ST_GBuffer;
    $output     //输出GBuffer的各项值

    output.color = vec4f($red, $green, $blue, $alpha);
    if U_MVP.reversedZ == 1 {
        if ( fsInput.position.z- depth> weZero)
        {
            output.depth = depth;
            if (depth < weZero) {
                output.depth = weZero/100.0; 
            }
            else {
                output.depth = depth+weZero/100.0;
            }
            //output.color = vec4f(1,1,0,0.5);             
        } else {
            discard;
            //output.color = vec4f(1,0,0,0.5);
        }
    }
    else
     {
        if (depth > fsInput.position.z)
        {
            discard;
           //output.color = vec4f(1,0,0,1);
        } else {
            output.depth = depth;
            output.color = vec4f(1,0.5,0,1);

        }
    }
    $vertexColor
    //if uv.y > 0.5 {
        //output.color = vec4f(fsInput.position.z, fsInput.position.z, fsInput.position.z, 1);
    //} else {
    //output.color = vec4f(depth0, depth0, depth0, 1);
    //}
    return output;
}
//end : color.fs.wgsl
