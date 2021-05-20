## SyncPlayer

Play multiple videos at the same time with state synchronization.

## Usage

```js
import videojs from "video.js";
import { VideoPlayer, SyncPlayer } from "@netless/sync-player";

const player1 = new VideoPlayer({ video: videojs("#video1"), name: "video1" });
const player2 = new VideoPlayer({ video: videojs("#video2"), name: "video2" });

const syncPlayer = new SyncPlayer({ players: [player1, player2] });

syncPlayer.play();
```

## Development

```bash
yarn start
```

