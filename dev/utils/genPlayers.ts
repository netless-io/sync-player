import videoJS, { VideoJsPlayer } from "video.js";
import { Player, WhiteWebSdk } from "white-web-sdk";
import { renderTime } from "./video-controller";

export type UpdateElSize = (width: number, height: number) => void;

export interface VideoItem {
    updateSize: UpdateElSize;
    video: VideoJsPlayer;
}

export function genVideo(videoSRC: string): VideoItem {
    const $video = document.createElement("video");
    $video.className = "video video-js";
    $video.preload = "auto";
    $video.width = 240;
    $video.height = 180;

    const $container = document.createElement("div");
    $container.className = "player-container";

    const $currentTime = document.createElement("div");
    $currentTime.className = "player-container-current-time";
    $currentTime.textContent = renderTime(0);

    const $source = document.createElement("source");
    $source.src = videoSRC;

    $video.appendChild($source);

    $container.appendChild($video);
    $container.appendChild($currentTime);
    document.body.appendChild($container);

    const video = videoJS($video);

    video.on("timeupdate", () => {
        $currentTime.textContent = renderTime((video.currentTime() || 0) * 1000);
    });

    return {
        updateSize: (width: number, height: number): void => {
            $video.width = width;
            $video.height = height;
        },
        video,
    };
}

export function genVideos(videoSRCs: string[]): VideoItem[] {
    return videoSRCs.map(genVideo);
}

export interface WhiteboardItem {
    updateSize: UpdateElSize;
    room: Player;
}

export interface WhiteboardConfig {
    offset?: number;
    appId: string;
    region: string;
    roomUUID: string;
    roomToken: string;
    beginTime: number;
    endTime: number;
}

export async function genWhiteboard(config: WhiteboardConfig): Promise<WhiteboardItem> {
    const whiteboardEl = document.createElement("div");
    whiteboardEl.style.width = "240px";
    whiteboardEl.style.height = "180px";
    whiteboardEl.style.outline = "1px solid #ddd";

    const $container = document.createElement("div");
    $container.className = "player-container";

    const $currentTime = document.createElement("div");
    $currentTime.className = "player-container-current-time";
    $currentTime.textContent = renderTime(0);

    $container.appendChild(whiteboardEl);
    $container.appendChild($currentTime);
    document.body.appendChild($container);

    const sdk = new WhiteWebSdk({
        appIdentifier: config.appId,
        loggerOptions: { printLevelMask: "error" },
    });

    const room = await sdk.replayRoom({
        beginTimestamp: config.beginTime,
        duration: config.endTime - config.beginTime,
        room: config.roomUUID,
        roomToken: config.roomToken,
        region: config.region,
    });

    room.bindHtmlElement(whiteboardEl);

    room.callbacks.on("onProgressTimeChanged", (currentTime: number) => {
        $currentTime.textContent = renderTime(currentTime || 0);
    });

    return {
        updateSize: (width: number, height: number): void => {
            whiteboardEl.style.width = `${width}px`;
            whiteboardEl.style.height = `${height}px`;
        },
        room,
    };
}

export function genWhiteboards(configs: WhiteboardConfig[]): Promise<WhiteboardItem[]> {
    return Promise.all(configs.map(genWhiteboard));
}
