# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Start development server
npm start

# Run tests (single run with coverage)
npm test -- --coverage --watchAll=false

# Run tests in watch mode
npm test

# Run a single test file
npm test -- --testPathPattern=exampleGenerator

# Build for production
npm run build

# Deploy to GitHub Pages
npm run deploy
```

## Architecture Overview

This is a React-based Japanese vocabulary tracker with Google Sheets integration. The application follows a clean architecture pattern with custom hooks, service classes, and modular components.

### Core Architecture Patterns

**Authentication Flow**: The app supports two authentication modes:
- **OAuth-Only Mode** (recommended): Direct Google OAuth without API keys
- **API Key + OAuth Mode** (legacy): Uses Google Sheets API key + OAuth for write access

**Data Flow**: Local storage → Custom hooks → Service classes → Google Sheets API/OAuth

**State Management**: Uses React hooks with localStorage persistence, no external state management library.

### Key Components Structure

- **JapaneseVocabTracker.jsx**: Main orchestrator component that uses custom hooks and manages view routing
- **Custom Hooks** (`/src/hooks/`):
  - `useVocabulary`: Manages vocabulary CRUD operations and localStorage
  - `useGoogleSheets`: Handles Google Sheets API integration and OAuth
  - `useExampleGeneration`: Manages AI-powered example sentence generation
- **Service Classes** (`/src/services/`):
  - `GoogleSheetsApiClient`: Direct Google Sheets API integration with OAuth 2.0
  - `ExampleGenerator`: Gemini AI integration for Japanese example sentences

### Google Sheets Integration

The app uses a dual-authentication approach:

1. **GoogleSheetsApiClient** class handles both API key and OAuth-only modes
2. OAuth Client ID is hard-coded in `/src/config/googleAuth.js` (safe to expose, domain-restricted)
3. Factory functions: `createGoogleSheetsClient()` and `createOAuthOnlySheetsClient()`

Expected Google Sheet structure:
```
| Kanji | Reading | Meaning | Status | Date Added | Examples | ID |
```

### Component Architecture

**View Components**: DashboardView, VocabularyView, ReviewView - Pure presentation components
**Modal Components**: SettingsModal, AddWordModal, ExampleSentenceModal - Handle specific user interactions
**Shared Components**: WordCard - Reusable vocabulary display component

### State Persistence

- **localStorage Keys**:
  - `vocabulary`: Main vocabulary array
  - `appsScriptSettings`: Google Sheets connection settings
  - `vocabularySyncHash`: Sync state tracking
  - `geminiApiKey`: AI service configuration

### Testing Strategy

- **Service Layer**: Comprehensive unit tests with mocking for external APIs
- **Component Layer**: React Testing Library for UI interactions
- **Integration**: Tests cover OAuth flows and data synchronization

### Mobile-First Design

- Tailwind CSS with responsive breakpoints (sm:, md:, lg:)
- Touch-optimized interactions
- Adaptive navigation (collapsed on mobile)
- Modal dialogs with mobile-specific layouts

### Performance Considerations

- Example sentences are cached in localStorage to reduce API calls
- Vocabulary sync uses hash comparison to detect changes
- Local-first approach with cloud backup
- Lazy loading and code splitting not implemented (small app size)

## Important Implementation Details

**OAuth Client ID**: Hard-coded in config (domain-restricted, safe to expose)
**API Keys**: Never hard-code Google Sheets or Gemini API keys
**Error Handling**: User-friendly alerts for connection failures
**Sync Strategy**: Hash-based change detection with manual sync triggers

## File Naming Conventions

- Components: PascalCase.jsx
- Hooks: camelCase starting with "use"
- Services: camelCase.js
- Constants: camelCase.js
- Tests: Same as source file with .test.js/.test.jsx

## Recent Major Changes

The app recently implemented OAuth-only authentication mode, allowing users to connect to Google Sheets without needing to create their own API keys. This is now the recommended setup method in SettingsModal.