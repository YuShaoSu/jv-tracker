import React from 'react';
import { X, Cloud, RefreshCw, Download, Unlock } from 'lucide-react';

const SettingsModal = ({
  isOpen,
  onClose,
  googleSheetsHook,
  exampleHook,
  onLoadFromSheets
}) => {
  const {
    googleApiKey,
    googleSheetId,
    googleClientId,
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50">
      <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md mx-3 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Settings</h3>
          <button
            onClick={onClose}
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
                        clientInput.value.trim()
                      );
                      // Handle Gemini API key separately through the example hook
                      if (geminiInput.value.trim()) {
                        exampleHook.updateGeminiApiKey(geminiInput.value.trim());
                      }
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
                  onClick={onLoadFromSheets}
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
  );
};

export default SettingsModal;