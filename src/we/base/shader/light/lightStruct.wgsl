struct PointLight {
    position : vec3f,
    color : vec3f,
    intensity : f32,
    distance : f32,
};

struct AmbientLight {
    color : vec3f,
    intensity : f32,
};

struct DirectionalLight{
    color : vec3f,
    intensity : f32,
    direction : vec3f,
};

struct SpotLight{
    position : vec3f,
    color : vec3f,
    intensity : f32,
    distance : f32,
    direction : vec3f,
    angle:f32,
}

struct Light{
    kind:i32,//0=direction ,1=point,2=spot
    position : vec3f,//方向光，没有位置，直接给出方向的单位向量
    color : vec3f,
    intensity : f32,
    distance : f32,
    direction : vec3f,//只有方向光有
    angle:f32,//default =0,spot is angle
}

struct lights{
    Ambient:AmbientLight,
    lights:array<Light>,
}
