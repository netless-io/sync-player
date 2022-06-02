# Changelog

## 1.0.2

-   Support Sync Operations

    Whiteboard Player updates status immediately without waiting for the first frame.

-   Reduce frame drop checking frequency

    Frame drop correction may cause dead loop. Reduce the checking frequency to improved fault tolerance.

## 1.0.3

-   Fix a bug when syncing sub players' states, ClusterPlayer make assume a sub-player is ended if it's first frame is not loaded yet(duration 0).

## 1.0.4

-   Check pause status when Error on video player.
