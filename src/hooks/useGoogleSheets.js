import { useState, useEffect } from 'react';
import { createGoogleSheetsClient, createOAuthOnlySheetsClient } from '../services/googleSheetsApi';
import { GOOGLE_OAUTH_CLIENT_ID } from '../config/googleAuth';

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
  const [useOAuthOnly, setUseOAuthOnly] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('appsScriptSettings');

    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setGoogleApiKey(settings.googleApiKey || '');
      setGoogleSheetId(settings.googleSheetId || '');
      setGoogleClientId(settings.googleClientId || '');
      setUseOAuthOnly(settings.useOAuthOnly || false);
      // Connected if either API key + sheet ID, or OAuth-only mode with sheet ID
      setIsConnected(!!(settings.googleSheetId && (settings.googleApiKey || settings.useOAuthOnly)));
      setLastSyncTime(settings.lastSync ? new Date(settings.lastSync) : null);

      // Create sheets client if we have credentials
      if (settings.googleSheetId && (settings.googleApiKey || settings.useOAuthOnly)) {
        // Use hard-coded OAuth Client ID if none saved
        const finalClientId = settings.googleClientId || GOOGLE_OAUTH_CLIENT_ID;
        
        const client = settings.useOAuthOnly 
          ? createOAuthOnlySheetsClient(settings.googleSheetId, finalClientId)
          : createGoogleSheetsClient(settings.googleApiKey, settings.googleSheetId, finalClientId);
          
        setSheetsClient(client);
        
        // Update the state with the final client ID
        if (!settings.googleClientId) {
          setGoogleClientId(GOOGLE_OAUTH_CLIENT_ID);
        }
      }
    }
  }, []);

  const connectToGoogleSheets = (apiKey = null, sheetId, clientId = null, oauthOnly = false) => {
    setGoogleApiKey(apiKey);
    setGoogleSheetId(sheetId);
    setUseOAuthOnly(oauthOnly);
    // Use hard-coded OAuth Client ID if none provided
    const finalClientId = clientId || GOOGLE_OAUTH_CLIENT_ID;
    setGoogleClientId(finalClientId);
    setIsConnected(true);

    // Create appropriate client type
    const client = oauthOnly 
      ? createOAuthOnlySheetsClient(sheetId, finalClientId)
      : createGoogleSheetsClient(apiKey, sheetId, finalClientId);
    setSheetsClient(client);

    // Save settings
    const settings = {
      googleApiKey: apiKey,
      googleSheetId: sheetId,
      googleClientId: finalClientId,
      useOAuthOnly: oauthOnly,
      lastSync: lastSyncTime?.toISOString()
    };
    localStorage.setItem('appsScriptSettings', JSON.stringify(settings));

    setSyncStatus('offline');
  };

  const disconnectGoogleSheets = () => {
    setGoogleApiKey('');
    setGoogleSheetId('');
    setGoogleClientId('');
    setUseOAuthOnly(false);
    setIsConnected(false);
    setIsOAuthAuthenticated(false);
    setLastSyncTime(null);
    setSyncStatus('offline');
    setSheetsClient(null);
    localStorage.removeItem('appsScriptSettings');
    localStorage.removeItem('vocabularySyncHash'); // Clean up sync hash
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

        // Store vocabulary hash for future comparison
        const vocabularyHash = generateVocabularyHash(vocabulary);
        storeSyncHash(vocabularyHash);

        // Update saved settings
        const settings = {
          googleApiKey: googleApiKey,
          googleSheetId: googleSheetId,
          googleClientId: googleClientId,
          useOAuthOnly: useOAuthOnly,
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

        // Store vocabulary hash for CSV export (since it's exported but not directly synced)
        const vocabularyHash = generateVocabularyHash(vocabulary);
        storeSyncHash(vocabularyHash);
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

          // Store vocabulary hash after loading from sheets
          const vocabularyHash = generateVocabularyHash(result.vocabulary);
          storeSyncHash(vocabularyHash);
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

  // Generate a hash from vocabulary data for comparison
  const generateVocabularyHash = (vocabulary) => {
    if (!vocabulary || vocabulary.length === 0) return '';

    // Normalize vocabulary data for consistent hashing
    const normalizedData = vocabulary
      .map(word => ({
        id: word.id,
        kanji: word.kanji || '',
        reading: word.reading || '',
        meaning: word.meaning || '',
        status: word.status || '',
        addedDate: word.addedDate || '',
        examples: (word.examples || []).sort() // Sort examples for consistency
      }))
      .sort((a, b) => a.id - b.id); // Sort by ID for consistency

    // Simple hash function (djb2 algorithm)
    const str = JSON.stringify(normalizedData);
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash) + str.charCodeAt(i);
    }
    return hash.toString();
  };

  // Get stored sync hash
  const getStoredSyncHash = () => {
    try {
      const stored = localStorage.getItem('vocabularySyncHash');
      return stored || '';
    } catch (error) {
      console.error('Failed to get sync hash:', error);
      return '';
    }
  };

  // Store sync hash
  const storeSyncHash = (hash) => {
    try {
      localStorage.setItem('vocabularySyncHash', hash);
    } catch (error) {
      console.error('Failed to store sync hash:', error);
    }
  };

  // Update sync status when vocabulary changes
  const updateSyncStatus = (currentVocabulary) => {
    if (!isConnected || !lastSyncTime) {
      setSyncStatus('offline');
      return;
    }

    // If already pending, no need to check hash again
    if (syncStatus === 'pending') {
      return;
    }

    // Generate hash of current vocabulary
    const currentHash = generateVocabularyHash(currentVocabulary);
    const storedHash = getStoredSyncHash();

    // Compare hashes to determine sync status
    if (currentHash === storedHash && storedHash !== '') {
      setSyncStatus('synced');
    } else {
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