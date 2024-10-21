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
    position : vec3f,
    color : vec3f,
    intensity : f32,
    distance : f32,
    direction : vec3f,//point=[0,0,0]
    angle:f32,//default =0,spot is angle
}

struct lights{
    Ambient:AmbientLight,
    lights:array<Light>,
}
