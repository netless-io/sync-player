import { SyncPlayerStateMachine } from "../../SyncPlayerStateMachine";
import { isPlaybackRateEqual } from "../../utils/playbackrate";
import { AtomPlayer, AtomPlayerStatus } from "../AtomPlayer";

export interface StateMachinePlayerConfig {
    rowPlayer: AtomPlayer;
    colPlayer: AtomPlayer;
}

export class StateMachinePlayer extends AtomPlayer {
    private readonly rowPlayer: AtomPlayer;
    private readonly colPlayer: AtomPlayer;
    private readonly stateMachine: SyncPlayerStateMachine;

    private longerPlayer: AtomPlayer;

    public constructor(config: StateMachinePlayerConfig) {
        super({
            name: `{${config.rowPlayer.name || "unknown"}-${config.colPlayer.name || "unknown"}}`,
        });

        this.rowPlayer = config.rowPlayer;
        this.colPlayer = config.colPlayer;

        this.longerPlayer =
            this.rowPlayer.duration >= this.colPlayer.duration ? this.rowPlayer : this.colPlayer;

        this.stateMachine = new SyncPlayerStateMachine({ ...config, name: this.name });

        this.rowPlayer.on("status", this.onRowPlayerStatusChanged);
        this.colPlayer.on("status", this.onColPlayerStatusChanged);

        this.rowPlayer.on("timeupdate", this.onRowPlayerTimeChanged);
        this.colPlayer.on("timeupdate", this.onColPlayerTimeChanged);

        this.rowPlayer.on("durationchange", this.onRowPlayerDurationChanged);
        this.colPlayer.on("durationchange", this.onColPlayerDurationChanged);

        this.rowPlayer.on("ratechange", this.onRowPlayerRateChanged);
        this.colPlayer.on("ratechange", this.onColPlayerRateChanged);
    }

    public destroy(): void {
        this.stateMachine.destroy();

        this.rowPlayer.destroy();
        this.colPlayer.destroy();

        this.rowPlayer.off("status", this.onRowPlayerStatusChanged);
        this.colPlayer.off("status", this.onColPlayerStatusChanged);

        this.rowPlayer.off("timeupdate", this.onRowPlayerTimeChanged);
        this.colPlayer.off("timeupdate", this.onColPlayerTimeChanged);

        this.rowPlayer.off("durationchange", this.onRowPlayerDurationChanged);
        this.colPlayer.off("durationchange", this.onColPlayerDurationChanged);

        this.rowPlayer.on("ratechange", this.onRowPlayerRateChanged);
        this.colPlayer.on("ratechange", this.onColPlayerRateChanged);
    }

    public get duration(): number {
        return this.longerPlayer.duration;
    }

    protected async readyImpl(): Promise<void> {
        await Promise.all([this.rowPlayer.ready(), this.colPlayer.ready()]);
    }

    protected async playImpl(): Promise<void> {
        await Promise.all([this.rowPlayer.play(), this.colPlayer.play()]);
    }

    protected async pauseImpl(): Promise<void> {
        await Promise.all([this.rowPlayer.pause(), this.colPlayer.pause()]);
    }

    protected async stopImpl(): Promise<void> {
        await Promise.all([this.rowPlayer.stop(), this.colPlayer.stop()]);
    }

    protected async seekImpl(ms: number): Promise<void> {
        await Promise.all([this.rowPlayer.seek(ms), this.colPlayer.seek(ms)]);
    }

    protected setPlaybackRateImpl(value: number): void {
        this.rowPlayer.playbackRate = value;
        this.colPlayer.playbackRate = value;
    }

    private onRowPlayerDurationChanged = (): void => {
        if (this.longerPlayer !== this.rowPlayer) {
            if (this.rowPlayer.duration > this.colPlayer.duration) {
                this.longerPlayer = this.rowPlayer;
            }
        }

        if (this.longerPlayer === this.rowPlayer && this.rowPlayer.duration !== this.duration) {
            this.emit("durationchange");
        }
    };

    private onColPlayerDurationChanged = (): void => {
        if (this.longerPlayer !== this.colPlayer) {
            if (this.colPlayer.duration > this.rowPlayer.duration) {
                this.longerPlayer = this.colPlayer;
            }
        }

        if (this.longerPlayer === this.colPlayer && this.colPlayer.duration !== this.duration) {
            this.emit("durationchange");
        }
    };

    private onRowPlayerRateChanged = (): void => {
        if (!isPlaybackRateEqual(this.rowPlayer.playbackRate, this.playbackRate)) {
            this.emit("ratechange");
        }
    };

    private onColPlayerRateChanged = (): void => {
        if (!isPlaybackRateEqual(this.colPlayer.playbackRate, this.playbackRate)) {
            this.playbackRate = this.colPlayer.playbackRate;
            this.emit("ratechange");
        }
    };

    private onRowPlayerStatusChanged = (): void => {
        if (this.rowPlayer === this.longerPlayer) {
            this.onSubPlayerStatusChanged(this.rowPlayer, this.colPlayer);
        }
    };

    private onColPlayerStatusChanged = (): void => {
        if (this.colPlayer === this.longerPlayer) {
            this.onSubPlayerStatusChanged(this.colPlayer, this.rowPlayer);
        }
    };

    private onSubPlayerStatusChanged(emitter: AtomPlayer, receptor: AtomPlayer): void {
        switch (emitter.status) {
            case AtomPlayerStatus.Ready: {
                switch (receptor.status) {
                    case AtomPlayerStatus.Ready:
                    case AtomPlayerStatus.Ended: {
                        this.status = AtomPlayerStatus.Ready;
                        break;
                    }
                }
                break;
            }

            case AtomPlayerStatus.Pause: {
                if (receptor.status !== AtomPlayerStatus.Playing) {
                    this.status = AtomPlayerStatus.Pause;
                }
                break;
            }

            case AtomPlayerStatus.Buffering: {
                if (receptor.status !== AtomPlayerStatus.Pause) {
                    this.status = AtomPlayerStatus.Buffering;
                }
                break;
            }

            case AtomPlayerStatus.Playing: {
                switch (receptor.status) {
                    case AtomPlayerStatus.Playing:
                    case AtomPlayerStatus.Ended: {
                        this.status = AtomPlayerStatus.Playing;
                        break;
                    }
                }
                break;
            }

            case AtomPlayerStatus.Ended: {
                this.status = receptor.status;
                break;
            }
        }
    }

    private onRowPlayerTimeChanged = (): void => {
        if (
            this.longerPlayer === this.rowPlayer &&
            this.rowPlayer.status !== AtomPlayerStatus.Ended
        ) {
            this.currentTime = this.rowPlayer.currentTime;
        }
    };

    private onColPlayerTimeChanged = (): void => {
        if (
            this.longerPlayer === this.colPlayer &&
            this.colPlayer.status !== AtomPlayerStatus.Ended
        ) {
            this.currentTime = this.colPlayer.currentTime;
        }
    };
}
