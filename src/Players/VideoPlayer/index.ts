import { AtomPlayer } from "../AtomPlayer";
import { ChromeAtomPlayer } from "./ChromeAtomPlayer";
import { VideoPlayerConfig } from "./Types";

export type { VideoPlayerConfig } from "./Types";

export const VideoPlayer = function VideoPlayer(config: VideoPlayerConfig): AtomPlayer {
    // @TODO pick player according to platform
    return new ChromeAtomPlayer(config);
} as unknown as new (config: VideoPlayerConfig) => AtomPlayer;
