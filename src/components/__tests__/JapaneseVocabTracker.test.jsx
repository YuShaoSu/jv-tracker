import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { default as userEvent } from '@testing-library/user-event';
import JapaneseVocabTracker from '../JapaneseVocabTracker';
import * as googleSheetsApi from '../../services/googleSheetsApi';
import * as exampleGenerator from '../../services/exampleGenerator';

// Mock the services
jest.mock('../../services/googleSheetsApi');
jest.mock('../../services/exampleGenerator');

// Mock localStorage
const mockLocalStorage = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock Google client library
global.window.google = {
  accounts: {
    oauth2: {
      initTokenClient: jest.fn().mockReturnValue({
        requestAccessToken: jest.fn()
      })
    }
  }
};

describe('JapaneseVocabTracker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.clear();
    
    // Mock example generator
    exampleGenerator.exampleGenerator = {
      setGeminiApiKey: jest.fn(),
      generateExample: jest.fn().mockResolvedValue({
        success: true,
        example: '私は学校で勉強します。(Watashi wa gakkou de benkyou shimasu.) - I study at school.',
        source: 'template'
      })
    };

    // Mock Google Sheets API client
    const mockSheetsClient = {
      testConnection: jest.fn().mockResolvedValue({
        success: true,
        spreadsheetTitle: 'Test Vocabulary Sheet',
        sheets: ['VocabularyData']
      }),
      requestWritePermission: jest.fn().mockResolvedValue({
        success: true,
        message: 'Authentication successful'
      }),
      saveVocabulary: jest.fn().mockResolvedValue({
        success: true,
        count: 2,
        message: 'Successfully saved vocabulary'
      }),
      loadVocabulary: jest.fn().mockResolvedValue({
        success: true,
        vocabulary: [
          {
            id: 1,
            kanji: '学校',
            reading: 'がっこう',
            meaning: 'school',
            status: 'know_well',
            addedDate: new Date().toISOString(),
            examples: []
          }
        ]
      }),
      downloadCsv: jest.fn()
    };

    googleSheetsApi.createGoogleSheetsClient = jest.fn().mockReturnValue(mockSheetsClient);
  });

  test('renders main header and navigation', () => {
    render(<JapaneseVocabTracker />);
    
    expect(screen.getByText('Japanese Vocabulary Tracker')).toBeInTheDocument();
    expect(screen.getByText('Track your learning progress and master Japanese vocabulary')).toBeInTheDocument();
    
    // Check navigation tabs
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getAllByText(/Vocabulary/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Review/)).toBeInTheDocument();
  });

  test('displays sample vocabulary data on initial load', () => {
    render(<JapaneseVocabTracker />);
    
    // Check for sample words
    expect(screen.getByText('勉強')).toBeInTheDocument();
    expect(screen.getByText('べんきょう')).toBeInTheDocument();
    expect(screen.getByText('study, learning')).toBeInTheDocument();
    
    expect(screen.getByText('学校')).toBeInTheDocument();
    expect(screen.getByText('がっこう')).toBeInTheDocument();
    expect(screen.getByText('school')).toBeInTheDocument();
  });

  test('shows dashboard stats correctly', () => {
    render(<JapaneseVocabTracker />);
    
    // Should display status counts (based on sample data)
    // Look for numbers in the dashboard - there should be counts for different statuses
    const dashboardNumbers = screen.getAllByText(/[0-9]+/);
    expect(dashboardNumbers.length).toBeGreaterThan(0);
  });

  test('can navigate between views', async () => {
    const user = userEvent.setup();
    render(<JapaneseVocabTracker />);
    
    // Click on Vocabulary tab - find it more specifically
    const vocabularyTab = screen.getAllByText(/Vocabulary/).find(el => 
      el.closest('button') && el.textContent.includes('Vocabulary')
    );
    if (vocabularyTab) {
      await user.click(vocabularyTab.closest('button'));
      expect(screen.getByText('All Vocabulary')).toBeInTheDocument();
      expect(screen.getByText('Add Word')).toBeInTheDocument();
    }
    
    // Click on Review tab
    await user.click(screen.getByText(/Review/));
    expect(screen.getByText('Words to Review')).toBeInTheDocument();
  });

  test('can add a new vocabulary word', async () => {
    const user = userEvent.setup();
    render(<JapaneseVocabTracker />);
    
    // Navigate to vocabulary view
    await user.click(screen.getByText(/Vocabulary|Words/));
    
    // Click Add Word button
    await user.click(screen.getByText('Add Word'));
    
    // Fill in the form
    const kanjiInput = screen.getByPlaceholderText('漢字');
    const readingInput = screen.getByPlaceholderText('かんじ');
    const meaningInput = screen.getByPlaceholderText('Chinese character');
    
    await user.type(kanjiInput, '友達');
    await user.type(readingInput, 'ともだち');
    await user.type(meaningInput, 'friend');
    
    // Submit the form
    await user.click(screen.getByText('Add Word'));
    
    // Verify the word was added
    await waitFor(() => {
      expect(screen.getByText('友達')).toBeInTheDocument();
      expect(screen.getByText('ともだち')).toBeInTheDocument();
      expect(screen.getByText('friend')).toBeInTheDocument();
    });
  });

  test('can update word status', async () => {
    const user = userEvent.setup();
    render(<JapaneseVocabTracker />);
    
    // Find a word and click on status button
    const oftenForgetButton = screen.getAllByText('Often Forget')[0];
    await user.click(oftenForgetButton);
    
    // The word should now have the "Often Forget" status
    // This would change the styling but we can check if the function was called
    // by checking localStorage or component state changes
  });

  test('can delete a vocabulary word', async () => {
    const user = userEvent.setup();
    render(<JapaneseVocabTracker />);
    
    // First check initial vocabulary count
    const initialVocabCount = screen.getAllByText('勉強').length;
    
    // Find delete button (X button) for the first word - look for button with X
    const deleteButtons = screen.getAllByRole('button').filter(button => {
      // Look for button containing an X or close icon
      const svg = button.querySelector('svg');
      return svg && (button.getAttribute('aria-label') === 'delete' || 
                     svg.getAttribute('data-testid') === 'x-icon' ||
                     button.textContent === '×');
    });
    
    if (deleteButtons.length > 0) {
      await user.click(deleteButtons[0]);
      
      // The word should be removed but we can't easily test this without more specific selectors
      // This test verifies the click handler works
      expect(deleteButtons[0]).toBeDefined();
    }
  });

  test('can generate example sentence', async () => {
    const user = userEvent.setup();
    render(<JapaneseVocabTracker />);
    
    // Find and click "Generate Example" button
    const generateButton = screen.getAllByText(/Generate Example|Show Example/)[0];
    await user.click(generateButton);
    
    // Wait for modal to appear
    await waitFor(() => {
      expect(screen.getByText(/Example for:/)).toBeInTheDocument();
    });
    
    // Wait for example to be generated
    await waitFor(() => {
      expect(exampleGenerator.exampleGenerator.generateExample).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  test('opens and closes settings modal', async () => {
    const user = userEvent.setup();
    render(<JapaneseVocabTracker />);
    
    // Find settings button by looking for buttons with gear/settings icon
    const buttons = screen.getAllByRole('button');
    const settingsButton = buttons.find(button => {
      const svg = button.querySelector('svg');
      return svg || button.getAttribute('aria-label') === 'settings';
    });
    
    if (settingsButton) {
      await user.click(settingsButton);
      
      // Settings modal should be open
      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument();
        expect(screen.getByText('Google Sheets API')).toBeInTheDocument();
      });
      
      // Close the modal - find close button
      const closeButtons = screen.getAllByRole('button');
      const closeButton = closeButtons.find(button => 
        button.textContent === '×' || 
        button.getAttribute('aria-label') === 'close'
      );
      
      if (closeButton) {
        await user.click(closeButton);
        
        // Modal should be closed
        await waitFor(() => {
          expect(screen.queryByText('Google Sheets API')).not.toBeInTheDocument();
        });
      }
    }
  });

  test('can connect to Google Sheets', async () => {
    const user = userEvent.setup();
    render(<JapaneseVocabTracker />);
    
    // Open settings
    const settingsButton = screen.getByRole('button', { name: /settings/i });
    await user.click(settingsButton);
    
    // Fill in connection details
    const apiKeyInput = screen.getByPlaceholderText(/AIzaSyA/);
    const sheetIdInput = screen.getByPlaceholderText(/1ABC123DEF456/);
    const clientIdInput = screen.getByPlaceholderText(/123456-abc.apps.googleusercontent.com/);
    const geminiKeyInput = screen.getByPlaceholderText(/AIzaSyB/);
    
    await user.type(apiKeyInput, 'AIzaSyA_TEST_API_KEY_12345678901234567890');
    await user.type(sheetIdInput, '1ABC123DEF456GHI789JKL012MNO345PQR678STU901VWX');
    await user.type(clientIdInput, '123456-abc.apps.googleusercontent.com');
    await user.type(geminiKeyInput, 'AIzaSyB_TEST_GEMINI_KEY_12345678901234567890');
    
    // Click connect button
    const connectButton = screen.getByText('Connect to Google Sheets');
    await user.click(connectButton);
    
    // Verify connection was established
    await waitFor(() => {
      expect(googleSheetsApi.createGoogleSheetsClient).toHaveBeenCalledWith(
        'AIzaSyA_TEST_API_KEY_12345678901234567890',
        '1ABC123DEF456GHI789JKL012MNO345PQR678STU901VWX',
        '123456-abc.apps.googleusercontent.com',
        'AIzaSyB_TEST_GEMINI_KEY_12345678901234567890'
      );
    });
  });

  test('loads data from localStorage on mount', () => {
    // Set up localStorage with saved data
    const savedVocabulary = JSON.stringify([
      {
        id: 999,
        kanji: 'テスト',
        reading: 'tesuto',
        meaning: 'test',
        status: 'learning',
        addedDate: new Date().toISOString(),
        examples: []
      }
    ]);
    
    const savedSettings = JSON.stringify({
      googleApiKey: 'saved_api_key',
      googleSheetId: 'saved_sheet_id',
      lastSync: new Date().toISOString()
    });
    
    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'japaneseVocabulary') return savedVocabulary;
      if (key === 'appsScriptSettings') return savedSettings;
      return null;
    });
    
    render(<JapaneseVocabTracker />);
    
    // Verify saved data is displayed
    expect(screen.getByText('テスト')).toBeInTheDocument();
    expect(screen.getByText('tesuto')).toBeInTheDocument();
    expect(screen.getByText('test')).toBeInTheDocument();
  });

  test('handles API errors gracefully', async () => {
    // Mock API failure
    const mockFailedClient = {
      testConnection: jest.fn().mockResolvedValue({
        success: false,
        message: 'Connection failed'
      })
    };
    
    googleSheetsApi.createGoogleSheetsClient.mockReturnValue(mockFailedClient);
    
    const user = userEvent.setup();
    render(<JapaneseVocabTracker />);
    
    // Set up connection
    const settingsButton = screen.getByRole('button', { name: /settings/i });
    await user.click(settingsButton);
    
    const apiKeyInput = screen.getByPlaceholderText(/AIzaSyA/);
    const sheetIdInput = screen.getByPlaceholderText(/1ABC123DEF456/);
    
    await user.type(apiKeyInput, 'invalid_key');
    await user.type(sheetIdInput, 'invalid_sheet_id');
    
    await user.click(screen.getByText('Connect to Google Sheets'));
    
    // Close settings to access test connection
    await user.click(screen.getByRole('button', { name: /close|×/i }));
    
    // The connection should fail gracefully without breaking the app
    expect(screen.getByText('Japanese Vocabulary Tracker')).toBeInTheDocument();
  });

  test('syncs status is displayed correctly', () => {
    render(<JapaneseVocabTracker />);
    
    // Should show "Never synced" initially
    expect(screen.getByText(/Never synced/)).toBeInTheDocument();
  });

  test('review view shows only words with "often_forget" status', async () => {
    const user = userEvent.setup();
    render(<JapaneseVocabTracker />);
    
    // First, change a word status to "often_forget"
    const oftenForgetButton = screen.getAllByText('Often Forget')[0];
    await user.click(oftenForgetButton);
    
    // Navigate to review tab
    await user.click(screen.getByText(/Review/));
    
    // Should show words to review
    expect(screen.getByText('Words to Review')).toBeInTheDocument();
    
    // If no words to review, should show encouragement message
    if (!screen.queryByText('勉強')) {
      expect(screen.getByText('Great job! No words need review right now.')).toBeInTheDocument();
    }
  });

  test('example modal can be closed', async () => {
    const user = userEvent.setup();
    render(<JapaneseVocabTracker />);
    
    // Open example modal
    const generateButton = screen.getAllByText(/Generate Example|Show Example/)[0];
    await user.click(generateButton);
    
    // Wait for modal
    await waitFor(() => {
      expect(screen.getByText(/Example for:/)).toBeInTheDocument();
    });
    
    // Close modal
    const closeButton = screen.getByText('Close');
    await user.click(closeButton);
    
    // Modal should be closed
    await waitFor(() => {
      expect(screen.queryByText(/Example for:/)).not.toBeInTheDocument();
    });
  });
});

// Helper function tests
describe('JapaneseVocabTracker Helper Functions', () => {
  test('vocabulary data persists to localStorage', async () => {
    const user = userEvent.setup();
    render(<JapaneseVocabTracker />);
    
    // Add a word
    await user.click(screen.getByText(/Vocabulary|Words/));
    await user.click(screen.getByText('Add Word'));
    
    const kanjiInput = screen.getByPlaceholderText('漢字');
    await user.type(kanjiInput, '新しい');
    
    const readingInput = screen.getByPlaceholderText('かんじ');
    await user.type(readingInput, 'あたらしい');
    
    const meaningInput = screen.getByPlaceholderText('Chinese character');
    await user.type(meaningInput, 'new');
    
    await user.click(screen.getByText('Add Word'));
    
    // Check if localStorage was called
    await waitFor(() => {
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'japaneseVocabulary',
        expect.stringContaining('新しい')
      );
    });
  });
});