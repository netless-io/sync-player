import { Player, PlayerPhase } from "white-web-sdk";
import { AtomPlayer } from "../AtomPlayer";
import { SyncPlayerStatus } from "../../Types";

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

    protected async initImpl(): Promise<void> {
        const p = new Promise<void>(resolve => {
            const { player } = this;
            player.callbacks.on("onPhaseChanged", function fistPlay(phase: PlayerPhase) {
                if (phase === PlayerPhase.Playing) {
                    player.pause();
                }

                if (phase === PlayerPhase.Pause) {
                    player.callbacks.off("onPhaseChanged", fistPlay);
                    return resolve();
                }
            });
        });
        this.player.seekToProgressTime(0);

        await p;
    }

    protected async readyImpl(): Promise<void> {
        this.player.pause();
    }

    protected async playImpl(): Promise<void> {
        const p = new Promise<void>(resolve => {
            const { player } = this;

            function callback(phase: PlayerPhase): void {
                if (phase === PlayerPhase.Playing) {
                    player.callbacks.off("onPhaseChanged", callback);
                    resolve();
                }
            }
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

    private handleStatusChanged = (phase: PlayerPhase): void => {
        if (this.status === SyncPlayerStatus.Ended) {
            return;
        }

        switch (phase) {
            case PlayerPhase.Ended:
            case PlayerPhase.Stopped: {
                this.status = SyncPlayerStatus.Ended;
                break;
            }
            case PlayerPhase.Playing: {
                this.status = SyncPlayerStatus.Playing;
                break;
            }
            default: {
                if (
                    this.status !== SyncPlayerStatus.Pause &&
                    this.status !== SyncPlayerStatus.Ready
                ) {
                    this.status = SyncPlayerStatus.Buffering;
                }
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
