import "./style.css";
import { AtomPlayer } from "../../../src/Players/AtomPlayer";

export function videoController(syncPlayer: AtomPlayer): void {
    const $controller = document.createElement("div");
    $controller.innerHTML = `
        <div class="sync-player-controller">
            <button class="sync-player-play-pause"></button>
            <div class="sync-player-progress">
                <div class="sync-player-progress-filled"></div>
            </div>
            <div class="sync-player-playback-rate-container">
                <span class="sync-player-playback-rate-content">1.0</span> X
                <div class="sync-player-playback-rate-panel">
                    0.0
                    <div class="sync-player-playback-rate">
                        <div class="sync-player-playback-rate-filled"></div>
                    </div>
                    2.0
                </div>
            </div>
            <div class="sync-player-time">00:00 / 00:00</div>
        </div>`;
    document.body.appendChild($controller);

    const $playPause = document.querySelector<HTMLButtonElement>(".sync-player-play-pause")!;
    const $progress = document.querySelector<HTMLDivElement>(".sync-player-progress")!;
    const $progressFilled = document.querySelector<HTMLDivElement>(".sync-player-progress-filled")!;
    const $time = document.querySelector<HTMLDivElement>(".sync-player-time")!;
    const $playbackRateContent = document.querySelector<HTMLDivElement>(
        ".sync-player-playback-rate-content",
    )!;
    const $playbackRate = document.querySelector<HTMLDivElement>(".sync-player-playback-rate")!;
    const $playbackRateFilled = document.querySelector<HTMLDivElement>(
        ".sync-player-playback-rate-filled",
    )!;

    $playPause.addEventListener("click", () => {
        if (syncPlayer.isPlaying) {
            syncPlayer.pause();
        } else {
            syncPlayer.play();
        }
    });

    $progress.addEventListener("click", event => {
        syncPlayer.seek((event.offsetX / $progress.offsetWidth) * syncPlayer.duration);
    });

    $playbackRate.addEventListener("click", event => {
        syncPlayer.playbackRate = (event.offsetX / $playbackRate.offsetWidth) * 2;
    });

    syncPlayer.on("status", () => {
        $playPause.classList.toggle("sync-player--playing", syncPlayer.isPlaying);
    });

    const updateTime = (): void => {
        if (syncPlayer.duration > 0) {
            const currentTime = syncPlayer.currentTime || 0;
            $progressFilled.style.width = `${(currentTime / syncPlayer.duration) * 100}%`;

            $time.textContent = `${renderTime(currentTime)} / ${renderTime(syncPlayer.duration)}`;
        }
    };

    syncPlayer.on("timeupdate", updateTime);
    syncPlayer.on("durationchange", updateTime);

    syncPlayer.on("ratechange", () => {
        $playbackRateContent.textContent = syncPlayer.playbackRate.toFixed(1);
        $playbackRateFilled.style.width = `${(syncPlayer.playbackRate / 2) * 100}%`;
    });

    function renderTime(ms: number): string {
        const seconds = ms / 1000;
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor((seconds % 3600) % 60);
        return (
            (h > 0 ? String(h).padStart(2, "0") + ":" : "") +
            String(m).padStart(2, "0") +
            ":" +
            String(s).padStart(2, "0")
        );
    }
}
