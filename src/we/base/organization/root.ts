import { mat4, Mat4, vec3, Vec3 } from "wgpu-matrix";
import { WeGenerateID, WeGenerateUUID } from "../math/baseFunction";
import { Scene } from "../scene/scene";
import { BaseStage } from "../stage/baseStage";
import { Rotation } from "../math/baseDefine";


export abstract class RootOfOrganization {
    /**
     * 节点名称
     * node name
     */
    _name: string;

    /**
     * 节点ID
     * node ID
     */

    _id!: number;

    /**
     * renderID，use for pickup
     * generate by stage 
     */
    _renderID!: number;


    /**
     * 节点UUID
     * node UUID
     */

    UUID!: string;
    //空间属性
    _position: Vec3;
    _scale: Vec3;
    _rotate: Rotation | undefined;

    enable: boolean;
    _destroy: boolean;
    /**
     * 节点是否可见,如果不在root的树，则visible为false，但没有删除，还在资源池中
     * node visible
     */
    visible: boolean;

    /**当前mesh的local的矩阵，按需更新 */
    matrix: Mat4;

    /**当前entity在世界坐标（层级的到root)，可以动态更新 */
    matrixWorld: Mat4;

    /**
     * 父节点
     * parent node
     */
    _parent: RootOfOrganization | undefined;

    /**
     * 子节点
     * child nodes
     */
    _children: RootOfOrganization[] = [];

    constructor() {
        this.UUID = WeGenerateUUID();
        this.ID = WeGenerateID();
        this._position = vec3.create();
        this._scale = vec3.create(1, 1, 1);
        this.enable = true;
        this.visible = true;
        this._name = this.ID.toString();
        this._destroy = false;

        // this._rotate = {
        //     axis: vec3.create(),
        //     angleInRadians: 0,
        // }
        this.matrix = mat4.create(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1,);
        this.matrixWorld = mat4.create(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1,);

    }
    isDestroy() {
        return this._destroy;
    }
    get children() { return this._children; }

    /**
     * add child 
     * 添加子节点
     * @param child 
     */
    addChild(child: RootOfOrganization) {
        child.parent = this;
        this._children.push(child);
    }

    /**
     * remove child
     * 移除子节点
     * @param child 
     * @returns RootOfOrganization | false
     *           移除成功返回子节点，失败返回false
     *           success return child, fail return false
     */
    removeChild(child: RootOfOrganization): RootOfOrganization | false {
        let index = this._children.indexOf(child);

        if (index !== -1) {
            this._children[index].visible = false;
            let child = this._children.splice(index, 1);
            return child[0];
        }
        return false;
    }
    /**
     * 返回第一个具有id的object
     * @param id 子节点的id
     */
    getObjectIndexByID(id: number): number | boolean {
        for (let i in this.children) {
            if (this.children[i].ID == id) {
                return parseInt(i);
            }
        }
        return false;
    }
    /**
     * get child by UUID
     * @param id 
     * @returns 
     */
    getObjectIndexByUUID(id: string): number | boolean {
        for (let i in this.children) {
            if (this.children[i].UUID == id) {
                return parseInt(i);
            }
        }
        return false;
    }
    /**
     * get child by renderID
     * @param id 
     * @returns 
     */
    getObjectIndexByRenderID(id: number): number | boolean {
        for (let i in this.children) {
            if (this.children[i]._renderID == id) {
                return parseInt(i);
            }
        }
        return false;
    }
    /**
     * 返回第一个具有name的object
     * @param name 
     * @returns 
     */
    getObjectByName(name: string): RootOfOrganization | boolean {
        for (let i of this.children) {
            if (i.Name == name) {
                return this;
            }
            else if (i instanceof RootOfOrganization) {
                let scope = i.getObjectByName(name);
                if (typeof scope != "boolean") {
                    return scope;
                }
            }
        }
        return false;
    }

    get parent(): RootOfOrganization | undefined {
        return this._parent;
    }
    set parent(value: RootOfOrganization) {
        this._parent = value;
    }

    set renderID(id: number) {
        this._renderID = id;
    }
    get renderID() {
        return this._renderID;
    }

    set ID(id) { this._id = id; }
    get ID() { return this._id; }

    set Scale(scale: Vec3) {
        this._scale = scale;
    }
    get Scale() {
        return this._scale;
    }

