## SyncPlayer

Plays multiple media(videos or whiteboards) at the same time with synchronized progress and speed. Stops when the longest media ended.

## Overview

-   `AtomPlayer`: Abstract class for anything that is playable.
    -   `VideoPlayer`: For `videojs` supported media.
    -   `WhiteboardPlayer`: For [Netless Whiteboard](https://developer.netless.link/javascript-en/home/replay) replay room.
    -   `OffsetPlayer`: Add blank offset before an `AtomPlayer`.
    -   `SelectionPlayer`: Cherry-pick segments of an `AtomPlayer`.
    -   `SyncPlayer`: Play groups of `AtomPlayer`s at the same time with synchronized progress and speed.

## Install

```
npm add @netless/sync-player
```

## Usage

You may clone this repo and run the [dev example](https://github.com/netless-io/sync-player/blob/main/dev/index.ts).

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
const video = videojs("#video1");
const videoPlayer = new VideoPlayer({ video, name: "video1" });

// wait 3s before actually playing
const offsetPlayer = new OffsetPlayer({ offset: 3000, player: videoPlayer });

// add css to hide the video element
video.toggleClass("hidden", !player.visible);
offsetPlayer.on("visibilitychange", () => {
    video.toggleClass("hidden", !player.visible);
});
```

### Selection Player

You may trim any `AtomPlayer` to selected parts by providing a selection list.

```ts
const video = videojs("#video1");
const videoPlayer = new VideoPlayer({ video, name: "video1" });
console.log(videoPlayer.duration); // let's say it's 15000

const selectionPlayer = new SelectionPlayer({
    player: videoPlayer,
    selectionList: [
        { start: 0, duration: 1000 },
        { start: 3000, duration: 9000 },
    ],
});
console.log(selectionPlayer.duration); // 7000
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

### stop

```ts
syncPlayer.stop();
```

### seek

```ts
syncPlayer.seek(200);
```

### duration

Duration(in millisecond) of the longest media.

```ts
console.log(syncPlayer.duration);

syncPlayer.on("durationchange", () => {
    console.log(syncPlayer.duration);
});
```

### currentTime

Player progress time(in millisecond).

```ts
console.log(syncPlayer.currentTime);

syncPlayer.seek(1000);

syncPlayer.on("timeupdate", () => {
    console.log(syncPlayer.currentTime);
});
```

### status

Player status.

-   `Pause` Player paused by user invoking `player.pause()`.
-   `Ready` Player paused by controller.
-   `Buffering` Player is buffering.
-   `Playing` Player is playing.
-   `Ended` Player ends.

```ts
// Ready | Pause | Buffering | Playing | Ended
console.log(syncPlayer.status);

syncPlayer.on("status", () => {
    console.log(syncPlayer.status);
});
```

### playbackRate

`0~1`. Playback speed, or rate, of a player.

```ts
console.log(syncPlayer.playbackRate);
syncPlayer.setPlaybackRate(0.5);

syncPlayer.on("ratechange", () => {
    console.log(syncPlayer.playbackRate);
});
```

### visible

A hint for visibility changes for `OffsetPlayer`. `player.visible` is `false` when `currentTime` is within the offset.

```ts
console.log(syncPlayer.visible);

syncPlayer.on("visibilitychange", () => {
    console.log(syncPlayer.visible);
});
```
