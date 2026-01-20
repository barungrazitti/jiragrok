# JiraGrok - Tests

This directory contains unit and integration tests for the JiraGrok Chrome extension.

## Test Structure

- `utils.test.js` - Tests for utility functions (JIRA page detection, ticket extraction, text formatting)
- `popup.test.js` - Tests for popup functionality (API key handling, storage operations, tab communication)
- `content.test.js` - Tests for content script functionality (DOM manipulation, API communication)

## Running Tests

To run the tests, first install the dependencies:

```bash
npm install
```

Then run the tests:

```bash
npm test
```

Or run tests in watch mode:

```bash
npm run test:watch
```

## Test Coverage

The tests cover:

- **Utility Functions**:
  - JIRA page detection logic
  - Ticket information extraction from DOM
  - API payload formatting
  - Text formatting for UI display

- **Popup Logic**:
  - API key validation
  - Chrome storage operations
  - Tab communication

- **Content Script**:
  - DOM manipulation
  - UI creation and management
  - Error handling

## Testing Approach

- Uses Jest as the testing framework
- JSDOM for simulating browser environment
- Mock Chrome APIs for testing extension functionality
- Comprehensive coverage of edge cases and error conditions

## Adding New Tests

When adding new functionality to the extension, please ensure you add corresponding tests:

1. Add unit tests for new utility functions
2. Add integration tests for new features
3. Test error conditions and edge cases
4. Ensure all tests pass before submitting changes
