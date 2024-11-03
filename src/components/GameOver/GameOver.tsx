// src/components/GameOver/GameOver.tsx

import React from "react";
import styles from "./GameOver.module.css";

interface GameOverProps {
  score: number;
}

const GameOver: React.FC<GameOverProps> = ({ score }) => {
  const handleRestart = () => {
    window.location.reload();
  };

  return (
    <div className={styles.gameOverContainer}>
      <div>
        <h1 className={styles.title}>Game Over!</h1>
        <p className={styles.score}>Score: {score}</p>
        <button className={styles.restartButton} onClick={handleRestart}>
          Restart Game
        </button>
      </div>
    </div>
  );
};

export default GameOver;
