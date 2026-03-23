---
name: lcontext
description: Analyze user behavior using Lcontext MCP tools. Use when investigating how users interact with the app, understanding engagement patterns, conversion flows, page performance, session recordings, visitor segments, Web Vitals, or when the user asks about analytics, user behavior, sessions, visitors, or what's happening in their app.
---

You have access to Lcontext MCP tools that provide raw user behavior data for the application you're working on. Use this guide to understand how users actually use the product, identify behavioral patterns, and connect insights to code.

There are no pre-computed summaries or AI-generated insights — you analyze the raw metrics and event timelines directly.

## Available Tools

| Tool | Purpose | Key Data |
|------|---------|----------|
| **`get_analysis`** | **START HERE.** Pre-computed analysis report | Problem areas, funnel health, session findings, prioritized recommendations with specific page paths, element IDs, and session IDs |
| `get_app_context` | Raw app-wide metrics (use after analysis) | Sessions, visitors, page views, clicks, form submits, bounce rate, top pages/referrers/countries, device breakdown (mobile/tablet/desktop), top browsers, top OS, Web Vitals (LCP, FCP, FID, CLS) |
| `list_pages` | Discover tracked pages | Page paths, titles, first/last seen dates, view count, bounce/entry/exit counts |
| `get_page_context` | Full page behavior profile | View count, unique visitors, bounce/entry/exit counts, avg duration, scroll depth, Web Vitals (LCP, FCP, FID, CLS), element interactions |
| `get_page_stats` | Lightweight page metrics | Same as get_page_context but without element data — use for bulk page comparison |
| `get_page_elements` | Element engagement data | Interactive elements sorted by interaction count, with engagement metrics and visitor counts |
| `get_element_context` | Single element deep-dive | Interaction count, unique visitors, per-period breakdown |
| `get_visitors` | Visitor list with profiles | Session count, first/last visit, country, referrer, device type, browser, OS, city, region |
| `get_visitor_detail` | Individual visitor journey | All sessions with timestamps and event counts, device info, location |
| `get_sessions` | Session list with filters | Duration, event count, start time, visitor ID, device type, entry/exit pages |
| `get_session_detail` | Full session replay | Every event: page_view, click, form_submit, scroll_depth, web_vital — with timestamps, element details, device type, location |
| `get_user_flows` | User journey patterns | Flow patterns with page sequences, session/visitor counts, drop-off funnels, categories (conversion, exploration, onboarding, etc.) |

## Analysis Workflow

### Quick Start (IMPORTANT)
ALWAYS call `get_analysis` first before any other tool. It returns a pre-computed triage report with specific page paths, element IDs, and session IDs you can immediately investigate with the other tools. Only fall back to the manual workflow below if no analysis is available.

Do NOT start with `get_app_context` or `get_sessions` -- those are for drilling deeper after you have the analysis.

### Phase 1: Understand the Big Picture

```
get_app_context
```

From the daily/weekly stats, understand:
- **Traffic patterns**: Are sessions rising, stable, or dropping? What's driving the trend?
- **Engagement signals**: Click-through rate (totalClicks / totalPageViews) — are users actively engaging or passively viewing?
- **Conversion signals**: Form submit rate (totalFormSubmits / totalSessions) — are users completing key actions?
- **Bounce behavior**: bounceCount / totalSessions — above 60% suggests users aren't finding what they expect
- **Entry points**: Where users arrive — these shape first impressions
- **Exit points**: Where users leave — these reveal where the experience falls short or where tasks complete
- **Audience**: Referrer sources, device breakdown, geography — who are your users and how do they access the product?
- **Performance**: Web Vitals (avgLcp, avgFcp, avgFid, avgCls) — is speed affecting the experience?

### Phase 2: Map How Users Navigate

```
list_pages
```

Build a mental model of the product's page structure:
- Group pages into flows (onboarding, core workflow, settings, etc.)
- Note which pages have recent activity vs stale
- Identify the intended user journeys vs where users actually go

```
get_user_flows
```

See the journeys users actually take:
- Which paths are most common? Do they match the designed flow?
- Where do users create their own paths (exploration behavior)?
- Which flows have high drop-off? Where do users hesitate?

