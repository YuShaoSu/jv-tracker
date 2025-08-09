import React, { useState, useEffect } from 'react';
import { Plus, BookOpen, Brain, Eye, RotateCcw, TrendingUp, X, Settings, Cloud, CloudOff, Download, RefreshCw, Shield, Unlock } from 'lucide-react';
import { createGoogleSheetsClient } from '../services/googleSheetsApi';
import { exampleGenerator } from '../services/exampleGenerator';

const JapaneseVocabTracker = () => {
  const [vocabulary, setVocabulary] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedWord, setSelectedWord] = useState(null);
  const [showExampleSentence, setShowExampleSentence] = useState(false);
  const [generatedSentence, setGeneratedSentence] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Google Sheets API integration state
  const [googleApiKey, setGoogleApiKey] = useState('');
  const [googleSheetId, setGoogleSheetId] = useState('');
  const [googleClientId, setGoogleClientId] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isOAuthAuthenticated, setIsOAuthAuthenticated] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState('offline'); // 'offline', 'synced', 'pending'
  const [sheetsClient, setSheetsClient] = useState(null);
  
  // AI Example Generation state
  const [geminiApiKey, setGeminiApiKey] = useState('');

  // Sample initial data
  useEffect(() => {
    const sampleData = [
      {
        id: 1,
        kanji: '勉強',
        reading: 'べんきょう',
        meaning: 'study, learning',
        status: 'learning',
        addedDate: new Date().toISOString(),
        examples: [] // Cached examples
      },
      {
        id: 2,
        kanji: '学校',
        reading: 'がっこう',
        meaning: 'school',
        status: 'know_well',
        addedDate: new Date().toISOString(),
        examples: []
      }
    ];

    // Try to load from localStorage first
    const savedVocabulary = localStorage.getItem('japaneseVocabulary');
    const savedSettings = localStorage.getItem('appsScriptSettings');

    if (savedVocabulary) {
      setVocabulary(JSON.parse(savedVocabulary));
    } else {
      setVocabulary(sampleData);
    }

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
      
      // Configure example generator with Gemini API key
      setGeminiApiKey(settings.geminiApiKey || '');
      if (settings.geminiApiKey) {
        exampleGenerator.setGeminiApiKey(settings.geminiApiKey);
      }
    }
  }, []);

  // Save to localStorage whenever vocabulary changes
  useEffect(() => {
    localStorage.setItem('japaneseVocabulary', JSON.stringify(vocabulary));
    if (lastSyncTime && vocabulary.length > 0) {
      setSyncStatus('pending');
    }
  }, [vocabulary, lastSyncTime]);

  const [newWord, setNewWord] = useState({
    kanji: '',
    reading: '',
    meaning: ''
  });

  const statusColors = {
    'often_forget': 'bg-red-100 text-red-800 border-red-200',
    'learning': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'know_well': 'bg-green-100 text-green-800 border-green-200'
  };

  const statusLabels = {
    'often_forget': 'Often Forget',
    'learning': 'Learning',
    'know_well': 'Know Well'
  };

  // Google Sheets API functions
  const connectToGoogleSheets = (apiKey, sheetId, clientId, geminiKey = '') => {
    setGoogleApiKey(apiKey);
    setGoogleSheetId(sheetId);
    setGoogleClientId(clientId);
    setGeminiApiKey(geminiKey);
    setIsConnected(true);

    // Create sheets client
    const client = createGoogleSheetsClient(apiKey, sheetId, clientId);
    setSheetsClient(client);

    // Configure example generator with Gemini API key
    if (geminiKey) {
      exampleGenerator.setGeminiApiKey(geminiKey);
    }

    // Save settings
    const settings = {
      googleApiKey: apiKey,
      googleSheetId: sheetId,
      googleClientId: clientId,
      geminiApiKey: geminiKey,
      lastSync: lastSyncTime?.toISOString()
    };
    localStorage.setItem('appsScriptSettings', JSON.stringify(settings));

    setSyncStatus('offline');
    setShowSettings(false);
  };

  const disconnectGoogleSheets = () => {
    setGoogleApiKey('');
    setGoogleSheetId('');
    setGoogleClientId('');
    setGeminiApiKey('');
    setIsConnected(false);
    setIsOAuthAuthenticated(false);
    setLastSyncTime(null);
    setSyncStatus('offline');
    setSheetsClient(null);
    exampleGenerator.setGeminiApiKey(null); // Clear API key from generator
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

  const syncToGoogleSheets = async () => {
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

  const loadFromGoogleSheets = async () => {
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

  const handleGenerateExample = async (word) => {
    // Check if we already have cached examples
    if (word.examples && word.examples.length > 0) {
      const randomExample = word.examples[Math.floor(Math.random() * word.examples.length)];
      setGeneratedSentence(randomExample);
      return;
    }

    setIsGenerating(true);
    try {
      // Use the ExampleGenerator service
      const result = await exampleGenerator.generateExample(word, {
        useAI: !!geminiApiKey, // Enable AI only if API key is configured
        simulateDelay: true
      });

      if (result.success) {
        setGeneratedSentence(result.example);

        // Cache the example sentence
        const updatedVocabulary = vocabulary.map(w => {
          if (w.id === word.id) {
            const updatedExamples = [...(w.examples || []), result.example];
            return { ...w, examples: updatedExamples };
          }
          return w;
        });
        setVocabulary(updatedVocabulary);
      } else {
        setGeneratedSentence('Sorry, could not generate example sentence at this time.');
      }
    } catch (error) {
      setGeneratedSentence('Sorry, could not generate example sentence at this time.');
      console.error('Example generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const addWord = () => {
    if (newWord.kanji && newWord.reading && newWord.meaning) {
      const word = {
        id: Date.now(),
        ...newWord,
        status: 'learning',
        addedDate: new Date().toISOString(),
        examples: []
      };
      setVocabulary([...vocabulary, word]);
      setNewWord({ kanji: '', reading: '', meaning: '' });
      setShowAddForm(false);
    }
  };

  const updateWordStatus = (id, status) => {
    setVocabulary(vocabulary.map(word =>
      word.id === id ? { ...word, status } : word
    ));
  };

  const deleteWord = (id) => {
    setVocabulary(vocabulary.filter(word => word.id !== id));
  };

  const getStatusCounts = () => {
    return vocabulary.reduce((acc, word) => {
      acc[word.status] = (acc[word.status] || 0) + 1;
      return acc;
    }, {});
  };

  const statusCounts = getStatusCounts();

  const getSyncStatusColor = () => {
    switch (syncStatus) {
      case 'synced': return 'text-green-600';
      case 'pending': return 'text-yellow-600';
      default: return 'text-gray-400';
    }
  };

  const getSyncStatusIcon = () => {
    switch (syncStatus) {
      case 'synced': return <Cloud size={16} />;
      case 'pending': return <CloudOff size={16} />;
      default: return <CloudOff size={16} />;
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

  const WordCard = ({ word }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 min-w-0">
          <div className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 break-words" style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>
            {word.kanji}
          </div>
          <div className="text-base sm:text-lg text-gray-600 mb-2 break-words" style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>
            {word.reading}
          </div>
          <div className="text-sm sm:text-base text-gray-700 mb-3 break-words">
            {word.meaning}
          </div>
          {word.examples && word.examples.length > 0 && (
            <div className="text-xs text-blue-600 mb-2">
              {word.examples.length} cached example{word.examples.length > 1 ? 's' : ''}
            </div>
          )}
        </div>
        <button
          onClick={() => deleteWord(word.id)}
          className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0 ml-2"
        >
          <X size={16} className="sm:w-[18px] sm:h-[18px]" />
        </button>
      </div>

      <div className={`inline-block px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium border mb-3 ${statusColors[word.status]}`}>
        {statusLabels[word.status]}
      </div>

      <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 mb-3">
        <button
          onClick={() => updateWordStatus(word.id, 'often_forget')}
          className="flex-1 py-1.5 sm:py-2 px-2 sm:px-3 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors text-xs sm:text-sm"
        >
          Often Forget
        </button>
        <button
          onClick={() => updateWordStatus(word.id, 'learning')}
          className="flex-1 py-1.5 sm:py-2 px-2 sm:px-3 bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200 transition-colors text-xs sm:text-sm"
        >
          Learning
        </button>
        <button
          onClick={() => updateWordStatus(word.id, 'know_well')}
          className="flex-1 py-1.5 sm:py-2 px-2 sm:px-3 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors text-xs sm:text-sm"
        >
          Know Well
        </button>
      </div>

      <button
        onClick={() => {
          setSelectedWord(word);
          setShowExampleSentence(true);
          handleGenerateExample(word);
        }}
        className="w-full py-2 px-3 sm:px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
      >
        <Eye size={14} className="sm:w-4 sm:h-4" />
        {word.examples && word.examples.length > 0 ? 'Show Example' : 'Generate Example'}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Japanese Vocabulary Tracker</h1>
              <p className="text-gray-600 text-sm sm:text-base">Track your learning progress and master Japanese vocabulary</p>
            </div>
            <div className="flex items-center gap-2 ml-4">
              {/* Sync Status */}
              <div className={`flex items-center gap-1 text-sm ${getSyncStatusColor()}`}>
                {getSyncStatusIcon()}
                <span className="hidden sm:inline">{formatLastSync()}</span>
              </div>

              {/* Sync Button */}
              {isConnected && googleApiKey && googleSheetId && (
                <button
                  onClick={syncToGoogleSheets}
                  disabled={isSyncing}
                  className={`flex items-center gap-1 px-2 sm:px-3 py-1 rounded-md transition-colors disabled:opacity-50 text-sm ${isOAuthAuthenticated
                      ? 'bg-green-500 text-white hover:bg-green-600'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                >
                  {isOAuthAuthenticated ? (
                    <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
                  ) : (
                    <Download size={14} className={isSyncing ? 'animate-spin' : ''} />
                  )}
                  <span className="hidden sm:inline">
                    {isSyncing
                      ? 'Syncing...'
                      : isOAuthAuthenticated
                        ? 'Sync'
                        : 'Export'
                    }
                  </span>
                </button>
              )}

              {/* Auth Button */}
              {isConnected && googleClientId && !isOAuthAuthenticated && (
                <button
                  onClick={authenticateForWriteAccess}
                  disabled={isSyncing}
                  className="flex items-center gap-1 px-2 sm:px-3 py-1 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors disabled:opacity-50 text-sm"
                >
                  <Shield size={14} className={isSyncing ? 'animate-spin' : ''} />
                  <span className="hidden sm:inline">{isSyncing ? 'Auth...' : 'Auth'}</span>
                </button>
              )}

              {/* Settings Button */}
              <button
                onClick={() => setShowSettings(true)}
                className="p-1 sm:p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Settings size={18} className="sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="bg-white rounded-lg shadow-sm mb-4 sm:mb-6">
          <div className="flex border-b overflow-x-auto">
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-3 sm:py-4 font-medium whitespace-nowrap text-sm sm:text-base ${currentView === 'dashboard'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              <TrendingUp size={18} className="sm:w-5 sm:h-5" />
              Dashboard
            </button>
            <button
              onClick={() => setCurrentView('vocabulary')}
              className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-3 sm:py-4 font-medium whitespace-nowrap text-sm sm:text-base ${currentView === 'vocabulary'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              <BookOpen size={18} className="sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Vocabulary</span>
              <span className="sm:hidden">Words</span>
              <span>({vocabulary.length})</span>
            </button>
            <button
              onClick={() => setCurrentView('review')}
              className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-3 sm:py-4 font-medium whitespace-nowrap text-sm sm:text-base ${currentView === 'review'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              <RotateCcw size={18} className="sm:w-5 sm:h-5" />
              Review ({statusCounts.often_forget || 0})
            </button>
          </div>
        </div>

        {/* Dashboard View */}
        {currentView === 'dashboard' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 sm:p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-500 rounded-full flex items-center justify-center">
                    <Brain size={16} className="text-white sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <div className="text-xl sm:text-2xl font-bold text-green-700">
                      {statusCounts.know_well || 0}
                    </div>
                    <div className="text-green-600 text-xs sm:text-sm">Know Well</div>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 sm:p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-yellow-500 rounded-full flex items-center justify-center">
                    <BookOpen size={16} className="text-white sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <div className="text-xl sm:text-2xl font-bold text-yellow-700">
                      {statusCounts.learning || 0}
                    </div>
                    <div className="text-yellow-600 text-xs sm:text-sm">Learning</div>
                  </div>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-500 rounded-full flex items-center justify-center">
                    <RotateCcw size={16} className="text-white sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <div className="text-xl sm:text-2xl font-bold text-red-700">
                      {statusCounts.often_forget || 0}
                    </div>
                    <div className="text-red-600 text-xs sm:text-sm">Need Review</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Words</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {vocabulary.slice(0, 6).map(word => (
                  <WordCard key={word.id} word={word} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Vocabulary View */}
        {currentView === 'vocabulary' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <h2 className="text-xl font-semibold text-gray-900">All Vocabulary</h2>
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-2 bg-blue-500 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm sm:text-base w-full sm:w-auto justify-center"
              >
                <Plus size={18} className="sm:w-5 sm:h-5" />
                Add Word
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
              {vocabulary.map(word => (
                <WordCard key={word.id} word={word} />
              ))}
            </div>
          </div>
        )}

        {/* Review View */}
        {currentView === 'review' && (
          <div className="space-y-4 sm:space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Words to Review</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
              {vocabulary.filter(word => word.status === 'often_forget').map(word => (
                <WordCard key={word.id} word={word} />
              ))}
              {vocabulary.filter(word => word.status === 'often_forget').length === 0 && (
                <div className="col-span-full text-center py-8 sm:py-12">
                  <div className="text-gray-400 text-base sm:text-lg">Great job! No words need review right now.</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50">
            <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md mx-3 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Settings</h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                {/* Google Sheets API Connection Section */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Google Sheets API</h4>
                  {!isConnected ? (
                    <div className="space-y-3">
                      <div className="text-sm text-gray-600 mb-2">
                        Step 1: Enter your Google Sheets API key:
                      </div>
                      <input
                        id="googleApiKey"
                        type="text"
                        placeholder="AIzaSyA... (Google API Key)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                      />

                      <div className="text-sm text-gray-600 mb-2">
                        Step 2: Enter your Google Sheet ID:
                      </div>
                      <input
                        id="googleSheetId"
                        type="text"
                        placeholder="1ABC123DEF456 (from your Google Sheet URL)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                      />

                      <div className="text-sm text-gray-600 mb-2">
                        Step 3: Enter OAuth Client ID (optional, for direct sync):
                      </div>
                      <input
                        id="googleClientId"
                        type="text"
                        placeholder="123456-abc.apps.googleusercontent.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                      />
                      <div className="text-xs text-gray-500 mb-3">
                        💡 Without Client ID: CSV export only. With Client ID: Direct sync to sheets.
                      </div>

                      <div className="text-sm text-gray-600 mb-2">
                        Step 4: Enter Gemini API key (optional, for AI example generation):
                      </div>
                      <input
                        id="geminiApiKey"
                        type="text"
                        placeholder="AIzaSyB... (Google AI Studio API Key)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                      />
                      <div className="text-xs text-gray-500 mb-3">
                        🤖 Enables AI-powered Japanese example sentence generation
                      </div>

                      <button
                        onClick={() => {
                          const apiKeyInput = document.getElementById('googleApiKey');
                          const sheetInput = document.getElementById('googleSheetId');
                          const clientInput = document.getElementById('googleClientId');
                          const geminiInput = document.getElementById('geminiApiKey');
                          if (apiKeyInput.value.trim() && sheetInput.value.trim()) {
                            connectToGoogleSheets(
                              apiKeyInput.value.trim(),
                              sheetInput.value.trim(),
                              clientInput.value.trim(),
                              geminiInput.value.trim()
                            );
                          } else {
                            alert('Please enter at least API key and Google Sheet ID');
                          }
                        }}
                        className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm"
                      >
                        Connect to Google Sheets
                      </button>

                      <div className="text-xs text-gray-500">
                        Need help? Check the setup instructions below.
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="p-3 bg-green-50 rounded-md">
                        <div className="font-medium text-sm text-green-900">
                          ✅ Connected to Google Sheets API
                        </div>
                        <div className="text-xs text-green-600 mt-1">
                          API Key: {googleApiKey.substring(0, 10)}...{googleApiKey.substring(googleApiKey.length - 4)}
                        </div>
                        <div className="text-xs text-green-600">
                          Sheet ID: {googleSheetId}
                        </div>
                        {googleClientId && (
                          <div className="text-xs text-green-600">
                            OAuth: {googleClientId.substring(0, 15)}...{googleClientId.substring(googleClientId.length - 15)}
                          </div>
                        )}
                        {geminiApiKey && (
                          <div className="text-xs text-purple-600">
                            🤖 Gemini AI: {geminiApiKey.substring(0, 10)}...{geminiApiKey.substring(geminiApiKey.length - 4)}
                          </div>
                        )}
                        {isOAuthAuthenticated && (
                          <div className="text-xs text-green-700 font-medium">
                            🔓 OAuth Authenticated - Direct sync enabled
                          </div>
                        )}
                        <div className="text-xs text-green-600 mt-1">
                          {formatLastSync()}
                        </div>
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={testConnection}
                            disabled={isSyncing}
                            className="text-xs text-green-600 hover:text-green-800 disabled:opacity-50"
                          >
                            {isSyncing ? 'Testing...' : 'Test Connection'}
                          </button>
                          <button
                            onClick={disconnectGoogleSheets}
                            className="text-xs text-red-600 hover:text-red-800"
                          >
                            Disconnect
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Sync Actions */}
                {isConnected && googleApiKey && googleSheetId && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Sync Actions</h4>
                    <div className="space-y-2">
                      {googleClientId && !isOAuthAuthenticated && (
                        <button
                          onClick={authenticateForWriteAccess}
                          disabled={isSyncing}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors disabled:opacity-50 text-sm"
                        >
                          <Unlock size={16} className={isSyncing ? 'animate-spin' : ''} />
                          {isSyncing ? 'Authenticating...' : 'Authenticate for Write Access'}
                        </button>
                      )}
                      <button
                        onClick={syncToGoogleSheets}
                        disabled={isSyncing}
                        className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-colors disabled:opacity-50 text-sm ${isOAuthAuthenticated
                            ? 'bg-green-500 text-white hover:bg-green-600'
                            : 'bg-blue-500 text-white hover:bg-blue-600'
                          }`}
                      >
                        {isOAuthAuthenticated ? (
                          <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
                        ) : (
                          <Download size={16} className={isSyncing ? 'animate-spin' : ''} />
                        )}
                        {isSyncing
                          ? (isOAuthAuthenticated ? 'Syncing to Sheet...' : 'Exporting CSV...')
                          : (isOAuthAuthenticated ? 'Sync to Google Sheet' : 'Export to CSV')
                        }
                      </button>
                      <button
                        onClick={loadFromGoogleSheets}
                        disabled={isSyncing}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 text-sm"
                      >
                        <Cloud size={16} className={isSyncing ? 'animate-spin' : ''} />
                        {isSyncing ? 'Loading...' : 'Load from Google Sheet'}
                      </button>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      {isOAuthAuthenticated
                        ? '🚀 Direct sync enabled! Changes save directly to Google Sheets.'
                        : googleClientId
                          ? '💡 Click "Authenticate" above for direct sync, or use CSV export.'
                          : '💡 Add OAuth Client ID for direct sync, or use CSV export.'}
                    </div>
                  </div>
                )}

                {/* Setup Instructions */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Setup Instructions</h4>
                  <div className="text-xs text-gray-600 space-y-3">
                    <div className="p-3 bg-blue-50 rounded-md">
                      <div className="font-medium mb-2 text-blue-900">Quick Setup Guide:</div>
                      <ol className="list-decimal list-inside space-y-1 text-blue-800 text-xs">
                        <li>Create a <a href="https://sheets.google.com" target="_blank" rel="noopener noreferrer" className="underline">new Google Sheet</a></li>
                        <li>Add a sheet tab named "VocabularyData"</li>
                        <li>Add headers in row 1: Kanji | Reading | Meaning | Status | Date Added | Examples | ID</li>
                        <li>Copy the Sheet ID from URL</li>
                        <li>Get API key from <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="underline">Google Cloud Console</a></li>
                        <li><strong>Optional:</strong> Create OAuth Client ID for direct sync</li>
                        <li>Enter credentials above</li>
                      </ol>
                    </div>

                    <div className="p-3 bg-green-50 rounded-md">
                      <div className="font-medium mb-2 text-green-900">🚀 Get API Key (Required):</div>
                      <ol className="list-decimal list-inside space-y-1 text-green-800 text-xs">
                        <li>Go to <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="underline">Google Cloud Console</a></li>
                        <li>Create project → APIs & Services → Library</li>
                        <li>Enable "Google Sheets API"</li>
                        <li>Credentials → "Create Credentials" → API Key</li>
                        <li>Copy the API key (starts with "AIza...")</li>
                      </ol>
                    </div>

                    <div className="p-3 bg-orange-50 rounded-md">
                      <div className="font-medium mb-2 text-orange-900">🔐 Get OAuth Client ID (Optional - for direct sync):</div>
                      <ol className="list-decimal list-inside space-y-1 text-orange-800 text-xs">
                        <li>Same project → Credentials → "Create Credentials" → OAuth client ID</li>
                        <li>Application type: Web application</li>
                        <li>Authorized JavaScript origins: <code className="bg-orange-200 px-1 rounded">https://jv-tracker.vercel.app</code></li>
                        <li>Copy Client ID (ends with ".apps.googleusercontent.com")</li>
                        <li>Without this: CSV export only. With this: Direct sync!</li>
                      </ol>
                    </div>

                    <div className="p-3 bg-purple-50 rounded-md">
                      <div className="font-medium mb-2 text-purple-900">🤖 Get Gemini API Key (Optional - for AI examples):</div>
                      <ol className="list-decimal list-inside space-y-1 text-purple-800 text-xs">
                        <li>Go to <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline">Google AI Studio</a></li>
                        <li>Sign in with your Google account</li>
                        <li>Click "Create API Key"</li>
                        <li>Copy the API key (starts with "AIzaSy...")</li>
                        <li>With this: AI generates contextual Japanese example sentences!</li>
                      </ol>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-md">
                      <div className="font-medium mb-1">How to get Google Sheet ID:</div>
                      <div className="text-xs">
                        From URL: <code className="bg-gray-200 px-1 rounded">https://docs.google.com/spreadsheets/d/<strong>1ABC123DEF456</strong>/edit</code>
                        <br />
                        Copy the bold part: <code className="bg-gray-200 px-1 rounded">1ABC123DEF456</code>
                      </div>
                    </div>

                    <div className="p-3 bg-yellow-50 rounded-md">
                      <div className="font-medium mb-1 text-yellow-800">🔒 Security Notes:</div>
                      <div className="text-xs text-yellow-700 space-y-1">
                        <div>• <strong>API Key:</strong> Only allows reading your sheets (safe to share)</div>
                        <div>• <strong>OAuth:</strong> You grant permission directly to Google (secure)</div>
                        <div>• <strong>Your data:</strong> Only you can access your vocabulary sheets</div>
                        <div>• <strong>This app:</strong> Runs in your browser, no server storage</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Word Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50">
            <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md mx-3">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Word</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kanji/Word
                  </label>
                  <input
                    type="text"
                    value={newWord.kanji}
                    onChange={(e) => setNewWord({ ...newWord, kanji: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                    placeholder="漢字"
                    style={{ fontFamily: 'Noto Sans JP, sans-serif' }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reading (Hiragana/Katakana)
                  </label>
                  <input
                    type="text"
                    value={newWord.reading}
                    onChange={(e) => setNewWord({ ...newWord, reading: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                    placeholder="かんじ"
                    style={{ fontFamily: 'Noto Sans JP, sans-serif' }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meaning (English)
                  </label>
                  <input
                    type="text"
                    value={newWord.meaning}
                    onChange={(e) => setNewWord({ ...newWord, meaning: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                    placeholder="Chinese character"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addWord}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  Add Word
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Example Sentence Modal */}
        {showExampleSentence && selectedWord && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50">
            <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-2xl mx-3 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 pr-2">
                  Example for: {selectedWord.kanji} ({selectedWord.reading})
                </h3>
                <button
                  onClick={() => {
                    setShowExampleSentence(false);
                    setSelectedWord(null);
                    setGeneratedSentence('');
                  }}
                  className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                >
                  <X size={20} className="sm:w-6 sm:h-6" />
                </button>
              </div>

              <div className="mb-4">
                <div className="text-gray-600 mb-2 text-sm sm:text-base">Meaning: {selectedWord.meaning}</div>
                {selectedWord.examples && selectedWord.examples.length > 0 && (
                  <div className="text-blue-600 text-sm">
                    {selectedWord.examples.length} cached example{selectedWord.examples.length > 1 ? 's' : ''} available
                  </div>
                )}
              </div>

              <div className="bg-gray-50 rounded-lg p-3 sm:p-4 min-h-24">
                {isGenerating ? (
                  <div className="flex items-center justify-center py-6 sm:py-8">
                    <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-500"></div>
                    <span className="ml-3 text-gray-600 text-sm sm:text-base">Generating example sentence...</span>
                  </div>
                ) : generatedSentence ? (
                  <div className="text-gray-800 whitespace-pre-wrap text-sm sm:text-base leading-relaxed" style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>
                    {generatedSentence}
                  </div>
                ) : (
                  <div className="text-gray-500 text-sm sm:text-base">
                    {selectedWord.examples && selectedWord.examples.length > 0
                      ? 'Click "Show Another Example" to see a different example.'
                      : 'Click "Generate New Example" to see an example sentence.'
                    }
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mt-4 sm:mt-6">
                <button
                  onClick={() => handleGenerateExample(selectedWord)}
                  disabled={isGenerating}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 text-sm sm:text-base"
                >
                  {selectedWord.examples && selectedWord.examples.length > 0
                    ? (isGenerating ? 'Generating...' : 'Generate New Example')
                    : (isGenerating ? 'Generating...' : 'Generate Example')
                  }
                </button>
                {selectedWord.examples && selectedWord.examples.length > 0 && (
                  <button
                    onClick={() => {
                      const randomExample = selectedWord.examples[Math.floor(Math.random() * selectedWord.examples.length)];
                      setGeneratedSentence(randomExample);
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm sm:text-base"
                  >
                    Show Another Example
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowExampleSentence(false);
                    setSelectedWord(null);
                    setGeneratedSentence('');
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm sm:text-base"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JapaneseVocabTracker;