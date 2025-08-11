import React, { useEffect, useState } from 'react';
import useWebSocket from './useWebSocket.js';

/**
 * Displays the current player's profile including PvP level,
 * properties owned and calculated reward rates. In a real game this
 * data would be queried from the server when the component is
 * mounted. Here we simulate it with placeholder state and
 * demonstrate how to update the UI when new data arrives via the
 * WebSocket connection.
 */
export default function Profile() {
  const { sendMessage, lastMessage } = useWebSocket();
  const [profile, setProfile] = useState({
    username: 'PlayerOne',
    pvpLevel: 3,
    properties: [],
    dailyReward: 0,
  });

  // When mounted ask the server for the current player's profile.
  useEffect(() => {
    sendMessage(JSON.stringify({ type: 'getProfile' }));
  }, [sendMessage]);

  // When a new message arrives update local state accordingly.
  useEffect(() => {
    if (lastMessage) {
      try {
        const data = JSON.parse(lastMessage.data);
        if (data.type === 'profile') {
          setProfile(data.profile);
        }
      } catch (err) {
        console.error('Profile parse error', err);
      }
    }
  }, [lastMessage]);

  return (
    <div className="p-4 h-full overflow-y-auto">
      <h2 className="text-xl font-semibold mb-4">Profile</h2>
      <div className="bg-gray-800 p-4 rounded-lg shadow mb-6">
        <p className="text-lg font-medium mb-2">Username: {profile.username}</p>
        <p className="text-md mb-2">PvP Level: {profile.pvpLevel}</p>
        <p className="text-md mb-2">Daily Reward Rate: {profile.dailyReward} tokens</p>
      </div>
      <h3 className="text-lg font-medium mb-2">Owned Properties</h3>
      {profile.properties.length === 0 ? (
        <p className="text-gray-400">You don't own any properties yet.</p>
      ) : (
        <ul className="space-y-2">
          {profile.properties.map((prop, idx) => (
            <li key={idx} className="bg-gray-800 p-3 rounded-md flex justify-between items-center">
              <span>{prop.name}</span>
              <span className="text-sm text-gray-400">Reward: {prop.reward} / day</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}