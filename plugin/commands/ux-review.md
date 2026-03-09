---
description: Review a specific page or flow — see how users actually experience it vs how it was designed
---

Perform a targeted UX review using real user behavior data. Focus on: $ARGUMENTS

## Steps

1. **Get page analytics**: Call `get_page_context` for the specified page(s). Look at the full picture:
   - How do users arrive here? (entry count, referrers)
   - How long do they stay? (avg duration)
   - How far do they scroll? (scroll depth)
   - Where do they go next — or do they leave? (exit rate)
   - How does the page perform? (Web Vitals)

2. **Understand element engagement**: From the page context, see which interactive elements users actually use and which they ignore. Calculate interaction rates relative to page views. Look for:
   - Features that get heavy use — users value these
   - Features that get no attention — not discoverable, not needed, or not working
   - Unexpected interaction patterns — users engaging with things in surprising ways

3. **Watch real sessions**: Use `get_sessions` filtered to the page, then `get_session_detail` for 3-5 sessions. Observe:
   - What do users do before and after visiting this page?
   - How do they interact with the page content?
   - Do they hesitate, explore, or move with purpose?
   - Are there patterns across sessions?

4. **Connect to code**: Find the relevant components, routes, and layouts in the codebase. Explain how the current implementation creates the experience you're observing. Suggest code changes that could improve the user experience.

5. **Summarize**: Present what users actually do on this page, how it differs from the intended design, and what changes would better serve user needs.
