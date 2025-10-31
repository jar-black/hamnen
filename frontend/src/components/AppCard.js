import React, { useState } from 'react';
import './AppCard.css';

function AppCard({ app, onStart, onStop }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const handleStart = async () => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await onStart(app.id);
      setSuccessMessage('Application started! Opening in new tab...');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await onStop(app.id);
      setSuccessMessage('Application stopped');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusClass = () => {
    if (loading) return 'starting';
    return app.status || 'stopped';
  };

  const getStatusText = () => {
    if (loading) return 'Loading...';
    switch (app.status) {
      case 'running':
        return 'Running';
      case 'partial':
        return 'Partial';
      case 'stopped':
        return 'Stopped';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className={`app-card ${getStatusClass()}`}>
      <div className="app-card-header">
        <div className="app-icon">{app.icon || '📦'}</div>
        <div className="app-status-badge">{getStatusText()}</div>
      </div>

      <div className="app-card-body">
        <h3>{app.name}</h3>
        <p>{app.description}</p>

        {app.tags && app.tags.length > 0 && (
          <div className="app-tags">
            {app.tags.map(tag => (
              <span key={tag} className="tag">{tag}</span>
            ))}
          </div>
        )}

        {app.port && (
          <div className="app-info">
            <span className="info-label">Port:</span>
            <span className="info-value">{app.port}</span>
          </div>
        )}

        {successMessage && (
          <div className="message success">{successMessage}</div>
        )}

        {error && (
          <div className="message error">{error}</div>
        )}
      </div>

      <div className="app-card-footer">
        {app.status === 'running' ? (
          <>
            <button
              className="btn btn-secondary"
              onClick={handleStop}
              disabled={loading}
            >
              Stop
            </button>
            <button
              className="btn btn-primary"
              onClick={() => window.open(`http://localhost:${app.port}${app.path || '/'}`, '_blank')}
              disabled={loading}
            >
              Open
            </button>
          </>
        ) : (
          <button
            className="btn btn-primary btn-full"
            onClick={handleStart}
            disabled={loading}
          >
            {loading ? 'Starting...' : 'Launch'}
          </button>
        )}
      </div>
    </div>
  );
}

export default AppCard;
