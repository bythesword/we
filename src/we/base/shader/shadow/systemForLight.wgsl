///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//  shadowmap 渲染的VS部分（也只有此部分）
// 不透明和透明的shadowmap
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//start system.wgsl
struct ST_SystemMVP {
  MVP: mat4x4f,
  reversedZ: u32,
};

// struct ST_shadows {
//   shadow: array<ST_shadow,$lightNumber>,//这里与ST_lights保持相同
// }


var<private> weZero=0.000001;
var<private > MVP : mat4x4f;
var<private> matrix_z : mat4x4f = mat4x4f(
    1.0, 0.0, 0.0, 0.0,
    0.0, 1.0, 0.0, 0.0,
    0.0, 0.0, 1.0, 0.0,
    0.0, 0.0, 0.0, 1.0
);

@group(0) @binding(0) var<uniform> U_MVP : ST_SystemMVP;


fn initSystemOfVS() {
    MVP = U_MVP.MVP;

    if U_MVP.reversedZ == 1 {
        matrix_z = mat4x4f(
            1.0, 0.0, 0.0, 0.0,
            0.0, 1.0, 0.0, 0.0,
            0.0, 0.0, -1.0, 0.0,
            0.0, 0.0, 1.0, 1.0
        );
    }
}
// end system.wgsl

