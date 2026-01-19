#!/usr/bin/env node

/**
 * lcontext MCP Server
 *
 * Provides page and element analytics context for Claude Code.
 * Requires authentication via LCONTEXT_API_KEY environment variable only.
 *
 * Tools:
 * - get_page_context: Get page analytics, stats, and related elements for a given path and time range
 * - list_pages: List all tracked pages for the authenticated website
 * - get_element_context: Get detailed analytics for a specific element
 * - get_app_context: Get application-wide analytics including sessions, visitors, and AI insights
 * - get_visitors: Get visitors list with AI-generated profiles and segment assignments
 * - get_visitor_detail: Get detailed profile and sessions for a specific visitor
 * - get_sessions: Get sessions list with AI summaries and sentiment analysis
 * - get_session_detail: Get detailed session info including events and visitor context
 */

// Handle CLI flags before importing heavy dependencies
const args = process.argv.slice(2);
if (args.includes('--version') || args.includes('-v')) {
  console.log('1.1.0');
  process.exit(0);
}
if (args.includes('--help') || args.includes('-h')) {
  console.log(`lcontext v1.1.0

MCP server for lcontext page analytics.
Provides page and element context for Claude Code.

Usage:
  lcontext [options]

Options:
  -v, --version    Show version number
  -h, --help       Show this help message
  --update         Update to the latest version

Environment Variables:
  LCONTEXT_API_KEY    Your lcontext API key (required)
  LCONTEXT_API_URL    API base URL (default: https://lcontext.com)

Documentation: https://lcontext.com/docs/mcp
`);
  process.exit(0);
}
// Self-update command - runs async then exits
if (args.includes('--update')) {
  import('fs').then(fs => import('os').then(os => {
    const CURRENT_VERSION = '1.1.0';
    const GITHUB_REPO = 'evan-kyr/lcontext';

    const platform = os.platform();
    const arch = os.arch();

    let binaryName: string;
    if (platform === 'darwin') {
      binaryName = arch === 'arm64' ? 'lcontext-macos-arm64' : 'lcontext-macos-x64';
    } else if (platform === 'win32') {
      binaryName = 'lcontext-windows-x64.exe';
    } else {
      binaryName = arch === 'arm64' ? 'lcontext-linux-arm64' : 'lcontext-linux-x64';
    }

    console.log(`Current version: ${CURRENT_VERSION}`);
    console.log(`Platform: ${platform} ${arch}`);
    console.log('Checking for updates...');

    fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
      headers: { 'User-Agent': 'lcontext-mcp' }
    })
      .then(res => res.json())
      .then((release: any) => {
        const latestVersion = release.tag_name.replace(/^v/, '');
        console.log(`Latest version: ${latestVersion}`);

        if (latestVersion === CURRENT_VERSION) {
          console.log('Already up to date!');
          process.exit(0);
        }

        const asset = release.assets.find((a: any) => a.name === binaryName);
        if (!asset) {
          console.error(`No binary found for ${binaryName}`);
          process.exit(1);
        }

        console.log(`Downloading ${binaryName}...`);

        return fetch(asset.browser_download_url, {
          headers: { 'User-Agent': 'lcontext-mcp' }
        }).then(res => res.arrayBuffer()).then(data => {
          const binaryData = Buffer.from(data);
          const execPath = process.execPath;
          const tempPath = execPath + '.new';
          const backupPath = execPath + '.backup';

          console.log(`Installing to ${execPath}...`);

          fs.writeFileSync(tempPath, binaryData);
          fs.chmodSync(tempPath, 0o755);

          if (fs.existsSync(backupPath)) fs.unlinkSync(backupPath);
          fs.renameSync(execPath, backupPath);
          fs.renameSync(tempPath, execPath);
          fs.unlinkSync(backupPath);

          console.log(`Successfully updated to ${latestVersion}!`);
          process.exit(0);
        });
      })
      .catch((err: any) => {
        console.error('Update failed:', err.message);
        process.exit(1);
      });
  }));
  // Keep process alive while update runs
  setInterval(() => {}, 1000);
}

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

// Configuration
const CURRENT_VERSION = "1.1.0";
const GITHUB_REPO = "evan-kyr/lcontext";
const API_BASE_URL = process.env.LCONTEXT_API_URL || "https://lcontext.com";
const API_KEY = process.env.LCONTEXT_API_KEY;

// Check for updates (non-blocking, outputs to stderr)
async function checkForUpdates(): Promise<void> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`,
      {
        signal: controller.signal,
        headers: { 'User-Agent': 'lcontext-mcp' }
      }
    );
    clearTimeout(timeout);

    if (!response.ok) return;

    const release = await response.json() as { tag_name: string; html_url: string };
    const latestVersion = release.tag_name.replace(/^v/, '');

    if (latestVersion !== CURRENT_VERSION && isNewerVersion(latestVersion, CURRENT_VERSION)) {
      console.error(`\n[lcontext] Update available: ${CURRENT_VERSION} → ${latestVersion}`);
      console.error(`[lcontext] Download: https://github.com/${GITHUB_REPO}/releases/latest\n`);
    }
  } catch {
    // Silently ignore - don't block startup for update checks
  }
}

