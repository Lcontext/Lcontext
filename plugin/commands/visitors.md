---
description: Understand who your users are — their behavior patterns, engagement trends, and how different segments use your product
---

Analyze visitor behavior and segments using real user data. Focus on: $ARGUMENTS

## Steps

1. **Get the visitor landscape**: Call `get_visitors` to see who's using the app. Look at:
   - Session counts and visit frequency — who are the power users vs one-time visitors?
   - Engagement trends — who's becoming more engaged? Who's fading?
   - Device and location distribution — where and how do users access the product?

2. **Identify interesting segments**: Group visitors by behavior patterns:
   - **Power users**: High session counts, increasing engagement — what do they do differently?
   - **Churning users**: Decreasing engagement — when did their behavior change?
   - **New users**: Recent first visit — how is their onboarding experience?
   - **Mobile vs desktop**: Do users on different devices behave differently?

3. **Deep-dive into representative users**: Pick 2-3 visitors from each interesting segment. Call `get_visitor_detail` to see their full session history, then `get_session_detail` for key sessions. Understand:
   - What journey brought them to the product?
   - Which features do they use most?
   - How has their behavior evolved over time?

4. **Connect to code**: Based on the behavioral differences between segments, identify which parts of the codebase serve each group well or poorly. Suggest changes that would better serve underserved segments.

5. **Present insights**: Describe the user segments you found, what characterizes each group's behavior, and what product decisions could improve engagement for each.