### Phase 3: Page-Level Behavior

```
get_page_context(path) → For pages you want to understand deeply
get_page_stats(path) → For quick comparison across many pages
```

Analyze how users experience each page:
- **Engagement depth**: Scroll depth <30% = users don't see content below the fold
- **Time spent**: <5s on content-heavy pages = users aren't engaging with the content
- **Entry vs exit ratio**: More exits than entries = this page loses users who arrive elsewhere
- **Day-over-day patterns**: Compare viewCount across periods to spot trends
- **Performance**: avgLcp >2.5s or avgCls >0.1 = performance may be hurting the experience

**Element engagement** (from the elements section):
- Calculate each element's **interaction rate**: interactionCount / page viewCount
- High interaction rate = users value this feature
- Zero interactions on a high-traffic page = feature isn't discoverable or isn't needed
- Forms with views but no submits = friction in the form experience
- Compare interaction rates to see what users prioritize vs what you expect them to prioritize

### Phase 4: Funnel & Flow Analysis

For multi-step flows (signup, checkout, onboarding):
1. Get `get_page_context` for each step
2. Line up viewCounts in sequence: Step 1 → Step 2 → Step 3...
3. Calculate **step-to-step drop-off**: (step N views - step N+1 views) / step N views
4. The step with the biggest drop-off is where users struggle most
5. On that step, check element interactions and scroll depth to understand why

### Phase 5: Watch Real Users

When you've identified interesting behavior patterns:

```
get_sessions → Find relevant sessions
get_session_detail(sessionId) → Watch what users actually do
```

Sessions include `deviceType` (mobile/tablet/desktop) — compare by device to spot experience differences.

In the event timeline, look for behavioral signals:
- **Rapid repeated clicks** (<500ms apart) = user frustrated — the element isn't responding
- **Long gaps** between events (>30s) = user thinking, confused, or waiting
- **page_view → no further events** = content didn't match expectation
- **form_submit → same page_view** = form error or validation failure
- **Deep scrolling without clicks** = user searching for something not visible
- **Back-and-forth navigation** = user comparing options or lost
- **web_vital** red flags: LCP >2.5s, CLS >0.1, FID >100ms

### Phase 6: Understand Your Users

```
get_visitors → See who's using the product
get_visitor_detail(visitorId) → Understand individual user journeys
```

Look for behavioral segments:
- **Power users**: High session counts — what do they do differently? Which features do they rely on?
- **One-and-done visitors**: Single session, bounce — what were they looking for?
- **Returning users who stop**: Decreasing engagement — when did their behavior change?
- **Device-specific patterns**: Do mobile and desktop users behave differently?
- **Geography/referrer patterns**: Do users from different sources have different engagement?

## Decision Trees

### "How are users actually using this feature?"
1. `get_page_context(path)` → see engagement metrics and element interactions
2. `get_page_elements(path)` → rank elements by interaction count
3. `get_sessions(pagePath)` → find sessions that include this page
4. `get_session_detail` for 3-5 sessions → watch how users interact with the feature
5. Compare intended usage with actual behavior patterns

### "Where should we focus product effort?"
1. `get_app_context` → identify top pages by traffic and engagement
2. `get_user_flows` → see which journeys users take most and where they drop off
3. For each high-traffic page: `get_page_context` → find engagement gaps
4. Prioritize by: high traffic + low engagement = biggest opportunity

### "This page isn't converting"
1. `get_page_context(path)` → check entry/exit ratio and element interactions
2. Find the primary CTA → is interaction count proportional to views?
3. If CTA interactions are low → check scroll depth (is the CTA visible?)
4. `get_session_detail` for 3-5 sessions on this page → see what users do instead of converting
5. Look at the page code — connect the behavioral evidence to the implementation

### "Users are dropping off in a funnel"
1. `get_page_context` for each funnel step → compare view counts step-to-step
2. Biggest drop-off = the step to investigate
3. On that step: check element interactions, scroll depth, duration
4. `get_sessions` → find sessions that visited the drop-off page but NOT the next step
5. `get_session_detail` → see what happened at the moment of drop-off

