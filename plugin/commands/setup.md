---
description: Set up Lcontext — sign up, connect your API key, and add tracking to your app
---

Help the user set up Lcontext step by step. Follow this flow exactly:

## Step 1: Check if already configured

Check if the Lcontext MCP server is already working by calling `get_app_context`. If it returns data successfully, tell the user Lcontext is already configured and skip to Step 4 (tracking script).

## Step 2: Authenticate

Start the device authorization flow:

```bash
curl -s -X POST ${LCONTEXT_URL:-https://lcontext.com}/api/cli/auth/start -H "Content-Type: application/json" -d '{}' | cat
```

This returns a JSON with `token` and `url`. Open the URL in the user's browser:

```bash
open "THE_URL_FROM_RESPONSE"    # macOS
xdg-open "THE_URL_FROM_RESPONSE"  # Linux
```

Tell the user: "I've opened your browser to sign in. Please sign up or log in, then come back here."

Then poll for completion (every 3 seconds, up to 10 minutes):

```bash
curl -s ${LCONTEXT_URL:-https://lcontext.com}/api/cli/auth/poll/THE_TOKEN | cat
```

Keep polling until the response status is "completed". When it completes, you'll get back `apiKey`, `tag`, and `websiteName`.

## Step 3: Configure the MCP server

Once you have the API key, configure it using the Claude Code CLI:

```bash
claude mcp add lcontext -s user -e LCONTEXT_API_KEY=THE_API_KEY -- npx -y lcontext-mcp@latest
```

Tell the user: "Lcontext is now connected. You'll need to restart Claude Code for the MCP server to be available."

## Step 4: Add tracking script

Ask the user which app they want to track. Then provide the tracking script they need to add to their HTML:

```html
<script src="${LCONTEXT_URL:-https://lcontext.com}/it.js?iTag=THE_TAG" defer></script>
```

Use the `tag` from the auth response. If the user's codebase is available, help them find the right place to add it (the main HTML file, layout component, or `<head>` section).

## Step 5: Confirm

Tell the user the setup is complete. Once their app gets some traffic, they can use `/lcontext:analyze` to start understanding user behavior.
