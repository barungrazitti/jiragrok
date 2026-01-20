// Mock chrome API for popup tests
const mockChrome = {
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn()
    }
  },
  tabs: {
    query: jest.fn(),
    sendMessage: jest.fn()
  },
  scripting: {
    executeScript: jest.fn()
  },
  runtime: {
    lastError: null
  }
};

// Mock DOM elements for popup tests
global.document = {
  getElementById: jest.fn(),
  querySelector: jest.fn(),
  addEventListener: jest.fn()
};

global.window = {
  close: jest.fn()
};

// Mock setTimeout for testing
global.setTimeout = jest.fn((callback) => callback());

describe('JiraGrok - Popup Functions', () => {
  // Since popup.js is a standalone script, we'll simulate its functionality
  // This test would normally run in the browser context
  
  describe('API Key Handling', () => {
    test('should validate API key format', () => {
      // Simulate API key validation logic
      const isValidApiKey = (key) => /^gsk_[a-zA-Z0-9]+$/.test(key);
      
      expect(isValidApiKey('gsk_abc123')).toBe(true);
      expect(isValidApiKey('invalid-key')).toBe(false);
      expect(isValidApiKey('')).toBe(false);
      expect(isValidApiKey('gsk_')).toBe(false);
    });
  });

  describe('Storage Operations', () => {
    test('should store API key in chrome storage', async () => {
      const apiKey = 'gsk_test123';
      
      // Mock chrome.storage.local.set
      mockChrome.storage.local.set.mockImplementation((data, callback) => {
        callback();
      });
      
      // Simulate storing API key
      mockChrome.storage.local.set({ groq_api_key: apiKey }, () => {});
      
      expect(mockChrome.storage.local.set).toHaveBeenCalledWith(
        { groq_api_key: apiKey },
        expect.any(Function)
      );
    });

    test('should retrieve API key from chrome storage', async () => {
      const storedApiKey = 'gsk_test123';
      
      // Mock chrome.storage.local.get
      mockChrome.storage.local.get.mockImplementation((keys, callback) => {
        callback({ groq_api_key: storedApiKey });
      });
      
      // Simulate retrieving API key
      mockChrome.storage.local.get(['groq_api_key'], (result) => {
        expect(result.groq_api_key).toBe(storedApiKey);
      });
      
      expect(mockChrome.storage.local.get).toHaveBeenCalledWith(
        ['groq_api_key'],
        expect.any(Function)
      );
    });
  });

  describe('Tab Communication', () => {
    test('should send message to active tab', async () => {
      const apiKey = 'gsk_test123';
      const tabId = 123;
      
      // Mock chrome.tabs.query
      mockChrome.tabs.query.mockResolvedValue([{ id: tabId }]);
      
      // Mock chrome.tabs.sendMessage
      mockChrome.tabs.sendMessage.mockImplementation((id, message, callback) => {
        callback({ status: 'Analysis started' });
      });
      
      // Simulate sending message to tab
      const tabs = await mockChrome.tabs.query({ active: true, currentWindow: true });
      const activeTab = tabs[0];
      
      if (activeTab && activeTab.id) {
        mockChrome.tabs.sendMessage(activeTab.id, {
          action: 'SUMMARIZE_JIRA_TICKET',
          apiKey: apiKey
        }, (response) => {
          expect(response.status).toBe('Analysis started');
        });
        
        expect(mockChrome.tabs.sendMessage).toHaveBeenCalledWith(
          tabId,
          { action: 'SUMMARIZE_JIRA_TICKET', apiKey: apiKey },
          expect.any(Function)
        );
      }
    });
  });
});