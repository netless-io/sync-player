import { AtomPlayer } from "../AtomPlayer";
import { ChromeAtomPlayer } from "./ChromeAtomPlayer";
import { SafariAtomPlayer } from "./SafariAtomPlayer";
import { VideoPlayerConfig } from "./Types";

export type { VideoPlayerConfig } from "./Types";

export const VideoPlayer = function VideoPlayer(config: VideoPlayerConfig): AtomPlayer {
    return /apple/i.test(navigator.vendor)
        ? new SafariAtomPlayer(config)
        : new ChromeAtomPlayer(config);
} as unknown as new (config: VideoPlayerConfig) => AtomPlayer;
