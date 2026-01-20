// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'SUMMARIZE_JIRA_TICKET') {
    performJIRATicketAnalysis(request.apiKey, request.regenerate, request.returnToPopup, sendResponse);
    return true; // Keep channel open for async sendResponse
  }
});

async function performJIRATicketAnalysis(apiKey, regenerate = false, returnToPopup = false, sendResponse) {
  if (!isJIRAPage()) {
    showNotification('Not on a JIRA ticket page', 'error');
    sendResponse({ status: 'not_jira_page' });
    return;
  }

  if (regenerate) {
    const existingUI = document.getElementById('jts-container');
    if (existingUI) {
      existingUI.style.opacity = '0';
      existingUI.style.transform = 'translateY(-20px)';
      setTimeout(() => existingUI.remove(), 400);
    }
  }

  if (!returnToPopup) {
    const uiContainer = createUI();
    document.body.appendChild(uiContainer);
  }

  await sleep(500);

  const titleEl = document.getElementById('jts-title');
  const contentEl = document.getElementById('jts-content');
  const loaderEl = document.getElementById('jts-loader');

  if (titleEl) titleEl.textContent = "Analyzing ticket content...";
  const ticketInfo = extractJIRATicketInfo();

  if (!ticketInfo || Object.keys(ticketInfo).length === 0) {
    const errorMsg = "Could not extract JIRA ticket information.";
    if (returnToPopup) {
      sendResponse({ status: 'error', message: errorMsg });
    } else {
      showError(document.getElementById('jts-container'), errorMsg);
    }
    return;
  }

  const formattedContent = formatTicketForAPI(ticketInfo);

  if (titleEl) titleEl.textContent = "Generating Summary...";
  if (loaderEl) loaderEl.style.display = 'block';

  try {
    const summary = await fetchGroqSummary(apiKey, formattedContent);

    if (returnToPopup) {
      sendResponse({ status: 'success', summary: summary });
    } else {
      if (loaderEl) loaderEl.style.display = 'none';
      if (titleEl) titleEl.textContent = "JIRA Ticket Summary";
      if (contentEl) contentEl.innerHTML = formatText(summary);

      const uiContainer = document.getElementById('jts-container');
      if (uiContainer) {
        uiContainer.style.opacity = '1';
        uiContainer.style.transform = 'translateY(0)';
      }
      sendResponse({ status: 'success' });
    }

  } catch (error) {
    console.error('Error in JIRA ticket analysis:', error);
    if (returnToPopup) {
      sendResponse({ status: 'error', message: error.message });
    } else {
      showError(document.getElementById('jts-container'), `Error: ${error.message}`);
    }
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isJIRAPage() {
  const hostname = window.location.hostname;
  return (
    hostname.includes('atlassian.net') ||
    hostname.includes('jira.') ||
    hostname.includes('.jira.')
  );
}

function extractJIRATicketInfo() {
  const ticketInfo = {};

  const issueKeyElement = document.querySelector('[data-testid="issue.views.issue-base.foundation.breadcrumbs.breadcrumb-current-issue"]');
  if (issueKeyElement) {
    ticketInfo.issueKey = issueKeyElement.textContent.trim();
  } else {
    const issueKeyMatch = document.title.match(/[A-Z0-9]+-\d+/);
    if (issueKeyMatch) {
      ticketInfo.issueKey = issueKeyMatch[0];
    }
  }

  const summaryElement = document.querySelector('[data-testid="issue.views.issue-base.foundation.summary.heading"]');
  if (summaryElement) {
    ticketInfo.summary = summaryElement.textContent.trim();
  } else {
    const summaryAlt = document.querySelector('h1[data-testid*="summary"]');
    if (summaryAlt) {
      ticketInfo.summary = summaryAlt.textContent.trim();
    }
  }

  const descriptionElement = document.querySelector('[data-testid="issue.views.issue-base.foundation.description.description-content"]');
  if (descriptionElement) {
    ticketInfo.description = descriptionElement.textContent.trim();
  } else {
    const descAlt = document.querySelector('.descriptionWikiEditor');
    if (descAlt) {
      ticketInfo.description = descAlt.textContent.trim();
    } else {
      const descFromVal = document.querySelector('#description-val .descriptionContent');
      if (descFromVal) {
        ticketInfo.description = descFromVal.textContent.trim();
      }
    }
  }

  const assigneeElement = document.querySelector('[data-testid="issue.views.issue-details.issue-field.assignee"]');
  if (assigneeElement) {
    ticketInfo.assignee = assigneeElement.textContent.trim();
  } else {
    const assigneeVal = document.querySelector('#assignee-val .user-hover');
    if (assigneeVal) {
      ticketInfo.assignee = assigneeVal.textContent.trim();
    }
  }

  const reporterElement = document.querySelector('[data-testid="issue.views.issue-details.issue-field.reporter"]');
  if (reporterElement) {
    ticketInfo.reporter = reporterElement.textContent.trim();
  } else {
    const reporterVal = document.querySelector('#reporter-val .user-hover');
    if (reporterVal) {
      ticketInfo.reporter = reporterVal.textContent.trim();
    }
  }

  const priorityElement = document.querySelector('[data-testid="issue.views.issue-details.issue-field.priority"]');
  if (priorityElement) {
    ticketInfo.priority = priorityElement.textContent.trim();
  } else {
    const priorityVal = document.querySelector('#priority-val');
    if (priorityVal) {
      ticketInfo.priority = priorityVal.textContent.trim().replace(/(^\s*|\s*$)/g, '').replace(/\s+/g, ' ');
    }
  }

  const statusElement = document.querySelector('[data-testid="issue.views.issue-details.issue-field.status"]');
  if (statusElement) {
    ticketInfo.status = statusElement.textContent.trim();
  } else {
    const statusVal = document.querySelector('#status-val .jira-issue-status-lozenge');
    if (statusVal) {
      ticketInfo.status = statusVal.textContent.trim();
    }
  }

  const typeElement = document.querySelector('[data-testid="issue.views.issue-base.foundation.issue-content-wrap.type"]');
  if (typeElement) {
    ticketInfo.type = typeElement.textContent.trim();
  } else {
    const typeVal = document.querySelector('#type-val');
    if (typeVal) {
      ticketInfo.type = typeVal.textContent.replace(/(^\s*|\s*$)/g, '').replace(/\s+/g, ' ');
    }
  }

  const labelsElement = document.querySelector('[data-testid="issue.views.issue-details.issue-field.labels"]');
  if (labelsElement) {
    ticketInfo.labels = labelsElement.textContent.trim();
  } else {
    const labelsVal = document.querySelector('#labels-242533-value');
    if (labelsVal) {
      ticketInfo.labels = Array.from(labelsVal.querySelectorAll('a.lozenge')).map(label => label.textContent.trim()).join(', ');
    }
  }

  let comments = [];

  const standardComments = document.querySelectorAll('[data-testid="comment"]');
  if (standardComments.length > 0) {
    comments = comments.concat(Array.from(standardComments).map(comment => {
      const author = comment.querySelector('[data-testid*="author"]')?.textContent ||
                    comment.querySelector('[data-testid="comment-author"]')?.textContent ||
                    'Unknown';
      const content = comment.querySelector('[data-testid*="comment-content"]')?.textContent ||
                      comment.querySelector('[data-testid="comment-content"]')?.textContent ||
                      comment.textContent || '';
      return `${author}: ${content}`;
    }));
  }

  const altComments = document.querySelectorAll('.issue-data-block.comment-block, [role="region"] div[aria-label*="comment"]');
  if (altComments.length > 0) {
    comments = comments.concat(Array.from(altComments).map(comment => {
      const author = comment.querySelector('.user-hover, .comment-author')?.textContent || 'Unknown';
      const content = comment.querySelector('.comment-body, .ak-renderer-wrapper')?.textContent || comment.textContent || '';
      return `${author}: ${content}`;
    }));
  }

  const activityComments = document.querySelectorAll('.activity-comment, .comment, .issue-data-item');
  if (activityComments.length > 0) {
    comments = comments.concat(Array.from(activityComments).map(comment => {
      const author = comment.querySelector('.author, .user-fullname, .user-link')?.textContent || 'Unknown';
      const content = comment.querySelector('.action-body, .comment-body, .activity-content')?.textContent || comment.textContent || '';
      if (content.trim().length > 10) {
        return `${author}: ${content}`;
      }
      return null;
    }).filter(comment => comment !== null));
  }

  if (comments.length > 0) {
    ticketInfo.comments = comments.join('\n\n');
  }

  if (!ticketInfo.summary) {
    const summaryFallback = document.querySelector('h1');
    if (summaryFallback) {
      ticketInfo.summary = summaryFallback.textContent.trim();
    }
  }

  if (!ticketInfo.description) {
    const descFallback = document.querySelector('#description-val, .description');
    if (descFallback) {
      ticketInfo.description = descFallback.textContent.trim();
    }
  }

  return ticketInfo;
}

function formatTicketForAPI(ticketInfo) {
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

  if (ticketInfo.type) {
    formattedContent += `TYPE: ${ticketInfo.type}\n`;
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

async function fetchGroqSummary(apiKey, content) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are a JIRA ticket analyst. Provide a concise summary in exactly these 5 sections:

Main Objective:
• One-line summary of what this ticket is about

Key Details:
• Technical implementation details
• Business context or requirements
• Any constraints or dependencies mentioned

Contributors:
• Key people who have commented (if any)

Key Timelines:
• Any dates, deadlines, or time-sensitive info mentioned
• Sprint goals or release targets
• Time estimates if provided

Next Steps:
• Action items or blockers
• What needs to happen to resolve this ticket

Keep each section brief. Use bullet points only. Don't use bold or formatting.`
        },
        {
          role: "user",
          content: content.substring(0, 10000)
        }
      ],
      temperature: 0.3,
      max_tokens: 800
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `API Request Failed with status ${response.status}`);
  }

  const data = await response.json();

  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error('Invalid response format from API');
  }

  return data.choices[0].message.content;
}

