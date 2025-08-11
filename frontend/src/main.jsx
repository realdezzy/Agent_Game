import React from 'react';
import ReactDOM from 'react-dom/client';

// Import Tailwind styles
import './index.css';

import App from './App.jsx';

// Create the root and render the app
const container = document.getElementById('root');
const root = ReactDOM.createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);