#!/usr/bin/env node

// Simple test runner for JiraGrok
// This avoids npm permission issues by running tests directly

// Mock DOM implementation for testing
class MockDocument {
  constructor(html) {
    this.html = html;
    this.elements = [];
    this.title = '';
    
    // Parse title from HTML
    const titleMatch = html.match(/<title>(.*?)<\/title>/);
    if (titleMatch) {
      this.title = titleMatch[1];
    }
  }
  
  querySelector(selector) {
    // Simple selector matching for testing
    if (selector === '[data-testid="issue.views.issue-base.foundation.breadcrumbs.breadcrumb-current-issue"]') {
      const match = this.html.match(/<div data-testid="issue.views.issue-base.foundation.breadcrumbs.breadcrumb-current-issue">(.*?)<\/div>/);
      if (match) {
        return { textContent: match[1], getAttribute: () => null };
      }
    } else if (selector === '[data-testid="issue.views.issue-base.foundation.summary.heading"]') {
      const match = this.html.match(/<h1 data-testid="issue.views.issue-base.foundation.summary.heading">(.*?)<\/h1>/);
      if (match) {
        return { textContent: match[1], getAttribute: () => null };
      }
    } else if (selector === '[data-testid="issue.views.issue-base.foundation.description.description-content"]') {
      const match = this.html.match(/<div data-testid="issue.views.issue-base.foundation.description.description-content">(.*?)<\/div>/);
      if (match) {
        return { textContent: match[1], getAttribute: () => null };
      }
    } else if (selector === '[data-testid="issue.views.issue-details.issue-field.assignee"]') {
      const match = this.html.match(/<div data-testid="issue.views.issue-details.issue-field.assignee">(.*?)<\/div>/);
      if (match) {
        return { textContent: match[1], getAttribute: () => null };
      }
    } else if (selector === '[data-testid="issue.views.issue-details.issue-field.reporter"]') {
      const match = this.html.match(/<div data-testid="issue.views.issue-details.issue-field.reporter">(.*?)<\/div>/);
      if (match) {
        return { textContent: match[1], getAttribute: () => null };
      }
    } else if (selector === '[data-testid="issue.views.issue-details.issue-field.priority"]') {
      const match = this.html.match(/<div data-testid="issue.views.issue-details.issue-field.priority">(.*?)<\/div>/);
      if (match) {
        return { textContent: match[1], getAttribute: () => null };
      }
    } else if (selector === '[data-testid="issue.views.issue-details.issue-field.status"]') {
      const match = this.html.match(/<div data-testid="issue.views.issue-details.issue-field.status">(.*?)<\/div>/);
      if (match) {
        return { textContent: match[1], getAttribute: () => null };
      }
    } else if (selector === '[data-testid="issue.views.issue-details.issue-field.components"]') {
      const match = this.html.match(/<div data-testid="issue.views.issue-details.issue-field.components">(.*?)<\/div>/);
      if (match) {
        return { textContent: match[1], getAttribute: () => null };
      }
    } else if (selector === '[data-testid="issue.views.issue-details.issue-field.labels"]') {
      const match = this.html.match(/<div data-testid="issue.views.issue-details.issue-field.labels">(.*?)<\/div>/);
      if (match) {
        return { textContent: match[1], getAttribute: () => null };
      }
    } else if (selector === 'h1') {
      const match = this.html.match(/<h1[^>]*>(.*?)<\/h1>/);
      if (match) {
        return { textContent: match[1], getAttribute: () => null };
      }
    } else if (selector === '#description-val, .description') {
      // Look for description elements
      const descMatch = this.html.match(/<div[^>]*id="description-val"[^>]*>(.*?)<\/div>/) ||
                        this.html.match(/<div[^>]*class="description"[^>]*>(.*?)<\/div>/);
      if (descMatch) {
        return { textContent: descMatch[1], getAttribute: () => null };
      }
    }
    
    return null;
  }
  
  querySelectorAll(selector) {
    if (selector === '[data-testid="comment"]') {
      // Simple approach: find the content of the comment div
      // The HTML structure is: <div data-testid="comment"><div data-testid="comment-author">...<div data-testid="comment-content">...</div></div>
      const commentBlocks = this.html.split('<div data-testid="comment">');
      const results = [];

      // Skip the first element as it's content before the first comment
      for (let i = 1; i < commentBlocks.length; i++) {
        // Find the content until the closing </div> for this comment
        const block = commentBlocks[i];
        let depth = 1; // We're inside the first div
        let pos = 0;

        // Look for the matching closing tag
        while (pos < block.length && depth > 0) {
          if (block.substr(pos, 5) === '</div') {
            depth--;
            pos += 5; // Move past </div>
          } else if (block.substr(pos, 4) === '<div') {
            depth++;
            pos += 4; // Move past <div
          } else {
            pos++;
          }
        }

        if (depth === 0) {
          const commentContent = block.substring(0, pos - 5); // Exclude the last </div>

          results.push({
            querySelector: (subSelector) => {
              if (subSelector === '[data-testid*="author"]' || subSelector === '[data-testid="comment-author"]') {
                const authorMatch = commentContent.match(/<div[^>]*data-testid="[^"]*author[^"]*"[^>]*>(.*?)<\/div>/);
                return authorMatch ? { textContent: authorMatch[1] } : null;
              } else if (subSelector === '[data-testid*="comment-content"]' || subSelector === '[data-testid="comment-content"]') {
                const contentMatch = commentContent.match(/<div[^>]*data-testid="[^"]*comment-content[^"]*"[^>]*>(.*?)<\/div>/);
                return contentMatch ? { textContent: contentMatch[1] } : null;
              }
              return null;
            }
          });
        }
      }

      return results;
    }
    return [];
  }
}

