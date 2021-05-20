import "video.js/dist/video-js.css";
import "./style.css";

import { SyncPlayer } from "../src";
import { videoController } from "./utils/video-controller";
import { genVideos } from "./utils/genVideos";

// const players = genVideos(["video1.mp4", "video3.mp4"]);

const players = genVideos(Array(20).fill("video1.mp4"));

const syncPlayer = new SyncPlayer({ players });

videoController(syncPlayer);
