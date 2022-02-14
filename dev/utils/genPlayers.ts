import videoJS from "video.js";
import { WhiteWebSdk } from "white-web-sdk";
import { OffsetPlayer } from "../../src";
import { AtomPlayer } from "../../src/Players/AtomPlayer";
import { VideoPlayer } from "../../src/Players/VideoPlayer";
import { WhiteboardPlayer } from "../../src/Players/WhiteboardPlayer";

export type VideoConfig = string | { offset: number, videoSRC: string };

export interface WhiteboardConfig {
    offset?: number;
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
            if (typeof config === "string" || Object.prototype.hasOwnProperty.call(config, "videoSRC")) {
                return genVideo(config as VideoConfig, index);
            }
            return genWhiteboard(config as WhiteboardConfig, index);
        }),
    );

    function genVideo(config: VideoConfig, index: number): AtomPlayer {
        const $video = document.createElement("video");
        $video.className = "video video-js";
        $video.preload = "auto";
        $video.width = width;
        $video.height = height;

        const videoConfig = typeof config === "string" ? { offset: 0, videoSRC: config } : config;

        const $source = document.createElement("source");
        $source.src = videoConfig.videoSRC;

        $video.appendChild($source);
        document.body.appendChild($video);

        const video = videoJS($video);

        let player: AtomPlayer = new VideoPlayer({
            video: video,
            name: `player${index + 1}`,
        });

        if (videoConfig.offset > 0) {
            player = new OffsetPlayer({ offset: videoConfig.offset, player });
            video.toggleClass("video-hidden", !player.visible)
            player.on("visibilitychange", () => {
                video.toggleClass("video-hidden", !player.visible);
            });
        }

        return player;
    }

    async function genWhiteboard(config: WhiteboardConfig, index: number): Promise<AtomPlayer> {
        const whiteboardEl = document.createElement("div");
        whiteboardEl.style.width = `${width}px`;
        whiteboardEl.style.height = `${height}px`;
        whiteboardEl.style.outline = "1px solid #ddd";
        document.body.appendChild(whiteboardEl);

        const sdk = new WhiteWebSdk({
            appIdentifier: config.appId,
            loggerOptions: { printLevelMask: "error" },
        });

        const room = await sdk.replayRoom({
            beginTimestamp: config.beginTime,
            duration: config.endTime - config.beginTime,
            room: config.roomUUID,
            roomToken: config.roomToken,
        });

        room.bindHtmlElement(whiteboardEl);

        let player: AtomPlayer = new WhiteboardPlayer({ player: room, name: `whiteboard${index + 1}` });

        if (config.offset > 0) {
            player = new OffsetPlayer({ offset: config.offset, player });
        }

        return player;
    }
}
