# Lcontext

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://img.shields.io/npm/v/lcontext-mcp.svg)](https://www.npmjs.com/package/lcontext-mcp)

MCP server for [Lcontext](https://lcontext.com) behavioral analytics. Provides comprehensive behavioral analytics context for AI coding agents, including page metrics, visitor profiles, session data, and AI-generated insights.

**Works with:** Claude Code, Claude Desktop, Cursor, Windsurf, Cline, and any MCP-compatible AI coding tool.

## Installation

### Quick Install (Recommended)

```bash
curl -fsSL https://lcontext.com/api/cli/install | bash
```

This downloads a standalone binary - no Node.js required.

### Manual Download

Download the binary for your platform from the [latest release](https://github.com/evan-kyr/lcontext/releases/latest):

| Platform | Binary |
|----------|--------|
| macOS (Apple Silicon) | `lcontext-macos-arm64` |
| macOS (Intel) | `lcontext-macos-x64` |
| Linux (x64) | `lcontext-linux-x64` |
| Linux (ARM64) | `lcontext-linux-arm64` |
| Windows (x64) | `lcontext-windows-x64.exe` |

### Via npm

If you have Node.js installed:

```bash
npm install -g lcontext-mcp
```

### From Source

```bash
git clone https://github.com/lcontext/lcontext.git
cd lcontext
npm install
npm run build
```

## Configuration

### 1. Get Your API Key

Sign up at [lcontext.com](https://lcontext.com) and find your API key in **Settings > API Access**.

### 2. Add the Tracking Script to Your App

Before the MCP server can provide analytics context, you need to install the tracking script on your app to collect behavioral data.

**Quick install:** Add this to your app's HTML:

```html
<script src="https://lcontext.com/it.js?iTag=YOUR_SITE_TAG" defer></script>
```

Replace `YOUR_SITE_TAG` with the tag from your app settings in the Lcontext dashboard.

<details>
<summary><b>What the tracker collects</b></summary>

- **Page views** - URL, title, referrer
- **Clicks** - Buttons, links, interactive elements (label text only, no personal data)
- **Form submissions** - Form metadata (no field values captured)
- **Scroll depth** - How far users scroll (25% increments)
- **Device metadata** - Screen size, browser language, viewport

**Privacy-focused:** No passwords, input values, or personal information collected. ~4KB minified.

</details>

<details>
<summary><b>Advanced: Link to your user IDs</b></summary>

Associate the anonymous visitor with your application's user ID:

```javascript
lcontext('setProfileId', 'user-123');
```

Track custom events:

```javascript
lcontext('trackEvent', 'purchase', { productId: 'abc', amount: 99.99 });
```

</details>

### 3. Configure Your AI Coding Tool

<details open>
<summary><b>Claude Code / Claude Desktop</b></summary>

Run the install script - it will prompt for your API key and configure Claude automatically:

```bash
curl -fsSL https://lcontext.com/api/cli/install | bash
```

Then restart Claude.

</details>

<details>
<summary><b>Cursor</b></summary>

**Option 1: One-Click Install**

[Install Lcontext in Cursor](https://cursor.com/install-mcp?name=lcontext&config=eyJjb21tYW5kIjoibGNvbnRleHQiLCJlbnYiOnsiTENPTlRFWFRfQVBJX0tFWSI6InlvdXItYXBpLWtleS1oZXJlIn19)

After clicking, replace `your-api-key-here` with your actual API key in Cursor settings.

**Option 2: Manual Setup**

First, install the binary:
```bash
curl -fsSL https://lcontext.com/api/cli/install | bash
```

Then open Cursor Settings (`Cmd/Ctrl + Shift + J`), and add the server:

```json
{
  "lcontext": {
    "command": "lcontext",
    "env": {
      "LCONTEXT_API_KEY": "your-api-key-here"
    }
  }
}
```

</details>

<details>
<summary><b>Windsurf</b></summary>

First, install the binary:
```bash
curl -fsSL https://lcontext.com/api/cli/install | bash
```

Then open Windsurf and navigate to **Cascade > Configure > MCP Servers** (or click the hammer icon), then click "Add Server" and select "Add custom server". Add this configuration:

```json
{
  "lcontext": {
    "command": "lcontext",
    "env": {
      "LCONTEXT_API_KEY": "your-api-key-here"
    }
  }
}
```

</details>

<details>
<summary><b>Cline (VS Code Extension)</b></summary>

First, install the binary:
```bash
curl -fsSL https://lcontext.com/api/cli/install | bash
```

Then in VS Code with Cline installed:
1. Open Cline settings (click gear icon in Cline panel)
2. Navigate to **MCP Servers** section
3. Add a new server:

```json
{
  "lcontext": {
    "command": "lcontext",
    "env": {
      "LCONTEXT_API_KEY": "your-api-key-here"
    }
  }
}
```

</details>

<details>
<summary><b>Other MCP-Compatible Tools</b></summary>

First, install the binary:
```bash
curl -fsSL https://lcontext.com/api/cli/install | bash
```

Lcontext works with any tool that supports the Model Context Protocol. The general configuration pattern is:

- **Command:** `lcontext`
- **Environment Variable:** `LCONTEXT_API_KEY=your-api-key-here`

Refer to your tool's documentation for MCP server configuration.

</details>

## Available Tools

### `get_page_context`

Get comprehensive behavioral analytics context for a page including stats, visitor metrics, and all interactive elements with their engagement data.

**Parameters:**
- `path` (required): The page path (e.g., `/products`, `/checkout`)
- `startDate` (optional): Start date for stats (ISO format)
- `endDate` (optional): End date for stats (ISO format)
- `periodType` (optional): `day` or `week` (default: `day`)

**Example:**
```
Get the analytics context for the /checkout page for the last 7 days
```

### `list_pages`

List all tracked pages for your app.

**Parameters:**
- `limit` (optional): Maximum pages to return (default: 50, max: 200)
- `search` (optional): Filter by path (e.g., `/product`)

**Example:**
```
What pages are being tracked on my app?
```

### `get_element_context`

Get detailed analytics for a specific interactive element by its label or ID.

**Parameters:**
- `elementLabel` (optional): Element's label text or aria-label
- `elementId` (optional): Element's HTML ID
- `pagePath` (optional): Filter by page path

**Example:**
```
Show me analytics for the "Add to Cart" button
```

### `get_app_context`

Get application-wide behavioral analytics including total sessions, visitors, page views, engagement metrics, and AI-generated insights.

**Parameters:**
- `periodType` (optional): `day` or `week` (default: `day`)
- `limit` (optional): Number of periods to return (default: 7, max: 30)

**Example:**
```
Give me an overview of my app's behavioral analytics for the last week
```

### `get_visitors`

Get a list of visitors with AI-generated profiles, interests, engagement trends, and segment assignments.

**Parameters:**
- `limit` (optional): Maximum visitors to return (default: 20, max: 100)
- `offset` (optional): Offset for pagination
- `segmentId` (optional): Filter by segment ID
- `search` (optional): Search in visitor ID, title, summary, interests, goals, action, evidence
- `firstVisitAfter` (optional): Filter by first visit date (ISO format)
- `firstVisitBefore` (optional): Filter by first visit date (ISO format)
- `lastVisitAfter` (optional): Filter by last visit date (ISO format)
- `lastVisitBefore` (optional): Filter by last visit date (ISO format)
- `engagementTrend` (optional): `increasing`, `stable`, or `decreasing`
- `overallSentiment` (optional): `positive`, `negative`, `neutral`, or `mixed`

**Example:**
```
Show me visitors with increasing engagement trend
```

### `get_visitor_detail`

Get detailed profile and recent sessions for a specific visitor.

**Parameters:**
- `visitorId` (required): The visitor's unique identifier

**Example:**
```
Get the full profile for visitor abc123
```

### `get_sessions`

Get a list of user sessions with AI-generated summaries, titles, and sentiment analysis.

**Parameters:**
- `limit` (optional): Maximum sessions to return (default: 20, max: 100)
- `offset` (optional): Offset for pagination
- `visitorId` (optional): Filter by visitor ID
- `sentiment` (optional): `positive`, `negative`, or `neutral`
- `startDate` (optional): Start date for filtering (ISO format)
- `endDate` (optional): End date for filtering (ISO format)
- `search` (optional): Search in session title and description
- `minDuration` (optional): Minimum session duration in seconds
- `maxDuration` (optional): Maximum session duration in seconds
- `minEventsCount` (optional): Minimum number of events
- `maxEventsCount` (optional): Maximum number of events

**Example:**
```
Show me negative sentiment sessions from the last 24 hours
```

### `get_session_detail`

Get detailed information about a specific session including full event data and visitor context.

**Parameters:**
- `sessionId` (required): The session's numeric ID

**Example:**
```
Show me the details of session 12345
```

## Updating

The binary includes a self-update command:

```bash
lcontext --update
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `LCONTEXT_API_KEY` | Your Lcontext API key | Yes |
| `LCONTEXT_API_URL` | API base URL (default: https://lcontext.com) | No |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and build instructions.

## License

MIT - see [LICENSE](LICENSE) for details.