    set Rotate(rotate: Rotation) {
        this._rotate = rotate;
    }
    get Rotate(): Rotation | undefined {
        return this._rotate;
    }

    get Position() {
        return this._position
    }
    set Position(pos) {
        this._position = pos;
    }

    get Name() { return this._name }
    set Name(value: string) {
        this._name = value;
    }

    /** 绕任意轴旋转 */
    rotate = this.rotateAxis;
    rotateAxis(axis: Vec3, angle: number) {
        ////这里注销到的是因为，for操作的是instance的每个个体
        // for (let i = 0; i < this.numInstances; i++) {
        //     this.matrix[i] = mat4.axisRotate(this.matrix[i], axis, angle, this.matrix[i]);
        // }
        this.matrix = mat4.axisRotate(this.matrix, axis, angle, this.matrix);
    }

    /**绕X轴(1,0,0)旋转 */
    rotateX(angle: number) {
        this.rotateAxis([1, 0, 0], angle);
    }

    /**绕y轴(0,1,0)旋转 */
    rotateY(angle: number) {
        this.rotateAxis([0, 1, 0], angle);
    }

    /**绕z轴(0,0,1)旋转 */
    rotateZ(angle: number) {
        this.rotateAxis([0, 0, 1], angle);
    }

    /**
     * 在现有matrix（原有的position）上增加pos的xyz，
     * 将entity的矩阵应用POS的位置变换，是在原有矩阵上增加
     * @param pos :Vec3
     */
    translate(pos: Vec3,) {
        this.matrix = mat4.translate(this.matrix, pos);
    }

    /** 创建单位矩阵，矩阵的xyz(12,13,14)=pos
    * @param pos :Vec3
    */
    translation(pos: Vec3,) {
        this.matrix = mat4.translation(this.matrix, pos);
    }

    /**
     * 替换pos的位置（matrix的:12,13,14），其他的matrix数据不变，
     * 将entity的位置变为POS,等价wgpu-matrix的mat4的translation，是替换，不是增加
     * @param pos :Vec3
     */
    setTranslation(pos: Vec3,) {
        this.matrix = mat4.setTranslation(this.matrix, pos);
    }

    /**scale */
    scale(vec: Vec3) {
        this._scale = vec;
        this.matrix = mat4.scale(this.matrix, vec);
    }

    /**
     * 更新矩阵的顺序是先进行线性变换，再进行位置变换
     *      其实是没有影响，线性工作在3x3矩阵，位置变换在[12,13,14]
     * 
     */
    updateMatrix(_m4?: Mat4, _opera: "copy" | "multiply" = "copy"): Mat4 {
        this.matrix = mat4.create(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1,);
        if (_m4) {
            if (_opera === "copy")
                this.matrix = mat4.copy(_m4);
            else if (_opera === "multiply")
                this.matrix = mat4.multiply(this.matrix, _m4);
        }
        if (this._scale)
            this.scale(this._scale);

        if (this._rotate)
            this.rotateAxis(this._rotate.axis, this._rotate.angleInRadians);

        if (this._position)
            this.setTranslation(this._position);
        return this.matrix;
    }

    /** 
     * 更新世界矩阵，
     *          递归乘以父节点的矩阵
     */
    updateMatrixWorld(): Mat4 {
        if (this.parent !== undefined) {
            this.matrixWorld = mat4.multiply(this.updateMatrix(), this.parent.matrixWorld);
        }
        return this.matrixWorld;
    }

}


export abstract class RootOfGPU extends RootOfOrganization {

    device!: GPUDevice;

    scene!: Scene;

    canvas!: HTMLCanvasElement;

    stage!: BaseStage;//UI 可能没有不透明层

    /**
     * 节点是否以及GPU准备好
     * node is ready of GPU
     */
    _readyForGPU!: boolean;

    async setRootScene(scene: Scene) {
        this.scene = scene;
    }
    async setRootcanvas(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
    }
    async setRootENV(scene: Scene) {
        this.device = scene.device;
        this.canvas = scene.canvas;
        this.scene = scene;
        this._readyForGPU = true;
        await this.readyForGPU();

    }
    async setRootDevice(device: GPUDevice) {
        this.device = device;
        this._readyForGPU = true;
    }

    /**
     * 当前对象的GPU已经可以用时，执行此调用。
     * when GPU is ready, call this function
     */
    async readyForGPU(): Promise<any> { }
    abstract destroy(): void;

}