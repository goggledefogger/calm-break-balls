// src/components/Game/Game.tsx

import React from "react";
import GameCanvas from "../GameCanvas/GameCanvas";
import ScoreBoard from "../ScoreBoard/ScoreBoard";
import TurboButton from "../TurboButton/TurboButton";

const Game: React.FC = () => {
  return (
    <>
      <GameCanvas />
      <ScoreBoard />
      <TurboButton />
    </>
  );
};

export default Game;