function isNewerVersion(latest: string, current: string): boolean {
  const latestParts = latest.split('.').map(Number);
  const currentParts = current.split('.').map(Number);

  for (let i = 0; i < Math.max(latestParts.length, currentParts.length); i++) {
    const l = latestParts[i] || 0;
    const c = currentParts[i] || 0;
    if (l > c) return true;
    if (l < c) return false;
  }
  return false;
}

// Run update check in background
checkForUpdates();

// Validation schemas
const getPageContextSchema = z.object({
  path: z.string().describe("The page path to get context for (e.g., '/products', '/checkout')"),
  startDate: z.string().optional().describe("Start date for stats (ISO format, e.g., '2025-01-01')"),
  endDate: z.string().optional().describe("End date for stats (ISO format, e.g., '2025-01-13')"),
  periodType: z.enum(["day", "week"]).optional().default("day").describe("Period type for stats aggregation")
});

const listPagesSchema = z.object({
  limit: z.number().optional().default(50).describe("Maximum number of pages to return (max: 200)"),
  search: z.string().optional().describe("Search filter for page paths")
});

const getElementContextSchema = z.object({
  elementLabel: z.string().optional().describe("The element's label text or aria-label to search for"),
  elementId: z.string().optional().describe("The element's HTML ID to search for"),
  pagePath: z.string().optional().describe("Optional page path to filter elements")
});

const getAppContextSchema = z.object({
  periodType: z.enum(["day", "week"]).optional().default("day").describe("Period type for stats aggregation"),
  limit: z.number().optional().default(7).describe("Number of periods to return (default: 7, max: 30)")
});

const getVisitorsSchema = z.object({
  limit: z.number().optional().default(20).describe("Maximum number of visitors to return (default: 20, max: 100)"),
  offset: z.number().optional().default(0).describe("Offset for pagination"),
  segmentId: z.number().optional().describe("Filter by segment ID"),
  search: z.string().optional().describe("Search in visitor ID, title, summary, interests, goals, action, evidence"),
  firstVisitAfter: z.string().optional().describe("Filter visitors who first visited after this date (ISO format)"),
  firstVisitBefore: z.string().optional().describe("Filter visitors who first visited before this date (ISO format)"),
  lastVisitAfter: z.string().optional().describe("Filter visitors who last visited after this date (ISO format)"),
  lastVisitBefore: z.string().optional().describe("Filter visitors who last visited before this date (ISO format)"),
  engagementTrend: z.enum(["increasing", "stable", "decreasing"]).optional().describe("Filter by engagement trend"),
  overallSentiment: z.enum(["positive", "negative", "neutral", "mixed"]).optional().describe("Filter by overall sentiment")
});

const getVisitorDetailSchema = z.object({
  visitorId: z.string().describe("The visitor's unique identifier")
});

const getSessionsSchema = z.object({
  limit: z.number().optional().default(20).describe("Maximum number of sessions to return (default: 20, max: 100)"),
  offset: z.number().optional().default(0).describe("Offset for pagination"),
  visitorId: z.string().optional().describe("Filter sessions by visitor ID"),
  sentiment: z.enum(["positive", "negative", "neutral"]).optional().describe("Filter by session sentiment"),
  startDate: z.string().optional().describe("Start date for filtering (ISO format)"),
  endDate: z.string().optional().describe("End date for filtering (ISO format)"),
  search: z.string().optional().describe("Search in session title and description"),
  minDuration: z.number().optional().describe("Filter sessions with duration >= this value (seconds)"),
  maxDuration: z.number().optional().describe("Filter sessions with duration <= this value (seconds)"),
  minEventsCount: z.number().optional().describe("Filter sessions with events count >= this value"),
  maxEventsCount: z.number().optional().describe("Filter sessions with events count <= this value")
});

const getSessionDetailSchema = z.object({
  sessionId: z.number().describe("The session's numeric ID")
});

// HTTP client helper
async function apiRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
  if (!API_KEY) {
    throw new Error("LCONTEXT_API_KEY environment variable is required");
  }

  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'X-API-Key': API_KEY,
    'Content-Type': 'application/json',
    ...options.headers
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`API request failed (${response.status}): ${errorBody}`);
  }

  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error(`Invalid JSON response from API: ${text.substring(0, 200)}${text.length > 200 ? '...' : ''}`);
  }
}

