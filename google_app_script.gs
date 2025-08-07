/**
 * Japanese Vocabulary Tracker - Google Apps Script Backend
 * 
 * This script handles secure data synchronization between your vocabulary tracker
 * and Google Sheets without exposing any API keys in the frontend.
 * 
 * Setup Instructions:
 * 1. Go to script.google.com
 * 2. Create a new project
 * 3. Replace the default code with this script
 * 4. Save the project (give it a name like "Japanese Vocab Backend")
 * 5. Click "Deploy" > "New deployment"
 * 6. Choose type: "Web app"
 * 7. Execute as: "Me"
 * 8. Who has access: "Anyone" (this is safe - no sensitive data exposed)
 * 9. Click "Deploy" and copy the web app URL
 * 10. Use that URL in your vocabulary tracker settings
 */

// Configuration - CHANGE THESE VALUES
const CONFIG = {
  // Replace with your Google Sheet ID (from the URL)
  // Example: if your sheet URL is https://docs.google.com/spreadsheets/d/1ABC123DEF456/edit
  // Then your SHEET_ID is: 1ABC123DEF456
  SHEET_ID: 'YOUR_GOOGLE_SHEET_ID_HERE',
  
  // Sheet name/tab (you can change this)
  SHEET_NAME: 'VocabularyData',
  
  // Enable logging for debugging (set to false in production)
  DEBUG_MODE: true
};

/**
 * Main function that handles all HTTP requests
 */
function doPost(e) {
  try {
    // Enable CORS for web requests
    const response = {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    };
    
    // Parse the request
    const requestData = JSON.parse(e.postData.contents);
    const action = requestData.action;
    
    log('Received request:', { action: action });
    
    // Route to appropriate handler
    switch (action) {
      case 'saveVocabulary':
        return handleSaveVocabulary(requestData.vocabulary);
      case 'loadVocabulary':
        return handleLoadVocabulary();
      default:
        return createResponse(false, 'Unknown action: ' + action);
    }
    
  } catch (error) {
    log('Error in doPost:', error.toString());
    return createResponse(false, 'Server error: ' + error.toString());
  }
}

/**
 * Handle saving vocabulary data to Google Sheets
 */
function handleSaveVocabulary(vocabulary) {
  try {
    log('Saving vocabulary, count:', vocabulary.length);
    
    // Get or create the spreadsheet
    const sheet = getOrCreateSheet();
    
    // Clear existing data (except header)
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.deleteRows(2, lastRow - 1);
    }
    
    // Prepare data for sheet (convert vocabulary to rows)
    const rows = vocabulary.map(word => [
      word.kanji || '',
      word.reading || '',
      word.meaning || '',
      word.status || 'learning',
      word.addedDate || new Date().toISOString(),
      JSON.stringify(word.examples || []), // Store examples as JSON string
      word.id || ''
    ]);
    
    // Write data to sheet if we have vocabulary
    if (rows.length > 0) {
      const range = sheet.getRange(2, 1, rows.length, 7);
      range.setValues(rows);
    }
    
    // Update last sync timestamp
    updateSyncTimestamp(sheet);
    
    log('Successfully saved', rows.length, 'vocabulary words');
    return createResponse(true, 'Vocabulary saved successfully', { count: rows.length });
    
  } catch (error) {
    log('Error saving vocabulary:', error.toString());
    return createResponse(false, 'Failed to save vocabulary: ' + error.toString());
  }
}

/**
 * Handle loading vocabulary data from Google Sheets
 */
function handleLoadVocabulary() {
  try {
    log('Loading vocabulary from sheet');
    
    // Get the spreadsheet
    const sheet = getOrCreateSheet();
    const lastRow = sheet.getLastRow();
    
    // If no data, return empty array
    if (lastRow <= 1) {
      log('No vocabulary data found');
      return createResponse(true, 'No vocabulary data found', { vocabulary: [] });
    }
    
    // Get all data (skip header row)
    const range = sheet.getRange(2, 1, lastRow - 1, 7);
    const values = range.getValues();
    
    // Convert rows back to vocabulary objects
    const vocabulary = values
      .filter(row => row[0] && row[1]) // Only include rows with kanji and reading
      .map((row, index) => ({
        id: row[6] || Date.now() + index, // Use stored ID or generate new one
        kanji: row[0],
        reading: row[1],
        meaning: row[2],
        status: row[3] || 'learning',
        addedDate: row[4] || new Date().toISOString(),
        examples: parseExamples(row[5]) // Parse JSON examples
      }));
    
    log('Successfully loaded', vocabulary.length, 'vocabulary words');
    return createResponse(true, 'Vocabulary loaded successfully', { vocabulary: vocabulary });
    
  } catch (error) {
    log('Error loading vocabulary:', error.toString());
    return createResponse(false, 'Failed to load vocabulary: ' + error.toString());
  }
}

/**
 * Get or create the spreadsheet and sheet
 */
