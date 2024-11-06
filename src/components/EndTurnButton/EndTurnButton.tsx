// src/components/EndTurnButton/EndTurnButton.tsx

import React, { useContext } from "react";
import { GameContext } from "../../context/GameContext";
import { MdStop } from "react-icons/md"; // Using Material Design 'stop' icon
import styles from "./EndTurnButton.module.css";

interface EndTurnButtonProps {
  onClick: () => void;
  disabled: boolean;
}

const EndTurnButton: React.FC<EndTurnButtonProps> = ({ onClick, disabled }) => {
  const { turnInProgress } = useContext(GameContext)!;

  return (
    <button
      className={`${styles.endTurnButton} ${!turnInProgress ? styles.disabled : ""}`}
      onClick={onClick}
      disabled={disabled}
      aria-label="End Turn"
    >
      <MdStop size={24} />
    </button>
  );
};

export default EndTurnButton;
