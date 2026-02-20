#!/usr/bin/env bash
set -e

# Lcontext MCP Server Installation Script
# Downloads and installs the Lcontext MCP server binary for Claude Code

INSTALL_DIR="${HOME}/.local/bin"
BINARY_NAME="lcontext"
GITHUB_REPO="Lcontext/Lcontext"

# Use latest release by default, or a specific version if LCONTEXT_VERSION is set
if [ -n "${LCONTEXT_VERSION:-}" ]; then
    BASE_URL="${LCONTEXT_BASE_URL:-https://github.com/${GITHUB_REPO}/releases/download/${LCONTEXT_VERSION}}"
else
    BASE_URL="${LCONTEXT_BASE_URL:-https://github.com/${GITHUB_REPO}/releases/latest/download}"
fi

INSTALL_VERSION="${LCONTEXT_VERSION:-latest}"
DOWNLOAD_TOOL="unknown"
DOWNLOAD_DURATION_MS=0

# Telemetry: report install metrics (fire-and-forget, never blocks or fails install)
send_telemetry() {
    local success="$1"
    local api_key_configured="false"
    if [ -n "${API_KEY:-}" ]; then
        api_key_configured="true"
    fi

    local telemetry_url="https://lcontext.com/api/track-install"
    local json_payload="{\"platform\":\"${PLATFORM:-unknown}\",\"success\":${success},\"version\":\"${INSTALL_VERSION}\",\"apiKeyConfigured\":${api_key_configured},\"downloadTool\":\"${DOWNLOAD_TOOL}\",\"downloadDurationMs\":${DOWNLOAD_DURATION_MS:-0},\"binarySize\":${DOWNLOAD_SIZE:-0}}"

    if command -v curl &> /dev/null; then
        curl -sS -X POST "${telemetry_url}" \
            -H "Content-Type: application/json" \
            -d "${json_payload}" \
            --max-time 5 \
            > /dev/null 2>&1 &
    elif command -v wget &> /dev/null; then
        wget -q --timeout=5 -O /dev/null --post-data="${json_payload}" \
            --header="Content-Type: application/json" \
            "${telemetry_url}" \
            > /dev/null 2>&1 &
    fi
}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
cat << "EOF"
  _                 _            _
 | |               | |          | |
 | | ___ ___  _ __ | |_ _____  _| |_
 | |/ __/ _ \| '_ \| __/ _ \ \/ / __|
 | | (_| (_) | | | | ||  __/>  <| |_
 |_|\___\___/|_| |_|\__\___/_/\_\\__|

 MCP Server Installer
EOF
echo -e "${NC}"

# Detect OS and architecture
detect_platform() {
    local os=""
    local arch=""

    # Detect OS
    case "$(uname -s)" in
        Linux*)     os="linux";;
        Darwin*)    os="macos";;
        MINGW*|MSYS*|CYGWIN*) os="windows";;
        *)
            echo -e "${RED}Error: Unsupported operating system$(uname -s)${NC}"
            exit 1
            ;;
    esac

    # Detect architecture
    case "$(uname -m)" in
        x86_64|amd64)   arch="x64";;
        arm64|aarch64)  arch="arm64";;
        *)
            echo -e "${RED}Error: Unsupported architecture $(uname -m)${NC}"
            exit 1
            ;;
    esac

    # macOS arm64 check
    if [ "$os" = "macos" ] && [ "$arch" = "x64" ]; then
        # Check if running on Apple Silicon with Rosetta
        if [ "$(sysctl -n sysctl.proc_translated 2>/dev/null)" = "1" ]; then
            arch="arm64"
        fi
    fi

    echo "${os}-${arch}"
}

PLATFORM=$(detect_platform)
echo "Detected platform: ${PLATFORM}"

# Determine binary name based on platform
if [[ "$PLATFORM" == "windows-"* ]]; then
    BINARY_NAME="lcontext.exe"
    DOWNLOAD_NAME="lcontext-windows-x64.exe"
elif [[ "$PLATFORM" == "macos-arm64" ]]; then
    DOWNLOAD_NAME="lcontext-macos-arm64"
elif [[ "$PLATFORM" == "macos-x64" ]]; then
    DOWNLOAD_NAME="lcontext-macos-x64"
elif [[ "$PLATFORM" == "linux-arm64" ]]; then
    DOWNLOAD_NAME="lcontext-linux-arm64"
elif [[ "$PLATFORM" == "linux-x64" ]]; then
    DOWNLOAD_NAME="lcontext-linux-x64"
else
    echo -e "${RED}Error: Unsupported platform ${PLATFORM}${NC}"
    exit 1
fi

# Create installation directory
echo "Creating installation directory..."
mkdir -p "${INSTALL_DIR}"

