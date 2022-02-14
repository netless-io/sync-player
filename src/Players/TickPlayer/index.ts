import { SyncPlayerStatus } from "../..";
import { AtomPlayer, AtomPlayerConfig } from "../AtomPlayer";

export interface TickPlayerConfig extends AtomPlayerConfig {
    duration: number;
}

export class TickPlayer extends AtomPlayer {
    private _startTimer: (startTime: number, playbackRate: number) => void;
    private _stopTimer: () => void;
    private _resetTimer: (startTime: number, playbackRate: number) => void;

    public constructor({ duration, ...config }: TickPlayerConfig) {
        super(config);
        this.duration = duration;

        let playRafTicket = NaN;

        this._startTimer = (startTime: number, playbackRate: number): void => {
            window.cancelAnimationFrame(playRafTicket);
            const startTimestamp = Date.now();
            const playRaf = (): void => {
                this.currentTime = (Date.now() - startTimestamp) * playbackRate + startTime;
                if (this.currentTime >= this.duration) {
                    this.stop();
                } else {
                    playRafTicket = window.requestAnimationFrame(playRaf);
                }
            };
            playRaf();
        };

        this._stopTimer = (): void => {
            window.cancelAnimationFrame(playRafTicket);
            playRafTicket = NaN;
        };

        this._resetTimer = (startTime: number, playbackRate: number): void => {
            if (playRafTicket) {
                this._startTimer(startTime, playbackRate);
            } else {
                this.currentTime = startTime;
            }
        };

        this._sideEffect.addDisposer(this._stopTimer);
    }

    protected async readyImpl(): Promise<void> {
        this._stopTimer();
    }

    protected async playImpl(): Promise<void> {
        this._startTimer(this.currentTime, this.playbackRate);
        this.status = SyncPlayerStatus.Playing;
    }

    protected async pauseImpl(): Promise<void> {
        this._stopTimer();
    }

    protected async stopImpl(): Promise<void> {
        this._stopTimer();
        this.currentTime = this.duration;
    }

    protected async seekImpl(ms: number): Promise<void> {
        this._resetTimer(ms, this.playbackRate);
    }

    protected setPlaybackRateImpl(playbackRate: number): void {
        this._resetTimer(this.currentTime, playbackRate);
    }
}
