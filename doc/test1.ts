/**
 * Class  这个是Test1类
 *
 */
export class Test1 {
    /**
     * @property {number} id  身份
     */
    id: number;
    /***
     * @property {string} name  名称
     */
    name: string;
    /**
  * Test1的构造函数
  * @constructor
  * @param {number} id - ID
  * @param {string} name - name
  */
    constructor(id: number, name: string) {
        this.id = id;
        this.name = name
    }
    /**
     * 获取ID
     * @returns {number} id -ID
     */
    getID() {
        return this.id;
    }

    /**
     * 设置ID
     * @param id {number} id-ID
     */
    setID(id: number) {
        this.id = id;
    }
}

