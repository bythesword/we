

import { BaseCamera } from "../camera/baseCamera"
import { Input, InputControl, typeOfInputControl } from "./inputControl";



interface digital {
    forward: boolean;
    backward: boolean;
    left: boolean;
    right: boolean;
    up: boolean;
    down: boolean;
}
interface analog {
    x: number;
    y: number;
    zoom: number;
    touching: boolean;
};
// interface mouse {
//     x: number,
//     y: number,
//     /**
//         0: 没有按键或者是没有初始化
//         1: 鼠标左键
//         2: 鼠标右键
//         4: 鼠标滚轮或者是中键
//         8: 第四按键 (通常是“浏览器后退”按键)
//         16 : 第五按键 (通常是“浏览器前进”)
//      */
//     buttons: number,
//     buttonPress: boolean,
//     move: boolean,
//     ctrlKey: boolean,
//     altKey: boolean,
//     shiftKey: boolean
// }

export interface InputForCamera extends Input {
    // Digital input (e.g keyboard state)
    readonly digital: digital;
    // Analog input (e.g mouse, touchscreen)
    readonly analog: analog;
    // readonly mouse: mouse;
    readonly pointer: PointerEvent | undefined;
    readonly key: KeyboardEvent | undefined;
}
export type InputHandlerForCamera = (scope: any) => InputForCamera;

export interface optionCamreaControl {
    window?: Window,
    canvas: HTMLCanvasElement,//const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    camera?: BaseCamera,
    // parent: any,
}

export abstract class CamreaControl extends InputControl {
    _camera!: BaseCamera;
    _isDestroy!: boolean;
    _option!: optionCamreaControl;
    _digital!: digital;
    _analog!: analog;
    // _mouse!: mouse;
    _pointer: PointerEvent | undefined;
    _key: KeyboardEvent | undefined;

    declare inputHandler: InputHandlerForCamera;
    constructor(option: optionCamreaControl) {
        super();
        this.type = typeOfInputControl.Camera;
        this._option = option;
        if (this._option.window == undefined) {
            this._option.window = window;
        }
        // if (this._option.canvas == undefined) {
        //     this._option.canvas = this.canvas;
        // }
        if (option.camera) {
            this.camera = option.camera;
        }
        this.registerEvent = [];

        // else if (option.parent.cameraDefault) {
        //     this._camera = option.parent.cameraDefault;
        // }
        // else {
        //     this._camera = undefined;
        // }
        // this.scene = option.parent;
        this.isDestroy = false;
        this.inputHandler = this.createInputHandler(this._option.window, this._option.canvas!)
        this.init();
    }

    createInputHandler(
        window: Window,
        canvas: HTMLCanvasElement
    ): InputHandlerForCamera {
        let scope = this;
        /**digital 是给wasd使用的 */
        this._digital = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            up: false,
            down: false,
        };
        /** arcball 和wasd都用到*/
        this._analog = {
            x: 0,
            y: 0,
            zoom: 0,
            touching: false
        };
        // this._mouse = {
        //     x: -1,
        //     y: -1,
        //     buttons: 0,
        //     buttonPress: false,
        //     move: false,
        //     ctrlKey: false,
        //     altKey: false,
        //     shiftKey: false
        // }
        let mouseDown = false;

        const setDigital = (e: KeyboardEvent, value: boolean) => {
            this._key = e;
            switch (e.code) {
                case 'KeyW':
                case 'ArrowUp':
                    this._digital.forward = value;
                    e.preventDefault();
                    e.stopPropagation();
                    break;
                case 'KeyS':
                case 'ArrowDown':
                    this._digital.backward = value;
                    e.preventDefault();
                    e.stopPropagation();
                    break;
                case 'KeyA':
                case 'ArrowLeft':
                    this._digital.left = value;
                    e.preventDefault();
                    e.stopPropagation();
                    break;
                case 'KeyD':
                case 'ArrowRight':
                    this._digital.right = value;
                    e.preventDefault();
                    e.stopPropagation();
                    break;
                case 'Space':
                    this._digital.up = value;
                    e.preventDefault();
                    e.stopPropagation();
                    break;
                case 'ShiftLeft':
                case 'ControlLeft':
                case 'KeyC':
                    this._digital.down = value;
                    e.preventDefault();
                    e.stopPropagation();
                    break;
            }
        };

        window.addEventListener('keydown', (e) => setDigital(e, true));
        window.addEventListener('keyup', (e) => setDigital(e, false));

        canvas.style.touchAction = 'pinch-zoom';
        canvas.addEventListener('pointerdown', (e) => {
            this._pointer = e;
            mouseDown = true;
        });
        canvas.addEventListener('pointerup', (e) => {
            this._pointer = e;
            mouseDown = false;
        });
        canvas.addEventListener('pointermove', (e) => {
            this._pointer = e;
            mouseDown = e.pointerType == 'mouse' ? (e.buttons & 1) !== 0 : true;
            if (mouseDown) {
                this._analog.x += e.movementX;
                this._analog.y += e.movementY;
            }
        });
        canvas.addEventListener(
            'wheel',
            (e) => {
                // mouseDown = (e.buttons & 1) !== 0;
                // if (mouseDown) {
                // The scroll value varies substantially between user agents / browsers.
                // Just use the sign.
                this._analog.zoom += Math.sign(e.deltaY);
                // console.log(analog.zoom)
                e.preventDefault();
                e.stopPropagation();
                // }
            },
            { passive: false }
        );

        return (_scope) => {

            // if(scope._pointer){
            //     console.log("control output",scope._pointer);
            // }
            const out = {
                digital: scope._digital,
                analog: {
                    x: scope._analog.x,
                    y: scope._analog.y,
                    zoom: scope._analog.zoom,
                    touching: mouseDown,
                },
                pointer: scope._pointer,
                key: scope._key,
            };
            // if(analog.x && analog.y ){
            //     console.log(analog)
            // }
            // Clear the analog values, as these accumulate.
            scope._analog.x = 0;
            scope._analog.y = 0;
            scope._analog.zoom = 0;
            // scope._pointer = undefined;
            // scope._key = undefined;
            return out;
        };
    }
    getPointerInput(): PointerEvent | undefined {
        // if (this._pointer)            console.log(this._pointer)
        const pointer = this._pointer
        this._pointer = undefined;
        return pointer;
    }
    getKeyInput(): KeyboardEvent | undefined {
        const key = this._key;
        this._key = undefined;
        return key;
    }
    abstract init(): any;
    abstract update(deltaTime: number, startTime: number, lastTime: number): any
    abstract destroy(): any

    set camera(camera: BaseCamera) {
        this._camera = camera;
    }
    get camera(): BaseCamera {
        return this._camera;
    }
    get isDestroy() {
        return this._isDestroy;
    }
    set isDestroy(destroy: boolean) {
        this._isDestroy = destroy;
    }

}