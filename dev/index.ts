import "video.js/dist/video-js.css";
import "./style.css";

import {
    NativeVideoPlayer,
    OffsetPlayer,
    SelectionPlayer,
    SyncPlayer,
    VideoPlayer,
    WhiteboardPlayer,
} from "../src";
import { videoController } from "./utils/video-controller";
import { genNativeVideos, genVideos, genWhiteboards } from "./utils/genPlayers";

async function main(): Promise<void> {
    const videos = genVideos([
        "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4",
        "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4",
    ]);

    const nativeVideos = genNativeVideos([
        "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4",
    ]);

    const whiteboards = await genWhiteboards([
        {
            appId: "test/1",
            region: "cn-hz",
            beginTime: 1652689484178,
            endTime: 1652689525046,
            roomUUID: "a0ec99b0d4f111eca5875ff80c78ea42",
            // this test room token is intentionally put here
            roomToken:
                "NETLESSROOM_YWs9eTBJOWsxeC1IVVo4VGh0NyZub25jZT0xNjUyNjg5NDc5Nzg5MDAmcm9sZT0wJnNpZz00MTQ4NjJlMDIzMzA3ZjJmYjhkZjMxYjVlNzU0MGQxMTllNGYwNDNlMmUxZmFlYzJjYWYzOWYxNjVkYTNlZmY0JnV1aWQ9YTBlYzk5YjBkNGYxMTFlY2E1ODc1ZmY4MGM3OGVhNDI",
        },
    ]);

    [...videos, ...whiteboards].forEach((item, _, list) => {
        if (list.length === 2) {
            item.updateSize(480, 320);
        } else if (list.length === 3) {
            item.updateSize(320, 240);
        } else {
            item.updateSize(240, 180);
        }
    });

    const videoPlayers = videos.map(
        (item, index) =>
            new VideoPlayer({
                video: item.video,
                name: `player${index + 1}`,
            }),
    );

    const nativeVideoPlayers = nativeVideos.map(
        (video, index) =>
            new NativeVideoPlayer({
                video,
                name: `native-player${index + 1}`,
            }),
    );

    const whiteboardPlayers = whiteboards.map(
        (item, index) =>
            new WhiteboardPlayer({
                player: item.room,
                name: `whiteboard${index + 1}`,
            }),
    );

    videoPlayers[0] = new SelectionPlayer({
        player: videoPlayers[0],
        selectionList: [
            { start: 0, duration: 4000 },
            { start: 6000, duration: 10000 },
            { start: 8000, duration: 5000 },
        ],
    });

    videoPlayers[1] = new OffsetPlayer({
        player: videoPlayers[1],
        offset: 2000,
    });
    videos[1].video.toggleClass("video-hidden", !videoPlayers[1].visible);
    videoPlayers[1].on("visibilitychange", () => {
        videos[1].video.toggleClass("video-hidden", !videoPlayers[1].visible);
    });

    const syncPlayer = new SyncPlayer({
        players: [...videoPlayers, ...nativeVideoPlayers, ...whiteboardPlayers],
    });

    videoController(syncPlayer);
}

main();