// Helper function to format page context
function formatPageContext(data: any): string {
  const { page, stats, elements } = data;

  let output = `
## Page Analytics: ${page.path}
${page.title ? `**Title:** ${page.title}` : ''}
**First Seen:** ${new Date(page.firstSeenAt).toLocaleDateString()}
**Last Seen:** ${new Date(page.lastSeenAt).toLocaleDateString()}

### Page Statistics
`;

  if (stats.length === 0) {
    output += "No statistics available for the selected time range.\n";
  } else {
    // Aggregate totals
    const totals = stats.reduce((acc: any, stat: any) => ({
      views: acc.views + (stat.viewCount || 0),
      uniqueVisitors: acc.uniqueVisitors + (stat.uniqueVisitors || 0),
      bounces: acc.bounces + (stat.bounceCount || 0),
      entries: acc.entries + (stat.entryCount || 0),
      exits: acc.exits + (stat.exitCount || 0)
    }), { views: 0, uniqueVisitors: 0, bounces: 0, entries: 0, exits: 0 });

    output += `
**Summary (${stats.length} ${stats[0]?.periodType || 'day'}s)**
- Total Views: ${totals.views}
- Total Unique Visitors: ${totals.uniqueVisitors}
- Total Bounces: ${totals.bounces}
- Entry Rate: ${totals.views > 0 ? ((totals.entries / totals.views) * 100).toFixed(1) : 0}%
- Exit Rate: ${totals.views > 0 ? ((totals.exits / totals.views) * 100).toFixed(1) : 0}%

**Recent Daily Breakdown:**
`;
    for (const stat of stats.slice(0, 7)) {
      const date = new Date(stat.periodStart).toLocaleDateString();
      output += `| ${date} | Views: ${stat.viewCount} | Visitors: ${stat.uniqueVisitors} | Avg Duration: ${stat.avgDuration}s | Scroll: ${stat.avgScrollDepth}% |\n`;
    }

    // Add AI summaries if available
    const summaries = stats.filter((stat: any) => stat.aiSummary);
    if (summaries.length > 0) {
      output += `\n### AI Insights\n`;
      for (const stat of summaries) {
        const date = new Date(stat.periodStart).toLocaleDateString();
        const updatedAt = stat.aiSummaryUpdatedAt ? new Date(stat.aiSummaryUpdatedAt).toLocaleDateString() : 'Unknown';
        output += `\n**${stat.periodType === 'week' ? 'Week of' : ''} ${date}** (updated: ${updatedAt})\n${stat.aiSummary}\n`;
      }
    }
  }

  output += `
### Interactive Elements (${elements.length} tracked)
`;

  if (elements.length === 0) {
    output += "No interactive elements tracked on this page.\n";
  } else {
    // Calculate total interactions for each element
    const elementsWithTotals = elements.map((element: any) => {
      const totalInteractions = element.stats.reduce((sum: number, s: any) => sum + (s.interactionCount || 0), 0);
      return { ...element, totalInteractions };
    }).sort((a: any, b: any) => b.totalInteractions - a.totalInteractions);

    for (const element of elementsWithTotals.slice(0, 20)) {
      const label = element.label || element.ariaLabel || element.elementId || element.tagName || 'Unknown';
      const category = element.category?.toUpperCase() || 'OTHER';

      output += `
**${category}: ${label}**
- Interactions: ${element.totalInteractions}
- Tag: \`<${element.tagName || 'unknown'}>\`${element.elementId ? ` id="${element.elementId}"` : ''}
${element.destinationUrl ? `- Links to: ${element.destinationUrl}` : ''}
`;
    }

    if (elementsWithTotals.length > 20) {
      output += `\n*...and ${elementsWithTotals.length - 20} more elements*\n`;
    }
  }

  return output.trim();
}

