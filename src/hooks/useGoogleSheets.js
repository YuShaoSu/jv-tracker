import { useState, useEffect } from 'react';
import { createGoogleSheetsClient } from '../services/googleSheetsApi';

export const useGoogleSheets = () => {
  const [googleApiKey, setGoogleApiKey] = useState('');
  const [googleSheetId, setGoogleSheetId] = useState('');
  const [googleClientId, setGoogleClientId] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isOAuthAuthenticated, setIsOAuthAuthenticated] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState('offline');
  const [sheetsClient, setSheetsClient] = useState(null);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('appsScriptSettings');
    
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setGoogleApiKey(settings.googleApiKey || '');
      setGoogleSheetId(settings.googleSheetId || '');
      setGoogleClientId(settings.googleClientId || '');
      setIsConnected(!!(settings.googleApiKey && settings.googleSheetId));
      setLastSyncTime(settings.lastSync ? new Date(settings.lastSync) : null);

      // Create sheets client if we have credentials
      if (settings.googleApiKey && settings.googleSheetId) {
        const client = createGoogleSheetsClient(settings.googleApiKey, settings.googleSheetId, settings.googleClientId);
        setSheetsClient(client);
      }
    }
  }, []);

  const connectToGoogleSheets = (apiKey, sheetId, clientId) => {
    setGoogleApiKey(apiKey);
    setGoogleSheetId(sheetId);
    setGoogleClientId(clientId);
    setIsConnected(true);

    // Create sheets client
    const client = createGoogleSheetsClient(apiKey, sheetId, clientId);
    setSheetsClient(client);

    // Save settings
    const settings = {
      googleApiKey: apiKey,
      googleSheetId: sheetId,
      googleClientId: clientId,
      lastSync: lastSyncTime?.toISOString()
    };
    localStorage.setItem('appsScriptSettings', JSON.stringify(settings));

    setSyncStatus('offline');
  };

  const disconnectGoogleSheets = () => {
    setGoogleApiKey('');
    setGoogleSheetId('');
    setGoogleClientId('');
    setIsConnected(false);
    setIsOAuthAuthenticated(false);
    setLastSyncTime(null);
    setSyncStatus('offline');
    setSheetsClient(null);
    localStorage.removeItem('appsScriptSettings');
  };

  const testConnection = async () => {
    if (!sheetsClient) return;

    setIsSyncing(true);
    try {
      const result = await sheetsClient.testConnection();

      if (result.success) {
        alert(`✅ Connection successful!\n\nSpreadsheet: ${result.spreadsheetTitle}\nSheets: ${result.sheets.join(', ')}`);
        setSyncStatus('synced');
      } else {
        alert(`❌ Connection failed: ${result.message}`);
        setSyncStatus('offline');
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      alert('❌ Connection failed: ' + error.message);
      setSyncStatus('offline');
    } finally {
      setIsSyncing(false);
    }
  };

  const authenticateForWriteAccess = async () => {
    if (!sheetsClient || !googleClientId) {
      alert('⚠️ OAuth Client ID required for write access.\nPlease configure it in settings.');
      return;
    }

    setIsSyncing(true);
    try {
      const result = await sheetsClient.requestWritePermission();

      if (result.success) {
        setIsOAuthAuthenticated(true);
        setSyncStatus('synced');
        alert('✅ Authentication successful!\nYou can now sync directly to Google Sheets.');
      } else {
        alert(`❌ Authentication failed: ${result.message}`);
      }
    } catch (error) {
      console.error('OAuth failed:', error);
      alert('❌ Authentication failed: ' + error.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const syncToGoogleSheets = async (vocabulary) => {
    if (!sheetsClient || !isConnected) return;

    setIsSyncing(true);
    try {
      const result = await sheetsClient.saveVocabulary(vocabulary);

      if (result.success) {
        alert(`✅ Sync completed!\n${result.count} vocabulary items saved to Google Sheets.`);

        const now = new Date();
        setLastSyncTime(now);
        setSyncStatus('synced');

        // Update saved settings
        const settings = {
          googleApiKey: googleApiKey,
          googleSheetId: googleSheetId,
          googleClientId: googleClientId,
          lastSync: now.toISOString()
        };
        localStorage.setItem('appsScriptSettings', JSON.stringify(settings));
      } else if (result.requiresOAuth) {
        // Fallback to CSV download
        sheetsClient.downloadCsv(vocabulary);

        alert(`📥 CSV file downloaded!\n\nFor direct sync, click "Authenticate for Write Access" first.\n\nOr manually import:\n1. Open your Google Sheet\n2. File > Import > Upload CSV\n3. Choose "Replace spreadsheet"`);

        const now = new Date();
        setLastSyncTime(now);
        setSyncStatus('pending');
      } else if (result.requiresReauth) {
        setIsOAuthAuthenticated(false);
        alert(`🔐 Authentication expired.\nPlease click "Authenticate for Write Access" again.`);
      } else {
        alert(`❌ Sync failed: ${result.message}`);
        setSyncStatus('pending');
      }
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncStatus('pending');
      alert('❌ Sync failed: ' + error.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const loadFromGoogleSheets = async (setVocabulary) => {
    if (!sheetsClient || !isConnected) return;

    setIsSyncing(true);
    try {
      const result = await sheetsClient.loadVocabulary();

      if (result.success) {
        if (result.vocabulary.length > 0) {
          setVocabulary(result.vocabulary);
          alert(`✅ Loaded ${result.vocabulary.length} vocabulary items from Google Sheets!`);

          const now = new Date();
          setLastSyncTime(now);
          setSyncStatus('synced');
        } else {
          alert('📝 No vocabulary found in Google Sheets.\nMake sure you have data in the sheet or sync your local data first.');
        }
      } else {
        if (result.needsHeaders) {
          alert(`📋 Sheet setup required:\n\nPlease add these headers to row 1 of your "VocabularyData" sheet:\n\n${result.expectedHeaders.join(' | ')}\n\nThen try loading again.`);
        } else {
          alert(`❌ Load failed: ${result.message}`);
        }
      }
    } catch (error) {
      console.error('Load failed:', error);
      alert('❌ Load failed: ' + error.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const getSyncStatusColor = () => {
    switch (syncStatus) {
      case 'synced': return 'text-green-600';
      case 'pending': return 'text-yellow-600';
      default: return 'text-gray-400';
    }
  };

  const formatLastSync = () => {
    if (!lastSyncTime) return 'Never synced';
    const now = new Date();
    const diff = now - lastSyncTime;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  // Update sync status when vocabulary changes
  const updateSyncStatus = () => {
    if (lastSyncTime) {
      setSyncStatus('pending');
    }
  };

  return {
    googleApiKey,
    googleSheetId,
    googleClientId,
    isConnected,
    isOAuthAuthenticated,
    lastSyncTime,
    isSyncing,
    syncStatus,
    sheetsClient,
    connectToGoogleSheets,
    disconnectGoogleSheets,
    testConnection,
    authenticateForWriteAccess,
    syncToGoogleSheets,
    loadFromGoogleSheets,
    getSyncStatusColor,
    formatLastSync,
    updateSyncStatus
  };
};