import { GoogleSheetsApiClient, createGoogleSheetsClient } from '../googleSheetsApi';

// Mock fetch globally
global.fetch = jest.fn();

// Mock Google OAuth library
global.window = {
  google: {
    accounts: {
      oauth2: {
        initTokenClient: jest.fn()
      }
    }
  }
};

// Mock DOM methods
Object.defineProperty(global.document, 'createElement', {
  value: jest.fn(() => ({
    src: '',
    onload: null,
    onerror: null,
    style: { visibility: '' },
    setAttribute: jest.fn(),
    click: jest.fn()
  })),
  writable: true
});

Object.defineProperty(global.document, 'head', {
  value: { appendChild: jest.fn() },
  writable: true
});

Object.defineProperty(global.document, 'body', {
  value: { 
    appendChild: jest.fn(),
    removeChild: jest.fn()
  },
  writable: true
});

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-blob-url');

describe('GoogleSheetsApiClient', () => {
  let client;
  const mockApiKey = 'AIzaSyA_TEST_API_KEY_12345678901234567890';
  const mockSpreadsheetId = '1ABC123DEF456GHI789JKL012MNO345PQR678STU901VWX';
  const mockClientId = '123456-abc.apps.googleusercontent.com';

  beforeEach(() => {
    jest.clearAllMocks();
    client = new GoogleSheetsApiClient(mockApiKey, mockSpreadsheetId, mockClientId);
    
    // Reset fetch mock
    fetch.mockClear();
  });

  describe('Constructor and Basic Properties', () => {
    test('creates client with required parameters', () => {
      expect(client.apiKey).toBe(mockApiKey);
      expect(client.spreadsheetId).toBe(mockSpreadsheetId);
      expect(client.clientId).toBe(mockClientId);
      expect(client.sheetName).toBe('VocabularyData');
      expect(client.isOAuthAuthenticated).toBe(false);
    });

    test('creates client without optional clientId', () => {
      const clientWithoutOAuth = new GoogleSheetsApiClient(mockApiKey, mockSpreadsheetId);
      expect(clientWithoutOAuth.clientId).toBe(null);
    });

    test('can set client ID after creation', () => {
      const newClientId = 'new-client-id.apps.googleusercontent.com';
      client.setClientId(newClientId);
      expect(client.clientId).toBe(newClientId);
    });
  });

  describe('API Key and Spreadsheet ID Validation', () => {
    test('validates correct API key format', () => {
      const result = GoogleSheetsApiClient.validateApiKey('AIzaSyA_valid_key_1234567890123456789012');
      expect(result.valid).toBe(true);
    });

    test('rejects invalid API key formats', () => {
      const invalidKeys = [
        '',
        null,
        undefined,
        'invalid_key',
        'short',
        'BIzaSyA_wrong_prefix'
      ];

      invalidKeys.forEach(key => {
        const result = GoogleSheetsApiClient.validateApiKey(key);
        expect(result.valid).toBe(false);
        expect(result.message).toBeDefined();
      });
    });

    test('validates correct spreadsheet ID format', () => {
      const result = GoogleSheetsApiClient.validateSpreadsheetId('1ABC123DEF456GHI789JKL012MNO345PQR678STU901VWX234');
      expect(result.valid).toBe(true);
    });

    test('rejects invalid spreadsheet ID formats', () => {
      const invalidIds = [
        '',
        null,
        undefined,
        'short',
        '1ABC@#$%^&*()',
        '1ABC 123 DEF'
      ];

      invalidIds.forEach(id => {
        const result = GoogleSheetsApiClient.validateSpreadsheetId(id);
        expect(result.valid).toBe(false);
        expect(result.message).toBeDefined();
      });
    });
  });

  describe('Connection Testing', () => {
    test('successful connection returns spreadsheet info', async () => {
      const mockResponse = {
        properties: { title: 'Test Vocabulary Sheet' },
        sheets: [
          { properties: { title: 'VocabularyData' } },
          { properties: { title: 'Settings' } }
        ]
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockResponse)
      });

      const result = await client.testConnection();

      expect(result.success).toBe(true);
      expect(result.spreadsheetTitle).toBe('Test Vocabulary Sheet');
      expect(result.sheets).toEqual(['VocabularyData', 'Settings']);
      expect(fetch).toHaveBeenCalledWith(
        `https://sheets.googleapis.com/v4/spreadsheets/${mockSpreadsheetId}?key=${mockApiKey}`
      );
    });

    test('handles 403 API key error', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden'
      });

      const result = await client.testConnection();

      expect(result.success).toBe(false);
      expect(result.message).toBe('API key invalid or lacks permissions');
    });

    test('handles 404 spreadsheet not found error', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      const result = await client.testConnection();

      expect(result.success).toBe(false);
      expect(result.message).toBe('Spreadsheet not found or not accessible');
    });

    test('handles network errors', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await client.testConnection();

      expect(result.success).toBe(false);
      expect(result.message).toBe('Network error');
    });
  });

  describe('Sheet Setup and Headers', () => {
    test('validates existing sheet with correct headers', async () => {
      // Mock spreadsheet info response
      const mockSpreadsheetResponse = {
        sheets: [{ properties: { title: 'VocabularyData' } }]
      };

      // Mock headers response
      const mockHeadersResponse = {
        values: [['Kanji', 'Reading', 'Meaning', 'Status', 'Date Added', 'Examples', 'ID']]
      };

      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValueOnce(mockSpreadsheetResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValueOnce(mockHeadersResponse)
        });

      const result = await client.ensureSheetSetup();

      expect(result.success).toBe(true);
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    test('detects missing sheet', async () => {
      const mockSpreadsheetResponse = {
        sheets: [{ properties: { title: 'Sheet1' } }] // Wrong sheet name
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockSpreadsheetResponse)
      });

      const result = await client.ensureSheetSetup();

      expect(result.success).toBe(false);
      expect(result.message).toContain('Sheet "VocabularyData" doesn\'t exist');
    });

    test('detects incorrect headers', async () => {
      const mockSpreadsheetResponse = {
        sheets: [{ properties: { title: 'VocabularyData' } }]
      };

      const mockHeadersResponse = {
        values: [['Wrong', 'Headers']]
      };

      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValueOnce(mockSpreadsheetResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValueOnce(mockHeadersResponse)
        });

      const result = await client.ensureSheetSetup();

      expect(result.success).toBe(false);
      expect(result.needsHeaders).toBe(true);
      expect(result.expectedHeaders).toEqual(['Kanji', 'Reading', 'Meaning', 'Status', 'Date Added', 'Examples', 'ID']);
    });
  });

  describe('Loading Vocabulary', () => {
    test('loads vocabulary data successfully', async () => {
      // Mock setup validation
      const mockSpreadsheetResponse = {
        sheets: [{ properties: { title: 'VocabularyData' } }]
      };
      const mockHeadersResponse = {
        values: [['Kanji', 'Reading', 'Meaning', 'Status', 'Date Added', 'Examples', 'ID']]
      };

      // Mock vocabulary data
      const mockVocabResponse = {
        values: [
          ['学校', 'がっこう', 'school', 'know_well', '2023-01-01T00:00:00.000Z', '[]', '1'],
          ['勉強', 'べんきょう', 'study', 'learning', '2023-01-02T00:00:00.000Z', '["Example sentence"]', '2']
        ]
      };

      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValueOnce(mockSpreadsheetResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValueOnce(mockHeadersResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValueOnce(mockVocabResponse)
        });

      const result = await client.loadVocabulary();

      expect(result.success).toBe(true);
      expect(result.vocabulary).toHaveLength(2);
      expect(result.vocabulary[0]).toEqual({
        id: '1',
        kanji: '学校',
        reading: 'がっこう',
        meaning: 'school',
        status: 'know_well',
        addedDate: '2023-01-01T00:00:00.000Z',
        examples: []
      });
      expect(result.vocabulary[1].examples).toEqual(['Example sentence']);
    });

    test('handles empty vocabulary sheet', async () => {
      // Mock setup validation (successful)
      const mockSpreadsheetResponse = {
        sheets: [{ properties: { title: 'VocabularyData' } }]
      };
      const mockHeadersResponse = {
        values: [['Kanji', 'Reading', 'Meaning', 'Status', 'Date Added', 'Examples', 'ID']]
      };

      // Mock empty vocabulary response
      const mockVocabResponse = {
        values: []
      };

      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValueOnce(mockSpreadsheetResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValueOnce(mockHeadersResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValueOnce(mockVocabResponse)
        });

      const result = await client.loadVocabulary();

      expect(result.success).toBe(true);
      expect(result.vocabulary).toHaveLength(0);
    });
  });

  describe('OAuth Authentication', () => {
    beforeEach(() => {
      // Mock Google OAuth library
      global.window.google = {
        accounts: {
          oauth2: {
            initTokenClient: jest.fn()
          }
        }
      };
    });

    test.skip('requests OAuth permission successfully', async () => {
      const mockTokenClient = {
        requestAccessToken: jest.fn()
      };

      // Mock script loading
      const mockScript = {
        src: '',
        onload: null,
        onerror: null
      };

      global.document.createElement.mockReturnValue(mockScript);

      // Mock successful OAuth
      global.window.google.accounts.oauth2.initTokenClient
        .mockReturnValueOnce(mockTokenClient) // First call for initialization
        .mockReturnValueOnce(mockTokenClient); // Second call for token request

      // Mock the callback directly
      global.window.google.accounts.oauth2.initTokenClient.mockImplementation((config) => {
        // Simulate immediate success
        setTimeout(() => {
          if (config.callback) {
            config.callback({ access_token: 'mock_access_token' });
          }
        }, 0);
        return mockTokenClient;
      });

      const result = await client.requestWritePermission();

      expect(result.success).toBe(true);
      expect(client.isOAuthAuthenticated).toBe(true);
      expect(client.accessToken).toBe('mock_access_token');
    }, 10000);

    test('fails when no client ID provided', async () => {
      const clientWithoutId = new GoogleSheetsApiClient(mockApiKey, mockSpreadsheetId);

      await expect(clientWithoutId.requestWritePermission()).rejects.toThrow('OAuth Client ID required');
    });
  });

  describe('Saving Vocabulary', () => {
    beforeEach(() => {
      client.isOAuthAuthenticated = true;
      client.accessToken = 'mock_access_token';
    });

    test('saves vocabulary successfully with OAuth', async () => {
      // Mock console.warn to avoid test noise
      const originalWarn = console.warn;
      console.warn = jest.fn();
      const vocabulary = [
        {
          id: 1,
          kanji: '学校',
          reading: 'がっこう',
          meaning: 'school',
          status: 'know_well',
          addedDate: '2023-01-01T00:00:00.000Z',
          examples: []
        }
      ];

      // Mock setup validation
      const mockSpreadsheetResponse = {
        sheets: [{ properties: { title: 'VocabularyData' } }]
      };
      const mockHeadersResponse = {
        values: [['Kanji', 'Reading', 'Meaning', 'Status', 'Date Added', 'Examples', 'ID']]
      };

      // Mock save responses
      const mockClearResponse = { ok: true };
      const mockSaveResponse = {
        ok: true,
        json: jest.fn().mockResolvedValueOnce({ updatedCells: 7 })
      };
      const mockTimestampResponse = { ok: true };

      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValueOnce(mockSpreadsheetResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValueOnce(mockHeadersResponse)
        })
        .mockResolvedValueOnce(mockClearResponse)
        .mockResolvedValueOnce(mockSaveResponse)
        .mockResolvedValueOnce(mockTimestampResponse);

      const result = await client.saveVocabulary(vocabulary);

      expect(result.success).toBe(true);
      expect(result.count).toBe(1);
      expect(fetch).toHaveBeenCalledTimes(5); // Setup (2) + Clear + Save + Timestamp
      
      // Restore console.warn
      console.warn = originalWarn;
    });

    test('fails without OAuth authentication', async () => {
      client.isOAuthAuthenticated = false;
      
      const result = await client.saveVocabulary([]);

      expect(result.success).toBe(false);
      expect(result.requiresOAuth).toBe(true);
    });

    test.skip('handles OAuth token expiration', async () => {
      const vocabulary = [{ id: 1, kanji: 'test', reading: 'test', meaning: 'test' }];

      // Mock console.warn to avoid test noise
      const originalWarn = console.warn;
      console.warn = jest.fn();

      // Mock setup validation success
      const mockSpreadsheetResponse = {
        sheets: [{ properties: { title: 'VocabularyData' } }]
      };
      const mockHeadersResponse = {
        values: [['Kanji', 'Reading', 'Meaning', 'Status', 'Date Added', 'Examples', 'ID']]
      };

      // Mock 401 response (token expired) for the clear operation
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValueOnce(mockSpreadsheetResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValueOnce(mockHeadersResponse)
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          statusText: 'Unauthorized'
        });

      const result = await client.saveVocabulary(vocabulary);

      expect(result.success).toBe(false);
      expect(result.requiresReauth).toBe(true);
      
      // Restore console.warn
      console.warn = originalWarn;
    });
  });

  describe('CSV Generation and Download', () => {
    test.skip('generates CSV content correctly', () => {
      const vocabulary = [
        {
          id: 1,
          kanji: '学校',
          reading: 'がっこう',
          meaning: 'school',
          status: 'know_well',
          addedDate: '2023-01-01T00:00:00.000Z',
          examples: ['Example sentence with "quotes"']
        }
      ];

      const csvContent = client.generateCsvData(vocabulary);

      expect(csvContent).toContain('"Kanji","Reading","Meaning","Status","Date Added","Examples","ID"');
      expect(csvContent).toContain('"学校"');
      expect(csvContent).toContain('"がっこう"');
      expect(csvContent).toContain('"school"');
      expect(csvContent).toContain('"know_well"');
      // Should escape quotes in examples - look for the actual format
      expect(csvContent).toContain('\\"\\"\\"');
    });

    test('downloads CSV file', () => {
      const vocabulary = [
        { id: 1, kanji: 'test', reading: 'test', meaning: 'test', status: 'learning', addedDate: new Date().toISOString(), examples: [] }
      ];

      const mockLink = {
        setAttribute: jest.fn(),
        click: jest.fn(),
        style: { visibility: '' }
      };
      
      global.document.createElement.mockReturnValue(mockLink);
      Object.defineProperty(mockLink, 'download', { value: true, writable: true });
      
      // Make sure createObjectURL returns the mocked URL
      global.URL.createObjectURL.mockReturnValue('mock-blob-url');

      client.downloadCsv(vocabulary, 'test-vocabulary.csv');

      expect(mockLink.setAttribute).toHaveBeenCalledWith('href', 'mock-blob-url');
      expect(mockLink.setAttribute).toHaveBeenCalledWith('download', 'test-vocabulary.csv');
      expect(mockLink.click).toHaveBeenCalled();
    });
  });

  describe('Example Parsing', () => {
    test('parses valid JSON examples', () => {
      const examplesString = '["Example 1", "Example 2"]';
      const result = client.parseExamples(examplesString);

      expect(result).toEqual(['Example 1', 'Example 2']);
    });

    test('handles invalid JSON gracefully', () => {
      const invalidJson = 'invalid json string';
      const result = client.parseExamples(invalidJson);

      expect(result).toEqual([]);
    });

    test('handles empty/null examples', () => {
      expect(client.parseExamples('')).toEqual([]);
      expect(client.parseExamples(null)).toEqual([]);
      expect(client.parseExamples(undefined)).toEqual([]);
    });
  });
});

describe('createGoogleSheetsClient Factory Function', () => {
  test('creates client instance with provided parameters', () => {
    const apiKey = 'test_key';
    const spreadsheetId = 'test_id';
    const clientId = 'test_client_id';

    const client = createGoogleSheetsClient(apiKey, spreadsheetId, clientId);

    expect(client).toBeInstanceOf(GoogleSheetsApiClient);
    expect(client.apiKey).toBe(apiKey);
    expect(client.spreadsheetId).toBe(spreadsheetId);
    expect(client.clientId).toBe(clientId);
  });

  test('creates client without optional clientId', () => {
    const apiKey = 'test_key';
    const spreadsheetId = 'test_id';

    const client = createGoogleSheetsClient(apiKey, spreadsheetId);

    expect(client).toBeInstanceOf(GoogleSheetsApiClient);
    expect(client.clientId).toBe(null);
  });
});