// Import the utility functions by reading and evaluating the file
const fs = require('fs');
const path = require('path');

// Read the utils.js file and extract function definitions
const utilsCode = fs.readFileSync(path.join(__dirname, 'src/utils.js'), 'utf8');

// Evaluate the code to make functions available
eval(utilsCode);

// Test results tracker
let testsPassed = 0;
let testsTotal = 0;

function test(description, fn) {
  testsTotal++;
  try {
    fn();
    console.log(`✓ ${description}`);
    testsPassed++;
  } catch (error) {
    console.log(`✗ ${description}`);
    console.log(`  Error: ${error.message}`);
  }
}

function expect(actual) {
  const assertions = {
    toBe: (expected) => {
      if (actual !== expected) {
        throw new Error(`Expected ${expected}, got ${actual}`);
      }
    },
    toContain: (expected) => {
      if (typeof actual !== 'string' || !actual.includes(expected)) {
        throw new Error(`Expected string to contain "${expected}", got "${actual}"`);
      }
    },
    toBeUndefined: () => {
      if (actual !== undefined) {
        throw new Error(`Expected undefined, got ${actual}`);
      }
    }
  };

  // Add negative assertions
  const negatedAssertions = {
    toContain: (expected) => {
      if (typeof actual === 'string' && actual.includes(expected)) {
        throw new Error(`Expected string NOT to contain "${expected}", got "${actual}"`);
      }
    }
  };

  return {
    ...assertions,
    not: negatedAssertions
  };
}

  console.log('Running JiraGrok tests...\n');

// Test isJIRAPage function
test('isJIRAPage detects Atlassian domain', () => {
  expect(isJIRAPage('test.atlassian.net')).toBe(true);
});

test('isJIRAPage detects jira subdomain', () => {
  expect(isJIRAPage('company.jira.com')).toBe(true);
});

test('isJIRAPage detects nested jira subdomain', () => {
  expect(isJIRAPage('team.subdomain.jira.com')).toBe(true);
});

test('isJIRAPage returns false for non-JIRA domains', () => {
  expect(isJIRAPage('google.com')).toBe(false);
});

test('isJIRAPage handles undefined hostname', () => {
  expect(isJIRAPage(undefined)).toBe(false);
});

// Test extractJIRATicketInfo function
test('extractJIRATicketInfo extracts all available ticket information', () => {
  const html = `
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
  `;
  
  const mockDoc = new MockDocument(html);
  const ticketInfo = extractJIRATicketInfo(mockDoc);
  
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

test('extractJIRATicketInfo handles missing fields gracefully', () => {
  const html = `
    <!DOCTYPE html>
    <html>
      <head><title>TEST-456: Minimal Ticket</title></head>
      <body>
        <div data-testid="issue.views.issue-base.foundation.breadcrumbs.breadcrumb-current-issue">TEST-456</div>
      </body>
    </html>
  `;
  
  const mockDoc = new MockDocument(html);
  const ticketInfo = extractJIRATicketInfo(mockDoc);
  
  expect(ticketInfo.issueKey).toBe('TEST-456');
  expect(ticketInfo.summary).toBeUndefined();
  expect(ticketInfo.description).toBeUndefined();
});

// Test formatTicketForAPI function
test('formatTicketForAPI formats ticket info correctly', () => {
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

test('formatTicketForAPI handles missing fields', () => {
  const ticketInfo = {
    issueKey: 'PROJ-123'
  };

  const result = formatTicketForAPI(ticketInfo);

  expect(result).toContain('ISSUE KEY: PROJ-123');
  expect(result).not.toContain('SUMMARY:');
  expect(result).toContain('Please provide a concise summary');
});

test('formatTicketForAPI handles null input', () => {
  const result = formatTicketForAPI(null);
  expect(result).toBe('');
});

// Test formatText function
test('formatText converts markdown-like headers to HTML', () => {
  const input = '### Header Text\n\nRegular text here.';
  const result = formatText(input);
  
  expect(result).toContain('<h3>Header Text</h3>');
  expect(result).toContain('<p>Regular text here.</p>');
});

test('formatText converts bold text to HTML', () => {
  const input = 'This is **bold text** and regular text.';
  const result = formatText(input);

  expect(result).toContain('<strong>bold text</strong>');
});

test('formatText converts list items to HTML', () => {
  const input = '* Item 1\n* Item 2\n* Item 3';
  const result = formatText(input);
  
  expect(result).toContain('<ul>');
  expect(result).toContain('<li>Item 1</li>');
  expect(result).toContain('<li>Item 2</li>');
  expect(result).toContain('<li>Item 3</li>');
  expect(result).toContain('</ul>');
});

test('formatText handles paragraphs correctly', () => {
  const input = 'Paragraph 1\n\nParagraph 2\n\nParagraph 3';
  const result = formatText(input);
  
  const paragraphCount = (result.match(/<p>/g) || []).length;
  expect(paragraphCount).toBe(3);
});

test('formatText handles empty input', () => {
  const result = formatText('');
  expect(result).toBe('');
});

test('formatText handles non-string input', () => {
  const result = formatText(null);
  expect(result).toBe('');
});

console.log(`\nTests run: ${testsTotal}`);
console.log(`Tests passed: ${testsPassed}`);
console.log(`Tests failed: ${testsTotal - testsPassed}`);

if (testsTotal === testsPassed) {
  console.log('\n🎉 All tests passed!');
  process.exit(0);
} else {
  console.log('\n❌ Some tests failed!');
  process.exit(1);
}