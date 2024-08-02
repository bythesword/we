import { Scene, sceneInputJson } from "../../src/we/base/scene/scene"
import {
  DrawCommand,
  primitiveOption,
  drawModeIndexed,
  drawMode,
  indexBuffer,
  unifromGroup,
  uniformEntries,
  uniformBufferPart,
  fsPart,
  vsPart,
  vsAttributes
} from "../../src/we/base/command/DrawCommand"
declare global {
  interface Window {
    scene: any
    DC: any
  }
}
let input: sceneInputJson = { canvas: "render" }
let scene = new Scene(input);
await scene.init();

window.scene = scene;

// scene.requestAnimationFrame();
let shader = `
      struct OurVertexShaderOutput {
        @builtin(position) position: vec4f,
        @location(0) color: vec4f,
      };

      @vertex fn vs(
        @builtin(vertex_index) vertexIndex : u32
      ) -> OurVertexShaderOutput {
        let pos = array(
          vec2f( 0.0,  0.5),  // top center
          vec2f(-0.5, -0.5),  // bottom left
          vec2f( 0.5, -0.5)   // bottom right
        );
        var color = array<vec4f, 3>(
          vec4f(1, 0, 0, 1), // red
          vec4f(0, 1, 0, 1), // green
          vec4f(0, 0, 1, 1), // blue
        );

        var vsOutput: OurVertexShaderOutput;
        vsOutput.position = vec4f(pos[vertexIndex], 0.0, 1.0);
        vsOutput.color = color[vertexIndex];
        return vsOutput;
      }

      @fragment fn fs(@location(0) color: vec4f) -> @location(0) vec4f {
        return color;
      }
`;

let options: primitiveOption = {
  label:"a triangle",
  scene: scene,
  vertex: {
    code: shader,
    entryPoint: "vs",
    buffers: []
  },
  fragment: {
    code: shader,
    entryPoint: "fs",
    targets: [{ format: scene.presentationFormat }]
  },
  uniforms: [],
  draw: {
    mode: "draw",
    values: {
      vertexCount: 3
    }
  },
  rawUniform: true,
  // depthStencil: {
  //   depthWriteEnabled: true,
  //   depthCompare: 'less',
  //   format: 'depth24plus',
  // },
  // renderPassDescriptor : {
  //   label: 'our basic canvas renderPass',
  //   colorAttachments: [
  //     {
  //       // view: <- to be filled out when we render
  //       clearValue: [1., 0.3, 0.3, 1],
  //       loadOp: 'clear',
  //       storeOp: 'store',
  //     },
  //   ],
  // }
}

let DC = new DrawCommand(options);
window.DC = DC;
DC.submit()
