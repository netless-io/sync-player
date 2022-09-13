export const enum SyncPlayerStatus {
  /** Idle State. It acts like Pause but ready to be changed into any other state. */
  Ready = "Ready",
  /** Video is paused intentionally. */
  Pause = "Pause",
  /** Buffering is only happened during playing process. */
  Buffering = "Buffering",
  /** Video is playing. */
  Playing = "Playing",
  /** Video is ended. */
  Ended = "Ended",
}