# Download binary
DOWNLOAD_URL="${BASE_URL}/${DOWNLOAD_NAME}"
TEMP_FILE="/tmp/${DOWNLOAD_NAME}"

echo "Downloading from ${DOWNLOAD_URL}..."

DOWNLOAD_EXIT_CODE=0
DOWNLOAD_START=$(date +%s%N 2>/dev/null || echo "0")
if command -v curl &> /dev/null; then
    DOWNLOAD_TOOL="curl"
    curl -fSL --progress-bar "${DOWNLOAD_URL}" -o "${TEMP_FILE}" || DOWNLOAD_EXIT_CODE=$?
elif command -v wget &> /dev/null; then
    DOWNLOAD_TOOL="wget"
    wget -q --show-progress "${DOWNLOAD_URL}" -O "${TEMP_FILE}" || DOWNLOAD_EXIT_CODE=$?
else
    echo -e "${RED}Error: Neither curl nor wget found. Please install one of them.${NC}"
    exit 1
fi
DOWNLOAD_END=$(date +%s%N 2>/dev/null || echo "0")
if [ "$DOWNLOAD_START" != "0" ] && [ "$DOWNLOAD_END" != "0" ]; then
    DOWNLOAD_DURATION_MS=$(( (DOWNLOAD_END - DOWNLOAD_START) / 1000000 ))
fi

if [ $DOWNLOAD_EXIT_CODE -ne 0 ]; then
    echo -e "${RED}Error: Download failed with exit code $DOWNLOAD_EXIT_CODE${NC}"
    send_telemetry "false"
    exit 1
fi

# Verify download exists and has content
if [ ! -f "${TEMP_FILE}" ]; then
    echo -e "${RED}Error: Download failed - file not created${NC}"
    send_telemetry "false"
    exit 1
fi

DOWNLOAD_SIZE=$(stat -c%s "${TEMP_FILE}" 2>/dev/null || stat -f%z "${TEMP_FILE}" 2>/dev/null || echo "0")
if [ "$DOWNLOAD_SIZE" -lt 1000000 ]; then
    echo -e "${RED}Error: Download appears incomplete (only ${DOWNLOAD_SIZE} bytes)${NC}"
    echo -e "${RED}Expected a binary file of ~100MB. The server may be down or returning an error.${NC}"
    send_telemetry "false"
    rm -f "${TEMP_FILE}"
    exit 1
fi

echo "Downloaded ${DOWNLOAD_SIZE} bytes"

# Install binary
echo "Installing to ${INSTALL_DIR}/${BINARY_NAME}..."
mv "${TEMP_FILE}" "${INSTALL_DIR}/${BINARY_NAME}"
chmod +x "${INSTALL_DIR}/${BINARY_NAME}"

# Verify the file was actually installed
if [ ! -f "${INSTALL_DIR}/${BINARY_NAME}" ]; then
    echo -e "${RED}Error: Failed to install binary to ${INSTALL_DIR}/${BINARY_NAME}${NC}"
    exit 1
fi

# Verify binary can execute
VERIFY_OUTPUT=$("${INSTALL_DIR}/${BINARY_NAME}" --version 2>&1) || true
if [ -z "$VERIFY_OUTPUT" ]; then
    echo -e "${YELLOW}Warning: Binary installed but verification failed${NC}"
    echo -e "${YELLOW}This might indicate an architecture mismatch. Your system is: $(uname -m)${NC}"
    # Show more diagnostic info
    echo -e "${YELLOW}Binary file type:${NC}"
    file "${INSTALL_DIR}/${BINARY_NAME}" 2>/dev/null || ls -la "${INSTALL_DIR}/${BINARY_NAME}"
else
    echo -e "${GREEN}Binary verified: $VERIFY_OUTPUT${NC}"
fi

# Check if INSTALL_DIR is in PATH
if [[ ":$PATH:" != *":${INSTALL_DIR}:"* ]]; then
    echo ""
    echo -e "${YELLOW}Warning: ${INSTALL_DIR} is not in your PATH${NC}"
    echo "Add this line to your shell configuration file:"
    echo -e "${GREEN}export PATH=\"\$HOME/.local/bin:\$PATH\"${NC}"
    echo ""
    echo "Then restart your shell or run:"
    echo -e "${GREEN}source ~/.bashrc${NC}  # or ~/.zshrc, ~/.profile, etc."
    echo ""
fi

echo ""
echo -e "${GREEN}✓ Lcontext MCP server installed successfully!${NC}"
echo ""

# Determine config path for Claude Desktop (fallback)
if [[ "$PLATFORM" == "macos-"* ]]; then
    CONFIG_DIR="$HOME/Library/Application Support/Claude"
    CONFIG_PATH="$CONFIG_DIR/claude_desktop_config.json"
