import type { VideoJsPlayer } from "video.js";
import { AtomPlayer } from "../../AtomPlayer";
import { SyncPlayerStatus } from "../../../Types";
import type { VideoPlayerConfig } from "../Types";

export class ChromeAtomPlayer extends AtomPlayer {
  private readonly video: VideoJsPlayer;

  public constructor(config: VideoPlayerConfig) {
    super(config);

    this.video = config.video;
    this.video.controls(false);

    const addVideoListener = (
      type: string | string[],
      listener: (e?: Event) => void
    ): void => {
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

        if (
          this.video.paused() ||
          eventType === "seeking" ||
          eventType === "waiting"
        ) {
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
          this.status = SyncPlayerStatus.Playing;
        }
      }
    );

    addVideoListener("error", () => {
      if (this.status === SyncPlayerStatus.Playing && this.video.paused()) {
        this.status = SyncPlayerStatus.Buffering;
      }
    });

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
  }

  protected async readyImpl(): Promise<void> {
    try {
      this.video.pause();
    } catch {
      // ignore
    }
  }

  protected async playImpl(): Promise<void> {
    try {
      await this.video.play();
    } catch {
      // ignore
    }
  }

  protected async pauseImpl(): Promise<void> {
    try {
      this.video.pause();
    } catch {
      // ignore
    }
  }

  protected async stopImpl(): Promise<void> {
    try {
      this.video.currentTime(this.duration / 1000 - 0.5);
    } catch {
      // ignore
    }
  }

  protected async seekImpl(ms: number): Promise<void> {
    try {
      this.video.currentTime(ms / 1000);
    } catch {
      // ignore
    }
  }

  protected setPlaybackRateImpl(value: number): void {
    try {
      this.video.playbackRate(value);
    } catch {
      // ignore
    }
  }
}
