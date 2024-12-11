
// Input holds as snapshot of input state
export interface Input {
    // // Digital input (e.g keyboard state)
    // readonly digital: {
    //     readonly forward: boolean;
    //     readonly backward: boolean;
    //     readonly left: boolean;
    //     readonly right: boolean;
    //     readonly up: boolean;
    //     readonly down: boolean;
    // };
    // // Analog input (e.g mouse, touchscreen)
    // readonly analog: {
    //     readonly x: number;
    //     readonly y: number;
    //     readonly zoom: number;
    //     readonly touching: boolean;
    // };
    // readonly mouse: {
    //     readonly x: number,
    //     readonly y: number,
    //     /**
    //      * 0：主按键，通常指鼠标左键或默认值（译者注：如 document.getElementById('a').click() 这样触发就会是默认值）
    //         1：辅助按键，通常指鼠标滚轮中键
    //         2：次按键，通常指鼠标右键
    //         3：第四个按钮，通常指浏览器后退按钮
    //         4：第五个按钮，通常指浏览器的前进按钮
    //      */
    //     button: number,
    //     move: boolean,
    //     ctrlKey: boolean,
    //     altKey: boolean,
    //     shiftKey: boolean
    // }
}
// InputHandler is a function that when called, returns the current Input state.
export type InputHandler = (scope: any) => Input;

export type registerKeyFN = (scope: any, key: string) => {};
export type registerPointerFN = (scope: any, e: PointerEvent) => {};

export interface registerEventOfWE {
    name: string,
    enable: boolean,
    type: "Key" | "Pointer"
    registerFN: registerKeyFN | registerPointerFN
}
export enum typeOfInputControl {
    "Camera" = "Camera",
    "Multi" = "Multi"
}
/**
 * 顶级的input 控制类
 * 
 * 可扩展多种子类，以扩展CameraControl，预计扩展多控制器（多路输入，双人游戏类的那种）
 */
export abstract class InputControl {
    inputHandler!: InputHandler;// = createInputHandler(window, canvas);
    /**注册的事件集合 */
    registerEvent!: registerEventOfWE[];
    type!: typeOfInputControl;



    registerKeyboardEvent(register: registerEventOfWE) {

    }
    abstract createInputHandler(
        window: Window,
        canvas: HTMLCanvasElement
    ): InputHandler
}