/**
 * Google Sheets API Service
 * Direct integration with OAuth support for read/write access
 */

const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';
const OAUTH_SCOPES = 'https://www.googleapis.com/auth/spreadsheets';

/**
 * Google Sheets API Client
 */
export class GoogleSheetsApiClient {
  constructor(apiKey, spreadsheetId, clientId = null) {
    this.apiKey = apiKey;
    this.spreadsheetId = spreadsheetId;
    this.sheetName = 'VocabularyData';
    this.clientId = clientId;
    this.accessToken = null;
    this.isOAuthAuthenticated = false;
  }

  /**
   * Set OAuth client ID for write operations
   */
  setClientId(clientId) {
    this.clientId = clientId;
  }

  /**
   * Initialize Google OAuth 2.0
   */
  async initializeOAuth() {
    if (!this.clientId) {
      throw new Error('OAuth Client ID is required for write operations');
    }

    try {
      // Load Google Identity Services library
      await this.loadGoogleIdentityLibrary();
      
      // Initialize Google OAuth
      window.google.accounts.oauth2.initTokenClient({
        client_id: this.clientId,
        scope: OAUTH_SCOPES,
        callback: (response) => {
          if (response.access_token) {
            this.accessToken = response.access_token;
            this.isOAuthAuthenticated = true;
          }
        }
      });

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: `OAuth initialization failed: ${error.message}` 
      };
    }
  }

  /**
   * Load Google Identity Services library
   */
  async loadGoogleIdentityLibrary() {
    if (window.google && window.google.accounts) {
      return; // Already loaded
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.onload = resolve;
      script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
      document.head.appendChild(script);
    });
  }

  /**
   * Request OAuth permission for write access
   */
  async requestWritePermission() {
    if (!this.clientId) {
      throw new Error('OAuth Client ID required. Please configure it in settings.');
    }

    try {
      await this.initializeOAuth();

      return new Promise((resolve) => {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: this.clientId,
          scope: OAUTH_SCOPES,
          callback: (response) => {
            if (response.access_token) {
              this.accessToken = response.access_token;
              this.isOAuthAuthenticated = true;
              resolve({ success: true, message: 'OAuth permission granted' });
            } else {
              resolve({ success: false, message: 'OAuth permission denied' });
            }
          }
        });

        tokenClient.requestAccessToken({
          prompt: 'consent'
        });
      });
    } catch (error) {
      return { 
        success: false, 
        message: `OAuth request failed: ${error.message}` 
      };
    }
  }

  /**
   * Make authenticated API request
   */
  async makeAuthenticatedRequest(url, options = {}) {
    if (!this.isOAuthAuthenticated) {
      throw new Error('OAuth authentication required for this operation');
    }

    const headers = {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers
    };

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      if (response.status === 401) {
        this.isOAuthAuthenticated = false;
        this.accessToken = null;
        throw new Error('OAuth token expired. Please re-authenticate.');
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response;
  }

  /**
   * Test connection to Google Sheets
   */
  async testConnection() {
    try {
      const url = `${SHEETS_API_BASE}/${this.spreadsheetId}?key=${this.apiKey}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('API key invalid or lacks permissions');
        }
        if (response.status === 404) {
          throw new Error('Spreadsheet not found or not accessible');
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        message: 'Connected successfully',
        spreadsheetTitle: data.properties?.title || 'Unknown',
        sheets: data.sheets?.map(sheet => sheet.properties.title) || []
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Ensure the vocabulary sheet exists and has headers
   */
  async ensureSheetSetup() {
    try {
      // Get spreadsheet info
      const infoUrl = `${SHEETS_API_BASE}/${this.spreadsheetId}?key=${this.apiKey}`;
      const infoResponse = await fetch(infoUrl);
      const spreadsheetData = await infoResponse.json();

      // Check if our sheet exists
      const existingSheet = spreadsheetData.sheets?.find(
        sheet => sheet.properties.title === this.sheetName
      );

      if (!existingSheet) {
        // We can't create sheets with API key only, need OAuth
        throw new Error(`Sheet "${this.sheetName}" doesn't exist. Please create it manually.`);
      }

      // Check if headers exist
      const headersUrl = `${SHEETS_API_BASE}/${this.spreadsheetId}/values/${this.sheetName}!A1:G1?key=${this.apiKey}`;
      const headersResponse = await fetch(headersUrl);
      const headersData = await headersResponse.json();

      const expectedHeaders = ['Kanji', 'Reading', 'Meaning', 'Status', 'Date Added', 'Examples', 'ID'];
      const existingHeaders = headersData.values?.[0] || [];

      // If headers don't match, user needs to set them up
      if (JSON.stringify(existingHeaders) !== JSON.stringify(expectedHeaders)) {
        return {
          success: false,
          message: `Please add headers to row 1: ${expectedHeaders.join(', ')}`,
          needsHeaders: true,
          expectedHeaders
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Load vocabulary from Google Sheets
   */
  async loadVocabulary() {
    try {
      // First ensure sheet is set up
      const setupResult = await this.ensureSheetSetup();
      if (!setupResult.success) {
        return setupResult;
      }

      // Load data (skip header row)
      const range = `${this.sheetName}!A2:G1000`;
      const url = `${SHEETS_API_BASE}/${this.spreadsheetId}/values/${range}?key=${this.apiKey}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to load data: HTTP ${response.status}`);
      }

      const data = await response.json();
      const rows = data.values || [];

      // Convert rows to vocabulary objects
      const vocabulary = rows
        .filter(row => row[0] && row[1]) // Must have kanji and reading
        .map((row, index) => ({
          id: row[6] || Date.now() + index, // ID from column G or generated
          kanji: row[0] || '',
          reading: row[1] || '',
          meaning: row[2] || '',
          status: row[3] || 'learning',
          addedDate: row[4] || new Date().toISOString(),
          examples: this.parseExamples(row[5])
        }));

      return {
        success: true,
        message: `Loaded ${vocabulary.length} vocabulary items`,
        vocabulary
      };
    } catch (error) {
      return {
        success: false,
        message: `Load failed: ${error.message}`,
        vocabulary: []
      };
    }
  }

  /**
   * Save vocabulary to Google Sheets
   * Requires OAuth authentication for write access
   */
  async saveVocabulary(vocabulary) {
    try {
      // Check if OAuth is authenticated
      if (!this.isOAuthAuthenticated) {
        return {
          success: false,
          message: 'OAuth authentication required for direct saving.',
          requiresOAuth: true
        };
      }

      // First ensure sheet is set up
      const setupResult = await this.ensureSheetSetup();
      if (!setupResult.success) {
        return setupResult;
      }

      // Clear existing data (keep header)
      await this.clearSheetData();

      // Convert vocabulary to sheets format
      const rows = vocabulary.map(word => [
        word.kanji || '',
        word.reading || '',
        word.meaning || '',
        word.status || 'learning',
        word.addedDate || new Date().toISOString(),
        JSON.stringify(word.examples || []),
        word.id || ''
      ]);

      if (rows.length === 0) {
        return {
          success: true,
          message: 'No vocabulary to save',
          count: 0
        };
      }

      // Write data to sheet
      const range = `${this.sheetName}!A2:G${rows.length + 1}`;
      const url = `${SHEETS_API_BASE}/${this.spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`;

      const response = await this.makeAuthenticatedRequest(url, {
        method: 'PUT',
        body: JSON.stringify({
          values: rows
        })
      });

      const result = await response.json();

      // Add sync timestamp
      const timestampRange = `${this.sheetName}!I1:I2`;
      const timestampUrl = `${SHEETS_API_BASE}/${this.spreadsheetId}/values/${timestampRange}?valueInputOption=USER_ENTERED`;
      
      await this.makeAuthenticatedRequest(timestampUrl, {
        method: 'PUT',
        body: JSON.stringify({
          values: [
            ['Last Sync:'],
            [new Date().toISOString()]
          ]
        })
      });

      return {
        success: true,
        message: `Successfully saved ${vocabulary.length} vocabulary items to Google Sheets`,
        count: vocabulary.length,
        updatedCells: result.updatedCells
      };

    } catch (error) {
      if (error.message.includes('OAuth token expired')) {
        return {
          success: false,
          message: 'Authentication expired. Please re-authenticate and try again.',
          requiresReauth: true
        };
      }
      
      return {
        success: false,
        message: `Save failed: ${error.message}`
      };
    }
  }

  /**
   * Clear sheet data while preserving headers
   */
  async clearSheetData() {
    try {
      // Clear the range
      const clearUrl = `${SHEETS_API_BASE}/${this.spreadsheetId}/values/${this.sheetName}!A2:G1000:clear`;
      await this.makeAuthenticatedRequest(clearUrl, {
        method: 'POST'
      });
    } catch (error) {
      // If clearing fails, we'll just overwrite the data
      console.warn('Failed to clear sheet data:', error.message);
    }
  }

  /**
   * Generate CSV data for manual import
   */
  generateCsvData(vocabulary) {
    const headers = ['Kanji', 'Reading', 'Meaning', 'Status', 'Date Added', 'Examples', 'ID'];
    const rows = vocabulary.map(word => [
      word.kanji || '',
      word.reading || '',
      word.meaning || '',
      word.status || 'learning',
      word.addedDate || new Date().toISOString(),
      JSON.stringify(word.examples || []),
      word.id || ''
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell.toString().replace(/"/g, '""')}"`).join(','))
      .join('\n');

    return csvContent;
  }

  /**
   * Download CSV file
   */
  downloadCsv(vocabulary, filename = 'vocabulary-backup.csv') {
    const csvContent = this.generateCsvData(vocabulary);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  /**
   * Parse examples JSON safely
   */
  parseExamples(examplesString) {
    try {
      if (!examplesString || examplesString.trim() === '') {
        return [];
      }
      return JSON.parse(examplesString);
    } catch (error) {
      return [];
    }
  }

  /**
   * Validate API key format
   */
  static validateApiKey(apiKey) {
    if (!apiKey) {
      return { valid: false, message: 'API key is required' };
    }
    
    // Basic format check for Google API key
    if (apiKey.length < 30 || !apiKey.startsWith('AI')) {
      return { 
        valid: false, 
        message: 'Invalid API key format. Should start with "AI" and be ~40 characters long.' 
      };
    }
    
    return { valid: true };
  }

  /**
   * Validate spreadsheet ID format
   */
  static validateSpreadsheetId(spreadsheetId) {
    if (!spreadsheetId) {
      return { valid: false, message: 'Spreadsheet ID is required' };
    }
    
    // Basic format check for Google Sheets ID
    if (spreadsheetId.length < 40 || !/^[a-zA-Z0-9_-]+$/.test(spreadsheetId)) {
      return { 
        valid: false, 
        message: 'Invalid spreadsheet ID format. Should be 44 characters of letters, numbers, hyphens, and underscores.' 
      };
    }
    
    return { valid: true };
  }
}

/**
 * Factory function to create API client
 */
export function createGoogleSheetsClient(apiKey, spreadsheetId, clientId = null) {
  return new GoogleSheetsApiClient(apiKey, spreadsheetId, clientId);
}