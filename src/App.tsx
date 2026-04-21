import React from 'react';
import GamePanel from './components/GamePanel';

const App: React.FC = () => {
  return (
    <div className="flex flex-row w-full h-screen bg-[#0a0e17]">
      <GamePanel />
    </div>
  );
};

export default App;
