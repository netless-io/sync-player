import "video.js/dist/video-js.css";
import "./style.css";

import { SyncPlayer } from "../src";
import { videoController } from "./utils/video-controller";
import { genPlayers } from "./utils/genPlayers";

async function main(): Promise<void> {
    const players = await genPlayers([
        "video1.mp4",
        "video3.mp4",
        {
            appId: "",
            beginTime: 1621840756709,
            endTime: 1621840848391,
            roomToken: "",
            roomUUID: "",
        },
    ]);

    // const players = genVideos(Array(20).fill("video1.mp4"));

    const syncPlayer = new SyncPlayer({ players });

    videoController(syncPlayer);
}

main();
