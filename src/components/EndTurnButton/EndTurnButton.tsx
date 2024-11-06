// src/components/EndTurnButton/EndTurnButton.tsx

import React, { useContext } from "react";
import { GameContext } from "../../context/GameContext";
import styles from "./EndTurnButton.module.css";

interface EndTurnButtonProps {
  onClick: () => void;
  disabled: boolean;
}

const EndTurnButton: React.FC<EndTurnButtonProps> = ({ onClick, disabled }) => {
  const { turnInProgress } = useContext(GameContext)!;

  return (
    <button
      className={`${styles.endTurnButton} ${
        !turnInProgress ? styles.disabled : ""
      }`}
      onClick={onClick}
      disabled={disabled}>
      End Turn
    </button>
  );
};

export default EndTurnButton;
