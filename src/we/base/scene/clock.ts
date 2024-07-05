export class Clock {
    timeLast: number
    timeNow: number
    timeStart: number

    constructor() {
        this.timeStart = Date.now();
        this.timeLast = this.timeStart;
        this.timeNow = this.timeLast;
    }
    get deltaTime() {
        return (this.timeNow - this.timeLast) / 1000
    }
    get now() {
        return this.timeNow;
    }
    get last() {
        return this.timeLast;
    }
    set now(time: number) {
        this.timeNow = time;
    }
    set last(time: number) {
        this.timeLast = time;
    }

    updateNow() {
        this.timeNow = Date.now();
    }
    updateLast() {
        this.timeLast = this.timeNow;
    }
    update(){
        this.updateLast();
        this.updateNow();
    }
}