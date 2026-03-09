---
description: Run a full product analytics analysis — understand how users behave in your app, then connect insights to code
---

Run a comprehensive product analytics analysis using the Lcontext MCP tools. Follow this workflow:

1. **Start with the pre-computed report**: Call `get_analysis` to get the latest daily analysis. This surfaces behavioral patterns, engagement trends, and prioritized opportunities with specific page paths, element IDs, and session IDs.

2. **Understand the big picture**: Call `get_app_context` to see traffic trends, engagement rates, device breakdown, and where users come from. Identify what's growing, what's flat, and what's declining.

3. **Investigate key findings**: For each interesting pattern:
   - Use `get_page_context` to understand how users engage with specific pages
   - Use `get_user_flows` to see the journeys users actually take (vs the ones you designed)
   - Use `get_session_detail` to watch how real users navigate and interact
   - Use `get_element_context` to see which features get attention and which are ignored

4. **Connect behavior to code**: For each insight, find the relevant source code — components, routes, handlers, layouts — and explain how the current implementation shapes the behavior you're seeing. Suggest specific code changes when applicable.

5. **Present findings** as:
   - **What users are doing** — the behavioral evidence from analytics
   - **What it means** — the product insight (e.g., users prefer X over Y, this feature isn't discoverable, users create their own workaround flow)
   - **What to consider** — product opportunities, feature ideas, or code changes worth exploring

Focus on understanding user intent and behavior patterns, not just metrics. Help the user see their product through their users' eyes.

If the user provided arguments, focus the analysis on: $ARGUMENTS
