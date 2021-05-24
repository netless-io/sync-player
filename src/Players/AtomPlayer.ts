import EventEmitter from "eventemitter3";
import { isPlaybackRateEqual, normalizePlaybackRate } from "../utils/playbackrate";

export const enum AtomPlayerStatus {
    /** Idle State. It acts like Pause but ready to be changed into any other state. */
    Ready = "Ready",
    /** Video is paused intentionally. */
    Pause = "Pause",
    /** Buffering is only happened during playing process. */
    Buffering = "Buffering",
    /** Video is playing. */
    Playing = "Playing",
    /** Video is ended. */
    Ended = "Ended",
}

export abstract class AtomPlayer extends EventEmitter<AtomPlayerEvents> {
    public readonly name?: string;

    public constructor(config?: { name?: string }) {
        super();
        this.name = config?.name;
    }

    public get isPlaying(): boolean {
        return (
            this._status === AtomPlayerStatus.Playing || this._status === AtomPlayerStatus.Buffering
        );
    }

    public get status(): AtomPlayerStatus {
        return this._status;
    }

    public set status(value: AtomPlayerStatus) {
        if (!this._ignoreSetStatus && this._status !== value) {
            this._status = value;
            this.emit("status");
        }
    }

    public get currentTime(): number {
        return this._currentTime;
    }

    public set currentTime(ms: number) {
        ms = Math.floor(ms);
        if (this._status !== AtomPlayerStatus.Ended && this._currentTime !== ms) {
            this._currentTime = ms;
            this.emit("timeupdate");
        }
    }

    public get duration(): number {
        return this._duration;
    }

    public set duration(ms: number) {
        ms = Math.floor(ms);
        if (this._duration !== ms) {
            this._duration = ms;
            this.emit("durationchange");
        }
    }

    public get playbackRate(): number {
        return this._playbackRate;
    }

    public set playbackRate(value: number) {
        const rate = normalizePlaybackRate(value);
        if (!isPlaybackRateEqual(this._playbackRate, rate)) {
            this.setPlaybackRateImpl(rate);
            this._playbackRate = rate;
            this.emit("ratechange");
        }
    }

    public async play(): Promise<void> {
        if (this._status !== AtomPlayerStatus.Playing && this._status !== AtomPlayerStatus.Ended) {
            await this.playImpl();
            this.status = AtomPlayerStatus.Playing;
        }
    }

    public async pause(): Promise<void> {
        if (this._status !== AtomPlayerStatus.Pause && this._status !== AtomPlayerStatus.Ended) {
            this.status = AtomPlayerStatus.Pause;
            await this.pauseImpl();
        }
    }

    public async stop(): Promise<void> {
        if (this._status !== AtomPlayerStatus.Ended) {
            // set ended first
            this.status = AtomPlayerStatus.Ended;

            this._ignoreSetStatus = true;
            await this.readyImpl();
            await this.stopImpl();
            this._ignoreSetStatus = false;
        }
    }

    public async seek(ms: number): Promise<void> {
        ms = Math.floor(ms);

        if (ms === this._currentTime) {
            return;
        }

        if (ms > this.duration) {
            await this.stop();
            return;
        }

        const lastStatus = this._status;

        if (this.isPlaying) {
            await this.readyImpl();
        }
        await this.seekImpl(ms);

        switch (lastStatus) {
            case AtomPlayerStatus.Ready:
            case AtomPlayerStatus.Ended: {
                await this.ready();
                break;
            }
            case AtomPlayerStatus.Pause: {
                await this.pause();
                break;
            }
            case AtomPlayerStatus.Buffering:
            case AtomPlayerStatus.Playing: {
                await this.play();
                break;
            }
        }
    }

    public async ready(): Promise<void> {
        if (this._status !== AtomPlayerStatus.Ready) {
            this.status = AtomPlayerStatus.Ready;
            await this.readyImpl();
        }
    }

    public abstract destroy(): void;

    protected abstract readyImpl(): Promise<void>;
    protected abstract playImpl(): Promise<void>;
    protected abstract pauseImpl(): Promise<void>;
    protected abstract stopImpl(): Promise<void>;
    protected abstract seekImpl(ms: number): Promise<void>;
    protected abstract setPlaybackRateImpl(value: number): void;

    private _status: AtomPlayerStatus = AtomPlayerStatus.Ready;

    private _currentTime: number = 0;

    private _duration: number = 0;

    private _playbackRate: number = 1;

    private _ignoreSetStatus: boolean = false;
}

export type AtomPlayerEvents = "status" | "timeupdate" | "durationchange" | "ratechange";

export declare interface AtomPlayer {
    addListener<U extends AtomPlayerEvents>(event: U, listener: () => void): this;
    on<U extends AtomPlayerEvents>(event: U, listener: () => void): this;
    once<U extends AtomPlayerEvents>(event: U, listener: () => void): this;
}
