// src/components/SaveManager.js
import React, { useState, useEffect } from 'react';
import { 
  saveGame, 
  loadGame, 
  hasSaveData, 
  deleteSaveData, 
  getSaveInfo, 
  exportSaveData, 
  importSaveData 
} from '../services/SaveSystem';
import './SaveManager.css';

const SaveManager = ({ gameData, onLoadGame, isOpen, onClose }) => {
  const [saveInfo, setSaveInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const info = getSaveInfo();
      setSaveInfo(info);
    }
  }, [isOpen]);

  const handleSave = async () => {
    setIsLoading(true);
    setMessage('');
    
    const result = await saveGame(gameData);
    setMessage(result.message);
    
    if (result.success) {
      setSaveInfo(getSaveInfo());
    }
    
    setIsLoading(false);
  };

  const handleLoad = async () => {
    setIsLoading(true);
    setMessage('');
    
    const result = await loadGame();
    setMessage(result.message);
    
    if (result.success) {
      onLoadGame(result.data);
      onClose();
    }
    
    setIsLoading(false);
  };

  const handleDelete = async () => {
    setIsLoading(true);
    setMessage('');
    
    const result = await deleteSaveData();
    setMessage(result.message);
    
    if (result.success) {
      setSaveInfo(null);
      setShowConfirmDelete(false);
    }
    
    setIsLoading(false);
  };

  const handleExport = async () => {
    setIsLoading(true);
    setMessage('');
    
    const result = await exportSaveData();
    setMessage(result.message);
    
    setIsLoading(false);
  };

  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsLoading(true);
    setMessage('');
    
    const result = await importSaveData(file);
    setMessage(result.message);
    
    if (result.success) {
      setSaveInfo(getSaveInfo());
      setShowImportDialog(false);
    }
    
    setIsLoading(false);
    
    // Reset file input
    event.target.value = '';
  };

  const formatPlayTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (!isOpen) return null;

  return (
    <div className="save-manager-overlay" onClick={onClose}>
      <div className="save-manager-modal" onClick={(e) => e.stopPropagation()}>
        <div className="save-manager-header">
          <h2>Save & Load</h2>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>

        <div className="save-manager-content">
          {message && (
            <div className={`message ${message.includes('successfully') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}

          <div className="save-section">
            <h3>Save Game</h3>
            <button 
              className="save-button"
              onClick={handleSave}
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Game'}
            </button>
          </div>

          <div className="load-section">
            <h3>Load Game</h3>
            {saveInfo ? (
              <div className="save-info">
                <div className="save-details">
                  <span className="save-label">Last Played:</span>
                  <span className="save-value">{saveInfo.lastPlayed}</span>
                </div>
                <div className="save-details">
                  <span className="save-label">Play Time:</span>
                  <span className="save-value">{formatPlayTime(saveInfo.totalPlayTime)}</span>
                </div>
                <div className="save-details">
                  <span className="save-label">Version:</span>
                  <span className="save-value">v{saveInfo.version}</span>
                </div>
                
                <div className="load-actions">
                  <button 
                    className="load-button"
                    onClick={handleLoad}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Loading...' : 'Load Game'}
                  </button>
                  <button 
                    className="delete-button"
                    onClick={() => setShowConfirmDelete(true)}
                    disabled={isLoading}
                  >
                    Delete Save
                  </button>
                </div>
              </div>
            ) : (
              <div className="no-save">
                <p>No save data found</p>
              </div>
            )}
          </div>

          <div className="backup-section">
            <h3>Backup & Restore</h3>
            <div className="backup-actions">
              <button 
                className="export-button"
                onClick={handleExport}
                disabled={isLoading || !saveInfo}
              >
                Export Save
              </button>
              <button 
                className="import-button"
                onClick={() => setShowImportDialog(true)}
                disabled={isLoading}
              >
                Import Save
              </button>
            </div>
          </div>
        </div>

        {/* Import Dialog */}
        {showImportDialog && (
          <div className="import-dialog">
            <div className="import-content">
              <h4>Import Save File</h4>
              <p>Select a save file to import:</p>
              <input 
                type="file" 
                accept=".json"
                onChange={handleImport}
                className="file-input"
              />
              <div className="import-actions">
                <button 
                  className="cancel-button"
                  onClick={() => setShowImportDialog(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation */}
        {showConfirmDelete && (
          <div className="confirm-dialog">
            <div className="confirm-content">
              <h4>Delete Save Data?</h4>
              <p>This action cannot be undone. Are you sure you want to delete your save data?</p>
              <div className="confirm-actions">
                <button 
                  className="cancel-button"
                  onClick={() => setShowConfirmDelete(false)}
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button 
                  className="delete-confirm-button"
                  onClick={handleDelete}
                  disabled={isLoading}
                >
                  {isLoading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SaveManager; 