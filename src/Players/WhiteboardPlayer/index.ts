import { AtomPlayer, AtomPlayerStatus } from "../AtomPlayer";
import { Player, PlayerPhase } from "white-web-sdk";

export interface WhiteboardPlayerConfig {
    name?: string;
    player: Player;
}

export class WhiteboardPlayer extends AtomPlayer {
    private readonly player: Player;

    public constructor(config: WhiteboardPlayerConfig) {
        super(config);

        this.player = config.player;

        this.player.callbacks.on("onPhaseChanged", this.handleStatusChanged);
        this.player.callbacks.on("onLoadFirstFrame", this.handleLoadFirstFrame);
        this.player.callbacks.on("onProgressTimeChanged", this.updateCurrentTime);
    }

    public destroy = (): void => {
        this.player.callbacks.off("onPhaseChanged", this.handleStatusChanged);
        this.player.callbacks.off("onLoadFirstFrame", this.handleLoadFirstFrame);
        this.player.callbacks.off("onProgressTimeChanged", this.updateCurrentTime);
    };

    protected async readyImpl(): Promise<void> {
        this.player.pause();
    }

    protected async playImpl(): Promise<void> {
        const p = new Promise<void>(resolve => {
            let timeoutTicket: number = NaN;
            const { player } = this;
            function callback(phase: PlayerPhase): void {
                if (phase === PlayerPhase.Playing) {
                    player.callbacks.off("onPhaseChanged", callback);
                    window.clearTimeout(timeoutTicket);
                    resolve();
                }
            }
            timeoutTicket = window.setTimeout(() => {
                callback(PlayerPhase.Playing);
            }, 1000);
            player.callbacks.on("onPhaseChanged", callback);
        });
        this.player.play();
        await p;
    }

    protected async pauseImpl(): Promise<void> {
        this.player.pause();
    }

    protected async stopImpl(): Promise<void> {
        this.player.seekToProgressTime(this.duration);
    }

    protected async seekImpl(ms: number): Promise<void> {
        this.player.seekToProgressTime(ms);
    }

    protected setPlaybackRateImpl(value: number): void {
        this.player.playbackSpeed = value;
    }

    private handleStatusChanged = (): void => {
        if (this.status === AtomPlayerStatus.Ended) {
            return;
        }

        switch (this.player.phase) {
            case PlayerPhase.Ended:
            case PlayerPhase.Stopped: {
                this.status = AtomPlayerStatus.Ended;
                break;
            }
            case PlayerPhase.Playing: {
                this.status = AtomPlayerStatus.Playing;
                break;
            }
            case PlayerPhase.Pause: {
                if (
                    this.status !== AtomPlayerStatus.Pause &&
                    this.status !== AtomPlayerStatus.Ready
                ) {
                    this.status = AtomPlayerStatus.Buffering;
                }
                break;
            }
            default: {
                this.status = AtomPlayerStatus.Buffering;
                break;
            }
        }
    };

    private updateCurrentTime = (currentTime: number): void => {
        this.currentTime = currentTime;
    };

    private handleLoadFirstFrame = (): void => {
        this.duration = this.player.timeDuration || 0;
        this.playbackRate = this.player.playbackSpeed;
    };
}
