// JSDOM Environment for testing DOM manipulation functions
const { JSDOM } = require('jsdom');

// Set up a mock DOM environment
const dom = new JSDOM(`
  <!DOCTYPE html>
  <html>
    <head><title>TEST-123: Sample JIRA Ticket</title></head>
    <body>
      <div data-testid="issue.views.issue-base.foundation.breadcrumbs.breadcrumb-current-issue">TEST-123</div>
      <h1 data-testid="issue.views.issue-base.foundation.summary.heading">Sample JIRA Ticket Summary</h1>
      <div data-testid="issue.views.issue-base.foundation.description.description-content">This is a sample JIRA ticket description.</div>
      <div data-testid="issue.views.issue-details.issue-field.assignee">John Doe</div>
      <div data-testid="issue.views.issue-details.issue-field.reporter">Jane Smith</div>
      <div data-testid="issue.views.issue-details.issue-field.priority">High</div>
      <div data-testid="issue.views.issue-details.issue-field.status">Open</div>
      <div data-testid="issue.views.issue-details.issue-field.components">Component A</div>
      <div data-testid="issue.views.issue-details.issue-field.labels">bug, critical</div>
      <div data-testid="comment">
        <div data-testid="comment-author">Alice Johnson</div>
        <div data-testid="comment-content">This is a sample comment.</div>
      </div>
    </body>
  </html>
`);

global.document = dom.window.document;
global.window = dom.window;

// Mock chrome API for testing
global.chrome = {
  runtime: {
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    },
    lastError: null
  },
  tabs: {
    query: jest.fn(),
    sendMessage: jest.fn()
  },
  scripting: {
    executeScript: jest.fn()
  },
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn()
    }
  }
};

// Import the utility functions
const utils = require('../src/utils');
const {
  isJIRAPage,
  extractJIRATicketInfo,
  formatTicketForAPI,
  formatText
} = utils;

describe('JiraGrok - Utility Functions', () => {
  describe('isJIRAPage', () => {
    test('should detect Atlassian domain', () => {
      expect(isJIRAPage('test.atlassian.net')).toBe(true);
    });
    
    test('should detect jira subdomain', () => {
      expect(isJIRAPage('company.jira.com')).toBe(true);
    });
    
    test('should detect nested jira subdomain', () => {
      expect(isJIRAPage('team.subdomain.jira.com')).toBe(true);
    });
    
    test('should return false for non-JIRA domains', () => {
      expect(isJIRAPage('google.com')).toBe(false);
    });
  });

  describe('extractJIRATicketInfo', () => {
    test('should extract all available ticket information', () => {
      const ticketInfo = extractJIRATicketInfo(document);
      
      expect(ticketInfo.issueKey).toBe('TEST-123');
      expect(ticketInfo.summary).toBe('Sample JIRA Ticket Summary');
      expect(ticketInfo.description).toBe('This is a sample JIRA ticket description.');
      expect(ticketInfo.assignee).toBe('John Doe');
      expect(ticketInfo.reporter).toBe('Jane Smith');
      expect(ticketInfo.priority).toBe('High');
      expect(ticketInfo.status).toBe('Open');
      expect(ticketInfo.components).toBe('Component A');
      expect(ticketInfo.labels).toBe('bug, critical');
      expect(ticketInfo.comments).toContain('Alice Johnson: This is a sample comment.');
    });

    test('should handle missing fields gracefully', () => {
      // Create a minimal DOM with only issue key
      const minimalDom = new JSDOM(`
        <!DOCTYPE html>
        <html>
          <head><title>TEST-456: Minimal Ticket</title></head>
          <body>
            <div data-testid="issue.views.issue-base.foundation.breadcrumbs.breadcrumb-current-issue">TEST-456</div>
          </body>
        </html>
      `);
      
      const ticketInfo = extractJIRATicketInfo(minimalDom.window.document);
      
      expect(ticketInfo.issueKey).toBe('TEST-456');
      expect(ticketInfo.summary).toBeUndefined();
      expect(ticketInfo.description).toBeUndefined();
    });
  });

  describe('formatTicketForAPI', () => {
    test('should format ticket info correctly', () => {
      const ticketInfo = {
        issueKey: 'PROJ-123',
        summary: 'Test Summary',
        description: 'Test Description',
        assignee: 'John Doe',
        reporter: 'Jane Smith',
        priority: 'High',
        status: 'Open',
        components: 'Component A',
        labels: 'bug, critical',
        comments: 'Comment 1\n\nComment 2'
      };
      
      const result = formatTicketForAPI(ticketInfo);
      
      expect(result).toContain('ISSUE KEY: PROJ-123');
      expect(result).toContain('SUMMARY: Test Summary');
      expect(result).toContain('DESCRIPTION: Test Description');
      expect(result).toContain('ASSIGNEE: John Doe');
      expect(result).toContain('REPORTER: Jane Smith');
      expect(result).toContain('PRIORITY: High');
      expect(result).toContain('STATUS: Open');
      expect(result).toContain('COMPONENTS: Component A');
      expect(result).toContain('LABELS: bug, critical');
      expect(result).toContain('COMMENTS: Comment 1');
      expect(result).toContain('Please provide a concise summary');
    });

    test('should handle missing fields', () => {
      const ticketInfo = {
        issueKey: 'PROJ-123'
      };
      
      const result = formatTicketForAPI(ticketInfo);
      
      expect(result).toContain('ISSUE KEY: PROJ-123');
      expect(result).not.toContain('SUMMARY:');
      expect(result).toContain('Please provide a concise summary');
    });
  });

  describe('formatText', () => {
    test('should convert markdown-like headers to HTML', () => {
      const input = '### Header Text\n\nRegular text here.';
      const result = formatText(input);
      
      expect(result).toContain('<h3>Header Text</h3>');
      expect(result).toContain('<p>Regular text here.</p>');
    });

    test('should convert bold text to HTML', () => {
      const input = 'This is **bold text** and regular text.';
      const result = formatText(input);
      
      expect(result).toContain('<strong>bold text</strong>');
    });

    test('should convert list items to HTML', () => {
      const input = '* Item 1\n* Item 2\n* Item 3';
      const result = formatText(input);
      
      expect(result).toContain('<ul>');
      expect(result).toContain('<li>Item 1</li>');
      expect(result).toContain('<li>Item 2</li>');
      expect(result).toContain('<li>Item 3</li>');
      expect(result).toContain('</ul>');
    });

    test('should handle paragraphs correctly', () => {
      const input = 'Paragraph 1\n\nParagraph 2\n\nParagraph 3';
      const result = formatText(input);
      
      const paragraphCount = (result.match(/<p>/g) || []).length;
      expect(paragraphCount).toBe(3);
    });

    test('should handle empty paragraphs', () => {
      const input = 'Text\n\n\nMore text'; // Empty line between
      const result = formatText(input);
      
      // Should not create empty paragraphs
      expect(result).toContain('<p>Text</p>');
      expect(result).toContain('<p>More text</p>');
    });
  });
});