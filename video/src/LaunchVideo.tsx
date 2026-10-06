import React, { useEffect, useState } from "react";
import { AbsoluteFill, Audio, continueRender, delayRender, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Background, FPS, Layer } from "./shared";
import { fontsReady } from "./vendor/fonts";
import { COLD_DUR, ColdOpen, OUTRO_DUR, Outro, WHY_DUR, Why } from "./scenes/Story";
import { BUILT_DUR, Built, LEAK_DUR, Leak, RESULTS_DUR, Results } from "./scenes/Evidence";
import { DEMO_DUR, Demo, END_DUR, EndState } from "./scenes/Demo";

const SCENES = [
  { C: ColdOpen, dur: COLD_DUR },
  { C: Why, dur: WHY_DUR },
  { C: Leak, dur: LEAK_DUR },
  { C: Built, dur: BUILT_DUR },
  { C: Results, dur: RESULTS_DUR },
  { C: Demo, dur: DEMO_DUR },
  { C: EndState, dur: END_DUR },
  { C: Outro, dur: OUTRO_DUR },
];
const OVERLAP = 0; // hard cuts on the frame; each scene fades its own content in/out

export const LOGICAL_DURATION = SCENES.reduce((a, s) => a + s.dur - OVERLAP, 0);
const STARTS = SCENES.reduce<number[]>((acc, s, i) => [...acc, i === 0 ? 0 : acc[i - 1] + SCENES[i - 1].dur], []);

export const LaunchVideo: React.FC = () => {
  const [handle] = useState(() => delayRender("fonts"));
  useEffect(() => {
    fontsReady.then(() => continueRender(handle)).catch(() => continueRender(handle));
  }, [handle]);
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const k = fps / FPS;
  const music = interpolate(frame, [0, 30 * k, durationInFrames - 90 * k, durationInFrames], [0, 0.32, 0.32, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <Layer from={0} dur={LOGICAL_DURATION}>
        <Background />
      </Layer>
      <Audio src={staticFile("audio/music-ambient-think_01.wav")} volume={music} />
      {SCENES.map(({ C, dur }, i) => (
        <Layer key={i} from={STARTS[i]} dur={dur}>
          <C />
        </Layer>
      ))}
      {/* sound design: a soft data ping on every scene change, a counter land on the leak stat, the NOUS logo at the end */}
      {STARTS.slice(1).map((st, i) => (
        <Sequence key={i} from={Math.round(st * k)} durationInFrames={Math.round(20 * k)}>
          <Audio src={staticFile("audio/data-ping_01.wav")} volume={0.35} />
        </Sequence>
      ))}
      <Sequence from={Math.round((STARTS[2] + 50) * k)} durationInFrames={Math.round(20 * k)}>
        <Audio src={staticFile("audio/counter-land_01.wav")} volume={0.5} />
      </Sequence>
      <Sequence from={Math.round((STARTS[7] + 10) * k)} durationInFrames={Math.round(70 * k)}>
        <Audio src={staticFile("audio/nous-sonic-logo_01.wav")} volume={0.6} />
      </Sequence>
    </AbsoluteFill>
  );
};
