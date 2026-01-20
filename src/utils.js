/**
 * Utility functions for JIRA ticket extraction
 * These functions are separated to enable easier testing
 */

/**
 * Checks if the current page is a JIRA page
 * @param {string} hostname - The hostname to check
 * @returns {boolean} True if on a JIRA page, false otherwise
 */
function isJIRAPage(hostname = typeof window !== 'undefined' ? window.location.hostname : '') {
  if (!hostname) return false;

  return (
    hostname.includes('atlassian.net') ||
    hostname.includes('jira.') ||
    hostname.includes('.jira.')
  );
}

/**
 * Extracts relevant information from the JIRA ticket
 * @param {Document} doc - Document object to extract from (for testing purposes)
 * @returns {Object} Object containing extracted ticket information
 */
function extractJIRATicketInfo(doc = typeof document !== 'undefined' ? document : null) {
  if (!doc) {
    console.error('Document object not available');
    return {};
  }

  const ticketInfo = {};

  // Extract issue key (e.g., PROJ-123)
  const issueKeyElement = doc.querySelector('[data-testid="issue.views.issue-base.foundation.breadcrumbs.breadcrumb-current-issue"]');
  if (issueKeyElement) {
    ticketInfo.issueKey = issueKeyElement.textContent.trim();
  } else {
    // Alternative selector for issue key
    const issueKeyMatch = doc.title ? doc.title.match(/[A-Z0-9]+-\d+/) : null;
    if (issueKeyMatch) {
      ticketInfo.issueKey = issueKeyMatch[0];
    }
  }

  // Extract summary/title
  const summaryElement = doc.querySelector('[data-testid="issue.views.issue-base.foundation.summary.heading"]');
  if (summaryElement) {
    ticketInfo.summary = summaryElement.textContent.trim();
  } else {
    // Alternative selector for summary
    const summaryAlt = doc.querySelector('h1[data-testid*="summary"]');
    if (summaryAlt) {
      ticketInfo.summary = summaryAlt.textContent.trim();
    }
  }

  // Extract description
  const descriptionElement = doc.querySelector('[data-testid="issue.views.issue-base.foundation.description.description-content"]');
  if (descriptionElement) {
    ticketInfo.description = descriptionElement.textContent.trim();
  } else {
    // Alternative selector for description
    const descAlt = doc.querySelector('.descriptionWikiEditor');
    if (descAlt) {
      ticketInfo.description = descAlt.textContent.trim();
    }
  }

  // Extract assignee
  const assigneeElement = doc.querySelector('[data-testid="issue.views.issue-details.issue-field.assignee"]');
  if (assigneeElement) {
    ticketInfo.assignee = assigneeElement.textContent.trim();
  }

  // Extract reporter
  const reporterElement = doc.querySelector('[data-testid="issue.views.issue-details.issue-field.reporter"]');
  if (reporterElement) {
    ticketInfo.reporter = reporterElement.textContent.trim();
  }

  // Extract priority
  const priorityElement = doc.querySelector('[data-testid="issue.views.issue-details.issue-field.priority"]');
  if (priorityElement) {
    ticketInfo.priority = priorityElement.textContent.trim();
  }

  // Extract status
  const statusElement = doc.querySelector('[data-testid="issue.views.issue-details.issue-field.status"]');
  if (statusElement) {
    ticketInfo.status = statusElement.textContent.trim();
  }

  // Extract components/labels
  const componentsElement = doc.querySelector('[data-testid="issue.views.issue-details.issue-field.components"]');
  if (componentsElement) {
    ticketInfo.components = componentsElement.textContent.trim();
  }

  // Extract labels
  const labelsElement = doc.querySelector('[data-testid="issue.views.issue-details.issue-field.labels"]');
  if (labelsElement) {
    ticketInfo.labels = labelsElement.textContent.trim();
  }

  // Extract comments
  const commentsElements = doc.querySelectorAll('[data-testid="comment"]');
  if (commentsElements.length > 0) {
    ticketInfo.comments = Array.from(commentsElements).map(comment => {
      const authorElement = comment.querySelector('[data-testid*="author"]') || comment.querySelector('[data-testid="comment-author"]');
      const contentElement = comment.querySelector('[data-testid*="comment-content"]') || comment.querySelector('[data-testid="comment-content"]');
      const author = authorElement?.textContent?.trim() || 'Unknown';
      const content = contentElement?.textContent?.trim() || '';
      return `${author}: ${content}`;
    }).join('\n\n');
  }

  // Fallback selectors for older JIRA versions
  if (!ticketInfo.summary) {
    const summaryFallback = doc.querySelector('h1');
    if (summaryFallback) {
      ticketInfo.summary = summaryFallback.textContent.trim();
    }
  }

  if (!ticketInfo.description) {
    const descFallback = doc.querySelector('#description-val, .description');
    if (descFallback) {
      ticketInfo.description = descFallback.textContent.trim();
    }
  }

  return ticketInfo;
}

