/**
 * Google Sheets API Service
 * Direct integration without Apps Script
 */

const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

/**
 * Google Sheets API Client
 */
export class GoogleSheetsApiClient {
  constructor(apiKey, spreadsheetId) {
    this.apiKey = apiKey;
    this.spreadsheetId = spreadsheetId;
    this.sheetName = 'VocabularyData';
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
   * Note: This requires OAuth, not just API key
   */
  async saveVocabulary(vocabulary) {
    return {
      success: false,
      message: 'Saving requires OAuth authentication. Use the export feature instead.',
      requiresOAuth: true
    };
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
export function createGoogleSheetsClient(apiKey, spreadsheetId) {
  return new GoogleSheetsApiClient(apiKey, spreadsheetId);
}