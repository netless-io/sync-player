import { VideoJsPlayer } from "video.js";
import { AtomPlayer } from "../../AtomPlayer";
import { SyncPlayerStatus } from "../../../Types";
import { VideoPlayerConfig } from "../Types";

export class SafariAtomPlayer extends AtomPlayer {
    private readonly video: VideoJsPlayer;

    public constructor(config: VideoPlayerConfig) {
        super(config);

        this.video = config.video;
        this.video.controls(false);

        const addVideoListener = (type: string | string[], listener: (e?: Event) => void): void => {
            this.video.on(type, listener);
            this._sideEffect.addDisposer((): void => this.video.off(type, listener));
        };

        addVideoListener(
            [
                "waiting",
                "canplay",
                "pause",
                "suspend",
                "playing",
                "play",
                "seeking",
                "seeked",
                "stalled",
                "canplaythrough",
            ],
            (e?: Event): void => {
                if (this.status === SyncPlayerStatus.Ended) {
                    return;
                }

                const eventType = e?.type;

                if (this.video.paused() || eventType === "seeking" || eventType === "waiting") {
                    if (
                        this.status !== SyncPlayerStatus.Pause &&
                        this.status !== SyncPlayerStatus.Ready
                    ) {
                        if (eventType === "pause") {
                            this.status = SyncPlayerStatus.Ready;
                        } else {
                            this.status = SyncPlayerStatus.Buffering;
                        }
                    }
                } else {
                    this.checkCurrentTime();
                    this.status = SyncPlayerStatus.Playing;
                }
            },
        );

        addVideoListener("ended", () => {
            this.status = SyncPlayerStatus.Ended;
        });

        const setCurrentTime = (): void => {
            this.currentTime = (this.video.currentTime() || 0) * 1000;
        };
        setCurrentTime();
        addVideoListener("timeupdate", setCurrentTime);

        const setDuration = (): void => {
            this.duration = (this.video.duration() || 0) * 1000;
        };
        setDuration();
        addVideoListener("durationchange", setDuration);

        this.lastCurrentTime = this.currentTime;

        this._sideEffect.add(() => {
            const handler = (): void => {
                if (this.status === SyncPlayerStatus.Playing) {
                    this.checkCurrentTime();
                } else {
                    this.cleanCheckCurrentTime();
                }
            };
            this.on("status", handler);
            return (): void => {
                this.cleanCheckCurrentTime();
                this.off("status", handler);
            };
        });
    }

    protected async readyImpl(): Promise<void> {
        this.video.pause();
    }

    protected async playImpl(): Promise<void> {
        await this.video.play();
    }

    protected async pauseImpl(): Promise<void> {
        this.video.pause();
    }

    protected async stopImpl(): Promise<void> {
        this.video.currentTime(this.duration / 1000 - 0.5);
    }

    protected async seekImpl(ms: number): Promise<void> {
        this.video.currentTime(ms / 1000);
    }

    protected setPlaybackRateImpl(value: number): void {
        this.video.playbackRate(value);
    }

    private checkCurrentTime = (): void => {
        if (Number.isNaN(this.checkTimeInterval)) {
            this.checkTimeInterval = window.setInterval(() => {
                if (this.lastCurrentTime === this.currentTime) {
                    if (this.status === SyncPlayerStatus.Playing) {
                        this.status = SyncPlayerStatus.Buffering;
                    }
                } else {
                    this.lastCurrentTime = this.currentTime;
                }
            }, 500);
        }
    };

    private cleanCheckCurrentTime = (): void => {
        if (!Number.isNaN(this.checkTimeInterval)) {
            window.clearTimeout(this.checkTimeInterval);
            this.checkTimeInterval = NaN;
        }
    };

    private lastCurrentTime: number;

    private checkTimeInterval: number = NaN;
}
