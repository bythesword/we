
function getReplaceVertexConstants(code: string, entryPoint: string, group0: string, callFN: string): string {

    let split_1 = code.split("@vertex");
    let split_2 = split_1[1].split("{");
    split_2[1] = "\n"+callFN+split_2[1];
    split_1[0] = group0 + split_1[0];
    let split_2_new_string = split_2.join("{");
    let codeNewString = split_1[0] + split_2_new_string;
    return codeNewString;

}

let shader_1 = `struct SystemMVP {
    model: mat4x4f,
    view: mat4x4f,
    projection: mat4x4f,
};

 @group(0) @binding(0) var<uniform> MVP:  SystemMVP;

      @group(1) @binding(0) var<uniform> u_c : vec4f;
      @group(2) @binding(0) var<uniform> u_color : vec4f;
        
      var<private > modelMatrix:mat4x4f;
      var<private > viewMatrix:mat4x4f;
      var<private > projectionMatrix:mat4x4f;

       fn test(){
        modelMatrix=MVP.model;
        viewMatrix=MVP.view;
        projectionMatrix=MVP.projection;
       }
        `;


let shader_2 = `


      struct OurVertexShaderOutput {
        @builtin(position) position: vec4f,
        @location(0) color: vec4f,
      };

      @vertex fn vs(
         @location(0) position : vec3f,
         @location(1) color : vec4f
      ) -> OurVertexShaderOutput {


        var vsOutput: OurVertexShaderOutput;
        vsOutput.position = MVP.model*MVP.view*MVP.projection* vec4f(position,  1.0);
        vsOutput.color = color;
        return vsOutput;
      }

      @fragment fn fs(@location(0) color: vec4f) -> @location(0) vec4f {
       let abc=u_c;
        return u_color;
      }
`;

let FinishCode = getReplaceVertexConstants(shader_2, "vs", shader_1, "test();");
console.log(FinishCode)