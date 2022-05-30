import EventEmitter from "eventemitter3";
import { SideEffectManager } from "side-effect-manager";
import { SyncPlayerStatus } from "../Types";
import { isPlaybackRateEqual, normalizePlaybackRate } from "../utils/playbackrate";

export interface AtomPlayerConfig {
    name?: string;
}

export abstract class AtomPlayer extends EventEmitter<AtomPlayerEvents> {
    public readonly name?: string;
    private readonly loadInit: Promise<void>;

    /** wait `offset` ms before start playing */
    public get offset(): number {
        return this._offset;
    }

    protected _offset: number = 0;

    protected constructor(config?: AtomPlayerConfig) {
        super();
        this.name = config?.name;
        this.loadInit = this.init();
    }

    public get visible(): boolean {
        return this._visible;
    }

    public set visible(value: boolean) {
        if (this._visible !== value) {
            this._visible = value;
            this.emit("visibilitychange");
        }
    }

    protected _visible: boolean = true;

    public get isReady(): boolean {
        return this._initStatus === AtomPlayerInitStatus.Ready;
    }

    public get isPlaying(): boolean {
        return (
            this._status === SyncPlayerStatus.Playing || this._status === SyncPlayerStatus.Buffering
        );
    }

    public get status(): SyncPlayerStatus {
        return this._status;
    }

    public set status(value: SyncPlayerStatus) {
        if (!this.ignoreSetStatus && this._status !== value) {
            this._status = value;
            this.emit("status");
        }
    }

    public get currentTime(): number {
        return this._currentTime;
    }

    public set currentTime(ms: number) {
        ms = Math.floor(ms);
        if (this._currentTime !== ms) {
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

    public setPlaybackRate(value: number): void {
        this.playbackRate = value;
    }

    // @todo 等待播放器播放完成
    // private _pPlaying: Promise<void>

    public async play(): Promise<void> {
        if (!this.isReady) {
            this.status = SyncPlayerStatus.Buffering;
            await this.loadInit;
        }

        if (this._status !== SyncPlayerStatus.Playing) {
            try {
                await this.playImpl();
            } catch (e) {
                if (
                    this._status !== SyncPlayerStatus.Ready &&
                    this._status !== SyncPlayerStatus.Pause
                ) {
                    throw e;
                }
            }
        }
    }

    public async pause(): Promise<void> {
        if (!this.isReady) {
            await this.loadInit;
        }

        if (this._status !== SyncPlayerStatus.Pause && this._status !== SyncPlayerStatus.Ended) {
            this.status = SyncPlayerStatus.Pause;
            await this.pauseImpl();
        }
    }

    public async stop(): Promise<void> {
        if (!this.isReady) {
            await this.loadInit;
        }

        if (this._status !== SyncPlayerStatus.Ended) {
            // set ended first
            this.status = SyncPlayerStatus.Ended;

            this.ignoreSetStatus = true;
            await this.readyImpl(true);
            await this.stopImpl();
            this.ignoreSetStatus = false;
        }
    }

    public async seek(ms: number): Promise<void> {
        if (!this.isReady) {
            await this.loadInit;
        }

        ms = Math.floor(ms);

        if (ms === this._currentTime) {
            return;
        }

        if (ms >= this.duration) {
            await this.stop();
            return;
        }

        const lastStatus = this._status;

        await this.seekImpl(ms);

        switch (lastStatus) {
            case SyncPlayerStatus.Ready:
            case SyncPlayerStatus.Ended: {
                await this.ready();
                break;
            }
            case SyncPlayerStatus.Pause: {
                await this.pause();
                break;
            }
            case SyncPlayerStatus.Buffering:
            case SyncPlayerStatus.Playing: {
                await this.play();
                break;
            }
        }
    }

    public async ready(silently?: boolean): Promise<void> {
        if (this._status !== SyncPlayerStatus.Ready) {
            if (silently !== void 0) {
                this.ignoreSetStatus = silently;
            }

            this.status = SyncPlayerStatus.Ready;
            await this.readyImpl(silently);

            if (silently !== void 0) {
                this.ignoreSetStatus = false;
            }
        }
    }

    public destroy(): void {
        this._sideEffect.flushAll();
    }

    protected abstract readyImpl(silently?: boolean): Promise<void>;
    protected abstract playImpl(): Promise<void>;
    protected abstract pauseImpl(): Promise<void>;
    protected abstract stopImpl(): Promise<void>;
    protected abstract seekImpl(ms: number): Promise<void>;
    protected abstract setPlaybackRateImpl(value: number): void;

    protected initImpl(): Promise<void> {
        return Promise.resolve();
    }

    protected ignoreSetStatus: boolean = false;

    protected _sideEffect = new SideEffectManager();

    private _status: SyncPlayerStatus = SyncPlayerStatus.Ready;

    private _currentTime: number = 0;

    private _duration: number = 0;

    private _playbackRate: number = 1;

    private _initStatus: AtomPlayerInitStatus = AtomPlayerInitStatus.Idle;

    private async init(): Promise<void> {
        switch (this._initStatus) {
            case AtomPlayerInitStatus.Ready: {
                return;
            }
            case AtomPlayerInitStatus.Initializing: {
                return new Promise(resolve => this.once("ready", resolve));
            }
            default: {
                this.ignoreSetStatus = true;
                this._initStatus = AtomPlayerInitStatus.Initializing;
                await new Promise(r => setTimeout(r));
                await this.initImpl();
                this._initStatus = AtomPlayerInitStatus.Ready;
                this.emit("ready");
                this.ignoreSetStatus = false;
            }
        }
    }
}

export type AtomPlayerEvents =
    | "status"
    | "timeupdate"
    | "durationchange"
    | "ratechange"
    | "visibilitychange"
    | "ready";

export declare interface AtomPlayer {
    addListener<U extends AtomPlayerEvents>(event: U, listener: () => void): this;
    on<U extends AtomPlayerEvents>(event: U, listener: () => void): this;
    once<U extends AtomPlayerEvents>(event: U, listener: () => void): this;
}

const enum AtomPlayerInitStatus {
    Idle,
    Initializing,
    Ready,
}
