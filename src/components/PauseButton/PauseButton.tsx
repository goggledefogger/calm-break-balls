// src/components/PauseButton/PauseButton.tsx

import React, { useContext } from "react";
import { GameContext } from "../../context/GameContext";
import styles from "./PauseButton.module.css";

const PauseButton: React.FC = () => {
  const { isPaused, setIsPaused } = useContext(GameContext)!;

  return (
    <button
      className={styles.pauseButton}
      onClick={() => setIsPaused((prev) => !prev)}>
      {isPaused ? "Resume" : "Pause"}
    </button>
  );
};

export default PauseButton;