### "A feature isn't being used"
1. Find the page(s) with the feature → `get_page_context`
2. `get_page_elements(path)` → check the element's interaction count
3. If page has views but element has 0 interactions → users don't see it or don't understand it
4. If page has low views → users can't find the page
5. Check the element's position, label, and styling in code — is it clear what it does?

### "Performance feels slow"
1. `get_app_context` → check avgLcp, avgFcp, avgFid, avgCls site-wide
2. `get_page_context` for suspect pages → check per-page Web Vitals
3. `get_session_detail` for recent sessions → check individual web_vital events
4. LCP >2.5s → check for large images, blocking JS, slow API calls
5. CLS >0.1 → check for dynamic content, images without dimensions, font loading

### "What's changed recently?"
1. `get_app_context(limit=14)` → compare recent days vs previous period
2. Look for trend breaks: sudden changes in bounce rate, session count, engagement
3. If a specific page changed: `get_page_context` with date range comparison
4. Find sessions from the change period → `get_session_detail` to see new behavior patterns

## Connecting Behavior to Code

| Behavioral Pattern | Code Investigation |
|---|---|
| Users leave a page quickly | Check route handler, loading states, and whether content matches the page title/entry point |
| Feature gets no interaction | Find the component — check CSS visibility, positioning, label clarity, click handler binding |
| Form has low completion rate | Check validation logic, error messages, required fields, form length |
| Users scroll deeply without engaging | Key content or CTA may be positioned wrong — check layout and component ordering |
| Rage clicks on an element | Check the click handler — is it async without loading state? Does it fail silently? |
| Users revisit the same page | Check for missing success feedback, unclear navigation, broken state management |
| Drop-off after form submit | Check form action, redirect logic, success/error page rendering |
| Mobile bounce rate much higher | Check responsive layout, touch targets, viewport meta, mobile CSS |
| Users take unexpected paths | The product's navigation model may not match users' mental model — check IA and navigation components |
| Power users skip certain pages | These pages may be unnecessary — check if they can be streamlined or removed |

## Tool Parameters

### get_analysis
- `periodType`: "day" (default) or "week"
- `date`: ISO date string for period start (defaults to most recent)

### get_app_context
- `periodType`: "day" or "week" — default "day"
- `limit`: Number of periods — default 7, max 30

### list_pages
- `search`: Filter by path substring
- `limit`: Max pages — default 50, max 200

### get_page_context
- `path` (required): Page path, e.g. "/checkout"
- `startDate` / `endDate`: ISO dates
- `periodType`: "day" or "week"

### get_page_stats
- `path` (required): Page path
- `startDate` / `endDate`: ISO dates
- `periodType`: "day" or "week"

### get_page_elements
- `path` (required): Page path
- `startDate` / `endDate`: ISO dates
- `periodType`: "day" or "week"
- `limit`: Max elements — default 10, max 50
- `minInteractions`: Minimum interaction count threshold

### get_element_context
- `elementLabel`: Search by label or aria-label
- `elementId`: Search by HTML ID
- `pagePath`: Filter to specific page

### get_visitors
- `search`: Search by visitor ID
- `firstVisitAfter` / `firstVisitBefore`: Date range for first visit
- `lastVisitAfter` / `lastVisitBefore`: Date range for last visit
- `limit` / `offset`: Pagination — default 20, max 100

### get_sessions
- `visitorId`: Filter by visitor
- `startDate` / `endDate`: Date range
- `pagePath`: Filter by page visited
- `minDuration` / `maxDuration`: Seconds
- `minEventsCount` / `maxEventsCount`: Event count filters
- `includeAll`: Include bot/preview sessions (default: false)
- `limit` / `offset`: Pagination — default 20, max 100

### get_session_detail
- `sessionId` (required): Numeric session ID

### get_visitor_detail
- `visitorId` (required): Visitor's unique ID string

### get_user_flows
- `limit`: Max flows — default 10, max 50
- `category`: Filter by category (conversion, exploration, onboarding, support, engagement, other)
- `minSessions`: Minimum session count threshold
- `periodType`: "day" or "week"
