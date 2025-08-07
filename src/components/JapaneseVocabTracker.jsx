import React, { useState, useEffect } from 'react';
import { Plus, BookOpen, Brain, Eye, RotateCcw, TrendingUp, X, Settings, Cloud, CloudOff, RefreshCw } from 'lucide-react';

const JapaneseVocabTracker = () => {
  const [vocabulary, setVocabulary] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedWord, setSelectedWord] = useState(null);
  const [showExampleSentence, setShowExampleSentence] = useState(false);
  const [generatedSentence, setGeneratedSentence] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Google Apps Script integration state
  const [appsScriptUrl, setAppsScriptUrl] = useState('');
  const [googleSheetId, setGoogleSheetId] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState('offline'); // 'offline', 'synced', 'pending'

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
      setAppsScriptUrl(settings.appsScriptUrl || '');
      setGoogleSheetId(settings.googleSheetId || '');
      setIsConnected(!!(settings.appsScriptUrl && settings.googleSheetId));
      setLastSyncTime(settings.lastSync ? new Date(settings.lastSync) : null);
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

  // Google Apps Script API functions
  const connectToAppsScript = (url, sheetId) => {
    setAppsScriptUrl(url);
    setGoogleSheetId(sheetId);
    setIsConnected(true);

    // Save settings
    const settings = {
      appsScriptUrl: url,
      googleSheetId: sheetId,
      lastSync: lastSyncTime?.toISOString()
    };
    localStorage.setItem('appsScriptSettings', JSON.stringify(settings));

    setSyncStatus('offline');
    setShowSettings(false);
  };

  const disconnectAppsScript = () => {
    setAppsScriptUrl('');
    setGoogleSheetId('');
    setIsConnected(false);
    setLastSyncTime(null);
    setSyncStatus('offline');
    localStorage.removeItem('appsScriptSettings');
  };

  const testConnection = async () => {
    if (!appsScriptUrl || !googleSheetId) return;

    setIsSyncing(true);
    try {
      // Use JSONP to avoid CORS
      const callbackName = 'callback_' + Date.now();
      const url = `${appsScriptUrl}?action=testConnection&sheetId=${encodeURIComponent(googleSheetId)}&callback=${callbackName}`;

      const result = await new Promise((resolve, reject) => {
        // Create callback function
        window[callbackName] = (data) => {
          delete window[callbackName];
          document.head.removeChild(script);
          resolve(data);
        };

        // Create script tag for JSONP
        const script = document.createElement('script');
        script.src = url;
        script.onerror = () => {
          delete window[callbackName];
          document.head.removeChild(script);
          reject(new Error('JSONP request failed'));
        };

        document.head.appendChild(script);

        // Timeout after 10 seconds
        setTimeout(() => {
          if (window[callbackName]) {
            delete window[callbackName];
            document.head.removeChild(script);
            reject(new Error('Request timeout'));
          }
        }, 10000);
      });

      if (result.success) {
        alert(`✅ Connection successful!\nSheet: ${result.sheetName}\nVocabulary count: ${result.vocabularyCount}`);
        setSyncStatus('synced');
      } else {
        throw new Error(result.message || 'Connection test failed');
      }

    } catch (error) {
      console.error('Connection test failed:', error);
      alert('❌ Connection failed: ' + error.message);
      setSyncStatus('offline');
    } finally {
      setIsSyncing(false);
    }
  };

  const syncToGoogleSheets = async () => {
    if (!appsScriptUrl || !googleSheetId || !isConnected) return;

    setIsSyncing(true);
    try {
      // Use JSONP for sync
      const callbackName = 'callback_' + Date.now();
      const vocabularyData = encodeURIComponent(JSON.stringify(vocabulary));
      const url = `${appsScriptUrl}?action=saveVocabulary&sheetId=${encodeURIComponent(googleSheetId)}&vocabulary=${vocabularyData}&callback=${callbackName}`;

      const result = await new Promise((resolve, reject) => {
        // Create callback function
        window[callbackName] = (data) => {
          delete window[callbackName];
          document.head.removeChild(script);
          resolve(data);
        };

        // Create script tag for JSONP
        const script = document.createElement('script');
        script.src = url;
        script.onerror = () => {
          delete window[callbackName];
          document.head.removeChild(script);
          reject(new Error('JSONP request failed'));
        };

        document.head.appendChild(script);

        // Timeout after 15 seconds
        setTimeout(() => {
          if (window[callbackName]) {
            delete window[callbackName];
            document.head.removeChild(script);
            reject(new Error('Request timeout'));
          }
        }, 15000);
      });

      if (result.success) {
        const now = new Date();
        setLastSyncTime(now);
        setSyncStatus('synced');

        // Update saved settings
        const settings = {
          appsScriptUrl: appsScriptUrl,
          googleSheetId: googleSheetId,
          lastSync: now.toISOString()
        };
        localStorage.setItem('appsScriptSettings', JSON.stringify(settings));

        alert(`✅ Sync successful!\n${result.count} words saved to ${result.sheetName}`);
      } else {
        throw new Error(result.message || 'Sync failed');
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
    if (!appsScriptUrl || !googleSheetId || !isConnected) return;

    setIsSyncing(true);
    try {
      // Use JSONP for load
      const callbackName = 'callback_' + Date.now();
      const url = `${appsScriptUrl}?action=loadVocabulary&sheetId=${encodeURIComponent(googleSheetId)}&callback=${callbackName}`;

      const result = await new Promise((resolve, reject) => {
        // Create callback function
        window[callbackName] = (data) => {
          delete window[callbackName];
          document.head.removeChild(script);
          resolve(data);
        };

        // Create script tag for JSONP
        const script = document.createElement('script');
        script.src = url;
        script.onerror = () => {
          delete window[callbackName];
          document.head.removeChild(script);
          reject(new Error('JSONP request failed'));
        };

        document.head.appendChild(script);

        // Timeout after 10 seconds
        setTimeout(() => {
          if (window[callbackName]) {
            delete window[callbackName];
            document.head.removeChild(script);
            reject(new Error('Request timeout'));
          }
        }, 10000);
      });

      if (result.success && result.vocabulary) {
        setVocabulary(result.vocabulary);
        setSyncStatus('synced');
        setLastSyncTime(new Date());

        // Also save to localStorage
        localStorage.setItem('japaneseVocabulary', JSON.stringify(result.vocabulary));

        alert(`✅ Load successful!\n${result.vocabulary.length} words loaded from ${result.sheetName}`);
      } else {
        throw new Error(result.message || 'Load failed');
      }

    } catch (error) {
      console.error('Load failed:', error);
      alert('❌ Load failed: ' + error.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const generateExampleSentence = async (word) => {
    // Check if we already have cached examples
    if (word.examples && word.examples.length > 0) {
      const randomExample = word.examples[Math.floor(Math.random() * word.examples.length)];
      setGeneratedSentence(randomExample);
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 200,
          messages: [
            {
              role: "user",
              content: `Generate a simple Japanese example sentence using the word "${word.kanji}" (${word.reading}) which means "${word.meaning}". Please provide the sentence in Japanese with hiragana/katakana readings in parentheses, followed by an English translation. Keep it beginner-friendly.`
            }
          ]
        })
      });

      const data = await response.json();
      const sentence = data.content[0].text;
      setGeneratedSentence(sentence);

      // Cache the example sentence
      const updatedVocabulary = vocabulary.map(w => {
        if (w.id === word.id) {
          const updatedExamples = [...(w.examples || []), sentence];
          return { ...w, examples: updatedExamples };
        }
        return w;
      });
      setVocabulary(updatedVocabulary);

    } catch (error) {
      setGeneratedSentence('Sorry, could not generate example sentence at this time.');
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
          generateExampleSentence(word);
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
              {isConnected && appsScriptUrl && googleSheetId && (
                <button
                  onClick={syncToGoogleSheets}
                  disabled={isSyncing}
                  className="flex items-center gap-1 px-2 sm:px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 text-sm"
                >
                  <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
                  <span className="hidden sm:inline">{isSyncing ? 'Syncing...' : 'Sync'}</span>
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
                {/* Apps Script Connection Section */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Google Apps Script & Sheets</h4>
                  {!isConnected ? (
                    <div className="space-y-3">
                      <div className="text-sm text-gray-600 mb-2">
                        Step 1: Enter your Google Apps Script Web App URL:
                      </div>
                      <input
                        id="appsScriptUrl"
                        type="url"
                        placeholder="https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />

                      <div className="text-sm text-gray-600 mb-2">
                        Step 2: Enter your Google Sheet ID:
                      </div>
                      <input
                        id="googleSheetId"
                        type="text"
                        placeholder="1ABC123DEF456 (from your Google Sheet URL)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />

                      <button
                        onClick={() => {
                          const urlInput = document.getElementById('appsScriptUrl');
                          const sheetInput = document.getElementById('googleSheetId');
                          if (urlInput.value.trim() && sheetInput.value.trim()) {
                            connectToAppsScript(urlInput.value.trim(), sheetInput.value.trim());
                          } else {
                            alert('Please enter both Apps Script URL and Google Sheet ID');
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
                          ✅ Connected to Google Sheets
                        </div>
                        <div className="text-xs text-green-600 break-all mt-1">
                          Script: {appsScriptUrl.substring(0, 50)}...
                        </div>
                        <div className="text-xs text-green-600">
                          Sheet ID: {googleSheetId}
                        </div>
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
                            className="text-xs text-green-600 hover:text-green-800"
                          >
                            Disconnect
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Sync Actions */}
                {isConnected && appsScriptUrl && googleSheetId && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Sync Actions</h4>
                    <div className="space-y-2">
                      <button
                        onClick={syncToGoogleSheets}
                        disabled={isSyncing}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 text-sm"
                      >
                        <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
                        {isSyncing ? 'Syncing to Sheet...' : 'Sync to Google Sheet'}
                      </button>
                      <button
                        onClick={loadFromGoogleSheets}
                        disabled={isSyncing}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 text-sm"
                      >
                        <Cloud size={16} />
                        Load from Google Sheet
                      </button>
                    </div>
                  </div>
                )}

                {/* Setup Instructions */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Setup Instructions</h4>
                  <div className="text-xs text-gray-600 space-y-3">
                    <div className="p-3 bg-blue-50 rounded-md">
                      <div className="font-medium mb-2 text-blue-900">Quick Setup Guide:</div>
                      <ol className="list-decimal list-inside space-y-1 text-blue-800">
                        <li>Create a <a href="https://sheets.google.com" target="_blank" rel="noopener noreferrer" className="underline">new Google Sheet</a></li>
                        <li>Copy the Sheet ID from the URL (the long string after /d/)</li>
                        <li>Go to <a href="https://script.google.com" target="_blank" rel="noopener noreferrer" className="underline">script.google.com</a></li>
                        <li>Create new project and paste the provided Apps Script code</li>
                        <li>Deploy as Web App (Execute as: Me, Access: Anyone)</li>
                        <li>Copy both URLs and paste them above</li>
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
                      <div className="font-medium mb-1 text-yellow-800">🔒 Security Note:</div>
                      <div className="text-xs text-yellow-700">
                        Your Google Sheet remains private! The script only provides secure API access to YOUR data.
                        Others cannot see or modify your vocabulary.
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
                  onClick={() => generateExampleSentence(selectedWord)}
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