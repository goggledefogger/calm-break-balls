// src/components/ScoreBoard/ScoreBoard.tsx

import React, { useContext } from "react";
import { GameContext } from "../../context/GameContext";
import { MdSportsBasketball, MdTimer, MdStars } from "react-icons/md";
import styles from "./ScoreBoard.module.css";

const ScoreBoard: React.FC = () => {
  const { score, numBalls, turn } = useContext(GameContext)!;

  return (
    <>
      <div className={`${styles.score} ${styles.topRight}`}>
        <MdStars size={20} />
        {score}
      </div>
      <div className={`${styles.score} ${styles.topLeft}`}>
        <MdSportsBasketball size={20} />
        {numBalls}
      </div>
      <div className={`${styles.score} ${styles.topCenter}`}>
        <MdTimer size={20} />
        {turn}
      </div>
    </>
  );
};

export default ScoreBoard;
