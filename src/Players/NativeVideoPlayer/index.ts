import type { AtomPlayerConfig } from "../AtomPlayer";
import { AtomPlayer } from "../AtomPlayer";
import { SyncPlayerStatus } from "../../Types";
import { listen } from "./utils";

export interface NativeVideoPlayerConfig extends AtomPlayerConfig {
  video: HTMLVideoElement;
}

/**
 * **Note**: to play with HLS,
 * ```js
 * if (/\.m3u8/i.test(videoSRC) && Hls.isSupported()) {
 *     const hls = new Hls();
 *     hls.loadSource(videoSRC);
 *     hls.attachMedia($video);
 * } else if ($video.canPlayType("application/vnd.apple.mpegurl")) {
 *     $video.src = videoSRC;
 * }
 * ```
 */
export class NativeVideoPlayer extends AtomPlayer {
  private readonly video: HTMLVideoElement;

  public constructor(config: NativeVideoPlayerConfig) {
    super(config);

    this.video = config.video;
    this.video.controls = false;

    const addVideoListener = (
      type: keyof HTMLElementEventMap,
      listener: (e: Event) => void
    ): void => {
      this._sideEffect.push(listen(this.video, type, listener));
    };

    (
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
      ] as (keyof HTMLElementEventMap)[]
    ).forEach(eventName => {
      addVideoListener(eventName, e => {
        if (this.status === SyncPlayerStatus.Ended) {
          return;
        }

        const eventType = e.type;

        if (
          this.video.paused ||
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
      });
    });

    addVideoListener("error", () => {
      if (this.status === SyncPlayerStatus.Playing && this.video.paused) {
        this.status = SyncPlayerStatus.Buffering;
      }
    });

    addVideoListener("ended", () => {
      this.status = SyncPlayerStatus.Ended;
    });

    const setCurrentTime = (): void => {
      this.currentTime = this.video.currentTime * 1000;
    };
    setCurrentTime();
    addVideoListener("timeupdate", setCurrentTime);

    const setDuration = (): void => {
      this.duration = this.video.duration * 1000;
    };
    setDuration();
    addVideoListener("durationchange", setDuration);
  }

  protected async readyImpl(): Promise<void> {
    this.video.pause();
  }

  protected async playImpl(): Promise<void> {
    try {
      await this.video.play();
    } catch {
      // ignore
    }
  }

  protected async pauseImpl(): Promise<void> {
    this.video.pause();
  }

  protected async stopImpl(): Promise<void> {
    this.video.currentTime = this.duration / 1000 - 0.5;
  }

  protected async seekImpl(ms: number): Promise<void> {
    this.video.currentTime = ms / 1000;
  }

  protected setPlaybackRateImpl(value: number): void {
    this.video.playbackRate = value;
  }
}