// Helper function to format app context
function formatAppContext(data: any): string {
  const { stats, topPages, topEntryPages, topExitPages, recentInsights } = data;

  let output = `## Application Analytics Overview\n`;

  if (stats.length === 0) {
    output += "\nNo statistics available for the selected time range.\n";
  } else {
    // Aggregate totals
    const totals = stats.reduce((acc: any, stat: any) => ({
      sessions: acc.sessions + (stat.totalSessions || 0),
      uniqueVisitors: acc.uniqueVisitors + (stat.uniqueVisitors || 0),
      newVisitors: acc.newVisitors + (stat.newVisitors || 0),
      pageViews: acc.pageViews + (stat.totalPageViews || 0),
      totalDuration: acc.totalDuration + (stat.totalDuration || 0),
      totalEvents: acc.totalEvents + (stat.totalEvents || 0),
      bounces: acc.bounces + (stat.bounceCount || 0),
      positiveSessions: acc.positiveSessions + (stat.positiveSessions || 0),
      negativeSessions: acc.negativeSessions + (stat.negativeSessions || 0),
      neutralSessions: acc.neutralSessions + (stat.neutralSessions || 0)
    }), { sessions: 0, uniqueVisitors: 0, newVisitors: 0, pageViews: 0, totalDuration: 0, totalEvents: 0, bounces: 0, positiveSessions: 0, negativeSessions: 0, neutralSessions: 0 });

    const avgSessionDuration = totals.sessions > 0 ? Math.round(totals.totalDuration / totals.sessions) : 0;
    const bounceRate = totals.sessions > 0 ? ((totals.bounces / totals.sessions) * 100).toFixed(1) : '0';

    output += `
### Summary (${stats.length} ${stats[0]?.periodType || 'day'}s)
- **Total Sessions:** ${totals.sessions.toLocaleString()}
- **Unique Visitors:** ${totals.uniqueVisitors.toLocaleString()}
- **New Visitors:** ${totals.newVisitors.toLocaleString()}
- **Total Page Views:** ${totals.pageViews.toLocaleString()}
- **Avg Session Duration:** ${avgSessionDuration}s
- **Total Events:** ${totals.totalEvents.toLocaleString()}
- **Bounce Rate:** ${bounceRate}%

### Session Sentiment
- Positive: ${totals.positiveSessions} | Neutral: ${totals.neutralSessions} | Negative: ${totals.negativeSessions}

### Daily Breakdown
`;
    for (const stat of stats.slice(0, 7)) {
      const date = new Date(stat.periodStart).toLocaleDateString();
      output += `| ${date} | Sessions: ${stat.totalSessions} | Visitors: ${stat.uniqueVisitors} | Page Views: ${stat.totalPageViews} | Bounce: ${stat.bounceRate}% |\n`;
    }

    // Add AI summaries if available
    const summaries = stats.filter((stat: any) => stat.aiSummary);
    if (summaries.length > 0) {
      output += `\n### AI Insights\n`;
      for (const stat of summaries.slice(0, 3)) {
        const date = new Date(stat.periodStart).toLocaleDateString();
        output += `\n**${stat.periodType === 'week' ? 'Week of' : ''} ${date}**\n${stat.aiSummary}\n`;
      }
    }
  }

  // Top pages
  if (topPages && topPages.length > 0) {
    output += `\n### Top Pages by Views\n`;
    for (const page of topPages.slice(0, 5)) {
      output += `- ${page.path}: ${page.viewCount} views\n`;
    }
  }

  // Top entry pages
  if (topEntryPages && topEntryPages.length > 0) {
    output += `\n### Top Entry Pages\n`;
    for (const page of topEntryPages.slice(0, 5)) {
      output += `- ${page.path}: ${page.count} entries\n`;
    }
  }

  // Top exit pages
  if (topExitPages && topExitPages.length > 0) {
    output += `\n### Top Exit Pages\n`;
    for (const page of topExitPages.slice(0, 5)) {
      output += `- ${page.path}: ${page.count} exits\n`;
    }
  }

  // Recent insights
  if (recentInsights && recentInsights.length > 0) {
    output += `\n### Recent Insights\n`;
    for (const insight of recentInsights.slice(0, 3)) {
      const date = new Date(insight.createdAt).toLocaleDateString();
      output += `\n**${insight.title}** (${date})\n${insight.content}\n`;
    }
  }

  return output.trim();
}

// Helper function to format visitors list
function formatVisitors(data: any): string {
  const { visitors, total, limit, offset } = data;

  let output = `## Visitors\n\n`;
  output += `Showing ${visitors.length} of ${total} visitors (offset: ${offset}):\n`;

  if (visitors.length === 0) {
    output += "\nNo visitors found matching the criteria.\n";
    return output.trim();
  }

  for (const visitor of visitors) {
    const sentiment = visitor.overallSentiment ? ` | ${visitor.overallSentiment}` : '';
    const trend = visitor.engagementTrend ? ` | Trend: ${visitor.engagementTrend}` : '';
    const segment = visitor.segmentName ? ` | Segment: ${visitor.segmentName}` : '';

    output += `
### ${visitor.profileTitle || visitor.visitorId}
- **Visitor ID:** ${visitor.visitorId}
- **Sessions:** ${visitor.sessionCount}${sentiment}${trend}${segment}
- **First Visit:** ${new Date(visitor.firstVisitAt).toLocaleDateString()}
- **Last Visit:** ${new Date(visitor.lastVisitAt).toLocaleDateString()}
`;

    if (visitor.profileSummary) {
      output += `- **Profile:** ${visitor.profileSummary}\n`;
    }

    if (visitor.primaryInterests && visitor.primaryInterests.length > 0) {
      output += `- **Interests:** ${visitor.primaryInterests.join(', ')}\n`;
    }

    if (visitor.recommendedAction) {
      output += `- **Recommended Action:** ${visitor.recommendedAction}\n`;
    }
  }

  return output.trim();
}

