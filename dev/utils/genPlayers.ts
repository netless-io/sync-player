import videoJS, { VideoJsPlayer } from "video.js";
import { Player, WhiteWebSdk } from "white-web-sdk";

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

    const $source = document.createElement("source");
    $source.src = videoSRC;

    $video.appendChild($source);
    document.body.appendChild($video);

    return {
        updateSize: (width, height) => {
            $video.width = width;
            $video.height = height;
        },
        video: videoJS($video),
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
    whiteboardEl.style.width = `240px`;
    whiteboardEl.style.height = `180px`;
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
        region: config.region,
    });

    room.bindHtmlElement(whiteboardEl);
    (window as any).room = room;

    return {
        updateSize: (width, height) => {
            whiteboardEl.style.width = `${width}px`;
            whiteboardEl.style.height = `${height}px`;
        },
        room,
    };
}

export function genWhiteboards(configs: WhiteboardConfig[]): Promise<WhiteboardItem[]> {
    return Promise.all(configs.map(genWhiteboard));
}
