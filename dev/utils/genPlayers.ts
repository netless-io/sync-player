import videoJS from "video.js";
import { WhiteWebSdk } from "white-web-sdk";
import { AtomPlayer } from "../../src/Players/AtomPlayer";
import { VideoPlayer } from "../../src/Players/VideoPlayer";
import { WhiteboardPlayer } from "../../src/Players/WhiteboardPlayer";

export type VideoConfig = string;

export interface WhiteboardConfig {
    appId: string;
    roomUUID: string;
    roomToken: string;
    beginTime: number;
    endTime: number;
}

export async function genPlayers(
    configs: (VideoConfig | WhiteboardConfig)[],
): Promise<AtomPlayer[]> {
    if (configs.length > 3) {
        document.body.classList.add("many-videos");
    }

    let width: number;
    let height: number;

    if (configs.length === 2) {
        width = 480;
        height = 320;
    } else if (configs.length === 3) {
        width = 320;
        height = 240;
    } else {
        width = 240;
        height = 180;
    }

    return Promise.all(
        configs.map((config, index) => {
            if (typeof config === "string") {
                return genVideo(config, index);
            }
            return genWhiteboard(config, index);
        }),
    );

    function genVideo(src: string, index: number): AtomPlayer {
        const video = document.createElement("video");
        video.className = "video video-js";
        video.preload = "auto";
        video.width = width;
        video.height = height;

        const source = document.createElement("source");
        source.src = src;

        video.appendChild(source);
        document.body.appendChild(video);

        return new VideoPlayer({
            video: videoJS(video),
            name: `player${index + 1}`,
        });
    }

    async function genWhiteboard(config: WhiteboardConfig, index: number): Promise<AtomPlayer> {
        const whiteboardEl = document.createElement("div");
        whiteboardEl.style.width = `${width}px`;
        whiteboardEl.style.height = `${height}px`;
        whiteboardEl.style.outline = "1px solid #ddd";
        document.body.appendChild(whiteboardEl);

        const sdk = new WhiteWebSdk({ appIdentifier: config.appId });

        const room = await sdk.replayRoom({
            beginTimestamp: config.beginTime,
            duration: config.endTime - config.beginTime,
            room: config.roomUUID,
            roomToken: config.roomToken,
        });

        room.bindHtmlElement(whiteboardEl);

        return new WhiteboardPlayer({ player: room, name: `whiteboard${index + 1}` });
    }
}
