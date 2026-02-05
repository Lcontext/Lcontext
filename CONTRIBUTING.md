# Contributing to Lcontext

Thanks for your interest in contributing!

## Development Setup

```bash
# Clone the repo
git clone https://github.com/Lcontext/Lcontext.git
cd lcontext

# Install dependencies
npm install

# Run in development mode (with hot reload)
npm run dev

# Build TypeScript
npm run build

# Test locally
LCONTEXT_API_KEY=your-key npm start
```

## Project Structure

```
src/
  index.ts      # Main MCP server implementation
binaries/       # Built binaries (not committed, uploaded to releases)
dist/           # Compiled JavaScript output
```

## Building Binaries

We use [Bun](https://bun.sh) to compile standalone binaries that include the runtime.

### Prerequisites

- [Bun](https://bun.sh) installed
- `patchelf` for Linux builds (to fix interpreter paths)

### Build Commands

```bash
# Build for current platform
npm run build:binary

# Build for all platforms
npm run build:all

# Build for specific platform
npm run build:binary:linux
npm run build:binary:macos
npm run build:binary:windows
```

### Manual Build (All Platforms)

```bash
# macOS
bun build src/index.ts --compile --target=bun-darwin-arm64 --outfile binaries/lcontext-macos-arm64
bun build src/index.ts --compile --target=bun-darwin-x64 --outfile binaries/lcontext-macos-x64

# Linux
bun build src/index.ts --compile --target=bun-linux-x64 --outfile binaries/lcontext-linux-x64
bun build src/index.ts --compile --target=bun-linux-arm64 --outfile binaries/lcontext-linux-arm64

# Windows
bun build src/index.ts --compile --target=bun-windows-x64 --outfile binaries/lcontext-windows-x64.exe
```

### Linux Binary Patching

Linux binaries need their interpreter paths fixed for cross-distro compatibility:

```bash
patchelf --set-interpreter /lib64/ld-linux-x86-64.so.2 binaries/lcontext-linux-x64
patchelf --set-interpreter /lib/ld-linux-aarch64.so.1 binaries/lcontext-linux-arm64
```

If `patchelf` crashes, run it with a clean environment:

```bash
env -i PATH=/usr/bin:/bin patchelf --set-interpreter /lib64/ld-linux-x86-64.so.2 binaries/lcontext-linux-x64
```

## Release Process

1. Update version in `package.json` and `src/index.ts` (CURRENT_VERSION constant)
2. Build binaries for all platforms
3. Create a GitHub release with the version tag (e.g., `v1.0.2`)
4. Upload all binaries to the release

## Code Style

- TypeScript with strict mode
- ES modules
- Keep dependencies minimal

## Submitting Changes

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally with your API key
5. Submit a pull request

## Questions?

Open an issue on GitHub.
