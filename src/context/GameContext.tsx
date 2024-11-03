// src/context/GameContext.tsx

import React, { createContext, useState, ReactNode } from "react";

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
      }}>
      {children}
    </GameContext.Provider>
  );
};
