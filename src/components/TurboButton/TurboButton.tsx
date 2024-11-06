import React, { useContext } from "react";
import { GameContext } from "../../context/GameContext";
import { MdSpeed } from "react-icons/md"; // Using Material Design 'speed' icon
import styles from "./TurboButton.module.css";

const TurboButton: React.FC = () => {
  const { isTurbo, setIsTurbo, turnInProgress } = useContext(GameContext)!;

  return (
    <button
      className={`${styles.turboButton} ${!turnInProgress ? styles.disabled : ""}`}
      onClick={() => turnInProgress && setIsTurbo((prev) => !prev)}
      disabled={!turnInProgress}
      aria-label={isTurbo ? "Normal Speed" : "Turbo Speed"}
    >
      <MdSpeed
        size={24}
        style={{
          transform: isTurbo ? 'rotate(180deg)' : 'none',
          transition: 'transform 0.3s ease'
        }}
      />
    </button>
  );
};

export default TurboButton;
