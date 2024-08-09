struct SystemMVP {
    model: mat4x4f,
    view: mat4x4f,
    projection: mat4x4f,
};

@group(0) @binding(0) var<uniform> U_MVP:  SystemMVP;

var<private > modelMatrix:mat4x4f;
var<private > viewMatrix:mat4x4f;
var<private > projectionMatrix:mat4x4f;
var<private > MVP:mat4x4f;

fn initSystem(){
  modelMatrix = U_MVP.model;
  viewMatrix = U_MVP.view;
  projectionMatrix = U_MVP.projection;
  MVP = modelMatrix *  viewMatrix *   projectionMatrix ;
}