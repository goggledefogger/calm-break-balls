// src/components/ScoreBoard/ScoreBoard.tsx

import React, { useContext } from "react";
import { GameContext } from "../../context/GameContext";
import styles from "./ScoreBoard.module.css";

const ScoreBoard: React.FC = () => {
  const { score, numBalls, turn } = useContext(GameContext)!;

  return (
    <>
      <div className={`${styles.score} ${styles.topRight}`}>Score: {score}</div>
      <div className={`${styles.score} ${styles.topLeft}`}>
        Balls: {numBalls}
      </div>
      <div className={`${styles.score} ${styles.topCenter}`}>Turn: {turn}</div>
    </>
  );
};

export default ScoreBoard;
