import { AtomPlayer } from "./Players/AtomPlayer";
import { ClusterPlayer } from "./Players/ClusterPlayer";

export { VideoPlayer } from "./Players/VideoPlayer";
export type { VideoPlayerConfig } from "./Players/VideoPlayer";

export { WhiteboardPlayer } from "./Players/WhiteboardPlayer";
export type { WhiteboardPlayerConfig } from "./Players/WhiteboardPlayer";

export { OffsetPlayer } from "./Players/OffsetPlayer";
export type { OffsetPlayerConfig } from "./Players/OffsetPlayer";

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
