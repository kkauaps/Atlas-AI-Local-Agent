import React from "react";
import { registerRoot, Composition } from "remotion";
import { Main } from "./Main";
import { FPS, TOTAL } from "./time";
registerRoot(() => <Composition id="ViagemTempo" component={Main} durationInFrames={TOTAL} fps={FPS} width={1080} height={1920} />);
