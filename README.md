# lcontext

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://img.shields.io/npm/v/lcontext-mcp.svg)](https://www.npmjs.com/package/lcontext-mcp)

MCP (Model Context Protocol) server for [lcontext](https://lcontext.com) analytics. Provides comprehensive analytics context for Claude, including page metrics, visitor profiles, session data, and AI-generated insights.

## Installation

### Quick Install (Recommended)

```bash
curl -fsSL https://lcontext.com/install.sh | bash
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

### From Source

```bash
git clone https://github.com/evan-kyr/lcontext.git
cd lcontext
npm install
npm run build
```

## Configuration

### 1. Get Your API Key

Sign up at [lcontext.com](https://lcontext.com) and find your API key in **Settings > API Access**.

### 2. Configure Claude Code

```bash
claude mcp add lcontext -e LCONTEXT_API_KEY=your-api-key -- lcontext
```

### 3. Configure Claude Desktop

Edit your Claude Desktop config file:

- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`
- Linux: `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "lcontext": {
      "command": "lcontext",
      "env": {
        "LCONTEXT_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

Then restart Claude.

## Available Tools

### `get_page_context`

Get comprehensive analytics context for a page including stats, visitor metrics, and all interactive elements with their engagement data.

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

List all tracked pages for your website.

**Parameters:**
- `limit` (optional): Maximum pages to return (default: 50, max: 200)
- `search` (optional): Filter by path (e.g., `/product`)

**Example:**
```
What pages are being tracked on my website?
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

Get application-wide analytics including total sessions, visitors, page views, engagement metrics, and AI-generated insights.

**Parameters:**
- `periodType` (optional): `day` or `week` (default: `day`)
- `limit` (optional): Number of periods to return (default: 7, max: 30)

**Example:**
```
Give me an overview of my app's analytics for the last week
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
| `LCONTEXT_API_KEY` | Your lcontext API key | Yes |
| `LCONTEXT_API_URL` | API base URL (default: https://lcontext.com) | No |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and build instructions.

## License

MIT - see [LICENSE](LICENSE) for details.
