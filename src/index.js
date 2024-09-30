import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import Game from './Game';

const root = createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Game />
  </React.StrictMode>
);
