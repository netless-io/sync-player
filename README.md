## SyncPlayer

Play multiple videos at the same time with state synchronization.

> If one of the videos has finished playing, we will let the other videos continue to play. We don't fire the Ended event until all the videos have finished playing

## Usage

```ts
import videojs from "video.js";
import { VideoPlayer, SyncPlayer } from "@netless/sync-player";

const player1 = new VideoPlayer({ video: videojs("#video1"), name: "video1" });
const player2 = new VideoPlayer({ video: videojs("#video2"), name: "video2" });

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

## Common scenes

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
