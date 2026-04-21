import React, { useRef } from 'react';
import { useGameRunner } from '../hooks/useGameRunner';

const GamePanel: React.FC = () => {
  const gameRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useGameRunner(gameRef, canvasRef);

  return (
    <div className="flex w-full h-full">
      <div
        ref={gameRef}
        id="game"
        className="relative max-w-[600px] w-full pt-[50px]"
        style={{ color: '#2b2b2b', fontSize: '1em' }}
      >
        <div className="generation absolute top-1 left-0 right-0 font-bold text-center text-sm" />
      </div>
      <canvas
        ref={canvasRef}
        id="legend"
        className="flex-1 h-full"
      />
    </div>
  );
};

export default GamePanel;
