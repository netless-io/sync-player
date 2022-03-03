## SyncPlayer

Play multiple videos at the same time with state synchronization.

> If one of the videos has finished playing, we will let the other videos continue to play. We don't fire the Ended event until all the videos have finished playing

## Usage

```ts
import videojs from "video.js";
import { VideoPlayer, SyncPlayer, OffsetPlayer } from "@netless/sync-player";

const video1 = videojs("#video1")
const player1 = new VideoPlayer({ video: video1, name: "video1" });

const video2 = videojs("#video2")
const player2 = new OffsetPlayer({ offset: 1000, player: new VideoPlayer({ video: video2, name: "video2" }) });

video2.toggleClass("video-hidden", !player2.visible)
player2.on("visibilitychange", () => {
    video2.toggleClass("video-hidden", !player2.visible);
});

const syncPlayer = new SyncPlayer({ players: [player1, player2] });

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

### seek

```ts
// unit: ms
syncPlayer.seek(1000);
```

### duration

```ts
// unit: ms
// returns the longest timestamp
syncPlayer.duration
```


### currentTime

```ts
// unit: ms
syncPlayer.currentTime
```


### status

```ts
// Ready | Pause | Buffering | Playing | Ended
syncPlayer.status
```

## playbackRate

```ts
// link: https://developer.mozilla.org/en-US/docs/Web/Guide/Audio_and_video_delivery/WebAudio_playbackRate_explained
syncPlayer.playbackRate
```

## Basic Usage

### Monitor state changes

```ts
syncPlayer.on("status", () => {
  const currentStatus = syncPlayer.status;
});
```

### Monitor playback progress

```ts
syncPlayer.on("timeupdate", () => {
  const currentTime = syncPlayer.currentTime;
});
```

### Monitor playback rate

```ts
syncPlayer.on("ratechange", () => {
  const currentTime = syncPlayer.playbackRate;
});
```

## Offset

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