// Helper function to format visitor detail
function formatVisitorDetail(data: any): string {
  const { visitor, recentSessions } = data;

  let output = `## Visitor Profile: ${visitor.profileTitle || visitor.visitorId}\n`;

  output += `
**Visitor ID:** ${visitor.visitorId}
**First Visit:** ${new Date(visitor.firstVisitAt).toLocaleDateString()}
**Last Visit:** ${new Date(visitor.lastVisitAt).toLocaleDateString()}
`;

  if (visitor.segmentName) {
    output += `**Segment:** ${visitor.segmentName}\n`;
  }

  if (visitor.overallSentiment) {
    output += `**Overall Sentiment:** ${visitor.overallSentiment}\n`;
  }

  if (visitor.engagementTrend) {
    output += `**Engagement Trend:** ${visitor.engagementTrend}\n`;
  }

  if (visitor.profileSummary) {
    output += `\n### Profile Summary\n${visitor.profileSummary}\n`;
  }

  if (visitor.primaryInterests && visitor.primaryInterests.length > 0) {
    output += `\n### Primary Interests\n`;
    for (const interest of visitor.primaryInterests) {
      output += `- ${interest}\n`;
    }
  }

  if (visitor.goalsInferred && visitor.goalsInferred.length > 0) {
    output += `\n### Inferred Goals\n`;
    for (const goal of visitor.goalsInferred) {
      output += `- ${goal}\n`;
    }
  }

  if (visitor.recommendedAction) {
    output += `\n### Recommended Action\n${visitor.recommendedAction}\n`;
  }

  if (visitor.evidence && visitor.evidence.length > 0) {
    output += `\n### Supporting Evidence\n`;
    for (const e of visitor.evidence.slice(0, 5)) {
      output += `- ${e}\n`;
    }
  }

  if (recentSessions && recentSessions.length > 0) {
    output += `\n### Recent Sessions (${recentSessions.length})\n`;
    for (const session of recentSessions) {
      const date = new Date(session.startTime).toLocaleDateString();
      const sentiment = session.sentiment ? ` [${session.sentiment}]` : '';
      output += `\n**Session ${session.id}** - ${date}${sentiment}\n`;
      if (session.title) {
        output += `Title: ${session.title}\n`;
      }
      if (session.description) {
        output += `${session.description}\n`;
      }
      output += `Duration: ${session.duration || 0}s | Events: ${session.eventsCount || 0}\n`;
    }
  }

  return output.trim();
}

// Helper function to format sessions list
function formatSessions(data: any): string {
  const { sessions, total, limit, offset } = data;

  let output = `## Sessions\n\n`;
  output += `Showing ${sessions.length} of ${total} sessions (offset: ${offset}):\n`;

  if (sessions.length === 0) {
    output += "\nNo sessions found matching the criteria.\n";
    return output.trim();
  }

  for (const session of sessions) {
    const date = new Date(session.startTime).toLocaleDateString();
    const time = new Date(session.startTime).toLocaleTimeString();
    const sentiment = session.sentiment ? ` [${session.sentiment}]` : '';

    output += `
### Session ${session.id} - ${date} ${time}${sentiment}
- **Visitor:** ${session.visitorId}
- **Duration:** ${session.duration || 0}s
- **Events:** ${session.eventsCount || 0}
`;

    if (session.title) {
      output += `- **Title:** ${session.title}\n`;
    }

    if (session.description) {
      output += `- **Description:** ${session.description}\n`;
    }

    if (session.summary) {
      output += `- **Summary:** ${session.summary}\n`;
    }
  }

  return output.trim();
}

// Helper function to format session detail
function formatSessionDetail(data: any): string {
  const { session, visitor } = data;

  const date = new Date(session.startTime).toLocaleDateString();
  const time = new Date(session.startTime).toLocaleTimeString();
  const sentiment = session.sentiment ? ` [${session.sentiment}]` : '';

  let output = `## Session ${session.id}${sentiment}\n`;
  output += `**Date:** ${date} ${time}\n`;
  output += `**Duration:** ${session.duration || 0}s\n`;
  output += `**Events:** ${session.eventsCount || 0}\n`;

  if (session.title) {
    output += `**Title:** ${session.title}\n`;
  }

  if (visitor) {
    output += `\n### Visitor Context\n`;
    output += `**Visitor ID:** ${visitor.visitorId}\n`;
    if (visitor.profileTitle) {
      output += `**Profile:** ${visitor.profileTitle}\n`;
    }
    if (visitor.profileSummary) {
      output += `**Summary:** ${visitor.profileSummary}\n`;
    }
    if (visitor.overallSentiment) {
      output += `**Overall Sentiment:** ${visitor.overallSentiment}\n`;
    }
    if (visitor.segmentName) {
      output += `**Segment:** ${visitor.segmentName}\n`;
    }
  }

  if (session.description) {
    output += `\n### Session Description\n${session.description}\n`;
  }

  if (session.summary) {
    output += `\n### AI Summary\n${session.summary}\n`;
  }

  if (session.events && Array.isArray(session.events) && session.events.length > 0) {
    output += `\n### Events Timeline (${session.events.length} events)\n`;

    // Group events by type for a summary
    const eventTypes: Record<string, number> = {};
    for (const event of session.events) {
      const type = event.type || 'unknown';
      eventTypes[type] = (eventTypes[type] || 0) + 1;
    }

    output += `**Event Summary:** `;
    output += Object.entries(eventTypes)
      .map(([type, count]) => `${type}: ${count}`)
      .join(', ');
    output += '\n\n';

    // Show first 20 events with details
    const eventsToShow = session.events.slice(0, 20);
    for (const event of eventsToShow) {
      const eventTime = event.timestamp ? new Date(event.timestamp).toLocaleTimeString() : '';
      output += `- **${event.type}**${eventTime ? ` (${eventTime})` : ''}`;

      if (event.data) {
        if (event.data.path) output += ` - ${event.data.path}`;
        if (event.data.elementId) output += ` [#${event.data.elementId}]`;
        if (event.data.label) output += ` "${event.data.label}"`;
      }
      output += '\n';
    }

    if (session.events.length > 20) {
      output += `\n*... and ${session.events.length - 20} more events*\n`;
    }
  }

  return output.trim();
}

