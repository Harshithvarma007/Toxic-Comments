import React from "react";
import { Composition } from "remotion";
import "./vendor/tokens.css";
import { LaunchVideo, LOGICAL_DURATION } from "./LaunchVideo";

/* Authored on a 1920x1080 / 30fps logical canvas (Stage). 1080p/30 for quick renders and
   the web; 4K/60 is the channel's canonical upload format. */
export function RemotionRoot() {
  return (
    <>
      <Composition id="LaunchVideo" component={LaunchVideo} durationInFrames={LOGICAL_DURATION} fps={30} width={1920} height={1080} />
      <Composition id="LaunchVideo4K" component={LaunchVideo} durationInFrames={LOGICAL_DURATION * 2} fps={60} width={3840} height={2160} />
    </>
  );
}