function createUI() {
  const existingUI = document.getElementById('jts-container');
  if (existingUI) {
    existingUI.remove();
  }

  const container = document.createElement('div');
  container.id = 'jts-container';

  container.innerHTML = `
    <style>
      #jts-container {
        position: fixed;
        top: 20px;
        right: 20px;
        width: 420px;
        max-height: 80vh;
        background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(0, 0, 0, 0.08);
        border-radius: 20px;
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(255, 255, 255, 0.8);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        color: #2c3e50;
        z-index: 2147483647;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        opacity: 0;
        transform: translateY(-20px);
        transition: opacity 0.4s ease, transform 0.4s ease;
      }
      #jts-header {
        padding: 20px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.05);
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: linear-gradient(135deg, #0052cc 0%, #2684ff 100%);
        color: white;
      }
      #jts-title {
        font-weight: 600;
        font-size: 16px;
        color: white;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      #jts-close {
        background: rgba(255, 255, 255, 0.15);
        border: none;
        color: white;
        cursor: pointer;
        padding: 8px;
        font-size: 18px;
        line-height: 1;
        border-radius: 50%;
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        backdrop-filter: blur(4px);
      }
      #jts-close:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: scale(1.1) rotate(90deg);
      }
      #jts-content {
        padding: 24px;
        overflow-y: auto;
        font-size: 14px;
        line-height: 1.7;
        color: #2c3e50;
        flex-grow: 1;
        background: transparent;
      }
      #jts-content p {
        margin-bottom: 16px;
        line-height: 1.7;
      }
      #jts-content strong {
        color: #2c3e50;
        font-weight: 600;
        background: linear-gradient(120deg, #e3f2fd 0%, #bbdefb 100%);
        padding: 2px 6px;
        border-radius: 4px;
        border: 1px solid #e3f2fd;
      }
      #jts-content h3 {
        margin: 20px 0 12px 0;
        font-size: 16px;
        font-weight: 700;
        color: #0052cc;
        padding-bottom: 8px;
        border-bottom: 2px solid #e3f2fd;
        background: linear-gradient(120deg, #f0f7ff 0%, #e6f0ff 100%);
        padding: 8px 12px;
        border-radius: 6px;
      }
      #jts-content ul {
        margin: 12px 0 18px 0;
        padding-left: 24px;
        list-style-type: none;
      }
      #jts-content li {
        margin-bottom: 12px;
        line-height: 1.6;
        color: #344563;
      }
      .section-list {
        background: rgba(241, 248, 255, 0.6);
        border-radius: 10px;
        padding: 14px !important;
        margin: 10px 0 16px 0;
        border: 1px solid rgba(0, 82, 204, 0.15);
      }
      .bullet-item {
        margin-bottom: 8px !important;
        padding: 6px 0 !important;
        border-bottom: 1px dashed rgba(0, 82, 204, 0.1);
      }
      .bullet-item:last-child {
        border-bottom: none;
      }

      .jts-spinner {
        width: 28px;
        height: 28px;
        border: 3px solid rgba(0, 82, 204, 0.2);
        border-radius: 50%;
        border-top-color: #0052cc;
        animation: jts-spin 1s linear infinite;
        margin: 0 auto;
      }
      @keyframes jts-spin {
        to { transform: rotate(360deg); }
      }
      #jts-loader {
        padding: 40px 20px;
        display: none;
        text-align: center;
      }
      #jts-loader p {
        margin-top: 12px;
        color: #6b778c;
        font-size: 14px;
        font-weight: 500;
      }
      #jts-error {
        color: #c51162;
        padding: 20px;
        background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%);
        border-radius: 12px;
        margin: 16px;
        font-size: 13px;
        border: 1px solid #f8bbd0;
        line-height: 1.6;
        box-shadow: 0 4px 12px rgba(197, 17, 98, 0.1);
      }
      .copy-button {
        background: linear-gradient(135deg, #0052cc 0%, #2684ff 100%);
        color: white;
        border: none;
        border-radius: 8px;
        padding: 10px 16px;
        font-size: 13px;
        cursor: pointer;
        margin-top: 16px;
        font-weight: 500;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 4px 12px rgba(0, 82, 204, 0.2);
      }
      .copy-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(0, 82, 204, 0.3);
      }
      .copy-button:active {
        transform: translateY(0);
      }
    </style>
    <div id="jts-header">
      <div id="jts-title">
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
        </svg>
        <span id="jts-title-text">Processing JIRA Ticket...</span>
      </div>
      <button id="jts-close">&times;</button>
    </div>
    <div id="jts-content"></div>
    <div id="jts-loader">
      <div class="jts-spinner"></div>
      <p>Analyzing ticket with AI...</p>
    </div>
  `;

  container.querySelector('#jts-close').addEventListener('click', () => {
    container.style.opacity = '0';
    container.style.transform = 'translateY(-20px)';
    setTimeout(() => container.remove(), 400);
  });

  return container;
}

