## SyncPlayer

Play multiple videos at the same time with state synchronization.

> If one of the videos has finished playing, we will let the other videos continue to play. We don't fire the Ended event until all the videos have finished playing

## Usage

### Basic

```ts
import videojs from "video.js";
import { VideoPlayer, SyncPlayer, OffsetPlayer } from "@netless/sync-player";

const player1 = new VideoPlayer({ video: videojs("#video1"), name: "video1" });
const player2 = new VideoPlayer({ video: videojs("#video2"), name: "video2" });

const syncPlayer = new SyncPlayer({ players: [player1, player2] });

syncPlayer.play();
```

### Offset

You may add a time offset before any `AtomPlayer`:

```ts
const video = videojs("#video1")
const videoPlayer = new VideoPlayer({ video, name: "video1" });

// wait 3s before actually playing
const offsetPlayer = new OffsetPlayer({ offset: 3000, player: videoPlayer })

// add css to hide the video element
video.toggleClass("hidden", !player.visible)
offsetPlayer.on("visibilitychange", () => {
    video.toggleClass("hidden", !player.visible)
})
```

### Sync With Netless Whiteboard

Sync videos with Netless Whiteboard Replay.

```js
import videojs from "video.js";
import { VideoPlayer, WhiteboardPlayer, SyncPlayer, OffsetPlayer } from "@netless/sync-player";

const videoPlayer1 = new VideoPlayer({ video: videojs("#video1"), name: "video1" });
const videoPlayer2 = new VideoPlayer({ video: videojs("#video2"), name: "video2" });

const sdk = new WhiteWebSdk({ ... });
const room = await sdk.replayRoom({ ... });
room.bindHtmlElement(el);
const whiteboardPlayer = new WhiteboardPlayer({ player: room });

const syncPlayer = new SyncPlayer({ players: [videoPlayer1, videoPlayer2, whiteboardPlayer] });

syncPlayer.play();
```


## API

### play

```ts
syncPlayer.play();
```

### pause

```ts
syncPlayer.pause();
```

### duration

```ts
// unit: ms
// returns the longest timestamp
console.log(syncPlayer.duration);

syncPlayer.on("durationchange", () => {
  console.log(syncPlayer.duration);
});
```


### currentTime

```ts
// unit: ms
console.log(syncPlayer.currentTime);

syncPlayer.seek(1000);

syncPlayer.on("timeupdate", () => {
  console.log(syncPlayer.currentTime);
});
```


### status

```ts
// Ready | Pause | Buffering | Playing | Ended
console.log(syncPlayer.status);

syncPlayer.on("status", () => {
  console.log(syncPlayer.status);
});
```


### playbackRate

<https://developer.mozilla.org/en-US/docs/Web/Guide/Audio_and_video_delivery/WebAudio_playbackRate_explained>

```ts
console.log(syncPlayer.playbackRate);
syncPlayer.setPlaybackRate(0.5);

syncPlayer.on("ratechange", () => {
  console.log(syncPlayer.playbackRate);
});
```

### visibility

A hint for visibility changes for player with offset

```ts
console.log(syncPlayer.visible)

syncPlayer.on("visibilitychange", () => {
  console.log(syncPlayer.visible)
});
```
