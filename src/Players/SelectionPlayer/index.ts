import { AtomPlayer, AtomPlayerConfig, AtomPlayerEvents } from "../AtomPlayer";

export interface SelectionPlayerSelection {
    start: number;
    end: number;
}

export interface SelectionPlayerConfig extends AtomPlayerConfig {
    player: AtomPlayer;
    selectionList: SelectionPlayerSelection[];
}

export class SelectionPlayer extends AtomPlayer {
    private readonly player: AtomPlayer;
    private selectionList: SelectionPlayerSelection[];
    private compressedTimeList: SelectionPlayerSelection[];

    public constructor({ player, selectionList, ...config }: SelectionPlayerConfig) {
        super(config);
        if (!config.name) {
            config.name = player.name;
        }
        this.player = player;

        selectionList = sanitizeSelectionList(selectionList);

        this.selectionList = selectionList.filter(s => s.end <= this.player.duration);
        this.compressedTimeList = compressTimeList(this.selectionList);

        this.status = this.player.status;
        this.playbackRate = this.player.playbackRate;
        this.duration = this.calcDuration();
        this.currentTime = this.calcCurrentTime();

        const syncAtomProps = (
            player: AtomPlayer,
            event: AtomPlayerEvents,
            listener: () => void,
        ): void => {
            player.on(event, listener);
            this._sideEffect.addDisposer((): void => {
                player.off(event, listener);
            });
        };

        syncAtomProps(this.player, "status", () => {
            this.status = this.player.status;
        });
        syncAtomProps(this.player, "ratechange", () => {
            this.playbackRate = this.player.playbackRate;
        });
        syncAtomProps(this.player, "timeupdate", () => {
            this.currentTime = this.calcCurrentTime();
        });
        syncAtomProps(this.player, "durationchange", () => {
            this.selectionList = selectionList.filter(s => s.end <= this.player.duration);
            this.compressedTimeList = compressTimeList(this.selectionList);
            this.duration = this.calcDuration();
            this.currentTime = this.calcCurrentTime();
        });
    }

    protected readyImpl(silently?: boolean): Promise<void> {
        return this.player.ready(silently);
    }

    protected playImpl(): Promise<void> {
        return this.player.play();
    }

    protected pauseImpl(): Promise<void> {
        return this.player.pause();
    }

    protected async stopImpl(): Promise<void> {
        await this.player.stop();
        const lastS = this.selectionList[this.selectionList.length - 1];
        if (lastS) {
            await this.player.seek(lastS.end);
        }
    }

    protected setPlaybackRateImpl(value: number): void {
        return this.player.setPlaybackRate(value);
    }

    protected async seekImpl(ms: number): Promise<void> {
        if (this.compressedTimeList.length <= 0) {
            return this.player.seek(ms);
        }

        for (let i = 0; i < this.compressedTimeList.length; i++) {
            const t = this.compressedTimeList[i];
            if (ms >= t.start && ms <= t.end) {
                return this.player.seek(ms - t.start + this.selectionList[i].start);
            }
        }

        if (ms < this.compressedTimeList[0].start) {
            return this.player.seek(0);
        }

        if (ms > this.compressedTimeList[this.compressedTimeList.length - 1].end) {
            return this.player.seek(this.player.duration);
        }
    }

    private calcCurrentTime(): number {
        const selectionList = this.selectionList;
        const compressedTimeList = this.compressedTimeList;
        const currentTime = this.player.currentTime;

        if (selectionList.length <= 0) {
            return currentTime;
        }

        for (let i = 0; i < selectionList.length; i++) {
            const s = selectionList[i];
            if (currentTime >= s.start && currentTime <= s.end) {
                return currentTime - s.start + compressedTimeList[i].start;
            }
            const nextS = selectionList[i + 1];
            if (nextS) {
                if (currentTime >= s.end && currentTime <= nextS.start) {
                    this.player.seek(nextS.start);
                    return compressedTimeList[i + 1].start;
                }
            } else {
                this.stop();
                return compressedTimeList[compressedTimeList.length - 1].end;
            }
        }

        this.player.seek(selectionList[0].start);
        return compressedTimeList[0].start;
    }

    private calcDuration(): number {
        return this.compressedTimeList.length > 0
            ? this.compressedTimeList[this.compressedTimeList.length - 1].end
            : this.player.duration;
    }
}

function sanitizeSelectionList(
    selectionList: SelectionPlayerSelection[],
): SelectionPlayerSelection[] {
    selectionList.sort((a, b) => a.start - b.start);
    const result: SelectionPlayerSelection[] = [];
    for (let i = 0; i < selectionList.length; i++) {
        const s = selectionList[i];
        if (s.start < s.end) {
            const lastS = result[result.length - 1];
            if (lastS && s.start <= lastS.end) {
                lastS.end = s.end;
            } else {
                result.push(s);
            }
        }
    }
    return result;
}

function compressTimeList(selectionList: SelectionPlayerSelection[]): SelectionPlayerSelection[] {
    const result: SelectionPlayerSelection[] = [];
    for (let i = 0; i < selectionList.length; i++) {
        const s = selectionList[i];
        const lastS = result[result.length - 1];
        if (lastS) {
            result.push({ start: lastS.end, end: s.end - s.start + lastS.end });
        } else {
            result.push(s);
        }
    }
    return result;
}