elif [[ "$PLATFORM" == "windows-"* ]]; then
    CONFIG_DIR="$APPDATA/Claude"
    CONFIG_PATH="$CONFIG_DIR/claude_desktop_config.json"
else
    CONFIG_DIR="$HOME/.config/Claude"
    CONFIG_PATH="$CONFIG_DIR/claude_desktop_config.json"
fi

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}Configure Claude${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "To use Lcontext with Claude, you need an API key."
echo -e "Get your API key from: ${BLUE}https://lcontext.com/settings${NC}"
echo ""

# Prompt for API key (read from /dev/tty to work when script is piped)
read -p "Enter your API key (or press Enter to skip): " API_KEY < /dev/tty

if [ -n "$API_KEY" ]; then
    echo ""
    echo "Configuring Claude..."

    CONFIGURED=false

    # API URL for the MCP server to connect to
    API_URL="https://lcontext.com"

    # Try Claude Code CLI first (preferred method)
    if command -v claude &> /dev/null; then
        echo "Detected Claude Code CLI, configuring via 'claude mcp add'..."
        if claude mcp add lcontext -e "LCONTEXT_API_KEY=$API_KEY" -e "LCONTEXT_API_URL=$API_URL" -- lcontext 2>/dev/null; then
            echo -e "${GREEN}✓ Claude Code configured successfully!${NC}"
            CONFIGURED=true
        else
            echo -e "${YELLOW}Claude Code configuration failed, trying Claude Desktop config...${NC}"
        fi
    fi

    # Fall back to Claude Desktop config file
    if [ "$CONFIGURED" = false ]; then
        echo "Configuring Claude Desktop..."
        mkdir -p "$CONFIG_DIR"

        if [ -f "$CONFIG_PATH" ] && [ -s "$CONFIG_PATH" ]; then
            # Config exists - merge with Python if available
            if command -v python3 &> /dev/null; then
                python3 << PYEOF
import json

config_path = "$CONFIG_PATH"
api_key = "$API_KEY"

try:
    with open(config_path, 'r') as f:
        config = json.load(f)
except:
    config = {}

if 'mcpServers' not in config:
    config['mcpServers'] = {}

config['mcpServers']['lcontext'] = {
    'command': 'lcontext',
    'env': {
        'LCONTEXT_API_KEY': api_key,
        'LCONTEXT_API_URL': 'https://lcontext.com'
    }
}

with open(config_path, 'w') as f:
    json.dump(config, f, indent=2)

print("Configuration merged successfully!")
PYEOF
            else
                cp "$CONFIG_PATH" "$CONFIG_PATH.backup"
                echo -e "${YELLOW}Existing config backed up to ${CONFIG_PATH}.backup${NC}"
                cat > "$CONFIG_PATH" << JSONEOF
{
  "mcpServers": {
    "lcontext": {
      "command": "lcontext",
      "env": {
        "LCONTEXT_API_KEY": "$API_KEY",
        "LCONTEXT_API_URL": "$API_URL"
      }
    }
  }
}
JSONEOF
            fi
        else
            cat > "$CONFIG_PATH" << JSONEOF
{
  "mcpServers": {
    "lcontext": {
      "command": "lcontext",
      "env": {
        "LCONTEXT_API_KEY": "$API_KEY",
        "LCONTEXT_API_URL": "$API_URL"
      }
    }
  }
}
JSONEOF
        fi
        echo -e "${GREEN}✓ Claude Desktop configured successfully!${NC}"
    fi

    echo ""
    echo -e "${YELLOW}Restart Claude to start using lcontext.${NC}"
else
    echo ""
    echo -e "${YELLOW}Skipped configuration.${NC}"
    echo ""
    echo "To configure manually:"
    echo ""
    echo -e "${GREEN}Claude Code (CLI):${NC}"
    echo "  claude mcp add lcontext -e LCONTEXT_API_KEY=your-api-key -e LCONTEXT_API_URL=https://lcontext.com -- lcontext"
    echo ""
    echo -e "${GREEN}Claude Desktop:${NC}"
    echo "  Edit: ${YELLOW}${CONFIG_PATH}${NC}"
    echo ""
    cat << 'CONFIGEOF'
{
  "mcpServers": {
    "lcontext": {
      "command": "lcontext",
      "env": {
        "LCONTEXT_API_KEY": "your-api-key-here",
        "LCONTEXT_API_URL": "https://lcontext.com"
      }
    }
  }
}
CONFIGEOF
fi

# Send installation telemetry (background, non-blocking)
send_telemetry "true"

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "For documentation and support:"
echo -e "${BLUE}https://github.com/Lcontext/Lcontext${NC}"
echo ""
