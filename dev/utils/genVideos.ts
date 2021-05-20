import videoJS from "video.js";
import { AtomPlayer } from "../../src/Players/AtomPlayer";
import { VideoPlayer } from "../../src/Players/VideoPlayer";

export function genVideos(srcs: string[]): AtomPlayer[] {
    if (srcs.length > 3) {
        document.body.classList.add("many-videos");
    }

    return srcs.map((src, i) => {
        const video = document.createElement("video");
        video.className = "video video-js";
        video.preload = "auto";

        if (srcs.length === 2) {
            video.width = 480;
            video.height = 320;
        } else if (srcs.length === 3) {
            video.width = 320;
            video.height = 240;
        } else {
            video.width = 240;
            video.height = 180;
        }

        const source = document.createElement("source");
        source.src = src;

        video.appendChild(source);
        document.body.appendChild(video);

        return new VideoPlayer({
            video: videoJS(video),
            name: `player${i + 1}`,
        });
    });
}