/**
 * Formats the extracted ticket information for the API call
 * @param {Object} ticketInfo - The extracted ticket information
 * @returns {string} Formatted string for the API
 */
function formatTicketForAPI(ticketInfo) {
  if (!ticketInfo) {
    console.error('Ticket info is required');
    return '';
  }

  let formattedContent = "JIRA TICKET SUMMARY REQUEST\n\n";

  if (ticketInfo.issueKey) {
    formattedContent += `ISSUE KEY: ${ticketInfo.issueKey}\n`;
  }

  if (ticketInfo.summary) {
    formattedContent += `SUMMARY: ${ticketInfo.summary}\n`;
  }

  if (ticketInfo.description) {
    formattedContent += `DESCRIPTION: ${ticketInfo.description}\n`;
  }

  if (ticketInfo.assignee) {
    formattedContent += `ASSIGNEE: ${ticketInfo.assignee}\n`;
  }

  if (ticketInfo.reporter) {
    formattedContent += `REPORTER: ${ticketInfo.reporter}\n`;
  }

  if (ticketInfo.priority) {
    formattedContent += `PRIORITY: ${ticketInfo.priority}\n`;
  }

  if (ticketInfo.status) {
    formattedContent += `STATUS: ${ticketInfo.status}\n`;
  }

  if (ticketInfo.components) {
    formattedContent += `COMPONENTS: ${ticketInfo.components}\n`;
  }

  if (ticketInfo.labels) {
    formattedContent += `LABELS: ${ticketInfo.labels}\n`;
  }

  if (ticketInfo.comments) {
    formattedContent += `COMMENTS: ${ticketInfo.comments}\n`;
  }

  formattedContent += "\nPlease provide a concise summary of this JIRA ticket, highlighting the main issue, priority, and any important context from the comments.";

  return formattedContent;
}

/**
 * Formats text for display in the UI
 * @param {string} text - The text to format
 * @returns {string} The formatted HTML
 */
function formatText(text) {
  if (typeof text !== 'string') {
    console.error('Text must be a string');
    return '';
  }

  // Convert markdown-like headers and bold to HTML first
  let formatted = text
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')  // Headers
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');  // Bold

  // Split by paragraphs and wrap in <p> tags
  formatted = formatted
    .split('\n\n')
    .filter(paragraph => paragraph.trim() !== '')
    .map(paragraph => `<p>${paragraph.trim()}</p>`)
    .join('');

  // Then handle lists - find list items within paragraphs and wrap them
  // First, let's extract list items and put them in proper ul tags
  const listPattern = /<p>(\* .*\s*)+<\/p>/g;
  formatted = formatted.replace(listPattern, (match) => {
    // Extract individual list items
    const items = match
      .replace(/<\/?p>/g, '') // Remove paragraph tags
      .split('\n')
      .map(item => item.trim())
      .filter(item => item.startsWith('* '))
      .map(item => `<li>${item.substring(2)}</li>`); // Remove '* ' prefix

    return `<ul>${items.join('')}</ul>`;
  });

  return formatted;
}

// Export functions for testing (if in a module environment)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    isJIRAPage,
    extractJIRATicketInfo,
    formatTicketForAPI,
    formatText
  };
}