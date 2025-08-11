import React, { useState } from 'react';

// Import sub‑components for different parts of the app. These files are
// created later in the project and live under src/components.
import GameCanvas from './components/GameCanvas.jsx';
import Marketplace from './components/Marketplace.jsx';
import Profile from './components/Profile.jsx';
import PvPArena from './components/PvPArena.jsx';

// Hero icons for modern navigation. These will be tree‑shaken by Vite.
import {
  CubeTransparentIcon,
  ShoppingBagIcon,
  BoltIcon,
  UserCircleIcon,
} from '@heroicons/react/24/solid';

// Simple helper component to encapsulate navigation button styling.
function NavButton({ label, Icon, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center space-x-1 px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
        isActive ? 'bg-primary text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
      }`}
    >
      {Icon && <Icon className="w-5 h-5" />}
      <span>{label}</span>
    </button>
  );
}

/**
 * The root application component. It holds navigation state and
 * conditionally renders the different screens. It also hosts the
 * WebSocket provider to share the connection across components.
 */
export default function App() {
  // Track which tab is active. Default to the game view.
  const [activeTab, setActiveTab] = useState('game');

  // Define the tabs along with their icons to streamline rendering.
  const tabs = [
    { key: 'game', label: 'Game', icon: CubeTransparentIcon },
    { key: 'market', label: 'Marketplace', icon: ShoppingBagIcon },
    { key: 'arena', label: 'PvP Arena', icon: BoltIcon },
    { key: 'profile', label: 'Profile', icon: UserCircleIcon },
  ];

  return (
    <div className="flex flex-col h-screen w-screen">
      {/* Navigation bar */}
      <nav className="flex items-center justify-between bg-secondary px-4 py-3 border-b border-gray-800">
        <h1 className="text-lg font-bold text-primary">Africa Universe</h1>
        <div className="flex space-x-2">
          {tabs.map((tab) => (
            <NavButton
              key={tab.key}
              label={tab.label}
              Icon={tab.icon}
              isActive={activeTab === tab.key}
              onClick={() => setActiveTab(tab.key)}
            />
          ))}
        </div>
      </nav>

      {/* Main content area */}
      <div className="flex-grow overflow-hidden">
        {activeTab === 'game' && <GameCanvas />}
        {activeTab === 'market' && <Marketplace />}
        {activeTab === 'arena' && <PvPArena />}
        {activeTab === 'profile' && <Profile />}
      </div>
    </div>
  );
}