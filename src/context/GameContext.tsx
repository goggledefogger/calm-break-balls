// src/context/GameContext.tsx

import React, { createContext, useState, ReactNode, useEffect } from "react";

interface GameContextProps {
  score: number;
  setScore: React.Dispatch<React.SetStateAction<number>>;
  numBalls: number;
  setNumBalls: React.Dispatch<React.SetStateAction<number>>;
  turn: number;
  setTurn: React.Dispatch<React.SetStateAction<number>>;
  isPaused: boolean;
  setIsPaused: React.Dispatch<React.SetStateAction<boolean>>;
  isGameOver: boolean;
  setIsGameOver: React.Dispatch<React.SetStateAction<boolean>>;
  isTurbo: boolean;
  setIsTurbo: React.Dispatch<React.SetStateAction<boolean>>;
  turnInProgress: boolean;
  setTurnInProgress: React.Dispatch<React.SetStateAction<boolean>>;
}

export const GameContext = createContext<GameContextProps | undefined>(
  undefined
);

interface GameProviderProps {
  children: ReactNode;
}

export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  const [score, setScore] = useState<number>(0);
  const [numBalls, setNumBalls] = useState<number>(1);
  const [turn, setTurn] = useState<number>(1);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isTurbo, setIsTurbo] = useState<boolean>(false);
  const [turnInProgress, setTurnInProgress] = useState<boolean>(false);

  return (
    <GameContext.Provider
      value={{
        score,
        setScore,
        numBalls,
        setNumBalls,
        turn,
        setTurn,
        isPaused,
        setIsPaused,
        isGameOver,
        setIsGameOver,
        isTurbo,
        setIsTurbo,
        turnInProgress,
        setTurnInProgress,
      }}>
      {children}
    </GameContext.Provider>
  );
};
