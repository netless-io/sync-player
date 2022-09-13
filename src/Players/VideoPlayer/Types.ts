import type { VideoJsPlayer } from "video.js";
import type { AtomPlayerConfig } from "../AtomPlayer";

export interface VideoPlayerConfig extends AtomPlayerConfig {
  video: VideoJsPlayer;
}
