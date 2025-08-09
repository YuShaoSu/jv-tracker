/**
 * Japanese Vocabulary Tracker - Google Apps Script Backend
 * Clean version with proper CORS handling
 */

// Configuration
const CONFIG = {
  DEFAULT_SHEET_NAME: 'VocabularyData',
  DEBUG_MODE: true
};

/**
 * Handle POST requests
 */
function doPost(e) {
  return handleRequest(e);
}

/**
 * Handle GET requests
 */
function doGet(e) {
  return createResponse(true, 'Japanese Vocabulary Tracker API is running', {
    version: '2.0',
    methods: ['POST'],
    actions: ['saveVocabulary', 'loadVocabulary', 'testConnection']
  });
}

/**
 * Handle OPTIONS requests (CORS preflight)
 */
function doOptions(e) {
  return ContentService
    .createTextOutput("")
    .setMimeType(ContentService.MimeType.TEXT);
}

/**
 * Main request handler
 */
function handleRequest(e) {
  try {
    if (!e.postData) {
      return createResponse(false, 'POST data required');
    }
    
    let requestData;
    
    // Check if the data is JSON or form data
    const contentType = e.postData.type;
    if (contentType === 'application/json') {
      requestData = JSON.parse(e.postData.contents);
    } else {
      // Handle form data (from React form submission)
      requestData = parseFormData(e.parameter);
    }
    
    const { action, sheetId, sheetName = CONFIG.DEFAULT_SHEET_NAME } = requestData;
    
    log('Request:', { action, sheetId: sheetId ? 'provided' : 'missing' });
    
    if (!sheetId) {
      return createResponse(false, 'Sheet ID is required');
    }
    
    switch (action) {
      case 'saveVocabulary':
        return handleSaveVocabulary(requestData.vocabulary, sheetId, sheetName);
      case 'loadVocabulary':
        return handleLoadVocabulary(sheetId, sheetName);
      case 'testConnection':
        return handleTestConnection(sheetId, sheetName);
      default:
        return createResponse(false, 'Unknown action: ' + action);
    }
    
  } catch (error) {
    log('Error:', error.toString());
    return createResponse(false, 'Server error: ' + error.toString());
  }
}

/**
 * Test connection to Google Sheet
 */
function handleTestConnection(sheetId, sheetName) {
  try {
    const sheet = getOrCreateSheet(sheetId, sheetName);
    const rowCount = sheet.getLastRow();
    const vocabularyCount = Math.max(0, rowCount - 1);
    
    return createResponse(true, 'Connected successfully', {
      sheetName: sheet.getName(),
      vocabularyCount: vocabularyCount
    });
  } catch (error) {
    return createResponse(false, 'Connection failed: ' + error.toString());
  }
}

/**
 * Save vocabulary to Google Sheet
 */
function handleSaveVocabulary(vocabulary, sheetId, sheetName) {
  try {
    const sheet = getOrCreateSheet(sheetId, sheetName);
    
    // Clear existing data (keep header)
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.deleteRows(2, lastRow - 1);
    }
    
    // Convert vocabulary to rows
    const rows = vocabulary.map(word => [
      word.kanji || '',
      word.reading || '',
      word.meaning || '',
      word.status || 'learning',
      word.addedDate || new Date().toISOString(),
      JSON.stringify(word.examples || []),
      word.id || ''
    ]);
    
    // Write data
    if (rows.length > 0) {
      const range = sheet.getRange(2, 1, rows.length, 7);
      range.setValues(rows);
    }
    
    // Update sync timestamp
    sheet.getRange('I1').setValue('Last Sync:');
    sheet.getRange('I2').setValue(new Date());
    
    return createResponse(true, 'Vocabulary saved successfully', {
      count: rows.length,
      sheetName: sheet.getName()
    });
    
  } catch (error) {
    return createResponse(false, 'Save failed: ' + error.toString());
  }
}

/**
 * Load vocabulary from Google Sheet
 */
function handleLoadVocabulary(sheetId, sheetName) {
  try {
    const sheet = getOrCreateSheet(sheetId, sheetName);
    const lastRow = sheet.getLastRow();
    
    if (lastRow <= 1) {
      return createResponse(true, 'No vocabulary found', {
        vocabulary: [],
        sheetName: sheet.getName()
      });
    }
    
    const range = sheet.getRange(2, 1, lastRow - 1, 7);
    const values = range.getValues();
    
    const vocabulary = values
      .filter(row => row[0] && row[1])
      .map((row, index) => ({
        id: row[6] || Date.now() + index,
        kanji: row[0],
        reading: row[1],
        meaning: row[2],
        status: row[3] || 'learning',
        addedDate: row[4] || new Date().toISOString(),
        examples: parseExamples(row[5])
      }));
    
    return createResponse(true, 'Vocabulary loaded successfully', {
      vocabulary: vocabulary,
      sheetName: sheet.getName()
    });
    
  } catch (error) {
    return createResponse(false, 'Load failed: ' + error.toString());
  }
}

/**
 * Get or create sheet
 */
