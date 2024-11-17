// Note: The code in this file does not use the 'dst' output parameter of functions in the
// 'wgpu-matrix' library, so produces many temporary vectors and matrices.
// This is intentional, as this sample prefers readability over performance.
import {
  Mat4,
  Vec3,
  Vec4,
  mat4,
  vec3
} from 'wgpu-matrix';

/**
 * 投影矩阵的参数(base)
 */
export interface projectionOptions {
  /** 向上的方向，默认是(0,1,0) */
  upDirection?: Vec3,

  /** 近平面*/
  near: number,

  /** 远平面 */
  far: number,
  // left?:number,
  // right?:number,
  // top?:number,
  // bottom?:number,
  name?: string,
  position: Vec3,
  lookAt?: Vec3,
}
//todo
export interface cameraRayValues {
  direction: Vec3,
  left: Vec3,
  right: Vec3,
  up: Vec3,
  down: Vec3,
}

/***
 * 摄像机抽象类
 */
export abstract class BaseCamera {
  /** 初始化参数  */
  option!: projectionOptions;
  // /**
  //  * 默认的上方向
  //  */
  // _upDirection: Vec3 = new Float32Array([0, 1, 0]);

  /**   * 单位阵   */
  matrix_ = new Float32Array([
    1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1,
  ]);
  /** view matrix */
  viewMatrix = new Float32Array([
    1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1,
  ]);

  /** model matrix  */
  modelMatrix = new Float32Array([
    1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1,
  ]);;
  /** projection Matrix  */
  projectionMatrix!: Mat4;

  /** 第一行,X轴 */
  right_ = new Float32Array(this.viewMatrix.buffer, 4 * 0, 4);
  /** 第二行,Y轴 */
  up_ = new Float32Array(this.viewMatrix.buffer, 4 * 4, 4);
  /** 第三行,Z轴 */
  back_ = new Float32Array(this.viewMatrix.buffer, 4 * 8, 4);
  /** 第四行,位置 */
  position_ = new Float32Array(this.modelMatrix.buffer, 4 * 12, 4);

  /** MVP的Mat4的数组，[model,view,projection]  */
  MVP!: Mat4[];
  /**数字ID，scene中的队列的id */
  NID!: number;


  lookAt!: Vec3;

  // // The camera matrix.
  // // This is the inverse of the view matrix.
  // matrix!: Mat4;
  // // Alias to column vector 0 of the camera matrix.
  // right!: Vec4;
  // // Alias to column vector 1 of the camera matrix.
  // up!: Vec4;
  // // Alias to column vector 2 of the camera matrix.
  // back!: Vec4;
  // // Alias to column vector 3 of the camera matrix.
  // position!: Vec4;


  /**归一化的方向 
   * lookAt 的 vector
  */
  direction!: Vec4;

  name!: string;

  constructor(option: projectionOptions) {

    this.option = option;
    if (option.upDirection) {
      vec3.copy(option.upDirection, this.up);
    }
    if (typeof option.name != 'undefined') {
      this.name = option.name;
    }
    else {
      this.name = "Camera_" + new Date().getTime();
    }
    if (option.position) {
      this.position = option.position
    }
    if (option.lookAt) {
      this.back = vec3.normalize(vec3.sub(option.position, option.lookAt));
      this.lookAt = option.lookAt;
    }
    else {
      this.lookAt = vec3.create(0, 0, 0);
    }
    this.updateProjectionMatrix(option);//构造投影矩阵
  }
  // /** 获取up方向 */
  // get upDirection() {
  //   return this._upDirection;
  // }
  // /** 设置up方向 */
  // set upDirection(up: Vec3) {
  //   vec3.copy(up, this._upDirection);
  // }

  // abstract update(position: Vec3, direction: Vec3, normalize: boolean): Mat4[];
  /**
   * 通过position,dir更新摄像机矩阵（三个，M，V，P）
   * @param position ：摄像机位置
   * @param direction ：摄像机方向
   * @param normalize ：摄像机方向是否归一化的
   * @returns  MVP的Mat4[]
   */
  update(position: Vec3, direction: Vec3, normalize = false): Mat4[] {
    this.position = position;
    if (normalize === false) {
      vec3.normalize(vec3.subtract(position, direction, this.back));
    }
    else {
      this.back = direction;
    }
    this.right = vec3.normalize(vec3.cross(this.up, this.back));
    this.up = vec3.normalize(vec3.cross(this.back, this.right));

    // console.log("projectionMatrix=", this.projectionMatrix)

    this.MVP = [mat4.invert(this.modelMatrix), mat4.invert(this.viewMatrix), this.projectionMatrix];
    // let mv = mat4.multiply(this.viewMatrix, this.modelMatrix,);
    // // console.log("M*V=", mv, "M*V的invert=", mat4.invert(mv))

    // let mv1 = mat4.multiply(mat4.invert(this.viewMatrix), mat4.invert(this.modelMatrix),);
    // // console.log("M.invert * V.invert=", mv1)

    // let mvp = mat4.multiply(this.projectionMatrix, mat4.invert(mv));
    // // console.log(mat4.invert(mv), mvp)

    return this.MVP;
  }
  updateByPositionYawPitch(position: Vec3, yaw: number, pitch: number): Mat4[] {
    //更新camera的矩阵，通过yaw和pitch的增量，暂缓后边通过camera.update更新
    // Reconstruct the camera's rotation, and store into the camera matrix.
    let view = mat4.rotateX(mat4.rotationY(yaw), pitch);
    mat4.copy(view, this.viewMatrix);

    this.position = position;
    this.MVP = [mat4.invert(this.modelMatrix), mat4.invert(this.viewMatrix), this.projectionMatrix];
    return this.MVP;
  }

  abstract getCameraRays(): cameraRayValues


  /**
   * 更新投影参数
   * 
   * @param options :projectionOptions
   * 
   */
  abstract updateProjectionMatrix(option: projectionOptions): any;


  getViewMatrix() {
    return this.viewMatrix;
  }

  getModelMatrix() {
    return this.modelMatrix;
  }

  getProjectionMatrix() {
    return this.projectionMatrix
  }

  /**归一化的方向 
 * lookAt 的 vector
*/
  getDirection() {
    return this.direction;
  }

  /**
   *  返回MVP矩阵,分别是M,V,P三个矩阵
   * @returns  Mat4[]
   */
  getMVP() {
    if (this.MVP)
      return this.MVP;
    else {
      return this.update(this.position, this.back, true);
    }
  }

  // Returns column vector 0 of the camera matrix
  get right() {
    return this.right_;
  }
  // Assigns `vec` to the first 3 elements of column vector 0 of the camera matrix
  set right(vec: Vec3) {
    vec3.copy(vec, this.right_);
  }

  // Returns column vector 1 of the camera matrix
  get up() {
    return this.up_;
  }
  // Assigns `vec` to the first 3 elements of column vector 1 of the camera matrix
  set up(vec: Vec3) {
    vec3.copy(vec, this.up_);
  }

  // Returns column vector 2 of the camera matrix
  get back() {
    return this.back_;
  }
  // Assigns `vec` to the first 3 elements of column vector 2 of the camera matrix
  set back(vec: Vec3) {
    vec3.copy(vec, this.back_);
  }

  // Returns column vector 3 of the camera matrix
  get position() {
    return this.position_;
  }
  // Assigns `vec` to the first 3 elements of column vector 3 of the camera matrix
  set position(vec: Vec3) {
    vec3.copy(vec, this.position_);
  }

}
