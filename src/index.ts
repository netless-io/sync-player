import { AtomPlayer } from "./Players/AtomPlayer";
import { StateMachinePlayer } from "./Players/StateMachinePlayer";

export { VideoPlayer } from "./Players/VideoPlayer";
export { WhiteboardPlayer } from "./Players/WhiteboardPlayer";

export type { SyncPlayerStatus } from "./Types";

export interface SyncPlayerConfig {
    players: AtomPlayer[];
}

export const SyncPlayer = function SyncPlayer(config: SyncPlayerConfig): AtomPlayer {
    return config.players.reduce(
        (combinedPlayer, player) =>
            new StateMachinePlayer({ rowPlayer: combinedPlayer, colPlayer: player }),
    );
} as unknown as new (config: SyncPlayerConfig) => AtomPlayer;
