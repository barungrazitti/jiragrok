document.addEventListener('DOMContentLoaded', () => {
  const apiKeyInput = document.getElementById('apiKey');
  const saveApiKeyBtn = document.getElementById('saveApiKeyBtn');
  const clearApiKeyBtn = document.getElementById('clearApiKeyBtn');
  const regenerateBtn = document.getElementById('regenerateBtn');
  const regenerateBtnText = document.getElementById('regenerateBtnText');
  const copyBtn = document.getElementById('copyBtn');
  const settingsToggle = document.getElementById('settingsToggle');
  const settingsSection = document.getElementById('settingsSection');
  const statusMsg = document.getElementById('statusMsg');
  const settingsStatusMsg = document.getElementById('settingsStatusMsg');
  const apiStatus = document.getElementById('apiStatus');
  const apiStatusText = document.getElementById('apiStatusText');
  const summaryContainer = document.getElementById('summaryContainer');
  const summaryContent = document.getElementById('summaryContent');
  const emptyState = document.getElementById('emptyState');
  const emptyStateText = document.getElementById('emptyStateText');

  let currentApiKey = null;
  let isSummarizing = false;
  let currentSummary = '';

  init();

  async function init() {
    try {
      const result = await chrome.storage.local.get(['groq_api_key']);
      currentApiKey = result.groq_api_key || null;
      updateApiStatus();
      loadApiKeyIfExists();

      if (currentApiKey) {
        autoSummarize();
      } else {
        showEmptyState('Click Settings to add your API key');
      }
    } catch (err) {
      console.error('Init error:', err);
    }
  }

  function updateApiStatus() {
    if (currentApiKey) {
      apiStatus.classList.remove('no-key');
      apiStatus.classList.add('has-key', 'hidden');
      apiStatus.querySelector('svg').innerHTML = '<polyline points="20 6 9 17 4 12"/>';
      apiStatusText.textContent = 'API key configured';
    } else {
      apiStatus.classList.remove('has-key', 'hidden');
      apiStatus.classList.add('no-key');
      apiStatus.querySelector('svg').innerHTML = '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>';
      apiStatusText.textContent = 'API key not configured';
    }
  }

  function loadApiKeyIfExists() {
    if (currentApiKey) {
      apiKeyInput.value = currentApiKey;
      clearApiKeyBtn.style.display = 'inline-block';
    } else {
      apiKeyInput.value = '';
      clearApiKeyBtn.style.display = 'none';
    }
  }

  function toggleSettings() {
    settingsSection.classList.toggle('open');
    settingsToggle.classList.toggle('open');
  }

  function setButtonLoading(loading) {
    if (loading) {
      regenerateBtn.disabled = true;
      regenerateBtnText.innerHTML = '<div class="spinner"></div>';
    } else {
      regenerateBtn.disabled = false;
      regenerateBtnText.textContent = 'Regenerate Summary';
    }
  }

  function showStatus(message, type) {
    statusMsg.textContent = message;
    statusMsg.className = `status-msg ${type}`;
    clearTimeout(statusMsg.timeout);
    statusMsg.timeout = setTimeout(() => {
      statusMsg.textContent = '';
      statusMsg.className = 'status-msg';
    }, 4000);
  }

  function showEmptyState(message) {
    summaryContainer.classList.remove('open');
    emptyState.style.display = 'block';
    emptyStateText.textContent = message;
  }

  function displaySummary(summary) {
    currentSummary = summary;
    summaryContent.innerHTML = formatSummaryText(summary);
    summaryContainer.classList.add('open');
    emptyState.style.display = 'none';
  }

  function formatSummaryText(text) {
    if (!text) return '';

    let formatted = text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/^### (.*$)/gm, '<h3>$1</h3>');

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
          result.push(`<h3>${currentSection}</h3><ul>${sectionItems.join('')}</ul>`);
          sectionItems = [];
        }
        currentSection = trimmedLine;
      } else if (trimmedLine.startsWith('• ') || trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ')) {
        let bulletContent = trimmedLine.replace(/^[•*-\s]+/, '');
        sectionItems.push(`<li>${bulletContent}</li>`);
      } else if (trimmedLine && !currentSection) {
        result.push(`<p>${trimmedLine}</p>`);
      }
    }

    if (currentSection && sectionItems.length > 0) {
      result.push(`<h3>${currentSection}</h3><ul>${sectionItems.join('')}</ul>`);
    }

    return result.join('');
  }

  async function autoSummarize() {
    if (!currentApiKey || isSummarizing) return;

    isSummarizing = true;
    setButtonLoading(true);
    showStatus('Analyzing ticket...', 'info');

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab || !tab.id) {
        showEmptyState('Open a JIRA ticket to summarize');
        isSummarizing = false;
        setButtonLoading(false);
        return;
      }

      try {
        const response = await chrome.tabs.sendMessage(tab.id, {
          action: 'SUMMARIZE_JIRA_TICKET',
          apiKey: currentApiKey,
          returnToPopup: true
        });
        handleSummarizationResponse(response);
      } catch (msgErr) {
        await injectContentScriptAndSendMessage(tab.id, false);
      }

    } catch (err) {
      console.error('Auto-summarize error:', err.message);
      showEmptyState('Click to summarize this ticket');
      isSummarizing = false;
      setButtonLoading(false);
    }
  }

  function handleSummarizationResponse(response) {
    isSummarizing = false;
    setButtonLoading(false);

    if (response?.status === 'success' && response?.summary) {
      displaySummary(response.summary);
      showStatus('Summary generated!', 'success');
    } else if (response?.status === 'not_jira_page') {
      showEmptyState('Open a JIRA ticket to summarize');
    } else if (response?.status === 'not_configured') {
      showEmptyState('Click Settings to add your API key');
      showStatus('Please configure your API key', 'error');
      toggleSettings();
    } else if (response?.status === 'error') {
      showEmptyState(response?.message || 'Failed to generate summary');
      showStatus(response?.message || 'Failed to generate summary', 'error');
    } else {
      showEmptyState('Click to summarize this ticket');
    }
  }

  settingsToggle.addEventListener('click', toggleSettings);

  saveApiKeyBtn.addEventListener('click', async () => {
    const apiKey = apiKeyInput.value.trim();

    if (!apiKey) {
      showStatus('Please enter your Groq API key', 'error');
      return;
    }

    if (!apiKey.startsWith('gsk_')) {
      showStatus('Invalid format. Should start with "gsk_"', 'error');
      return;
    }

    saveApiKeyBtn.textContent = 'Saving...';
    saveApiKeyBtn.disabled = true;

    try {
      await chrome.storage.local.set({ groq_api_key: apiKey });
      currentApiKey = apiKey;
      updateApiStatus();
      clearApiKeyBtn.style.display = 'inline-block';
      showStatus('API key saved!', 'success');
      setTimeout(() => {
        settingsSection.classList.remove('open');
        settingsToggle.classList.remove('open');
        autoSummarize();
      }, 800);
    } catch (err) {
      console.error('Save error:', err);
      showStatus('Failed to save API key', 'error');
    } finally {
      saveApiKeyBtn.textContent = 'Save';
      saveApiKeyBtn.disabled = false;
    }
  });

  clearApiKeyBtn.addEventListener('click', async () => {
    try {
      await chrome.storage.local.remove(['groq_api_key']);
      currentApiKey = null;
      apiKeyInput.value = '';
      clearApiKeyBtn.style.display = 'none';
      updateApiStatus();
      showStatus('API key cleared', 'info');
      showEmptyState('Click Settings to add your API key');
    } catch (err) {
      showStatus('Failed to clear API key', 'error');
    }
  });

  regenerateBtn.addEventListener('click', async () => {
    if (!currentApiKey) {
      showStatus('Click Settings to add your API key', 'error');
      toggleSettings();
      return;
    }

    if (isSummarizing) return;

    isSummarizing = true;
    setButtonLoading(true);
    showStatus('Regenerating summary...', 'info');

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.id) {
        showEmptyState('Could not access current tab');
        isSummarizing = false;
        setButtonLoading(false);
        return;
      }

      try {
        const response = await chrome.tabs.sendMessage(tab.id, {
          action: 'SUMMARIZE_JIRA_TICKET',
          apiKey: currentApiKey,
          regenerate: true,
          returnToPopup: true
        });

        isSummarizing = false;
        setButtonLoading(false);

        if (response?.status === 'success' && response?.summary) {
          displaySummary(response.summary);
          showStatus('Summary regenerated!', 'success');
        } else if (response?.status === 'not_jira_page') {
          showEmptyState('Open a JIRA ticket to summarize');
        } else {
          showStatus('Failed to regenerate', 'error');
        }
      } catch (msgErr) {
        await injectContentScriptAndSendMessage(tab.id, true);
      }

    } catch (err) {
      console.error('Regenerate error:', err.message);
      showStatus('Failed to regenerate', 'error');
      isSummarizing = false;
      setButtonLoading(false);
    }
  });

  copyBtn.addEventListener('click', async () => {
    if (!currentSummary) return;

    try {
      await navigator.clipboard.writeText(currentSummary);
      const originalText = copyBtn.innerHTML;
      copyBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Copied!';
      setTimeout(() => {
        copyBtn.innerHTML = originalText;
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  });

  async function injectContentScriptAndSendMessage(tabId, isRegenerate) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['content.js']
      });

      await new Promise(resolve => setTimeout(resolve, 1000));

      const response = await chrome.tabs.sendMessage(tabId, {
        action: 'SUMMARIZE_JIRA_TICKET',
        apiKey: currentApiKey,
        regenerate: isRegenerate,
        returnToPopup: true
      });

      handleSummarizationResponse(response);

    } catch (err) {
      console.error('Injection error:', err);
      isSummarizing = false;
      setButtonLoading(false);
      if (err.message?.includes('Receiving end does not exist')) {
        showEmptyState('Reload the JIRA page and try again');
        showStatus('Reload the JIRA page and try again', 'error');
      } else if (err.message?.includes('No tab with id')) {
        showEmptyState('Tab closed. Refresh and try again.');
        showStatus('Tab closed', 'error');
      } else {
        showEmptyState('Could not analyze this page');
        showStatus('Could not analyze this page', 'error');
      }
    }
  }

  apiKeyInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      saveApiKeyBtn.click();
    }
  });
});
