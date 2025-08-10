import React, { useState, useEffect } from 'react';
import { BookOpen, TrendingUp, RotateCcw, Settings, Cloud, CloudOff, Download, RefreshCw, Shield } from 'lucide-react';

import { useVocabulary } from '../hooks/useVocabulary';
import { useGoogleSheets } from '../hooks/useGoogleSheets';
import { useExampleGeneration } from '../hooks/useExampleGeneration';

import DashboardView from './DashboardView';
import VocabularyView from './VocabularyView';
import ReviewView from './ReviewView';
import SettingsModal from './SettingsModal';
import AddWordModal from './AddWordModal';
import ExampleSentenceModal from './ExampleSentenceModal';

import { VIEWS } from '../constants/vocabulary';

const JapaneseVocabTracker = () => {
  // UI state
  const [showAddForm, setShowAddForm] = useState(false);
  const [currentView, setCurrentView] = useState(VIEWS.DASHBOARD);
  const [selectedWord, setSelectedWord] = useState(null);
  const [showExampleSentence, setShowExampleSentence] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Custom hooks for state management
  const vocabularyHook = useVocabulary();
  const googleSheetsHook = useGoogleSheets();
  const exampleHook = useExampleGeneration();

  const { vocabulary, addWord, updateWordStatus, deleteWord, updateWordExamples, getStatusCounts } = vocabularyHook;
  const { isConnected, isSyncing, syncToGoogleSheets, loadFromGoogleSheets, getSyncStatusColor, formatLastSync, updateSyncStatus } = googleSheetsHook;

  // Update sync status when vocabulary changes
  useEffect(() => {
    updateSyncStatus(vocabulary);
  }, [vocabulary, updateSyncStatus]);

  const statusCounts = getStatusCounts();

  // Event handlers
  const handleShowExample = (word) => {
    setSelectedWord(word);
    setShowExampleSentence(true);
  };

  const handleSyncToSheets = () => {
    syncToGoogleSheets(vocabulary);
  };

  const handleLoadFromSheets = () => {
    loadFromGoogleSheets(vocabularyHook.setVocabulary);
  };

  const getSyncStatusIcon = () => {
    switch (googleSheetsHook.syncStatus) {
      case 'synced': return <Cloud size={16} />;
      case 'pending': return <CloudOff size={16} />;
      default: return <CloudOff size={16} />;
    }
  };


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
              {isConnected && googleSheetsHook.googleSheetId && (
                <button
                  onClick={handleSyncToSheets}
                  disabled={isSyncing}
                  className={`flex items-center gap-1 px-2 sm:px-3 py-1 rounded-md transition-colors disabled:opacity-50 text-sm ${googleSheetsHook.isOAuthAuthenticated
                    ? 'bg-green-500 text-white hover:bg-green-600'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                >
                  {googleSheetsHook.isOAuthAuthenticated ? (
                    <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
                  ) : (
                    <Download size={14} className={isSyncing ? 'animate-spin' : ''} />
                  )}
                  <span className="hidden sm:inline">
                    {isSyncing
                      ? 'Syncing...'
                      : googleSheetsHook.isOAuthAuthenticated
                        ? 'Sync'
                        : 'Export'
                    }
                  </span>
                </button>
              )}

              {/* Auth Button */}
              {isConnected && googleSheetsHook.googleClientId && !googleSheetsHook.isOAuthAuthenticated && (
                <button
                  onClick={googleSheetsHook.authenticateForWriteAccess}
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
              onClick={() => setCurrentView(VIEWS.DASHBOARD)}
              className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-3 sm:py-4 font-medium whitespace-nowrap text-sm sm:text-base ${currentView === VIEWS.DASHBOARD
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              <TrendingUp size={18} className="sm:w-5 sm:h-5" />
              Dashboard
            </button>
            <button
              onClick={() => setCurrentView(VIEWS.VOCABULARY)}
              className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-3 sm:py-4 font-medium whitespace-nowrap text-sm sm:text-base ${currentView === VIEWS.VOCABULARY
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
              onClick={() => setCurrentView(VIEWS.REVIEW)}
              className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-3 sm:py-4 font-medium whitespace-nowrap text-sm sm:text-base ${currentView === VIEWS.REVIEW
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              <RotateCcw size={18} className="sm:w-5 sm:h-5" />
              Review ({statusCounts.often_forget || 0})
            </button>
          </div>
        </div>

        {/* Views */}
        {currentView === VIEWS.DASHBOARD && (
          <DashboardView
            statusCounts={statusCounts}
            vocabulary={vocabulary}
            onDeleteWord={deleteWord}
            onUpdateWordStatus={updateWordStatus}
            onShowExample={handleShowExample}
          />
        )}

        {currentView === VIEWS.VOCABULARY && (
          <VocabularyView
            vocabulary={vocabulary}
            onShowAddForm={() => setShowAddForm(true)}
            onDeleteWord={deleteWord}
            onUpdateWordStatus={updateWordStatus}
            onShowExample={handleShowExample}
          />
        )}

        {currentView === VIEWS.REVIEW && (
          <ReviewView
            vocabulary={vocabulary}
            onDeleteWord={deleteWord}
            onUpdateWordStatus={updateWordStatus}
            onShowExample={handleShowExample}
          />
        )}

        {/* Modals */}
        <SettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          googleSheetsHook={googleSheetsHook}
          exampleHook={exampleHook}
          onLoadFromSheets={handleLoadFromSheets}
        />

        <AddWordModal
          isOpen={showAddForm}
          onClose={() => setShowAddForm(false)}
          onAddWord={addWord}
        />

        <ExampleSentenceModal
          isOpen={showExampleSentence}
          onClose={() => setShowExampleSentence(false)}
          selectedWord={selectedWord}
          exampleHook={exampleHook}
          updateWordExamples={updateWordExamples}
        />
      </div>
    </div>
  );
};

export default JapaneseVocabTracker;