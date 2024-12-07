 

 //start:part_replace.VertexShaderOutput.vs.wgsl
 //这个是entity部分的输出到vsOutput
 //1、vsOutput的输出需要与part_add.st.VertexShaderOutput.vs.wgsl中的定义保持一致
 //2、也需要与使用这个的FS的input保持一致
  vsOutput.position = matrix_z * projectionMatrix * viewMatrix * modelMatrix * entity.MatrixWorld[instanceIndex] * vec4f(position, 1.0);
  vsOutput.uv = uv;
  vsOutput.normal = vec4f(entity.MatrixWorld[instanceIndex] * vec4f(normal, 0)).xyz;
  vsOutput.color = color;
  vsOutput.worldPosition = vec4f(entity.MatrixWorld[instanceIndex] * vec4f(position, 1.0)).xyz;
  let entity_id = entity.entity_id << 14;
  let stage_id = entity.stage_id << 29;
  vsOutput.entityID = instanceIndex + entity_id + stage_id;
  // vsOutput.entityID = entity.entity_id;
//end:part_replace.VertexShaderOutput.vs.wgsl
