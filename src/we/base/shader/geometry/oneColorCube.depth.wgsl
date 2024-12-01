

@vertexfn vs(
@location(0) position: vec3f, 
@builtin(instance_index) instanceIndex: u32 
) -> @builtin(position) vec4f { 
  let position = projectionMatrix * viewMatrix * modelMatrix * entity.MatrixWorld[instanceIndex] * vec4f(position, 1.0);
   return position;
}
