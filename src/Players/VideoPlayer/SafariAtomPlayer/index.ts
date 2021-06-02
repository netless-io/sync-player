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

        this.video.on("waiting", this.handleStatusChanged);
        this.video.on("canplay", this.handleStatusChanged);
        this.video.on("pause", this.handleStatusChanged);
        this.video.on("suspend", this.handleStatusChanged);
        this.video.on("playing", this.handleStatusChanged);
        this.video.on("play", this.handleStatusChanged);
        this.video.on("seeking", this.handleStatusChanged);
        this.video.on("seeked", this.handleStatusChanged);
        this.video.on("stalled", this.handleStatusChanged);
        this.video.on("canplaythrough", this.handleStatusChanged);

        this.video.on("ended", this.toEnded);

        this.video.on("timeupdate", this.updateCurrentTime);

        this.video.on("durationchange", this.onDurationChanged);

        this.lastCurrentTime = this.currentTime;

        this.on("status", this.handleCheckCurrentTime);
    }

    public destroy = (): void => {
        this.video.off("waiting", this.handleStatusChanged);
        this.video.off("canplay", this.handleStatusChanged);
        this.video.off("pause", this.handleStatusChanged);
        this.video.off("suspend", this.handleStatusChanged);
        this.video.off("playing", this.handleStatusChanged);
        this.video.off("play", this.handleStatusChanged);
        this.video.off("seeking", this.handleStatusChanged);
        this.video.off("seeked", this.handleStatusChanged);
        this.video.off("stalled", this.handleStatusChanged);
        this.video.off("canplaythrough", this.handleStatusChanged);

        this.video.off("ended", this.toEnded);

        this.video.off("timeupdate", this.updateCurrentTime);

        this.video.off("durationchange", this.onDurationChanged);

        this.off("status", this.handleCheckCurrentTime);

        this.cleanCheckCurrentTime();
    };

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

    private handleStatusChanged = (e?: Event): void => {
        if (this.status === SyncPlayerStatus.Ended) {
            return;
        }

        const eventType = e?.type;

        if (this.video.paused() || eventType === "seeking" || eventType === "waiting") {
            if (this.status !== SyncPlayerStatus.Pause && this.status !== SyncPlayerStatus.Ready) {
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
    };

    private toEnded = (): void => {
        this.status = SyncPlayerStatus.Ended;
    };

    private updateCurrentTime = (): void => {
        this.currentTime = (this.video.currentTime() || 0) * 1000;
    };

    private onDurationChanged = (): void => {
        this.duration = (this.video.duration() || 0) * 1000;
    };

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

    private handleCheckCurrentTime = (): void => {
        if (this.status === SyncPlayerStatus.Playing) {
            this.checkCurrentTime();
        } else {
            this.cleanCheckCurrentTime();
        }
    };

    private lastCurrentTime: number;

    private checkTimeInterval: number = NaN;
}
