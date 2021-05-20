import { AtomPlayer, AtomPlayerStatus } from "../Players/AtomPlayer";
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
            case AtomPlayerStatus.Pause: {
                if (receptor.isPlaying) {
                    receptor.pause();
                }
                break;
            }

            case AtomPlayerStatus.Buffering: {
                if (receptor.status === AtomPlayerStatus.Playing) {
                    emitter.play();
                }
                break;
            }

            case AtomPlayerStatus.Playing: {
                if (receptor.status === AtomPlayerStatus.Buffering) {
                    await emitter.ready();
                }

                if (
                    receptor.status !== AtomPlayerStatus.Ended ||
                    emitter.currentTime < receptor.duration
                ) {
                    receptor.play();
                }
                break;
            }
        }
    };
}
