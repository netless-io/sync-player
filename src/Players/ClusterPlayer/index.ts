import { SyncPlayerStatus } from "../../Types";
import { isPlaybackRateEqual } from "../../utils/playbackrate";
import { AtomPlayer, AtomPlayerConfig, AtomPlayerEvents } from "../AtomPlayer";

export interface ClusterPlayerConfig extends AtomPlayerConfig {
    rowPlayer: AtomPlayer;
    colPlayer: AtomPlayer;
}

export class ClusterPlayer extends AtomPlayer {
    private readonly rowPlayer: AtomPlayer;
    private readonly colPlayer: AtomPlayer;

    private longerPlayer: AtomPlayer;

    public constructor(config: ClusterPlayerConfig) {
        super({
            name:
                config.name ||
                `{${config.rowPlayer.name || "unknown"}-${config.colPlayer.name || "unknown"}}`,
        });

        this.rowPlayer = config.rowPlayer;
        this.colPlayer = config.colPlayer;

        this.longerPlayer =
            this.rowPlayer.duration >= this.colPlayer.duration ? this.rowPlayer : this.colPlayer;

        this.duration = this.longerPlayer.duration;
        this.playbackRate = this.longerPlayer.playbackRate;

        const addAtomListener = (
            event: AtomPlayerEvents,
            listener: (emitter: AtomPlayer, receptor: AtomPlayer) => void,
        ): void => {
            this._sideEffect.add(() => {
                const handler = (): void => {
                    listener(this.rowPlayer, this.colPlayer);
                };
                this.rowPlayer.on(event, handler);
                return (): void => {
                    this.rowPlayer.off(event, handler);
                };
            });
            this._sideEffect.add(() => {
                const handler = (): void => {
                    listener(this.colPlayer, this.rowPlayer);
                };
                this.colPlayer.on(event, handler);
                return (): void => {
                    this.colPlayer.off(event, handler);
                };
            });
        };

        addAtomListener("status", (emitter, receptor) => {
            if (!this.ignoreSetStatus) {
                this.syncSubPlayer(emitter, receptor);
                this.updateStatus(emitter, receptor);
            }
        });

        addAtomListener("timeupdate", emitter => {
            if (this.longerPlayer === emitter && emitter.status !== SyncPlayerStatus.Ended) {
                this.currentTime = emitter.currentTime;
            }
        });

        addAtomListener("durationchange", (emitter, receptor) => {
            if (emitter.duration >= this.longerPlayer.duration) {
                if (emitter !== this.longerPlayer) {
                    this.longerPlayer = emitter;
                }
            } else {
                this.longerPlayer = receptor;
            }
            this.duration = this.longerPlayer.duration;
        });

        addAtomListener("ratechange", emitter => {
            if (!isPlaybackRateEqual(emitter.playbackRate, this.playbackRate)) {
                this.playbackRate = emitter.playbackRate;
            }
        });
    }

    public destroy(): void {
        super.destroy();
        this.rowPlayer.destroy();
        this.colPlayer.destroy();
    }

    public get isReady(): boolean {
        return this.rowPlayer.isReady && this.colPlayer.isReady;
    }

    public async ready(silently?: boolean): Promise<void> {
        await this.readyImpl(silently);
    }

    public async play(): Promise<void> {
        // Do not check this.status !== SyncPlayerStatus.Playing
        // since one sub-player may not be playing
        if (this.status !== SyncPlayerStatus.Ended) {
            await this.playImpl();
        }
    }

    public async pause(): Promise<void> {
        await this.pauseImpl();
    }

    public async stop(): Promise<void> {
        await this.stopImpl();
    }

    public async seek(ms: number): Promise<void> {
        await this.seekImpl(ms);
    }

    protected async readyImpl(silently?: boolean): Promise<void> {
        await Promise.all([this.rowPlayer.ready(silently), this.colPlayer.ready(silently)]);
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

    private updateStatus(emitter: AtomPlayer, receptor: AtomPlayer): void {
        switch (emitter.status) {
            case SyncPlayerStatus.Ready: {
                switch (receptor.status) {
                    case SyncPlayerStatus.Ready:
                    case SyncPlayerStatus.Ended: {
                        this.status = SyncPlayerStatus.Ready;
                        break;
                    }
                }
                break;
            }

            case SyncPlayerStatus.Pause: {
                if (receptor.status !== SyncPlayerStatus.Playing) {
                    this.status = SyncPlayerStatus.Pause;
                }
                break;
            }

            case SyncPlayerStatus.Buffering: {
                if (receptor.status !== SyncPlayerStatus.Pause) {
                    this.status = SyncPlayerStatus.Buffering;
                }
                break;
            }

            case SyncPlayerStatus.Playing: {
                switch (receptor.status) {
                    case SyncPlayerStatus.Playing:
                    case SyncPlayerStatus.Ended: {
                        this.status = SyncPlayerStatus.Playing;
                        break;
                    }
                }
                break;
            }

            case SyncPlayerStatus.Ended: {
                this.status = receptor.status;
                break;
            }
        }
    }

    private async syncSubPlayer(emitter: AtomPlayer, receptor: AtomPlayer): Promise<void> {
        switch (emitter.status) {
            case SyncPlayerStatus.Pause: {
                if (receptor.isPlaying) {
                    await receptor.pause();
                }
                break;
            }

            case SyncPlayerStatus.Buffering: {
                if (receptor.status === SyncPlayerStatus.Playing) {
                    await receptor.ready();
                }
                break;
            }

            case SyncPlayerStatus.Playing: {
                if (receptor.status === SyncPlayerStatus.Buffering) {
                    await emitter.ready();
                }

                if (
                    receptor.status !== SyncPlayerStatus.Ended &&
                    emitter.currentTime < receptor.duration
                ) {
                    await receptor.play();
                    // handle frame drops
                    const diff = emitter.currentTime - receptor.currentTime;
                    if (Math.abs(diff) >= 1000) {
                        if (diff < 0) {
                            await emitter.seek(receptor.currentTime);
                        } else {
                            await receptor.seek(emitter.currentTime);
                        }
                    }
                }
                break;
            }
        }
    }
}