// Initialize MCP server
const server = new Server({
  name: "lcontext-mcp",
  version: "1.0.0"
}, {
  capabilities: {
    tools: {}
  }
});

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_page_context",
        description: "Get comprehensive analytics context for a page including stats, visitor metrics, and all interactive elements with their engagement data. Use this when analyzing user behavior on a specific page.",
        inputSchema: {
          type: "object",
          properties: {
            path: {
              type: "string",
              description: "The page path to get context for (e.g., '/products', '/checkout')"
            },
            startDate: {
              type: "string",
              description: "Start date for stats (ISO format, e.g., '2025-01-01')"
            },
            endDate: {
              type: "string",
              description: "End date for stats (ISO format, e.g., '2025-01-13')"
            },
            periodType: {
              type: "string",
              enum: ["day", "week"],
              description: "Period type for stats aggregation (default: 'day')"
            }
          },
          required: ["path"]
        }
      },
      {
        name: "list_pages",
        description: "List all tracked pages for your website. Use this to discover available pages before getting detailed context.",
        inputSchema: {
          type: "object",
          properties: {
            limit: {
              type: "number",
              description: "Maximum number of pages to return (default: 50, max: 200)"
            },
            search: {
              type: "string",
              description: "Search filter for page paths (e.g., '/product' to find all product pages)"
            }
          }
        }
      },
      {
        name: "get_element_context",
        description: "Get detailed analytics for a specific interactive element by its label or ID. Use this to understand how users interact with buttons, links, or forms.",
        inputSchema: {
          type: "object",
          properties: {
            elementLabel: {
              type: "string",
              description: "The element's label text or aria-label to search for"
            },
            elementId: {
              type: "string",
              description: "The element's HTML ID to search for"
            },
            pagePath: {
              type: "string",
              description: "Optional page path to filter elements"
            }
          }
        }
      },
      {
        name: "get_app_context",
        description: "Get application-wide analytics context including total sessions, visitors, page views, engagement metrics, and AI-generated insights. Use this to understand overall app performance and trends.",
        inputSchema: {
          type: "object",
          properties: {
            periodType: {
              type: "string",
              enum: ["day", "week"],
              description: "Period type for stats aggregation (default: 'day')"
            },
            limit: {
              type: "number",
              description: "Number of periods to return (default: 7, max: 30)"
            }
          }
        }
      },
      {
        name: "get_visitors",
        description: "Get a list of visitors with their AI-generated profiles, interests, engagement trends, and segment assignments. Use this to understand who is using your application.",
        inputSchema: {
          type: "object",
          properties: {
            limit: {
              type: "number",
              description: "Maximum number of visitors to return (default: 20, max: 100)"
            },
            offset: {
              type: "number",
              description: "Offset for pagination (default: 0)"
            },
            segmentId: {
              type: "number",
              description: "Filter by segment ID"
            },
            search: {
              type: "string",
              description: "Search in visitor ID, title, summary, interests, goals, action, evidence"
            },
            firstVisitAfter: {
              type: "string",
              description: "Filter visitors who first visited after this date (ISO format)"
            },
            firstVisitBefore: {
              type: "string",
              description: "Filter visitors who first visited before this date (ISO format)"
            },
            lastVisitAfter: {
              type: "string",
              description: "Filter visitors who last visited after this date (ISO format)"
            },
            lastVisitBefore: {
              type: "string",
              description: "Filter visitors who last visited before this date (ISO format)"
            },
            engagementTrend: {
              type: "string",
              enum: ["increasing", "stable", "decreasing"],
              description: "Filter by engagement trend"
            },
            overallSentiment: {
              type: "string",
              enum: ["positive", "negative", "neutral", "mixed"],
              description: "Filter by overall sentiment"
            }
          }
        }
      },
      {
        name: "get_visitor_detail",
        description: "Get detailed profile and recent sessions for a specific visitor. Use this to understand individual user behavior and journey.",
        inputSchema: {
          type: "object",
          properties: {
            visitorId: {
              type: "string",
              description: "The visitor's unique identifier"
            }
          },
          required: ["visitorId"]
        }
      },
      {
        name: "get_sessions",
        description: "Get a list of user sessions with AI-generated summaries, titles, and sentiment analysis. Use this to understand user activity patterns.",
        inputSchema: {
          type: "object",
          properties: {
            limit: {
              type: "number",
              description: "Maximum number of sessions to return (default: 20, max: 100)"
            },
            offset: {
              type: "number",
              description: "Offset for pagination (default: 0)"
            },
            visitorId: {
              type: "string",
              description: "Filter sessions by visitor ID"
            },
            sentiment: {
              type: "string",
              enum: ["positive", "negative", "neutral"],
              description: "Filter by session sentiment"
            },
            startDate: {
              type: "string",
              description: "Start date for filtering (ISO format, e.g., '2025-01-01')"
            },
            endDate: {
              type: "string",
              description: "End date for filtering (ISO format, e.g., '2025-01-15')"
            },
            search: {
              type: "string",
              description: "Search in session title and description"
            },
            minDuration: {
              type: "number",
              description: "Filter sessions with duration >= this value (seconds)"
            },
            maxDuration: {
              type: "number",
              description: "Filter sessions with duration <= this value (seconds)"
            },
            minEventsCount: {
              type: "number",
              description: "Filter sessions with events count >= this value"
            },
            maxEventsCount: {
              type: "number",
              description: "Filter sessions with events count <= this value"
            }
          }
        }
      },
      {
        name: "get_session_detail",
        description: "Get detailed information about a specific session including full event data and visitor context. Use this to investigate specific user interactions.",
        inputSchema: {
          type: "object",
          properties: {
            sessionId: {
              type: "number",
              description: "The session's numeric ID"
            }
          },
          required: ["sessionId"]
        }
      }
    ]
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    // GET_PAGE_CONTEXT tool
    if (request.params.name === "get_page_context") {
      const args = getPageContextSchema.parse(request.params.arguments);

      // Build query parameters
      const params = new URLSearchParams();
      if (args.startDate) params.append('startDate', args.startDate);
      if (args.endDate) params.append('endDate', args.endDate);
      if (args.periodType) params.append('periodType', args.periodType);

      // URL-encode the path to handle "/" and special characters correctly
      // The path is encoded so "/" becomes "%2F" allowing the API to distinguish paths
      const encodedPath = encodeURIComponent(args.path);
      const queryString = params.toString();
      const endpoint = `/api/mcp/pages/${encodedPath}${queryString ? `?${queryString}` : ''}`;

      const data = await apiRequest(endpoint);
      const contextOutput = formatPageContext(data);

      return {
        content: [{
          type: "text",
          text: contextOutput
        }]
      };
    }

    // LIST_PAGES tool
    if (request.params.name === "list_pages") {
      const args = listPagesSchema.parse(request.params.arguments || {});

      const params = new URLSearchParams();
      if (args.limit) params.append('limit', args.limit.toString());
      if (args.search) params.append('search', args.search);

      const queryString = params.toString();
      const endpoint = `/api/mcp/pages${queryString ? `?${queryString}` : ''}`;

      const data = await apiRequest(endpoint);

      if (data.pages.length === 0) {
        return {
          content: [{
            type: "text",
            text: `No pages found. Make sure tracking is set up and data has been collected.`
          }]
        };
      }

      let output = `## Tracked Pages\n\n`;
      output += `Found ${data.pages.length} pages${data.total > data.pages.length ? ` (showing first ${data.pages.length} of ${data.total})` : ''}:\n\n`;

      for (const page of data.pages) {
        const lastSeen = new Date(page.lastSeenAt).toLocaleDateString();
        output += `- **${page.path}**${page.title ? ` - ${page.title}` : ''} (last seen: ${lastSeen})\n`;
      }

      return {
        content: [{
          type: "text",
          text: output.trim()
        }]
      };
    }

    // GET_ELEMENT_CONTEXT tool
    if (request.params.name === "get_element_context") {
      const args = getElementContextSchema.parse(request.params.arguments || {});

      if (!args.elementLabel && !args.elementId) {
        return {
          isError: true,
          content: [{
            type: "text",
            text: "Either elementLabel or elementId is required"
          }]
        };
      }

      const params = new URLSearchParams();
      if (args.elementLabel) params.append('elementLabel', args.elementLabel);
      if (args.elementId) params.append('elementId', args.elementId);
      if (args.pagePath) params.append('pagePath', args.pagePath);

      const queryString = params.toString();
      const endpoint = `/api/mcp/elements?${queryString}`;

      const data = await apiRequest(endpoint);

      if (data.elements.length === 0) {
        return {
          content: [{
            type: "text",
            text: `No elements found matching the criteria.`
          }]
        };
      }

      let output = `## Elements Found\n\nFound ${data.elements.length} matching element(s):\n`;

      for (const element of data.elements) {
        output += `
### ${element.category?.toUpperCase() || 'ELEMENT'}: ${element.label || element.elementId || 'Unknown'}
- **Page:** ${element.pagePath}
- **Tag:** \`<${element.tagName || 'unknown'}>\`
- **HTML ID:** ${element.elementId || 'N/A'}
- **Name:** ${element.elementName || 'N/A'}
- **ARIA Label:** ${element.ariaLabel || 'N/A'}
- **Category:** ${element.category || 'N/A'}
${element.destinationUrl ? `- **Links to:** ${element.destinationUrl}` : ''}
- **Total Interactions:** ${element.totalInteractions}
- **Unique Visitors:** ${element.uniqueVisitors}
- **First Seen:** ${new Date(element.firstSeenAt).toLocaleDateString()}
- **Last Seen:** ${new Date(element.lastSeenAt).toLocaleDateString()}
`;
      }

      return {
        content: [{
          type: "text",
          text: output.trim()
        }]
      };
    }

    // GET_APP_CONTEXT tool
    if (request.params.name === "get_app_context") {
      const args = getAppContextSchema.parse(request.params.arguments || {});

      const params = new URLSearchParams();
      if (args.periodType) params.append('periodType', args.periodType);
      if (args.limit) params.append('limit', args.limit.toString());

      const queryString = params.toString();
      const endpoint = `/api/mcp/app-context${queryString ? `?${queryString}` : ''}`;

      const data = await apiRequest(endpoint);
      const contextOutput = formatAppContext(data);

      return {
        content: [{
          type: "text",
          text: contextOutput
        }]
      };
    }

    // GET_VISITORS tool
    if (request.params.name === "get_visitors") {
      const args = getVisitorsSchema.parse(request.params.arguments || {});

      const params = new URLSearchParams();
      if (args.limit) params.append('limit', args.limit.toString());
      if (args.offset) params.append('offset', args.offset.toString());
      if (args.segmentId) params.append('segmentId', args.segmentId.toString());
      if (args.search) params.append('search', args.search);
      if (args.firstVisitAfter) params.append('firstVisitAfter', args.firstVisitAfter);
      if (args.firstVisitBefore) params.append('firstVisitBefore', args.firstVisitBefore);
      if (args.lastVisitAfter) params.append('lastVisitAfter', args.lastVisitAfter);
      if (args.lastVisitBefore) params.append('lastVisitBefore', args.lastVisitBefore);
      if (args.engagementTrend) params.append('engagementTrend', args.engagementTrend);
      if (args.overallSentiment) params.append('overallSentiment', args.overallSentiment);

      const queryString = params.toString();
      const endpoint = `/api/mcp/visitors${queryString ? `?${queryString}` : ''}`;

      const data = await apiRequest(endpoint);
      const contextOutput = formatVisitors(data);

      return {
        content: [{
          type: "text",
          text: contextOutput
        }]
      };
    }

    // GET_VISITOR_DETAIL tool
    if (request.params.name === "get_visitor_detail") {
      const args = getVisitorDetailSchema.parse(request.params.arguments || {});

      const endpoint = `/api/mcp/visitors/${encodeURIComponent(args.visitorId)}`;

      const data = await apiRequest(endpoint);
      const contextOutput = formatVisitorDetail(data);

      return {
        content: [{
          type: "text",
          text: contextOutput
        }]
      };
    }

    // GET_SESSIONS tool
    if (request.params.name === "get_sessions") {
      const args = getSessionsSchema.parse(request.params.arguments || {});

      const params = new URLSearchParams();
      if (args.limit) params.append('limit', args.limit.toString());
      if (args.offset) params.append('offset', args.offset.toString());
      if (args.visitorId) params.append('visitorId', args.visitorId);
      if (args.sentiment) params.append('sentiment', args.sentiment);
      if (args.startDate) params.append('startDate', args.startDate);
      if (args.endDate) params.append('endDate', args.endDate);
      if (args.search) params.append('search', args.search);
      if (args.minDuration !== undefined) params.append('minDuration', args.minDuration.toString());
      if (args.maxDuration !== undefined) params.append('maxDuration', args.maxDuration.toString());
      if (args.minEventsCount !== undefined) params.append('minEventsCount', args.minEventsCount.toString());
      if (args.maxEventsCount !== undefined) params.append('maxEventsCount', args.maxEventsCount.toString());

      const queryString = params.toString();
      const endpoint = `/api/mcp/sessions${queryString ? `?${queryString}` : ''}`;

      const data = await apiRequest(endpoint);
      const contextOutput = formatSessions(data);

      return {
        content: [{
          type: "text",
          text: contextOutput
        }]
      };
    }

    // GET_SESSION_DETAIL tool
    if (request.params.name === "get_session_detail") {
      const args = getSessionDetailSchema.parse(request.params.arguments || {});

      const endpoint = `/api/mcp/sessions/${args.sessionId}`;

      const data = await apiRequest(endpoint);
      const contextOutput = formatSessionDetail(data);

      return {
        content: [{
          type: "text",
          text: contextOutput
        }]
      };
    }

    return {
      isError: true,
      content: [{
        type: "text",
        text: `Unknown tool: ${request.params.name}`
      }]
    };

  } catch (error) {
    return {
      isError: true,
      content: [{
        type: "text",
        text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }]
    };
  }
});

// Start server
async function main() {
  if (!API_KEY) {
    console.error("LCONTEXT_API_KEY environment variable is required");
    console.error("Get your API key from: https://lcontext.com/settings");
    process.exit(1);
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("lcontext MCP server running on stdio");
  console.error(`Connected to: ${API_BASE_URL}`);
}

// Don't start server if running --update
if (!args.includes('--update')) {
  main().catch(err => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
}
