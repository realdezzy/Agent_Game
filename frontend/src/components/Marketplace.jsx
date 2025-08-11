import React, { useState } from 'react';
import useWebSocket from './useWebSocket.js';

/**
 * A reusable tab navigation for the marketplace. Each tab represents a
 * category of items players can purchase. When a tab is clicked the
 * active category state is updated and the item list below changes.
 */
function CategoryTabs({ categories, active, onChange }) {
  return (
    <div className="flex space-x-2 border-b border-gray-700 pb-2 mb-4 overflow-x-auto">
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => onChange(cat)}
          className={`px-4 py-1 text-sm font-medium rounded-t-md ${
            active === cat ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}

/**
 * The marketplace component presents different categories of assets that
 * players can purchase. For demonstration purposes the items are
 * hardcoded. Purchasing an item sends a message to the server to
 * update the player's inventory. In a real application the server
 * would respond with confirmation and update all connected clients.
 */
export default function Marketplace() {
  // WebSocket for communicating purchases to the server.
  const { sendMessage } = useWebSocket();
  // Available categories in the marketplace.
  const categories = ['Islands', 'NFT Characters', 'Buildings', 'Land', 'Weapons'];
  // Track which category is currently active.
  const [activeCategory, setActiveCategory] = useState(categories[0]);

  // Fake inventory for each category. Each item has a name, price and rarity.
  const items = {
    Islands: [
      { id: 'island-1', name: 'Serengeti Island', price: 1000, rarity: 'Rare' },
      { id: 'island-2', name: 'Kalahari Haven', price: 750, rarity: 'Common' },
    ],
    'NFT Characters': [
      { id: 'nft-1', name: 'Warrior Ayo', price: 500, rarity: 'Epic' },
      { id: 'nft-2', name: 'Hunter Zuri', price: 350, rarity: 'Common' },
    ],
    Buildings: [
      { id: 'build-1', name: 'Mud Hut', price: 100, rarity: 'Common' },
      { id: 'build-2', name: 'Stone Palace', price: 800, rarity: 'Legendary' },
    ],
    Land: [
      { id: 'land-1', name: 'Savanna Plot', price: 200, rarity: 'Common' },
      { id: 'land-2', name: 'Oasis Patch', price: 300, rarity: 'Uncommon' },
    ],
    Weapons: [
      { id: 'wpn-1', name: 'Spear of Unity', price: 150, rarity: 'Rare' },
      { id: 'wpn-2', name: 'Shield of Hope', price: 120, rarity: 'Common' },
    ],
  };

  // Handler for purchasing an item. Sends a message to the server.
  const handlePurchase = (item) => {
    const payload = {
      type: 'purchase',
      itemId: item.id,
      category: activeCategory,
    };
    sendMessage(JSON.stringify(payload));
    alert(`Purchased ${item.name}!`);
  };

  return (
    <div className="p-4 h-full overflow-y-auto">
      <h2 className="text-xl font-semibold mb-4">Marketplace</h2>
      <CategoryTabs categories={categories} active={activeCategory} onChange={setActiveCategory} />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {items[activeCategory].map((item) => (
          <div
            key={item.id}
            className="bg-gray-800 p-4 rounded-lg shadow hover:shadow-md transition-shadow duration-200"
          >
            <h3 className="text-lg font-medium mb-1">{item.name}</h3>
            <p className="text-sm text-gray-400 mb-2">Rarity: {item.rarity}</p>
            <p className="text-sm text-green-400 mb-4">Price: {item.price} tokens</p>
            <button
              onClick={() => handlePurchase(item)}
              className="w-full px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-md"
            >
              Purchase
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}