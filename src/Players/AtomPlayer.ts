import EventEmitter from "eventemitter3";

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

    private _status: AtomPlayerStatus = AtomPlayerStatus.Ready;

    private _currentTime: number = 0;

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

    public set currentTime(value: number) {
        if (this._status !== AtomPlayerStatus.Ended && this._currentTime !== value) {
            this._currentTime = value;
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

    public async play(): Promise<void> {
        if (this._status !== AtomPlayerStatus.Playing && this._status !== AtomPlayerStatus.Ended) {
            await this.playImpl();
            this.status = AtomPlayerStatus.Playing;
        }
    }

    public async pause(): Promise<void> {
        if (this._status !== AtomPlayerStatus.Pause && this._status !== AtomPlayerStatus.Ended) {
            await this.pauseImpl();
            this.status = AtomPlayerStatus.Pause;
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
            await this.readyImpl();
            this.status = AtomPlayerStatus.Ready;
        }
    }

    public abstract destroy(): void;

    protected abstract readyImpl(): Promise<void>;
    protected abstract playImpl(): Promise<void>;
    protected abstract pauseImpl(): Promise<void>;
    protected abstract stopImpl(): Promise<void>;
    protected abstract seekImpl(ms: number): Promise<void>;

    private _ignoreSetStatus: boolean = false;
}

export type AtomPlayerEvents = "status" | "timeupdate" | "durationchange";

export declare interface AtomPlayer {
    addListener<U extends AtomPlayerEvents>(event: U, listener: () => void): this;
    on<U extends AtomPlayerEvents>(event: U, listener: () => void): this;
    once<U extends AtomPlayerEvents>(event: U, listener: () => void): this;
}
