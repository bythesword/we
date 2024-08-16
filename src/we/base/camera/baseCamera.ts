// Note: The code in this file does not use the 'dst' output parameter of functions in the
// 'wgpu-matrix' library, so produces many temporary vectors and matrices.
// This is intentional, as this sample prefers readability over performance.
import {
  Mat4,
  Vec3,
  Vec4,
  // mat4,
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
  /**
   * 默认的上方向
   */
  _upDirection: Vec3 = new Float32Array([0, 1, 0]);

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
  /**归一化的方向 */
  direction!: Vec4;

  name!: string;
  constructor(option: projectionOptions) {

    this.option = option;
    if (option.upDirection) {
      vec3.copy(option.upDirection, this._upDirection);
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


  }
  /** 获取up方向 */
  get upDirection() {
    return this._upDirection;
  }
  /** 设置up方向 */
  set upDirection(up: Vec3) {
    vec3.copy(up, this._upDirection);
  }
  /**
   * 更新入口 
   * Mat4[model,view,projection]
   */
  abstract update(position: Vec3, direction: Vec3, normalize: boolean): Mat4[];
  abstract getCameraRays(): cameraRayValues
  /**
   * 更新投影参数
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

  getDirection() {
    return this.direction;
  }

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
