import React from "react";
import { Composition } from "remotion";
import { Main } from "./Main";
import { FPS, TOTAL } from "./time";
export const Root: React.FC = () => <Composition id="Metodo4D" component={Main} durationInFrames={TOTAL} fps={FPS} width={1080} height={1920} />;
