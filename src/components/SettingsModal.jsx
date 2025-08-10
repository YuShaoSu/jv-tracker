import React, { useState } from 'react';
import { X, Cloud, RefreshCw, Download, Unlock, Settings, HelpCircle, Zap, CheckCircle2 } from 'lucide-react';
import { GOOGLE_OAUTH_CLIENT_ID, isOAuthConfigured } from '../config/googleAuth';

const SettingsModal = ({
  isOpen,
  onClose,
  googleSheetsHook,
  exampleHook,
  onLoadFromSheets
}) => {
  const [activeTab, setActiveTab] = useState('connection');
  
  const {
    googleApiKey,
    googleSheetId,
    isConnected,
    isOAuthAuthenticated,
    isSyncing,
    connectToGoogleSheets,
    disconnectGoogleSheets,
    testConnection,
    authenticateForWriteAccess,
    syncToGoogleSheets,
    formatLastSync
  } = googleSheetsHook;

  const { geminiApiKey } = exampleHook;

  if (!isOpen) return null;
  
  const tabs = [
    { id: 'connection', label: 'Connection', icon: Settings, enabled: true },
    { id: 'sync', label: 'Sync Actions', icon: Cloud, enabled: isConnected },
    { id: 'help', label: 'Setup Help', icon: HelpCircle, enabled: true }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start sm:items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg w-full max-w-4xl mx-2 sm:mx-4 my-4 sm:my-8 shadow-xl max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">Settings</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => tab.enabled && setActiveTab(tab.id)}
                disabled={!tab.enabled}
                className={`flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 font-medium text-sm sm:text-base border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-blue-600 bg-white'
                    : tab.enabled
                    ? 'text-gray-600 border-transparent hover:text-gray-900 hover:border-gray-300'
                    : 'text-gray-400 border-transparent cursor-not-allowed'
                }`}
              >
                <Icon size={16} className="sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
        
        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* Connection Tab */}
          {activeTab === 'connection' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold text-gray-900">Google Sheets Connection</h4>
                {isConnected && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                    <CheckCircle2 size={16} />
                    <span>Connected</span>
                  </div>
                )}
              </div>

              {!isConnected ? (
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">1</div>
                      <h5 className="font-medium text-blue-900">Google Sheets API Key</h5>
                    </div>
                    <p className="text-sm text-blue-700 mb-3">Required to read your spreadsheets</p>
                    <input
                      id="googleApiKey"
                      type="password"
                      placeholder="AIzaSyA... (Google API Key)"
                      className="w-full px-3 py-2.5 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono bg-white"
                    />
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">2</div>
                      <h5 className="font-medium text-green-900">Google Sheet ID</h5>
                    </div>
                    <p className="text-sm text-green-700 mb-3">Found in your Google Sheet URL</p>
                    <input
                      id="googleSheetId"
                      type="text"
                      placeholder="1ABC123DEF456... (from your Google Sheet URL)"
                      className="w-full px-3 py-2.5 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm font-mono bg-white"
                    />
                  </div>

                  <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">3</div>
                        <h5 className="font-medium text-orange-900">OAuth Client ID</h5>
                      </div>
                      <div className="flex items-center gap-2 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                        <CheckCircle2 size={12} />
                        <span>Built-in</span>
                      </div>
                    </div>
                    <p className="text-sm text-orange-700 mb-3">Pre-configured for direct sync to Google Sheets 🚀</p>
                    <div className="bg-white p-3 rounded-md border border-orange-300">
                      <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">OAuth Client ID</div>
                      <div className="text-sm font-mono text-gray-700 break-all">
                        {isOAuthConfigured() ? GOOGLE_OAUTH_CLIENT_ID : '⚠️ OAuth not configured'}
                      </div>
                      {isOAuthConfigured() && (
                        <div className="text-xs text-green-600 mt-2">✅ Ready for direct sync</div>
                      )}
                    </div>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center">
                        <Zap size={14} />
                      </div>
                      <h5 className="font-medium text-purple-900">Gemini AI Key <span className="text-xs font-normal text-purple-700">(Optional)</span></h5>
                    </div>
                    <p className="text-sm text-purple-700 mb-3">Enables AI-powered Japanese example sentence generation</p>
                    <input
                      id="geminiApiKey"
                      type="password"
                      placeholder="AIzaSyB... (Google AI Studio API Key)"
                      className="w-full px-3 py-2.5 border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-mono bg-white"
                    />
                  </div>

                  <button
                    onClick={() => {
                      const apiKeyInput = document.getElementById('googleApiKey');
                      const sheetInput = document.getElementById('googleSheetId');
                      const geminiInput = document.getElementById('geminiApiKey');
                      if (apiKeyInput.value.trim() && sheetInput.value.trim()) {
                        // OAuth Client ID is now hard-coded, no need to get from input
                        connectToGoogleSheets(
                          apiKeyInput.value.trim(),
                          sheetInput.value.trim()
                        );
                        // Handle Gemini API key separately through the example hook
                        if (geminiInput.value.trim()) {
                          exampleHook.updateGeminiApiKey(geminiInput.value.trim());
                        }
                        setActiveTab('sync'); // Switch to sync tab after connection
                      } else {
                        alert('Please enter at least API key and Google Sheet ID');
                      }
                    }}
                    className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-base shadow-md"
                  >
                    🚀 Connect to Google Sheets
                  </button>

                  <div className="text-center">
                    <button
                      onClick={() => setActiveTab('help')}
                      className="inline-flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-700 transition-colors text-sm"
                    >
                      <HelpCircle size={16} />
                      Need help? View setup guide
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-xl border border-green-200">
                  <div className="flex items-center gap-3 mb-4">
                    <CheckCircle2 size={24} className="text-green-600" />
                    <h4 className="text-lg font-semibold text-green-900">Successfully Connected!</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div className="bg-white p-3 rounded-lg border border-green-200">
                      <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">API Key</div>
                      <div className="text-sm font-mono text-gray-700">
                        {googleApiKey.substring(0, 10)}...{googleApiKey.substring(googleApiKey.length - 4)}
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-green-200">
                      <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Sheet ID</div>
                      <div className="text-sm font-mono text-gray-700 truncate">{googleSheetId}</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-orange-200">
                      <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">OAuth Client</div>
                      <div className="text-sm font-mono text-gray-700 truncate">
                        {isOAuthConfigured() ? 
                          `${GOOGLE_OAUTH_CLIENT_ID.substring(0, 15)}...${GOOGLE_OAUTH_CLIENT_ID.substring(GOOGLE_OAUTH_CLIENT_ID.length - 15)}` :
                          '⚠️ Not configured'
                        }
                      </div>
                    </div>
                    {geminiApiKey && (
                      <div className="bg-white p-3 rounded-lg border border-purple-200">
                        <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Gemini AI</div>
                        <div className="text-sm font-mono text-gray-700">
                          {geminiApiKey.substring(0, 10)}...{geminiApiKey.substring(geminiApiKey.length - 4)}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {isOAuthAuthenticated && (
                    <div className="flex items-center gap-2 mb-4 p-3 bg-green-100 rounded-lg">
                      <CheckCircle2 size={16} className="text-green-600" />
                      <span className="text-sm font-medium text-green-800">OAuth Authenticated - Direct sync enabled</span>
                    </div>
                  )}
                  
                  <div className="text-sm text-gray-600 mb-4">Last sync: {formatLastSync()}</div>
                  
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={testConnection}
                      disabled={isSyncing}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors text-sm font-medium"
                    >
                      {isSyncing ? 'Testing...' : '🔍 Test Connection'}
                    </button>
                    <button
                      onClick={() => setActiveTab('sync')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      ⚡ Go to Sync Actions
                    </button>
                    <button
                      onClick={disconnectGoogleSheets}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                    >
                      🔌 Disconnect
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Sync Actions Tab */}
          {activeTab === 'sync' && isConnected && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Cloud size={24} className="text-blue-600" />
                <h4 className="text-lg font-semibold text-gray-900">Sync Actions</h4>
              </div>

              <div className="grid gap-4">
                {isOAuthConfigured() && !isOAuthAuthenticated && (
                  <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                    <div className="flex items-center gap-3 mb-3">
                      <Unlock size={20} className="text-orange-600" />
                      <div>
                        <h5 className="font-medium text-orange-900">Authentication Required</h5>
                        <p className="text-sm text-orange-700">Enable direct sync to Google Sheets</p>
                      </div>
                    </div>
                    <button
                      onClick={authenticateForWriteAccess}
                      disabled={isSyncing}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 font-medium"
                    >
                      <Unlock size={16} className={isSyncing ? 'animate-spin' : ''} />
                      {isSyncing ? 'Authenticating...' : '🔐 Authenticate for Write Access'}
                    </button>
                  </div>
                )}

                <div className={`p-4 rounded-lg border ${
                  isOAuthAuthenticated ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'
                }`}>
                  <div className="flex items-center gap-3 mb-3">
                    {isOAuthAuthenticated ? (
                      <RefreshCw size={20} className="text-green-600" />
                    ) : (
                      <Download size={20} className="text-blue-600" />
                    )}
                    <div>
                      <h5 className={`font-medium ${
                        isOAuthAuthenticated ? 'text-green-900' : 'text-blue-900'
                      }`}>
                        {isOAuthAuthenticated ? 'Direct Sync' : 'CSV Export'}
                      </h5>
                      <p className={`text-sm ${
                        isOAuthAuthenticated ? 'text-green-700' : 'text-blue-700'
                      }`}>
                        {isOAuthAuthenticated 
                          ? 'Save directly to Google Sheets' 
                          : 'Download CSV file for manual import'
                        }
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={syncToGoogleSheets}
                    disabled={isSyncing}
                    className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg transition-colors disabled:opacity-50 font-medium ${
                      isOAuthAuthenticated
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
                      : (isOAuthAuthenticated ? '🔄 Sync to Google Sheet' : '📥 Export to CSV')
                    }
                  </button>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3 mb-3">
                    <Cloud size={20} className="text-gray-600" />
                    <div>
                      <h5 className="font-medium text-gray-900">Load from Sheets</h5>
                      <p className="text-sm text-gray-700">Replace local data with sheet data</p>
                    </div>
                  </div>
                  <button
                    onClick={onLoadFromSheets}
                    disabled={isSyncing}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-white hover:border-gray-400 transition-colors disabled:opacity-50 font-medium bg-white"
                  >
                    <Cloud size={16} className={isSyncing ? 'animate-spin' : ''} />
                    {isSyncing ? 'Loading...' : '📊 Load from Google Sheet'}
                  </button>
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h5 className="font-medium text-blue-900 mb-2">💡 Sync Tips</h5>
                <ul className="text-sm text-blue-800 space-y-1">
                  {isOAuthAuthenticated ? (
                    <li>• Direct sync is enabled! Your changes save directly to Google Sheets</li>
                  ) : isOAuthConfigured() ? (
                    <li>• Click "Authenticate" above to enable direct sync to sheets</li>
                  ) : (
                    <li>• OAuth is pre-configured for direct sync capability</li>
                  )}
                  <li>• Use "Load from Sheets" to sync data from your sheet to the app</li>
                  <li>• CSV export works without authentication for manual imports</li>
                </ul>
              </div>
            </div>
          )}

          {/* Help Tab */}
          {activeTab === 'help' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <HelpCircle size={24} className="text-blue-600" />
                <h4 className="text-lg font-semibold text-gray-900">Setup Guide</h4>
              </div>

              <div className="space-y-4">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
                  <h5 className="font-semibold text-blue-900 mb-4 text-lg">🚀 Quick Setup Checklist</h5>
                  <div className="grid gap-3">
                    <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-blue-100">
                      <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 mt-0.5">1</div>
                      <div>
                        <div className="font-medium text-gray-900">Create Google Sheet</div>
                        <div className="text-sm text-gray-600 mt-1">
                          <a href="https://sheets.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Create a new Google Sheet →</a>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-blue-100">
                      <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 mt-0.5">2</div>
                      <div>
                        <div className="font-medium text-gray-900">Setup sheet structure</div>
                        <div className="text-sm text-gray-600 mt-1">Add tab named "VocabularyData" with headers:</div>
                        <div className="text-xs font-mono bg-gray-100 p-2 rounded mt-2">Kanji | Reading | Meaning | Status | Date Added | Examples | ID</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-blue-100">
                      <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 mt-0.5">3</div>
                      <div>
                        <div className="font-medium text-gray-900">Get Google Sheets API Key</div>
                        <div className="text-sm text-gray-600 mt-1">OAuth is pre-configured! You only need the API key (see guide below)</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 p-6 rounded-xl border border-green-200">
                  <h5 className="font-semibold text-green-900 mb-4 flex items-center gap-2">
                    <CheckCircle2 size={20} />
                    Get Google Sheets API Key (Required)
                  </h5>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">1</div>
                      <div className="text-sm text-green-800">
                        Go to <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="underline font-medium">Google Cloud Console</a>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">2</div>
                      <div className="text-sm text-green-800">Create project → APIs & Services → Library</div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">3</div>
                      <div className="text-sm text-green-800">Enable "Google Sheets API"</div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">4</div>
                      <div className="text-sm text-green-800">Credentials → "Create Credentials" → API Key</div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">5</div>
                      <div className="text-sm text-green-800">Copy the API key (starts with "AIza...")</div>
                    </div>
                  </div>
                </div>

                <div className="bg-orange-50 p-6 rounded-xl border border-orange-200">
                  <h5 className="font-semibold text-orange-900 mb-4 flex items-center gap-2">
                    <CheckCircle2 size={20} />
                    OAuth Client ID (Pre-configured!)
                  </h5>
                  <div className="bg-green-100 p-4 rounded-lg mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 size={16} className="text-green-600" />
                      <span className="font-medium text-green-800">Great news! OAuth is already set up for you.</span>
                    </div>
                    <div className="text-sm text-green-700">
                      You don't need to create your own OAuth Client ID. The app comes with a pre-configured OAuth client that enables direct sync to Google Sheets.
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">✓</div>
                      <div className="text-sm text-orange-800">OAuth Client ID: Pre-configured and ready to use</div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">✓</div>
                      <div className="text-sm text-orange-800">Domain: Configured for jv-tracker.vercel.app</div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">✓</div>
                      <div className="text-sm text-orange-800">Security: Uses Google's secure OAuth 2.0 flow</div>
                    </div>
                  </div>
                  <div className="bg-orange-100 p-3 rounded-lg mt-4">
                    <div className="text-sm text-orange-800">
                      <strong>✨ Result:</strong> You can use direct sync to Google Sheets without any additional setup!
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 p-6 rounded-xl border border-purple-200">
                  <h5 className="font-semibold text-purple-900 mb-4 flex items-center gap-2">
                    <Zap size={20} />
                    Get Gemini AI Key (Optional - for smart examples)
                  </h5>
                  <div className="space-y-3 mb-4">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">1</div>
                      <div className="text-sm text-purple-800">
                        Go to <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline font-medium">Google AI Studio</a>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">2</div>
                      <div className="text-sm text-purple-800">Sign in with your Google account</div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">3</div>
                      <div className="text-sm text-purple-800">Click "Create API Key"</div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">4</div>
                      <div className="text-sm text-purple-800">Copy the API key (starts with "AIzaSy...")</div>
                    </div>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <div className="text-sm text-purple-800">
                      <strong>✨ With AI:</strong> Contextual Japanese example sentences generated automatically!
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                  <h5 className="font-semibold text-gray-900 mb-4">📋 Finding Your Google Sheet ID</h5>
                  <div className="space-y-3">
                    <div className="text-sm text-gray-700">Look at your Google Sheet URL:</div>
                    <div className="bg-white p-3 rounded-lg border border-gray-300">
                      <code className="text-xs font-mono text-gray-800 break-all">
                        https://docs.google.com/spreadsheets/d/<span className="bg-yellow-200 px-1 rounded font-bold">1ABC123DEF456GHI789</span>/edit
                      </code>
                    </div>
                    <div className="text-sm text-gray-700">
                      Copy the highlighted part: <code className="bg-yellow-100 px-2 py-1 rounded font-mono text-xs">1ABC123DEF456GHI789</code>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-200">
                  <h5 className="font-semibold text-yellow-900 mb-4 flex items-center gap-2">
                    🔒 Security & Privacy
                  </h5>
                  <div className="space-y-3 text-sm text-yellow-800">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full flex-shrink-0 mt-2"></div>
                      <div><strong>API Key:</strong> Only allows reading your sheets - safe to use</div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full flex-shrink-0 mt-2"></div>
                      <div><strong>OAuth:</strong> You grant permission directly through Google's secure system</div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full flex-shrink-0 mt-2"></div>
                      <div><strong>Your Data:</strong> Only you can access your vocabulary sheets</div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full flex-shrink-0 mt-2"></div>
                      <div><strong>This App:</strong> Runs entirely in your browser - no server storage</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;