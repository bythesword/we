
// start part.st_entity.vs.wgsl
//这个wgsl定义了 entity的结构体ST_entity
struct ST_entity{
  entity_id : u32,
  stage_id : u32,
  MatrixWorld : array<mat4x4f, $instacnce >
};
//也同时定义entity使用了哪个@group(1) @bing(0) 的unifrom buffer向VS传输
@group(1) @binding(0) var<uniform> entity : ST_entity;
// end part.st_entity.vs.wgsl