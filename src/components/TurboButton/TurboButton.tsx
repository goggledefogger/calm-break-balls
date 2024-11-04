import React, { useContext } from "react";
import { GameContext } from "../../context/GameContext";
import styles from "./TurboButton.module.css";

const TurboButton: React.FC = () => {
  const { isTurbo, setIsTurbo, turnInProgress } = useContext(GameContext)!;

  return (
    <button
      className={`${styles.turboButton} ${
        !turnInProgress ? styles.disabled : ""
      }`}
      onClick={() => turnInProgress && setIsTurbo((prev) => !prev)}
      disabled={!turnInProgress}>
      {isTurbo ? "Normal Speed" : "Turbo Speed"}
    </button>
  );
};

export default TurboButton;
