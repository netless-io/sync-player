import type { Player } from "white-web-sdk";
import { PlayerPhase } from "white-web-sdk";
import type { AtomPlayerConfig } from "../AtomPlayer";
import { AtomPlayer } from "../AtomPlayer";
import { SyncPlayerStatus } from "../../Types";

export interface WhiteboardPlayerConfig extends AtomPlayerConfig {
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

    this.duration = this.player.timeDuration || 0;
    this.playbackRate = this.player.playbackSpeed;

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
      return (): void =>
        this.player.callbacks.off("onProgressTimeChanged", handler);
    });
  }

  protected override async initImpl(): Promise<void> {
    const p = new Promise<void>(resolve => {
      const { player } = this;
      const disposerID = this._sideEffect.add(() => {
        const handler = (phase: PlayerPhase): void => {
          if (phase === PlayerPhase.Playing) {
            try {
              player.pause();
            } catch {
              // ignore
            }
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

    this._safeSeek(0);

    await p;
  }

  protected async readyImpl(): Promise<void> {
    this._safePause();
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
    this._safePlay();
    await p;
  }

  protected async pauseImpl(): Promise<void> {
    this._safePause();
  }

  protected async stopImpl(): Promise<void> {
    this._safeSeek(this.duration);
  }

  protected async seekImpl(ms: number): Promise<void> {
    this._safeSeek(ms);
  }

  protected setPlaybackRateImpl(value: number): void {
    try {
      this.player.playbackSpeed = value;
    } catch {
      // ignore
    }
  }

  private _safeSeek(ms: number): void {
    try {
      this.player.seekToProgressTime(ms);
    } catch {
      // ignore
    }
  }

  private _safePause(): void {
    try {
      this.player.pause();
    } catch {
      // ignore
    }
  }

  private _safePlay(): void {
    try {
      this.player.play();
    } catch {
      // ignore
    }
  }
}
