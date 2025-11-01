import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './App.css';
import AppCard from './components/AppCard';
import ToastContainer from './components/ToastContainer';

// Connect to WebSocket server
const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:3001');

function App() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('');
  const [showRunningOnly, setShowRunningOnly] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [darkMode, setDarkMode] = useState(() => {
    // Initialize from localStorage or default to false
    const saved = localStorage.getItem('darkMode');
    return saved === 'true';
  });

  // Apply dark mode class to body
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  useEffect(() => {
    loadApps();

    // Listen for WebSocket status updates (real-time)
    socket.on('app:status', (data) => {
      console.log('WebSocket update:', data);
      setApps(prevApps =>
        prevApps.map(app =>
          app.id === data.appId
            ? { ...app, status: data.status }
            : app
        )
      );
    });

    // Cleanup on unmount
    return () => {
      socket.off('app:status');
    };
  }, []);

  const loadApps = async () => {
    try {
      const response = await fetch('/api/apps');
      if (!response.ok) throw new Error('Failed to load applications');
      const data = await response.json();
      setApps(data.apps);
      setError(null);
    } catch (err) {
      setError(err.message);
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Toast management functions
  const showToast = (message, type = 'info', duration = 3000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type, duration }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const handleStart = async (appId) => {
    try {
      const app = apps.find(a => a.id === appId);
      showToast(`Starting ${app?.name || appId}...`, 'info');

      const response = await fetch(`/api/apps/${appId}/start`, {
        method: 'POST'
      });

      if (!response.ok) throw new Error('Failed to start application');

      const data = await response.json();

      // Update app status immediately
      await loadApps();

      showToast(`${app?.name || appId} started successfully!`, 'success');

      // Redirect after a short delay
      if (data.url) {
        setTimeout(() => {
          window.open(data.url, '_blank');
        }, 2000);
      }

      return data;
    } catch (err) {
      showToast(err.message, 'error');
      throw err;
    }
  };

  const handleStop = async (appId) => {
    try {
      const app = apps.find(a => a.id === appId);
      showToast(`Stopping ${app?.name || appId}...`, 'info');

      const response = await fetch(`/api/apps/${appId}/stop`, {
        method: 'POST'
      });

      if (!response.ok) throw new Error('Failed to stop application');

      // Update app status immediately
      await loadApps();

      showToast(`${app?.name || appId} stopped successfully!`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
      throw err;
    }
  };

  const filteredApps = apps.filter(app => {
    // Text search filter
    const matchesSearch = app.name.toLowerCase().includes(filter.toLowerCase()) ||
      app.description.toLowerCase().includes(filter.toLowerCase()) ||
      (app.tags && app.tags.some(tag => tag.toLowerCase().includes(filter.toLowerCase())));

    // Running status filter
    const matchesRunningFilter = !showRunningOnly || app.status === 'running';

    return matchesSearch && matchesRunningFilter;
  });

  // Group apps by category
  const appsByCategory = filteredApps.reduce((acc, app) => {
    const category = app.category || 'uncategorized';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(app);
    return acc;
  }, {});

  // Sort categories alphabetically
  const sortedCategories = Object.keys(appsByCategory).sort();

  // Format category name for display
  const formatCategoryName = (category) => {
    return category
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (loading && apps.length === 0) {
    return (
      <div className="App">
        <div className="loading">Loading applications...</div>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="App-header">
        <button
          className="dark-mode-toggle"
          onClick={() => setDarkMode(!darkMode)}
          title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {darkMode ? '☀️' : '🌙'}
        </button>
        <h1>🚢 Hamnen</h1>
        <p>Docker Application Launcher</p>
      </header>

      <div className="controls">
        <input
          type="text"
          placeholder="Search applications..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="search-input"
        />
        <label className="checkbox-filter">
          <input
            type="checkbox"
            checked={showRunningOnly}
            onChange={(e) => setShowRunningOnly(e.target.checked)}
          />
          <span>Running applications only</span>
        </label>
      </div>

      {error && (
        <div className="error-banner">
          Error: {error}
        </div>
      )}

      <div className="apps-container">
        {filteredApps.length === 0 ? (
          <div className="no-apps">
            <p>No applications found.</p>
            <p>Add applications to the <code>apps/</code> directory.</p>
          </div>
        ) : (
          sortedCategories.map(category => (
            <div key={category} className="category-section">
              <h2 className="category-header">
                {formatCategoryName(category)}
                <span className="category-count">({appsByCategory[category].length})</span>
              </h2>
              <div className="apps-grid">
                {appsByCategory[category].map(app => (
                  <AppCard
                    key={app.id}
                    app={app}
                    onStart={handleStart}
                    onStop={handleStop}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}

export default App;
