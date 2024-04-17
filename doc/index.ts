// src/index.ts
// 示例代码，大家可以按照自己的想法自行修改
/** 接口 */
export interface MyInterface {
    /** 属性1 */
    key1: number;
  
    /** 属性2 */
    key2: string;
  }
  
  /** 类 */
  export class MyClass {
    /** 类的属性 */
    prop1: number
  
    /** 构造函数 */
    constructor() {
      this.prop1 = this.privateMethod1(1, 2)
    }
  
    /**
     * 静态方法
     * @param param 参数，字符串列表
     * @returns 返回 Promise 对象
     */
    static staticMethod1(param: string[]) {
      return Promise.resolve(param)
    }
  
    /**
     * 私有方法
     * @param param1 第一个参数
     * @param param2 第二个参数
     * @returns 两数之和
     */
    private privateMethod1(param1: number, param2: number) {
      return param1 + param2
    }
  
    /** 公共方法 */
    publicMethod(param1: number, param2: number) {
      return this.prop1 + param1 + param2
    }
  }
  
  /** 类型 */
  export type MyType = 1 | 2 | 3 | 4
  
  /**
   * 函数
   * @param param 参数
   */
  export function myFunction(param: MyInterface) {
    return param
  }
  
  /** 没有导出的成员，不会出现在文档中 */
  class MyClassNotExport {}