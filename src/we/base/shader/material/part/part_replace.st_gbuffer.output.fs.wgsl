
//start : part_replace.st_gbuffer.output.fs.wgsl
//这个文件是进行GBuffer输出,使用var定义output，
//输出全部的output的值，具体FS shader的输出在这个之后进行
//***GBuffer数量与内容需要人工保持正确性
output.color = vec4f(1);
output.id = fsInput.entityID;
output.depth = fsInput.position.z;
output.uv = vec4f(fsInput.uv, 0, 1);
output.normal = vec4f(fsInput.normal, 1);
//end :part_replace.st_gbuffer.output.fs.wgsl