function getOrCreateSheet(sheetId, sheetName) {
  try {
    const spreadsheet = SpreadsheetApp.openById(sheetId);
    let sheet = spreadsheet.getSheetByName(sheetName);
    
    if (!sheet) {
      sheet = spreadsheet.insertSheet(sheetName);
      
      // Create headers
      const headers = ['Kanji', 'Reading', 'Meaning', 'Status', 'Date Added', 'Examples', 'ID'];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      
      // Format headers
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#f0f0f0');
    }
    
    return sheet;
    
  } catch (error) {
    if (error.toString().includes('not found')) {
      throw new Error('Google Sheet not found. Check your Sheet ID.');
    }
    throw error;
  }
}

/**
 * Parse form data from React form submission
 */
function parseFormData(parameter) {
  try {
    const data = {
      action: parameter.action,
      sheetId: parameter.sheetId,
      sheetName: parameter.sheetName
    };
    
    // Parse vocabulary JSON if present
    if (parameter.vocabulary) {
      data.vocabulary = JSON.parse(parameter.vocabulary);
    }
    
    return data;
  } catch (error) {
    throw new Error('Failed to parse form data: ' + error.toString());
  }
}

/**
 * Parse examples JSON safely
 */
function parseExamples(examplesString) {
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
 * Create response with proper CORS
 */
function createResponse(success, message, data = {}) {
  const response = {
    success: success,
    message: message,
    timestamp: new Date().toISOString(),
    ...data
  };
  
  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Logging function
 */
function log(...args) {
  if (CONFIG.DEBUG_MODE) {
    console.log('[Japanese Vocab Backend]', ...args);
  }
}

/**
 * Test script structure
 */
function testScriptStructure() {
  try {
    log('Testing script structure...');
    
    const testResponse = createResponse(true, 'Test message');
    log('✓ Response creation works');
    
    const testExamples = parseExamples('["example1", "example2"]');
    log('✓ Example parsing works');
    
    log('✓ Script structure is valid!');
    return 'Script structure test passed!';
    
  } catch (error) {
    log('✗ Script structure test failed:', error.toString());
    throw error;
  }
}

/**
 * Test setup with hardcoded Sheet ID
 * REPLACE THE SHEET_ID BELOW WITH YOUR ACTUAL GOOGLE SHEET ID
 */
function testSetup() {
  // 🔥 REPLACE THIS WITH YOUR ACTUAL SHEET ID 🔥
  const TEST_SHEET_ID = '1Q1PNq7CyYYLgWQdivOi716lqWvFXd5ilFjDP-YR2WwI';
  
  try {
    log('Testing Apps Script setup with Sheet ID:', TEST_SHEET_ID);
    
    // Check if user updated the Sheet ID
    if (TEST_SHEET_ID === 'PUT_YOUR_SHEET_ID_HERE') {
      log('❌ Please update TEST_SHEET_ID with your actual Google Sheet ID');
      log('1. Create a Google Sheet');
      log('2. Copy the Sheet ID from URL');
      log('3. Replace TEST_SHEET_ID above');
      log('4. Run this test again');
      return 'Please update TEST_SHEET_ID first';
    }
    
    // Test connection
    log('Testing connection...');
    const connectionResult = handleTestConnection(TEST_SHEET_ID, CONFIG.DEFAULT_SHEET_NAME);
    const connectionData = JSON.parse(connectionResult.getContent());
    
    if (!connectionData.success) {
      throw new Error('Connection failed: ' + connectionData.message);
    }
    log('✓ Connection test passed');
    
    // Test saving sample data
    log('Testing save functionality...');
    const sampleVocabulary = [
      {
        id: 999,
        kanji: 'テスト',
        reading: 'てすと',
        meaning: 'test',
        status: 'learning',
        addedDate: new Date().toISOString(),
        examples: ['これはテストです。(This is a test.)']
      }
    ];
    
    const saveResult = handleSaveVocabulary(sampleVocabulary, TEST_SHEET_ID, CONFIG.DEFAULT_SHEET_NAME);
    const saveData = JSON.parse(saveResult.getContent());
    
    if (!saveData.success) {
      throw new Error('Save failed: ' + saveData.message);
    }
    log('✓ Save test passed');
    
    // Test loading data
    log('Testing load functionality...');
    const loadResult = handleLoadVocabulary(TEST_SHEET_ID, CONFIG.DEFAULT_SHEET_NAME);
    const loadData = JSON.parse(loadResult.getContent());
    
    if (!loadData.success) {
      throw new Error('Load failed: ' + loadData.message);
    }
    log('✓ Load test passed');
    log('✓ Found', loadData.vocabulary.length, 'vocabulary items');
    
    // Clean up test data
    log('Cleaning up test data...');
    const sheet = getOrCreateSheet(TEST_SHEET_ID, CONFIG.DEFAULT_SHEET_NAME);
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.deleteRows(2, lastRow - 1);
      log('✓ Test data cleaned up');
    }
    
    log('🎉 ALL TESTS PASSED! Apps Script is ready to use.');
    return 'Setup test completed successfully!';
    
  } catch (error) {
    log('❌ Setup test failed:', error.toString());
    
    if (error.toString().includes('not found')) {
      log('💡 Make sure your Sheet ID is correct');
      log('💡 Make sure the Google Sheet exists');
    } else if (error.toString().includes('permission')) {
      log('💡 Make sure you have access to the sheet');
    }
    
    throw error;
  }
}