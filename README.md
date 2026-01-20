# JiraGrok

<div align="center">

![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-blue?style=for-the-badge&logo=google-chrome)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-green?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)
![Version](https://img.shields.io/badge/Version-1.0.0-orange?style=for-the-badge)

**Grok your JIRA tickets with AI-powered summarization**

*Powered by Groq API (Llama 3.3 70B)*

</div>

---

> *"I grok him."* — Robert A. Heinlein, Stranger in a Strange Land

JiraGrok is a Chrome extension that automatically extracts and summarizes JIRA tickets using advanced AI. Cut through the noise and understand ticket context in seconds.

## Features

- **Auto-Summarization**: Automatically generates summaries when you open the extension on a JIRA ticket
- **Fast AI Processing**: Powered by Groq's Llama 3.3 70B model for rapid, accurate summarization
- **Structured Output**: Generates summaries in 5 key sections for easy scanning
- **Secure Storage**: API keys stored locally in Chrome's encrypted storage
- **One-Click Copy**: Copy summaries to clipboard with a single click
- **Regenerate**: Regenerate summaries with different formatting if needed
- **Clean UI**: Minimal popup interface that complements JIRA's design

## Installation

### Prerequisites

- Google Chrome (or any Chromium-based browser: Edge, Brave, Opera)
- Valid Groq API key ([get one here](https://console.groq.com/keys))

### Load the Extension

1. Clone or download this repository:
   ```bash
   git clone https://github.com/yourusername/jiragrok.git
   cd jiragrok/jira-summariser
   ```

2. Open Chrome and navigate to `chrome://extensions/`

3. Enable **Developer mode** using the toggle in the top-right corner

4. Click **"Load unpacked"** button

5. Select the `jira-summariser` folder

6. The JiraGrok icon will appear in your browser toolbar

### Configure API Key

1. Click the **JiraGrok** icon in your toolbar
2. If no API key is configured, the settings panel will be visible
3. Enter your Groq API key and click "Save API Key"
4. The key is securely stored in Chrome's local storage

## Usage

### Daily Workflow

1. Navigate to any JIRA ticket page (e.g., `https://your-domain.atlassian.net/browse/PROJ-123`)
2. Click the JiraGrok icon in your browser toolbar
3. The summary generates automatically and appears in the popup
4. Review the 5-section summary:
   - **Main Objective**: One-line summary of what the ticket is about
   - **Key Details**: Technical implementation details and business context
   - **Contributors**: Key people who have commented
   - **Key Timelines**: Dates, deadlines, and sprint goals
   - **Next Steps**: Action items and blockers

### Actions

| Action | How |
|--------|-----|
| Regenerate summary | Click the "Regenerate" button |
| Copy to clipboard | Click the "Copy" button |
| Update API key | Click "Settings" and enter new key |
| Clear API key | Click "Settings" → "Clear API Key" |

## Project Structure

```
jiragrok/
├── manifest.json          # Chrome extension manifest (MV3)
├── package.json           # Node.js project configuration
├── popup.html             # Extension popup interface
├── popup.js               # Popup logic and state management
├── content.js             # JIRA DOM extraction and API integration
├── icons/                 # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── src/
│   └── utils.js           # Utility functions
└── tests/                 # Test suite
    ├── setup.js           # Jest test setup
    ├── popup.test.js      # Popup component tests
    ├── content.test.js    # Content script tests
    └── utils.test.js      # Utility function tests
```

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Chrome Browser                   │
│  ┌──────────────────────────────────────────────┐  │
│  │              Popup (popup.html)              │  │
│  │  ┌────────────────────────────────────────┐  │  │
│  │  │         UI Layer (popup.js)            │  │  │
│  │  │  - Settings management                 │  │  │
│  │  │  - Summary display                     │  │  │
│  │  │  - Event handlers                      │  │  │
│  │  └────────────────────────────────────────┘  │  │
│  └────────────┬───────────────────┬──────────────┘  │
│               │ chrome.runtime    │                  │
│               │ .onMessage        │                  │
│  ┌────────────┴───────────────────┴──────────────┐  │
│  │           Content Script (content.js)          │  │
│  │  ┌────────────────────────────────────────┐   │  │
│  │  │  - DOM extraction from JIRA page       │   │  │
│  │  │  - Data formatting for API             │   │  │
│  │  │  - Groq API communication              │   │  │
│  │  │  - Response processing                 │   │  │
│  │  └────────────────────────────────────────┘   │  │
│  └─────────────────────────┬──────────────────────┘  │
└────────────────────────────┼─────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │    Groq API     │
                    │  Llama 3.3 70B  │
                    └─────────────────┘
```

### Component Details

#### manifest.json
Chrome extension configuration defining:
- Extension metadata and permissions
- Popup configuration
- Content script injection rules for JIRA domains
- Icon assets

#### popup.html / popup.js
The extension's user interface:
- Displays summary when available
- Settings panel for API key management
- Regenerate and copy buttons
- State management for API key and summary data

#### content.js
Core extraction and summarization logic:
- Identifies and extracts JIRA ticket data (description, comments, assignee, priority, status)
- Formats data for Groq API consumption
- Handles API communication and error handling
- Processes AI responses into structured summaries

#### utils.js
Shared utility functions used across components.

## Configuration

### Supported JIRA Domains

The extension automatically activates on:
- `*.atlassian.net` (Cloud JIRA)
- `jira.grazitti.com` (Custom JIRA instances)

### Groq API

The extension uses Groq's Inference API with the following configuration:

- **Model**: `llama-3.3-70b-versatile`
- **Temperature**: 0.3 (for consistent, focused outputs)
- **Max Tokens**: 1024

### Summary Format

Summaries are generated in a consistent 5-section structure:

```markdown
Main Objective:
• One-line summary of what this ticket is about

Key Details:
• Technical implementation details
• Business context or requirements
• Any constraints or dependencies

Contributors:
• Key people who have commented

Key Timelines:
• Any dates, deadlines mentioned
• Sprint goals or release targets
• Time estimates

Next Steps:
• Action items or blockers
• What needs to happen to resolve
```

## Development

### Setup

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Lint code
npm run lint
```

### Running in Development

1. Make changes to the source files
2. Reload the extension in Chrome:
   - Go to `chrome://extensions/`
   - Find "JiraGrok"
   - Click the refresh icon
3. Test changes on a JIRA ticket

### Testing

The project uses Jest with jsdom for component testing:

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- utils.test.js
```

### Linting

```bash
# Lint all files
npm run lint

# Fix auto-fixable issues
npm run lint -- --fix
```

## Security

- **API Key Storage**: Keys are stored in `chrome.storage.local`, which is encrypted by Chrome
- **Network Requests**: API calls are made directly from the content script to Groq's servers
- **No External Tracking**: The extension does not collect or transmit any usage data
- **Local Processing**: All summarization happens client-side

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Ways to Contribute

- Improve JIRA selector detection for different themes/versions
- Enhance summarization prompts for better outputs
- Add support for additional JIRA fields
- Improve error handling and edge cases
- Add new features like keyboard shortcuts or summary caching
- Fix bugs and improve test coverage

### Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Troubleshooting

### Extension doesn't appear in toolbar
- Ensure the extension is loaded in `chrome://extensions/`
- Check that Developer mode is enabled
- Try clicking the puzzle piece icon in Chrome's toolbar

### "Not on a JIRA ticket page" message
- Verify you're on a JIRA issue page (URL should contain `/browse/PROJ-`)
- Ensure the JIRA domain is supported (atlassian.net or jira.grazitti.com)
- Try refreshing the page

### API errors
- Verify your Groq API key is valid
- Check your API quota at [console.groq.com](https://console.groq.com/keys)
- Ensure the key starts with `gsk_`

### Empty or incomplete summaries
- Ensure the JIRA ticket has content in description or comments
- Try regenerating the summary
- Check browser console for extraction errors

## FAQ

**Q: Is my API key secure?**
A: Yes. API keys are stored in Chrome's encrypted local storage and are only used to authenticate requests to Groq's API.

**Q: Does this extension read my JIRA data?**
A: The extension only accesses JIRA pages when you open the popup. The data is sent directly to Groq for processing and is not stored or transmitted anywhere else.

**Q: Can I use this with self-hosted JIRA?**
A: Currently, the extension is configured for Atlassian Cloud and jira.grazitti.com. Self-hosted JIRA instances can be added by updating the `content_scripts.matches` pattern in `manifest.json`.

**Q: What happens if I don't have an API key?**
A: You'll see a prompt to configure your API key before using the summarization feature.

**Q: Is there a cost to use this extension?**
A: The extension is free. Groq offers a generous free tier for API usage. Check [Groq's pricing](https://groq.com/pricing/) for current rates.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Groq](https://groq.com/) for their fast inference API
- [Llama](https://www.llama.com/) for the underlying language model
- [Robert A. Heinlein](https://en.wikipedia.org/wiki/Robert_A._Heinlein) for the term "grok"
- [Atlassian](https://www.atlassian.com/) for JIRA

---

<div align="center">
Made with ⚡ by <a href="https://github.com/barungrazitti">Barun Tayenjam</a>
</div>
