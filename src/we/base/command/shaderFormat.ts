
import * as wgsl_main from "../shader/system.wgsl?raw"

export function getReplaceVertexConstants(code: string, entryPoint: string): string {
    let group0 = `
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
}\n
  `;
    let callFN: string = "\n initSystem(); \n";

    let split_1 = code.split("@vertex");
    split_1[0] = wgsl_main.default + split_1[0];

    let split_2 = split_1[1].split("{");

    split_2[1] = callFN + split_2[1];


    split_1[1] = split_2.join("{");

    let codeNewString = split_1.join("@vertex");
    // console.log(codeNewString);

    return codeNewString;
}