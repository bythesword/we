

@vertex
fn main(
  @location(0) position: vec3f
) -> @builtin(position) vec4f {
  return MVP * vec4(position, 1.0);
}
