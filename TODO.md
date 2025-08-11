# Africa Universe Game Development To‑Do

This document outlines the next steps required to transform the
scaffolding into a fully featured Africa‑themed multiplayer universe
game. Tasks are grouped logically and should be addressed roughly in
the order presented.

## 1. Front‑end Enhancements

1. **Install dependencies:** Once network access is available, run
   `npm install` in the `frontend` directory. This will download
   React, Vite, Tailwind and other packages defined in
   `frontend/package.json`.

2. **Asset integration:** Source or commission 3D models and
   textures for African buildings, islands and landscapes. Import
   these models into the React Three Fiber scene using Drei's
   `useGLTF` hook. Replace the placeholder cubes in `GameCanvas.jsx`
   with these models.

3. **Player avatar and controls:** Add a controllable player avatar
   (e.g., a stylized character model). Implement movement controls
   (WASD/arrow keys) and camera follow. Sync movement with the server
   via WebSocket messages.

4. **Building placement:** Implement UI and interactions for
   purchasing and placing buildings on owned land. This requires
   sending build/purchase events to the server and updating the
   world state when confirmed.

5. **Marketplace integration:** Replace the hardcoded items in
   `Marketplace.jsx` with data fetched from the server. Display
   real supply, prices and rarity. Handle pending purchases and
   errors gracefully.

6. **Profile and inventory UI:** Enhance the profile page to show
   detailed information about owned properties, NFT characters and
   token balances. Integrate wallet authentication so players can
   view and manage their Hedera accounts.

7. **PvP arena visuals:** Build a dedicated 3D arena scene for
   battles. Visualize fights in real time by animating characters
   according to server updates. Add a spectator camera for watchers.

8. **Sound and notifications:** Incorporate ambient music and sound
   effects using Web Audio API or an audio library. Provide in‑app
   notifications for events such as incoming challenges, completed
   purchases and rewards.

9. **Responsive design:** Refine Tailwind layouts to work well on
   various screen sizes. Implement a mobile UI with accessible
   controls.

## 2. Back‑end Enhancements

1. **Hedera integration:** Choose a Rust SDK for Hedera (e.g.,
   [`hedera-sdk-rust`](https://github.com/hashgraph/hedera-sdk-rust)).
   Implement helper functions to mint NFTs for buildings, land and
   characters, transfer tokens, and query balances. Securely manage
   operator keys and use testnet for initial development.

2. **Persistent storage:** Replace the in‑memory `HashMap` with a
   database (e.g., PostgreSQL or SQLite) to persist player data,
   properties and marketplace inventory across restarts. Use an ORM
   such as `sqlx` for asynchronous database queries.

3. **Authentication and accounts:** Implement account creation and
   login using Hedera accounts or OAuth. Associate each WebSocket
   session with a specific user and enforce access control on
   purchases and challenges.

4. **Marketplace logic:** Maintain an authoritative marketplace in
   the back end. Enforce item supply, pricing and rarity. Validate
   purchases and update inventories and token balances atomically.

5. **PvP mechanics:** Design battle rules, damage calculation and
   win/loss conditions. When a challenge is accepted, create a
   dedicated battle session that broadcasts combat events to both
   participants and any spectators. Resolve the result by updating
   player inventories and token balances.

6. **State synchronization:** Implement efficient diff‑based world
   updates to minimize bandwidth. Broadcast only the changed
   properties (e.g., building placement, player movement) to all
   clients. Consider using a binary serialization format like
   MessagePack for compactness.

7. **Security and cheating prevention:** Enforce server‑side checks
   for all client actions (e.g., movement bounds, combat actions).
   Sign critical game messages with Hedera transactions when
   appropriate. Apply rate limiting to mitigate spam.

8. **Testing:** Write unit tests for core logic (marketplace,
   Hedera integration, battle resolution). Implement integration
   tests that simulate multiple clients interacting with the server.

9. **Deployment:** Containerize the front end and back end using
   Docker. Configure environment variables for Hedera credentials and
   database connections. Deploy to a cloud provider with SSL/TLS.

## 3. Project Management

1. **Version control:** Use Git to track changes. Commit early and
   often with descriptive messages.

2. **Issue tracking:** Break the high‑level tasks above into
   manageable issues in your project management tool of choice.

3. **Code quality:** Configure ESLint and Prettier in the front end
   and `rustfmt`/`clippy` in the back end to enforce a consistent
   style and catch common mistakes.

4. **Continuous integration:** Set up a CI pipeline (e.g., GitHub
   Actions) to lint, test and build both the front end and back end
   on every push.

Following this roadmap will gradually transform the current scaffold
into a complete, performant and secure multiplayer experience.