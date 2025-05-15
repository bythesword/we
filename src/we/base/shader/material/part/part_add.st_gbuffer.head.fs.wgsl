//start : part.st_gbuffer.fs.wgsl    //***GBuffer数量与内容需要人工保持正确性
//1、需要与WE的TS的GBuffer部分的定义保持一致
//2、需要与同目录下的part_replace.st_gbuffer.output.fs.wgsl保持输出的一致性
    struct ST_GBuffer{
        @builtin(frag_depth) depth : f32,
        @location(0) color : vec4f,
        @location(1) id : u32,
        @location(2) normal : vec4f,
        @location(3) uv : vec4f,
    }
//end : part.st_gbuffer.fs.wgsl
