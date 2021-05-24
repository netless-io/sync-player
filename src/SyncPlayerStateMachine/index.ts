import { AtomPlayer } from "../Players/AtomPlayer";
import { SyncPlayerStatus } from "../Types";
import { Logger } from "../utils/Logger";

export interface SyncPlayerStateMachineConfig {
    rowPlayer: AtomPlayer;
    colPlayer: AtomPlayer;
    name?: string;
}

export class SyncPlayerStateMachine {
    private readonly log: Logger;

    private readonly rowPlayer: AtomPlayer;
    private readonly colPlayer: AtomPlayer;

    public constructor({ rowPlayer, colPlayer, name }: SyncPlayerStateMachineConfig) {
        this.rowPlayer = rowPlayer;
        this.colPlayer = colPlayer;

        this.log = new Logger({ namespace: name || "SyncPlayerStateMachine" });

        this.rowPlayer.addListener("status", this.onRowPlayerChanged);
        this.colPlayer.addListener("status", this.onColPlayerChanged);
    }

    public destroy(): void {
        this.rowPlayer.removeListener("status", this.onRowPlayerChanged);
        this.colPlayer.removeListener("status", this.onColPlayerChanged);
    }

    private onRowPlayerChanged = (): Promise<void> => {
        this.log.info(
            `RowPlayer status changed. RowPlayer: ${this.rowPlayer.status}, ColPlayer: ${this.colPlayer.status}`,
        );
        return this.onPlayerChange(this.rowPlayer, this.colPlayer);
    };

    private onColPlayerChanged = (): Promise<void> => {
        this.log.info(
            `ColPlayer status changed. RowPlayer: ${this.rowPlayer.status}, ColPlayer: ${this.colPlayer.status}`,
        );
        return this.onPlayerChange(this.colPlayer, this.rowPlayer);
    };

    private onPlayerChange = async (emitter: AtomPlayer, receptor: AtomPlayer): Promise<void> => {
        switch (emitter.status) {
            case SyncPlayerStatus.Pause: {
                if (receptor.isPlaying) {
                    receptor.pause();
                }
                break;
            }

            case SyncPlayerStatus.Buffering: {
                if (receptor.status === SyncPlayerStatus.Playing) {
                    emitter.play();
                }
                break;
            }

            case SyncPlayerStatus.Playing: {
                if (receptor.status === SyncPlayerStatus.Buffering) {
                    await emitter.ready();
                }

                if (
                    receptor.status !== SyncPlayerStatus.Ended ||
                    emitter.currentTime < receptor.duration
                ) {
                    receptor.play();
                }
                break;
            }
        }
    };
}
