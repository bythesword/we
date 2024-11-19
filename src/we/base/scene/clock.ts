export class Clock {
    timeLast: number
    timeNow: number
    timeStart: number
    _deltaTime: number

    constructor() {
        this.timeStart = Date.now();
        this.timeLast = this.timeStart;
        this.timeNow = this.timeLast;
        this._deltaTime = 0;
    }
    getLastNowDelta() {
        return [this.last, this.now, this.deltaTime]
    }
    get deltaTime() {
        return this._deltaTime;
    }
    get start() {
        return this.timeStart;
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

    // updateNow() {
    //     this.timeNow = Date.now();
    // }
    // updateLast() {
    //     this.timeLast = this.timeNow;
    // }
    update() {
        // this.updateLast();
        // this.updateNow();
        this.timeLast = this.timeNow;
        this.timeNow = Date.now();
        this._deltaTime = (this.timeNow - this.timeLast) / 1000
    }
}