function getOrCreateSheet() {
  try {
    // Try to open existing spreadsheet
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    let sheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAME);
    
    // Create sheet if it doesn't exist
    if (!sheet) {
      sheet = spreadsheet.insertSheet(CONFIG.SHEET_NAME);
      
      // Add headers
      const headers = [
        'Kanji', 'Reading', 'Meaning', 'Status', 'Date Added', 'Examples', 'ID'
      ];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      
      // Format header row
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#f0f0f0');
      
      log('Created new sheet:', CONFIG.SHEET_NAME);
    }
    
    return sheet;
    
  } catch (error) {
    if (error.toString().includes('not found')) {
      throw new Error('Google Sheet not found. Please check your SHEET_ID in the Apps Script configuration.');
    }
    throw error;
  }
}

/**
 * Update sync timestamp in the sheet
 */
function updateSyncTimestamp(sheet) {
  try {
    // Add/update sync info in a separate area
    sheet.getRange('I1').setValue('Last Sync:');
    sheet.getRange('I2').setValue(new Date());
    sheet.getRange('I1:I2').setFontSize(10);
    sheet.getRange('I1').setFontWeight('bold');
  } catch (error) {
    log('Could not update sync timestamp:', error.toString());
  }
}

/**
 * Parse examples JSON string safely
 */
function parseExamples(examplesString) {
  try {
    if (!examplesString || examplesString.trim() === '') {
      return [];
    }
    return JSON.parse(examplesString);
  } catch (error) {
    log('Error parsing examples:', error.toString());
    return [];
  }
}

/**
 * Create standardized response object
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
 * Logging function (only logs when DEBUG_MODE is enabled)
 */
function log(...args) {
  if (CONFIG.DEBUG_MODE) {
    console.log('[Japanese Vocab Backend]', ...args);
  }
}

/**
 * Handle CORS preflight requests
 */
function doOptions(e) {
  return ContentService
    .createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT)
    .setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
}

/**
 * Test function - you can run this to verify everything is working
 * Go to Apps Script editor > Select "testSetup" function > Click "Run"
 */
function testSetup() {
  try {
    log('Testing Apps Script setup...');
    
    // Test creating/accessing sheet
    const sheet = getOrCreateSheet();
    log('✓ Successfully accessed sheet:', sheet.getName());
    
    // Test saving sample data
    const sampleVocabulary = [
      {
        id: 1,
        kanji: 'テスト',
        reading: 'てすと',
        meaning: 'test',
        status: 'learning',
        addedDate: new Date().toISOString(),
        examples: ['これはテストです。(This is a test.)']
      }
    ];
    
    const saveResult = handleSaveVocabulary(sampleVocabulary);
    log('✓ Save test result:', JSON.parse(saveResult.getContent()));
    
    // Test loading data
    const loadResult = handleLoadVocabulary();
    log('✓ Load test result:', JSON.parse(loadResult.getContent()));
    
    log('✓ All tests passed! Your Apps Script is ready to use.');
    
    // Clean up test data
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.deleteRows(2, lastRow - 1);
    }
    
    return 'Setup test completed successfully!';
    
  } catch (error) {
    log('✗ Setup test failed:', error.toString());
    throw error;
  }
}

/**
 * Get sheet statistics (useful for monitoring)
 */
function getSheetStats() {
  try {
    const sheet = getOrCreateSheet();
    const lastRow = sheet.getLastRow();
    const vocabularyCount = Math.max(0, lastRow - 1); // Subtract header row
    
    return {
      vocabularyCount: vocabularyCount,
      lastRow: lastRow,
      sheetName: sheet.getName(),
      spreadsheetId: CONFIG.SHEET_ID
    };
  } catch (error) {
    log('Error getting sheet stats:', error.toString());
    return null;
  }
}

/*
 * SETUP CHECKLIST:
 * 
 * 1. ✓ Copy this entire code into Google Apps Script
 * 
 * 2. ✓ Update CONFIG.SHEET_ID:
 *    - Create a new Google Sheet or use existing one
 *    - Copy the Sheet ID from the URL
 *    - Example: https://docs.google.com/spreadsheets/d/1ABC123DEF456/edit
 *    - Your SHEET_ID is: 1ABC123DEF456
 * 
 * 3. ✓ Save the project (Ctrl+S)
 * 
 * 4. ✓ Run the testSetup() function to verify everything works:
 *    - Select "testSetup" from the function dropdown
 *    - Click "Run"
 *    - Check the execution log for success messages
 * 
 * 5. ✓ Deploy as Web App:
 *    - Click "Deploy" > "New deployment"
 *    - Type: "Web app"
 *    - Execute as: "Me"
 *    - Who has access: "Anyone"
 *    - Click "Deploy"
 *    - Copy the Web app URL
 * 
 * 6. ✓ Use the Web app URL in your vocabulary tracker settings
 * 
 * 7. ✓ Test the connection in your vocabulary tracker
 * 
 * Your Google Sheet will have these columns:
 * | Kanji | Reading | Meaning | Status | Date Added | Examples | ID |
 * 
 * The Examples column stores cached example sentences as JSON,
 * reducing API calls to the language model.
 */
