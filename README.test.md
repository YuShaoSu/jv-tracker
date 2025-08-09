# Test Documentation

This document explains the test setup and how to run tests for the Japanese Vocabulary Tracker application.

## Test Structure

```
src/
├── __tests__/
│   ├── setupTests.js              # Jest test setup and global mocks
│   ├── testConfig.js              # Test configuration and utilities
│   ├── App.test.js                # Main App component tests
│   └── integration/
│       └── googleSheets.integration.test.js
├── components/
│   └── __tests__/
│       └── JapaneseVocabTracker.test.jsx
└── services/
    └── __tests__/
        ├── googleSheetsApi.test.js
        └── exampleGenerator.test.js
```

## Running Tests

### Unit and Integration Tests
```bash
# Run all tests
npm test

# Run tests in watch mode (development)
npm test -- --watch

# Run tests with coverage report
npm test -- --coverage

# Run specific test file
npm test -- JapaneseVocabTracker.test.jsx

# Run tests matching a pattern
npm test -- --testNamePattern="vocabulary"
```

### Integration Tests
Integration tests require real API credentials to test against actual Google Sheets and AI services.

1. **Setup Integration Testing:**
   ```bash
   # Copy environment template
   cp .env.test .env.test.local
   ```

2. **Configure Credentials in .env.test.local:**
   ```env
   # Replace with your actual credentials
   REACT_APP_TEST_GOOGLE_API_KEY=AIzaSyA_YOUR_REAL_API_KEY_HERE
   REACT_APP_TEST_GOOGLE_SHEET_ID=1ABC123_YOUR_REAL_SHEET_ID_HERE  
   REACT_APP_TEST_GOOGLE_CLIENT_ID=123456-your-client-id.apps.googleusercontent.com
   REACT_APP_TEST_GEMINI_API_KEY=AIzaSyB_YOUR_GEMINI_KEY_HERE
   
   # Enable integration tests
   REACT_APP_ENABLE_GOOGLE_SHEETS_INTEGRATION=true
   REACT_APP_ENABLE_AI_INTEGRATION=true
   ```

3. **Create Test Google Sheet:**
   - Create a new Google Sheet for testing
   - Add a sheet tab named "VocabularyData" 
   - Add headers: `Kanji | Reading | Meaning | Status | Date Added | Examples | ID`
   - Share the sheet or make it public readable
   - Copy the Sheet ID from the URL

4. **Run Integration Tests:**
   ```bash
   # Run only integration tests
   npm test -- --testPathPattern=integration

   # Run with environment variables
   REACT_APP_ENABLE_GOOGLE_SHEETS_INTEGRATION=true npm test
   ```

## Test Configuration

### Credentials and API Keys

The test suite uses placeholder credentials by default. For full integration testing, you need:

1. **Google Sheets API Key:**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Enable Google Sheets API
   - Create API key
   - Add to `REACT_APP_TEST_GOOGLE_API_KEY`

2. **Google OAuth Client ID (Optional):**
   - Create OAuth 2.0 Client ID
   - Add authorized origins: `http://localhost:3000`
   - Add to `REACT_APP_TEST_GOOGLE_CLIENT_ID`

3. **Google Gemini API Key (Optional):**
   - Get key from [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Add to `REACT_APP_TEST_GEMINI_API_KEY`

### Test Categories

1. **Unit Tests** - Test individual functions and components in isolation
2. **Integration Tests** - Test interactions with external APIs and services  
3. **Component Tests** - Test React component behavior and user interactions
4. **Service Tests** - Test API clients and business logic

## Test Utilities

The test suite includes utilities in `src/__tests__/testConfig.js`:

```javascript
import { testUtils, MOCK_VOCABULARY, TEST_CREDENTIALS } from '../testConfig';

// Create mock localStorage
const mockStorage = testUtils.createMockLocalStorage();

// Generate test vocabulary
const testWord = testUtils.generateRandomWord();

// Validate Japanese text
const hasJapanese = testUtils.containsJapanese('学校');

// Wait for async operations
await testUtils.waitForAsync(100);
```

## Writing New Tests

### Component Tests
```javascript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import YourComponent from '../YourComponent';

describe('YourComponent', () => {
  test('renders correctly', () => {
    render(<YourComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  test('handles user interaction', async () => {
    const user = userEvent.setup();
    render(<YourComponent />);
    
    await user.click(screen.getByRole('button'));
    await waitFor(() => {
      expect(screen.getByText('Result')).toBeInTheDocument();
    });
  });
});
```

### Service Tests
```javascript
import { YourService } from '../services/yourService';

describe('YourService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('handles API responses', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ data: 'test' })
    });

    const result = await YourService.fetchData();
    
    expect(result.success).toBe(true);
    expect(fetch).toHaveBeenCalledWith(expectedUrl);
  });
});
```

## Coverage Goals

The test suite aims for:
- **70%+ line coverage** - Each line of code should be executed by tests
- **70%+ branch coverage** - Each code path should be tested
- **70%+ function coverage** - Each function should have tests
- **70%+ statement coverage** - Each statement should be tested

View coverage report:
```bash
npm test -- --coverage --watchAll=false
open coverage/lcov-report/index.html
```

## Mock Strategy

Tests use mocks for:

1. **External APIs** - Google Sheets, AI services
2. **Browser APIs** - localStorage, fetch, DOM methods
3. **Heavy Dependencies** - Large libraries, complex modules
4. **Time-dependent code** - Dates, timeouts, animations

## Debugging Tests

```bash
# Run tests with verbose output
npm test -- --verbose

# Run single test in debug mode
npm test -- --testNamePattern="specific test" --verbose

# Use console.log for debugging (remove before committing)
console.log('Debug value:', someVariable);
```

## CI/CD Integration

Tests run automatically on:
- Pull requests
- Push to main branch
- Release builds

Environment variables for CI:
```env
CI=true
NODE_ENV=test
REACT_APP_ENABLE_GOOGLE_SHEETS_INTEGRATION=false  # Disable for CI
```

## Common Issues

### Failed Tests
1. **API Rate Limits** - Use mocks or reduce test frequency
2. **Network Issues** - Mock external dependencies
3. **Timing Issues** - Use `waitFor` or increase timeouts
4. **Environment Issues** - Check node version, dependencies

### Integration Test Issues
1. **Invalid Credentials** - Verify API keys are correct
2. **Sheet Permissions** - Ensure test sheet is accessible
3. **Quota Exceeded** - Wait or use different credentials
4. **Network Connectivity** - Check internet connection

## Best Practices

1. **Keep tests independent** - Each test should work in isolation
2. **Use descriptive names** - Test names should explain what they verify
3. **Mock external dependencies** - Don't rely on external services for unit tests
4. **Test user behavior** - Focus on what users actually do
5. **Keep tests fast** - Avoid unnecessary delays and heavy operations
6. **Clean up after tests** - Reset state, clear mocks, remove test data

## Contributing

When adding new tests:

1. Follow the existing test structure
2. Use the provided test utilities
3. Add both positive and negative test cases
4. Update this documentation if needed
5. Ensure tests pass before submitting PR

For questions about testing, check the test files for examples or refer to:
- [React Testing Library docs](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest documentation](https://jestjs.io/docs/getting-started)