---
description: Analyze how users move through a multi-step flow — where they convert, hesitate, or drop off
---

Analyze a user flow using real behavior data. Focus on: $ARGUMENTS

## Steps

1. **Map the flow**: Use `list_pages` to identify all pages in the journey. If the user specified pages, use those directly. Use `get_user_flows` to see the paths users actually take — these often differ from the designed flow.

2. **Measure each step**: Call `get_page_context` for each step in the flow. For each step, understand:
   - How many users reach this step (view count)
   - How they engage with it (element interactions, scroll depth, duration)
   - Whether they move forward, go back, or leave entirely

3. **Find the story in the drop-offs**: Calculate step-to-step conversion rates. For the biggest drop-off points:
   - Is it a friction issue? (long duration + low scroll = confused)
   - Is it an intent issue? (short duration + high exit = wrong audience or unmet expectation)
   - Is it a discovery issue? (low CTA interaction rate = users don't see the next step)

4. **Watch real journeys**: Use `get_sessions` to find sessions that reached the drop-off point. Call `get_session_detail` for 3-5 of these to see the full story — what users did before, during, and after the critical step.

5. **Connect to code**: Find the relevant components, forms, navigation logic, and layouts. Explain how the implementation shapes the flow experience and suggest changes.

6. **Present the funnel**: Show conversion rates at each step, explain why users drop off where they do, and recommend product changes — from quick code fixes to larger feature considerations.
