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

JiraGrok is an AI-powered Chrome extension that automatically extracts and summarizes JIRA tickets in seconds. Built with modern web technologies and following Chrome's Manifest V3 standards, it helps development teams quickly understand ticket context without reading through lengthy descriptions and comment threads.

<div align="center">

### ⭐ Key Features

| ⚡ | 🚀 | 🔒 | 📊 |
|---|---|---|---|
| Auto-Summarization | Groq Llama 3.3 70B | Local API Key Storage | 5-Section Output |
| Copy to Clipboard | Regenerate Summary | No Data Collection | Clean UI |

**Categories:** `chrome-extension` `jira` `summarizer` `ai` `productivity` `groq` `manifest-v3`

</div>

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
   git clone https://github.com/barungrazitti/jiragrok.git
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

<details>
<summary><b>🔐 Is my API key secure?</b></summary>

**Yes!** Your API key is stored in Chrome's encrypted local storage (`chrome.storage.local`). It never leaves your browser except for direct requests to Groq's API. We don't collect, track, or transmit any data.

</details>

<details>
<summary><b>📊 Does this extension read my JIRA data?</b></summary>

The extension only accesses JIRA pages when you explicitly open the popup. Data is sent directly to Groq for processing and is not stored anywhere else. Nothing is logged or saved to external servers.

</details>

<details>
<summary><b>💰 Is there a cost to use JiraGrok?</b></summary>

The extension itself is completely free. Groq offers a generous free tier for API usage. Check current rates at [groq.com/pricing](https://groq.com/pricing). Most users stay well within the free quota.

</details>

<details>
<summary><b>🌐 Can I use this with self-hosted JIRA?</b></summary>

Currently, JiraGrok supports Atlassian Cloud (`*.atlassian.net`) and `jira.grazitti.com`. Self-hosted JIRA instances can be added by updating the `content_scripts.matches` pattern in `manifest.json`.

</details>

<details>
<summary><b>🚀 How does summarization work?</b></summary>

JiraGrok extracts key ticket fields (description, comments, assignee, priority, status, etc.) and sends them to Groq's Llama 3.3 70B model. The AI generates a structured summary in 5 sections: Main Objective, Key Details, Contributors, Key Timelines, and Next Steps.

</details>

<details>
<summary><b>❌ What if I don't have an API key?</b></summary>

You'll see a prompt to configure your Groq API key before using the summarization feature. Get your free key at [console.groq.com/keys](https://console.groq.com/keys).

</details>

<details>
<summary><b>🧠 What does "grok" mean?</b></summary>

From Robert Heinlein's *Stranger in a Strange Land*: to grok means to understand intuitively, to empathize with, to "drink in" completely. Just like JiraGrok deeply understands your JIRA tickets! 😄

</details>

<details>
<summary><b>🔧 Can I contribute to this project?</b></summary>

Absolutely! Contributions are welcome—improved JIRA selectors, better prompts, new features, bug fixes, or documentation. Fork the repo, make changes, and submit a PR!

</details>

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
