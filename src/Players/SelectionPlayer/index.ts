import { AtomPlayer, AtomPlayerConfig, AtomPlayerEvents } from "../AtomPlayer";

export interface SelectionPlayerSelection {
    start: number;
    duration: number;
}

export interface SelectionPlayerConfig extends AtomPlayerConfig {
    player: AtomPlayer;
    selectionList: SelectionPlayerSelection[];
}

interface SelectionItem extends SelectionPlayerSelection {
    /** Start position of resulted timeline */
    rStart: number;
}

export class SelectionPlayer extends AtomPlayer {
    private readonly player: AtomPlayer;
    private selectionItems: SelectionItem[];

    public constructor({ player, selectionList, ...config }: SelectionPlayerConfig) {
        super(config);
        if (!config.name) {
            config.name = player.name;
        }
        this.player = player;

        const selectionItems = sanitizeSelectionList(selectionList);

        this.selectionItems = this.sliceSelectionItems(selectionItems);

        this.status = this.player.status;
        this.playbackRate = this.player.playbackRate;
        this.duration = this.calcDuration();
        this.currentTime = this.syncCurrentTime();

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
            this.currentTime = this.syncCurrentTime();
        });
        syncAtomProps(this.player, "durationchange", () => {
            this.selectionItems = this.sliceSelectionItems(selectionItems);
            this.duration = this.calcDuration();
            this.currentTime = this.syncCurrentTime();
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
        const lastItem = this.selectionItems[this.selectionItems.length - 1];
        if (lastItem) {
            await this.player.seek(lastItem.start + lastItem.duration);
        }
    }

    protected setPlaybackRateImpl(value: number): void {
        return this.player.setPlaybackRate(value);
    }

    protected async seekImpl(ms: number): Promise<void> {
        if (this.selectionItems.length <= 0) {
            return this.player.seek(ms);
        }

        if (ms <= 0) {
            return this.player.seek(0);
        }

        if (ms >= this.duration) {
            return this.player.seek(this.player.duration);
        }

        for (let i = 0; i < this.selectionItems.length; i++) {
            const item = this.selectionItems[i];
            if (ms >= item.rStart) {
                return this.player.seek(ms - item.rStart + item.start);
            }
        }
    }

    private syncCurrentTime(): number {
        const currentTime = this.player.currentTime;

        if (this.selectionItems.length <= 0) {
            return currentTime;
        }

        for (let i = 0; i < this.selectionItems.length; i++) {
            const item = this.selectionItems[i];
            if (currentTime <= item.start + item.duration) {
                if (currentTime < item.start) {
                    this.player.seek(item.start);
                    return item.rStart;
                }
                return currentTime - item.start + item.rStart;
            }
        }

        this.stop();
        return this.duration;
    }

    private calcDuration(): number {
        if (this.player.duration <= 0) {
            return 0;
        }
        const lastItem = this.selectionItems[this.selectionItems.length - 1];
        return lastItem ? lastItem.rStart + lastItem.duration : this.player.duration;
    }

    private sliceSelectionItems(selectionItems: SelectionItem[]): SelectionItem[] {
        if (this.player.duration <= 0) {
            return [];
        }
        const result: SelectionItem[] = [];
        for (let i = 0; i < selectionItems.length; i++) {
            const item = selectionItems[i];
            if (item.rStart + item.duration <= this.player.duration) {
                result.push(item);
            } else {
                result.push({ ...item, duration: this.player.duration - item.rStart });
                break;
            }
        }
        return result;
    }
}

function sanitizeSelectionList(selectionList: SelectionPlayerSelection[]): SelectionItem[] {
    selectionList = selectionList.sort((a, b) => a.start - b.start);
    const result: SelectionItem[] = [];
    let lastItem: SelectionItem | null = null;
    for (let i = 0; i < selectionList.length; i++) {
        const item = selectionList[i];
        if (lastItem && item.start <= lastItem.start + lastItem.duration) {
            lastItem.duration =
                Math.max(lastItem.start + lastItem.duration, item.start + item.duration) -
                lastItem.start;
        } else {
            lastItem = {
                start: item.start,
                duration: item.duration,
                rStart: lastItem ? lastItem.rStart + lastItem.duration : 0,
            };
            result.push(lastItem);
        }
    }

    return result;
}
