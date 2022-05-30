import { SyncPlayerStatus } from "../..";
import { AtomPlayer, AtomPlayerConfig, AtomPlayerEvents } from "../AtomPlayer";
import { TickPlayer } from "../TickPlayer";

export interface OffsetPlayerConfig extends AtomPlayerConfig {
    offset: number;
    player: AtomPlayer;
}

export class OffsetPlayer extends AtomPlayer {
    private readonly player: AtomPlayer;
    private readonly timer: TickPlayer;

    private _currentPlayer: AtomPlayer;
    private get currentPlayer(): AtomPlayer {
        return this._currentPlayer;
    }
    private set currentPlayer(player: AtomPlayer) {
        if (this._currentPlayer !== player) {
            this._currentPlayer = player;
            this.visible = player !== this.timer;
        }
    }

    public constructor({ offset, player, ...config }: OffsetPlayerConfig) {
        super({ ...config, name: config.name || `Offset<${player.name}>` });
        this.player = player;
        this._offset = offset || 0;

        this.timer = new TickPlayer({ name: `Tick<${this.name}>`, duration: this._offset });
        this.playbackRate = this.player.playbackRate;

        this._currentPlayer = this._offset > 0 ? this.timer : this.player;

        this.status = this.currentPlayer.status;
        this.duration = this.timer.duration + this.player.duration;

        if (this.currentPlayer === this.timer) {
            this.currentTime = this.timer.currentTime;
            this._visible = false;
        } else {
            this.currentTime = this.player.currentTime + this.offset;
        }

        this.playbackRate = this.currentPlayer.playbackRate;

        const syncAtomProps = (
            player: AtomPlayer,
            event: AtomPlayerEvents,
            listener: () => void,
        ): void => {
            player.on(event, listener);
            this._sideEffect.addDisposer((): void => {
                player.off(event, listener);
            });
        };

        syncAtomProps(this.player, "status", () => {
            if (this.currentPlayer !== this.player) {
                return;
            }

            if (this.status === SyncPlayerStatus.Ended) {
                return;
            }

            switch (this.player.status) {
                case SyncPlayerStatus.Playing: {
                    this.status = SyncPlayerStatus.Playing;
                    break;
                }
                case SyncPlayerStatus.Buffering: {
                    this.status = SyncPlayerStatus.Buffering;
                    break;
                }
                case SyncPlayerStatus.Ready: {
                    this.status = SyncPlayerStatus.Ready;
                    break;
                }
            }
        });
        syncAtomProps(this.player, "timeupdate", () => {
            if (this.currentPlayer === this.player) {
                this.currentTime = this.player.currentTime + this.offset;
            }
        });
        syncAtomProps(this.player, "durationchange", () => {
            this.duration = this.timer.duration + this.player.duration;
        });
        syncAtomProps(this.player, "ratechange", () => {
            if (this.currentPlayer === this.player) {
                this.playbackRate = this.player.playbackRate;
            }
        });

        syncAtomProps(this.timer, "status", async () => {
            if (this.currentPlayer !== this.timer) {
                return;
            }

            if (this.timer.status === SyncPlayerStatus.Ended) {
                this.currentPlayer = this.player;
                if (this.status === SyncPlayerStatus.Playing) {
                    await this.player.seek(0);
                    await this.player.play();
                    return;
                }
            }

            if (this.status === SyncPlayerStatus.Ended) {
                return;
            }

            switch (this.timer.status) {
                case SyncPlayerStatus.Playing: {
                    this.status = SyncPlayerStatus.Playing;
                    break;
                }
                case SyncPlayerStatus.Ready: {
                    this.status = SyncPlayerStatus.Ready;
                    break;
                }
            }
        });
        syncAtomProps(this.timer, "timeupdate", () => {
            if (this.currentPlayer === this.timer) {
                this.currentTime = this.timer.currentTime;
            }
        });
        syncAtomProps(this.timer, "durationchange", () => {
            this.duration = this.timer.duration + this.player.duration;
        });
        syncAtomProps(this.timer, "ratechange", () => {
            if (this.currentPlayer === this.timer) {
                this.playbackRate = this.timer.playbackRate;
            }
        });
    }

    protected async readyImpl(silently?: boolean): Promise<void> {
        await Promise.all([this.player.ready(silently), this.timer.ready(silently)]);
    }

    protected playImpl(): Promise<void> {
        return this.currentPlayer.play();
    }

    protected async pauseImpl(): Promise<void> {
        await this.timer.pause();
        await this.player.pause();
    }

    protected async stopImpl(): Promise<void> {
        await this.timer.stop();
        await this.player.stop();
    }

    protected async seekImpl(ms: number): Promise<void> {
        if (ms <= this.offset) {
            this.currentPlayer = this.timer;
            if (this.player.status === SyncPlayerStatus.Playing) {
                await this.player.ready(true);
            }
            if (this.player.currentTime !== 0) {
                await this.player.seek(0);
            }
            await this.timer.seek(ms);
        } else {
            this.currentPlayer = this.player;
            if (this.timer.currentTime !== 0) {
                await this.timer.stop();
            }
            await this.player.seek(ms - this.offset);
        }
    }

    protected setPlaybackRateImpl(value: number): void {
        this.player.setPlaybackRate(value);
        this.timer.setPlaybackRate(value);
    }
}
