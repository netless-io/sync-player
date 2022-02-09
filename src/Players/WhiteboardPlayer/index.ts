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

        this._sideEffect.add(() => {
            const handler = (phase: PlayerPhase): void => {
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
            this.player.callbacks.on("onPhaseChanged", handler);
            return (): void => this.player.callbacks.off("onPhaseChanged", handler);
        });

        this._sideEffect.add(() => {
            const handler = (): void => {
                this.duration = this.player.timeDuration || 0;
                this.playbackRate = this.player.playbackSpeed;
            };
            this.player.callbacks.on("onLoadFirstFrame", handler);
            return (): void => this.player.callbacks.off("onLoadFirstFrame", handler);
        });

        this._sideEffect.add(() => {
            const handler = (currentTime: number): void => {
                this.currentTime = currentTime;
            };
            this.player.callbacks.on("onProgressTimeChanged", handler);
            return (): void => this.player.callbacks.off("onProgressTimeChanged", handler);
        });
    }

    protected async initImpl(): Promise<void> {
        const p = new Promise<void>(resolve => {
            const { player } = this;
            const disposerID = this._sideEffect.add(() => {
                const handler = (phase: PlayerPhase): void => {
                    if (phase === PlayerPhase.Playing) {
                        player.pause();
                    }
                    if (phase === PlayerPhase.Pause) {
                        this._sideEffect.flush(disposerID);
                        return resolve();
                    }
                };
                player.callbacks.on("onPhaseChanged", handler);
                return (): void => player.callbacks.off("onPhaseChanged", handler);
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
            const disposerID = this._sideEffect.add(() => {
                const handler = (phase: PlayerPhase): void => {
                    if (phase === PlayerPhase.Playing) {
                        this._sideEffect.flush(disposerID);
                        resolve();
                    }
                };
                player.callbacks.on("onPhaseChanged", handler);
                return (): void => player.callbacks.off("onPhaseChanged", handler);
            });
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
}
