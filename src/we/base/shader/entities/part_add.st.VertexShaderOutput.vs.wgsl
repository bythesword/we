//start:part.st_vertexOutput.vs.wgsl    //定义了vertex shader 输出的结构体，
struct VertexShaderOutput {
    @builtin(position) position : vec4f,
    @location(0) uv : vec2f,
    @location(1) normal : vec3f,
    @location(2) color : vec3f,
    @location(3) worldPosition : vec3f,
            //这个是GBuffer的ID buffer
            //这个是entity id,通过uniform 得到(part_add.st_entity.vs.wgsl),
            //然后在(part_replace.VertexShaderOutput.vs.wgsl)进行格式化内容,
            //并输出fragment shader中。
    @location(4) @interpolate(flat) entityID : u32,
};
//end :part.st_vertexOutput.vs.wgsl
