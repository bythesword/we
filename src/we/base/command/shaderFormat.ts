
// import  wgsl_main from "../shader/system.wgsl?raw"
// import * as wgsl_main from "../shader/system.wgsl?raw"

export function getReplaceVertexConstantsVS(code: string, entryPoint: string,   wgsl_main: string): string {
  // export function getReplaceVertexConstants(code: string, entryPoint: string, groupAllbind: string, wgsl_main: string): string {
  //   let group0 = `
  // struct SystemMVP {
  //     model: mat4x4f,
  //     view: mat4x4f,
  //     projection: mat4x4f,
  // };

  // @group(0) @binding(0) var<uniform> U_MVP:  SystemMVP;

  // var<private > modelMatrix:mat4x4f;
  // var<private > viewMatrix:mat4x4f;
  // var<private > projectionMatrix:mat4x4f;
  // var<private > MVP:mat4x4f;

  // fn initSystem(){
  //   modelMatrix = U_MVP.model;
  //   viewMatrix = U_MVP.view;
  //   projectionMatrix = U_MVP.projection;
  //   MVP =projectionMatrix *viewMatrix * modelMatrix  ;
  // }\n
  //   `;


  let split_1 = code.split("@vertex");
  split_1[0] = wgsl_main + split_1[0];
  // split_1[0] = groupAllbind + "\n" + wgsl_main + split_1[0];

  let split_2 = split_1[1].split("{");

  let callFN: string = "\n initSystem(); \n";
  split_2[1] = callFN + split_2[1];

  split_1[1] = split_2.join("{");

  let codeNewString = split_1.join("@vertex");
  // console.log(codeNewString);

  return codeNewString;
}
export function getReplaceVertexConstantsFS(code: string, entryPoint: string,   wgsl_main: string): string {
  // export function getReplaceVertexConstants(code: string, entryPoint: string, groupAllbind: string, wgsl_main: string): string {
  //   let group0 = `
  // struct SystemMVP {
  //     model: mat4x4f,
  //     view: mat4x4f,
  //     projection: mat4x4f,
  // };

  // @group(0) @binding(0) var<uniform> U_MVP:  SystemMVP;

  // var<private > modelMatrix:mat4x4f;
  // var<private > viewMatrix:mat4x4f;
  // var<private > projectionMatrix:mat4x4f;
  // var<private > MVP:mat4x4f;

  // fn initSystem(){
  //   modelMatrix = U_MVP.model;
  //   viewMatrix = U_MVP.view;
  //   projectionMatrix = U_MVP.projection;
  //   MVP =projectionMatrix *viewMatrix * modelMatrix  ;
  // }\n
  //   `;


  let split_1 = code.split("@fragment");
  split_1[0] = wgsl_main + split_1[0];
  // split_1[0] = groupAllbind + "\n" + wgsl_main + split_1[0];

  let split_2 = split_1[1].split("{");

  let callFN: string = "\n initSystem(); \n";
  split_2[1] = callFN + split_2[1];

  split_1[1] = split_2.join("{");

  let codeNewString = split_1.join("@fragment");
  // console.log(codeNewString);

  return codeNewString;
}