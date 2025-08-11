import React, { useEffect, useState } from 'react';
import useWebSocket from './useWebSocket.js';

/**
 * The PvP arena allows players to engage in battles. Players can stake
 * land and buildings in winner‑takes‑all matches or agree to friendly
 * duels. This component queries the server for a list of currently
 * online players and displays simple controls for challenging them.
 */
export default function PvPArena() {
  const { sendMessage, lastMessage } = useWebSocket();
  const [players, setPlayers] = useState([]);
  const [status, setStatus] = useState('');

  // Request the list of available players when the arena view is loaded.
  useEffect(() => {
    sendMessage(JSON.stringify({ type: 'listPlayers' }));
  }, [sendMessage]);

  // Handle incoming messages from the server.
  useEffect(() => {
    if (lastMessage) {
      try {
        const data = JSON.parse(lastMessage.data);
        switch (data.type) {
          case 'playerList':
            setPlayers(data.players);
            break;
          case 'challengeResponse':
            setStatus(data.message);
            // Refresh player list after a challenge is accepted or declined.
            sendMessage(JSON.stringify({ type: 'listPlayers' }));
            break;
          case 'battleUpdate':
            // Show updates about an ongoing battle (e.g. watchers view).
            setStatus(data.update);
            break;
          default:
            break;
        }
      } catch (err) {
        console.error('PvP message parse error', err);
      }
    }
  }, [lastMessage, sendMessage]);

  // Initiate a challenge to another player. Optionally stake land if
  // stake === true.
  const challengePlayer = (targetPlayer, stake) => {
    const payload = {
      type: 'challenge',
      target: targetPlayer.id,
      stake,
    };
    sendMessage(JSON.stringify(payload));
    setStatus(`Sent challenge to ${targetPlayer.username}`);
  };

  return (
    <div className="p-4 h-full overflow-y-auto">
      <h2 className="text-xl font-semibold mb-4">PvP Arena</h2>
      <p className="text-sm text-gray-400 mb-4">
        Challenge other players to battle. You can stake your land and buildings in a high stakes
        match or agree to a friendly duel.
      </p>
      {status && (
        <div className="mb-4 p-2 bg-gray-800 rounded-md text-green-400 text-sm">
          {status}
        </div>
      )}
      <h3 className="text-lg font-medium mb-2">Online Players</h3>
      {players.length === 0 ? (
        <p className="text-gray-400">No players online at the moment.</p>
      ) : (
        <ul className="space-y-2">
          {players.map((player) => (
            <li
              key={player.id}
              className="bg-gray-800 p-3 rounded-md flex justify-between items-center"
            >
              <div>
                <p className="font-medium">{player.username}</p>
                <p className="text-xs text-gray-400">PvP Level: {player.pvpLevel}</p>
              </div>
              <div className="space-x-2">
                <button
                  onClick={() => challengePlayer(player, true)}
                  className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded"
                >
                  Stake Fight
                </button>
                <button
                  onClick={() => challengePlayer(player, false)}
                  className="px-2 py-1 bg-yellow-600 hover:bg-yellow-700 text-white text-xs rounded"
                >
                  Friendly Fight
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}