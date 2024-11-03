// src/App.tsx

import React from "react";
import { GameProvider } from "./context/GameContext";
import Game from "./components/Game/Game";

const App: React.FC = () => {
  return (
    <GameProvider>
      <Game />
    </GameProvider>
  );
};

export default App;
