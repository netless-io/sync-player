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
            <div class="sync-player-time">00:00:00 / 00:00:00</div>
        </div>`;
    document.body.appendChild($controller);

    const $playPause = document.querySelector<HTMLButtonElement>(".sync-player-play-pause")!;
    const $progress = document.querySelector<HTMLDivElement>(".sync-player-progress")!;
    const $progressFilled = document.querySelector<HTMLDivElement>(".sync-player-progress-filled")!;
    const $time = document.querySelector<HTMLDivElement>(".sync-player-time")!;

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

    syncPlayer.on("timeupdate", () => {
        if (syncPlayer.duration > 0) {
            const currentTime = syncPlayer.currentTime || 0;
            $progressFilled.style.width = `${(currentTime / syncPlayer.duration) * 100}%`;

            $time.textContent = `${renderTime(currentTime)} / ${renderTime(syncPlayer.duration)}`;
        }
    });

    syncPlayer.on("status", () => {
        $playPause.classList.toggle("sync-player--playing", syncPlayer.isPlaying);
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
