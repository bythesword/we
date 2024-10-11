      struct VertexShaderOutput {
        @builtin(position) position: vec4f,
        @location(0) uv: vec2f,
        @location(1) normal: vec3f,        
      };

      @vertex fn vs(
         @location(0) position : vec3f,
         @location(1) uv : vec2f,
         @location(2) normal : vec3f,
         @builtin(vertex_index) vertexIndex : u32
      ) -> VertexShaderOutput {
        var vsOutput: VertexShaderOutput;
        vsOutput.position =projectionMatrix *viewMatrix * modelMatrix *  vec4f(position,  1.0);
        vsOutput.uv = uv;
        vsOutput.normal = normal;
        return vsOutput;
      }