import { AtomPlayer } from "./Players/AtomPlayer";
import { ClusterPlayer } from "./Players/ClusterPlayer";

export { AtomPlayer };

export { NativeVideoPlayer } from "./Players/NativeVideoPlayer";
export type { NativeVideoPlayerConfig } from "./Players/NativeVideoPlayer";

export { VideoPlayer } from "./Players/VideoPlayer";
export type { VideoPlayerConfig } from "./Players/VideoPlayer";

export { WhiteboardPlayer } from "./Players/WhiteboardPlayer";
export type { WhiteboardPlayerConfig } from "./Players/WhiteboardPlayer";

export { OffsetPlayer } from "./Players/OffsetPlayer";
export type { OffsetPlayerConfig } from "./Players/OffsetPlayer";

export { SelectionPlayer } from "./Players/SelectionPlayer";
export type { SelectionPlayerConfig, SelectionPlayerSelection } from "./Players/SelectionPlayer";

export { SyncPlayerStatus } from "./Types";

export interface SyncPlayerConfig {
    players: AtomPlayer[];
}

export const SyncPlayer = function SyncPlayer(config: SyncPlayerConfig): AtomPlayer {
    return config.players.reduce(
        (combinedPlayer, player) =>
            new ClusterPlayer({ rowPlayer: combinedPlayer, colPlayer: player }),
    );
} as unknown as new (config: SyncPlayerConfig) => AtomPlayer;
