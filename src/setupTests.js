// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}

  observe() {
    return null;
  }

  disconnect() {
    return null;
  }

  unobserve() {
    return null;
  }
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}

  observe() {
    return null;
  }

  disconnect() {
    return null;
  }

  unobserve() {
    return null;
  }
};

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock Google APIs
global.gapi = {
  load: jest.fn((api, callback) => {
    if (typeof callback === 'function') {
      callback();
    }
  }),
  auth2: {
    init: jest.fn().mockResolvedValue({}),
    getAuthInstance: jest.fn(() => ({
      signIn: jest.fn().mockResolvedValue({}),
      signOut: jest.fn().mockResolvedValue({}),
      isSignedIn: {
        get: jest.fn(() => false),
        listen: jest.fn()
      }
    }))
  },
  client: {
    init: jest.fn().mockResolvedValue({}),
    request: jest.fn().mockResolvedValue({ result: {} })
  }
};

// Mock Google Identity Services
global.google = {
  accounts: {
    oauth2: {
      initTokenClient: jest.fn(() => ({
        requestAccessToken: jest.fn()
      }))
    }
  }
};

// Mock alert and confirm
global.alert = jest.fn();
global.confirm = jest.fn(() => true);

// Mock console methods to avoid noise in tests
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning:') || 
       args[0].includes('React does not recognize') ||
       args[0].includes('validateDOMNesting'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };

  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('componentWillReceiveProps') ||
       args[0].includes('componentWillMount'))
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});