function showNotification(message, type = 'info') {
  const existingNotification = document.querySelector('#jts-notification');
  if (existingNotification) {
    existingNotification.remove();
  }

  const notification = document.createElement('div');
  notification.id = 'jts-notification';
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    padding: 12px 24px;
    background: ${type === 'error' ? '#ff5630' : '#00875a'};
    color: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 2147483647;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    font-size: 14px;
    animation: fadeInOut 3s forwards;
  `;

  if (!document.querySelector('#jts-notification-styles')) {
    const style = document.createElement('style');
    style.id = 'jts-notification-styles';
    style.textContent = `
      @keyframes fadeInOut {
        0% { opacity: 0; top: 0; }
        10% { opacity: 1; top: 20px; }
        90% { opacity: 1; top: 20px; }
        100% { opacity: 0; top: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}

function formatText(text) {
  if (typeof text !== 'string') {
    console.error('Text must be a string');
    return '';
  }

  let formatted = text.replace(/\*\*(.*?)\*\*/g, '$1').replace(/^### (.*$)/gm, '<h3>$1</h3>');

  const lines = formatted.split('\n');
  const result = [];
  let currentSection = '';
  let sectionItems = [];

  const sectionHeaders = ['Main Objective:', 'Key Details:', 'Contributors:', 'Key Timelines:', 'Next Steps:'];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    const isHeader = sectionHeaders.some(h => trimmedLine.startsWith(h));

    if (isHeader) {
      if (currentSection && sectionItems.length > 0) {
        result.push(`<h3>${currentSection}</h3>`);
        result.push(`<ul class="section-list">${sectionItems.join('')}</ul>`);
        sectionItems = [];
      }
      currentSection = trimmedLine;
    } else if (trimmedLine.startsWith('• ') || trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ')) {
      let bulletContent = trimmedLine;
      if (trimmedLine.startsWith('• ')) bulletContent = trimmedLine.substring(2);
      else if (trimmedLine.startsWith('* ')) bulletContent = trimmedLine.substring(2);
      else if (trimmedLine.startsWith('- ')) bulletContent = trimmedLine.substring(2);
      sectionItems.push(`<li class="bullet-item">${bulletContent}</li>`);
    } else if (trimmedLine !== '' && !currentSection) {
      result.push(`<p>${trimmedLine}</p>`);
    }
  }

  if (currentSection && sectionItems.length > 0) {
    result.push(`<h3>${currentSection}</h3>`);
    result.push(`<ul class="section-list">${sectionItems.join('')}</ul>`);
  }

  return result.join('');
}

function showError(container, msg) {
  const titleText = container?.querySelector('#jts-title-text');
  if (titleText) titleText.textContent = "Error";
  const loader = container?.querySelector('#jts-loader');
  if (loader) loader.style.display = 'none';
  const content = container?.querySelector('#jts-content');
  if (content) {
    content.innerHTML = `<div id="jts-error">${msg}</div>`;
    content.innerHTML += '<button class="copy-button" id="retry-btn">Retry Analysis</button>';

    const retryBtn = document.getElementById('retry-btn');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        chrome.storage.local.get(['groq_api_key'], (result) => {
          if (result.groq_api_key) {
            performJIRATicketAnalysis(result.groq_api_key, true);
          } else {
            alert('Please set your API key in the extension popup first.');
          }
        });
      });
    }
  }

  if (container) {
    container.style.opacity = '1';
    container.style.transform = 'translateY(0)';
  }
}
