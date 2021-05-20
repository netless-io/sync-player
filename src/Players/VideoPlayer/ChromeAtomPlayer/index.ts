import { VideoJsPlayer } from "video.js";
import { AtomPlayer, AtomPlayerStatus } from "../../AtomPlayer";
import { VideoPlayerConfig } from "../Types";

export class ChromeAtomPlayer extends AtomPlayer {
    private readonly video: VideoJsPlayer;

    public constructor(config: VideoPlayerConfig) {
        super(config);

        this.video = config.video;
        this.video.controls(false);

        this.video.on("canplay", this.handleStatusChanged);
        this.video.on("pause", this.handleStatusChanged);
        this.video.on("suspend", this.handleStatusChanged);
        this.video.on("playing", this.handleStatusChanged);
        this.video.on("play", this.handleStatusChanged);
        this.video.on("seeking", this.handleStatusChanged);
        this.video.on("seeked", this.handleStatusChanged);
        this.video.on("stalled", this.handleStatusChanged);

        this.video.on("ended", this.toEnded);

        this.video.on("timeupdate", this.updateCurrentTime);

        this.video.on("durationchange", this.onDurationChanged);
    }

    public destroy = (): void => {
        this.video.off("canplay", this.handleStatusChanged);
        this.video.off("pause", this.handleStatusChanged);
        this.video.off("suspend", this.handleStatusChanged);
        this.video.off("playing", this.handleStatusChanged);
        this.video.off("play", this.handleStatusChanged);
        this.video.off("seeking", this.handleStatusChanged);
        this.video.off("seeked", this.handleStatusChanged);
        this.video.off("stalled", this.handleStatusChanged);

        this.video.off("ended", this.toEnded);

        this.video.off("timeupdate", this.updateCurrentTime);

        this.video.off("durationchange", this.onDurationChanged);
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
        this.video.currentTime(this.duration);
    }

    protected async seekImpl(ms: number): Promise<void> {
        this.video.currentTime(ms / 1000);
    }

    private handleStatusChanged = (): void => {
        if (this.status === AtomPlayerStatus.Ended) {
            return;
        }

        if (this.video.paused()) {
            if (this.status !== AtomPlayerStatus.Pause && this.status !== AtomPlayerStatus.Ready) {
                this.status = AtomPlayerStatus.Buffering;
            }
        } else {
            this.status = AtomPlayerStatus.Playing;
        }
    };

    private toEnded = (): void => {
        this.status = AtomPlayerStatus.Ended;
    };

    private updateCurrentTime = (): void => {
        this.currentTime = Math.floor((this.video.currentTime() || 0) * 1000);
    };

    private onDurationChanged = (): void => {
        this.duration = (this.video.duration() || 0) * 1000;
    };
}
