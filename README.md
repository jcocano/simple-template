# Simple Template

> Open-source, local-first email template editor for macOS, Windows and Linux — a no-code alternative to Beefree.io.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/jcocano/simple-templete?style=social)](https://github.com/jcocano/simple-templete/stargazers)
[![GitHub issues](https://img.shields.io/github/issues/jcocano/simple-templete)](https://github.com/jcocano/simple-templete/issues)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.md)
[![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey.svg)](#install)

**Languages:** [English](./README.md) · [Español](./README.es.md)

---

Simple Template is a desktop app for non-technical users who need to build polished, responsive email templates without touching code. Templates live on your machine — no accounts, no cloud, no tracking.

> **Like the project?** A [GitHub star](https://github.com/jcocano/simple-templete) is the easiest way to help it grow.

## Features

- Visual block-based editor (sections → columns → blocks)
- Local-first: SQLite storage on your disk, nothing leaves your machine
- Export to **HTML**, **MJML**, **plain text** or **ZIP** (HTML + inlined images)
- SMTP test-send built in (works with Gmail, SendGrid, Mailgun, any SMTP host)
- Pre-flight review with **21 automated checks** before you export
- Light / dark modes with three accent themes (indigo, ocean, violet)
- Fully internationalized: Spanish, English, Portuguese, French, Japanese, Chinese
- Image library per workspace, with drag-and-drop and folder organization
- Undo / redo with keyboard shortcuts
- Command palette (`⌘K` / `Ctrl+K`)

## Install

### From source

```sh
git clone https://github.com/jcocano/simple-templete.git
cd simple-templete
npm install
npm run dev
```

Requires Node 20+ and a working C toolchain for `better-sqlite3` (bundled with Xcode on macOS, `build-essential` on Debian/Ubuntu, Visual Studio Build Tools on Windows).

### Pre-built binaries

Not shipped yet — v0.1.0 release pending code-signing and CI/CD. [Star the repo](https://github.com/jcocano/simple-templete) or [watch for releases](https://github.com/jcocano/simple-templete/releases) to get notified.

Until then, you can build installers locally:

```sh
npm run dist
```

Binaries land in `release/` (`.dmg` / `.zip` for macOS, `.exe` for Windows, `.AppImage` / `.deb` for Linux).

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Vite + Electron with live reload |
| `npm run build:web` | Vite production bundle into `dist/` |
| `npm run pack` | Packaged `.app` / `.exe` / unpacked Linux, no installer |
| `npm run dist` | Full installers into `release/` (unsigned on a dev machine) |
| `npm run test:export` | Smoke test for the export pipeline |

## Keyboard shortcuts

| Shortcut | Action |
|---|---|
| `⌘K` / `Ctrl+K` | Command palette |
| `⌘S` / `Ctrl+S` | Save template |
| `⌘D` / `Ctrl+D` | Duplicate selected block or section |
| `⌘P` / `Ctrl+P` | Open preview |
| `⌘⇧T` / `Ctrl+Shift+T` | Send test email |
| `⌘⇧R` / `Ctrl+Shift+R` | Open pre-flight review |
| `⌘Z` / `⌘⇧Z` | Undo / redo |
| `Backspace` / `Delete` | Remove selected block or section |

## Support the project

Simple Template is free and open source. If it helps you, here are the ways to give back — any of them matter:

- **[Star the repo](https://github.com/jcocano/simple-templete)** so more people find it
- **[Report a bug](https://github.com/jcocano/simple-templete/issues/new?template=bug_report.yml)** if something is broken
- **[Request a feature](https://github.com/jcocano/simple-templete/issues/new?template=feature_request.yml)** you want to see
- **[Help with translations](https://github.com/jcocano/simple-templete/issues/new?template=translation.yml)** — fix typos, propose better copy, or add a new language
- **[Open a pull request](./CONTRIBUTING.md)** — see the contributing guide for the dev setup
- **[Join the discussions](https://github.com/jcocano/simple-templete/discussions)** for questions, ideas, and show-and-tell
- **[Buy me a coffee](https://buymeacoffee.com/jesuscocana)** if you want to fund ongoing development

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full contributor guide.

## Roadmap

**v0.1 (current):**
- Core editor, export, SMTP test-send, pre-flight review
- Six languages
- Local SQLite storage
- Local-only (no backend)

**v0.1.x (next):**
- App icons for all three platforms
- Code-signed and notarized builds (macOS + Windows)
- CI/CD release pipeline
- Auto-update channel

**Later (ideas, not commitments):**
- Export image optimization and domain rewriting
- Contact lists, send history, open/click tracking (these require infrastructure — not planned for the local-first core)

## Architecture

- **Electron** shell with strict security defaults (`contextIsolation`, `sandbox`, preload-only IPC)
- **React 18** renderer with a custom globals-on-`window` module convention (see [CLAUDE.md](./CLAUDE.md) if you're an AI agent or a curious contributor)
- **better-sqlite3** for local persistence
- **Vite** for bundling
- Custom `st-img://` protocol for serving workspace images without relaxing web security
- Uses `electron-builder` for cross-platform packaging

For detailed architecture notes, see [CONTRIBUTING.md](./CONTRIBUTING.md).

## Community

- [Discussions](https://github.com/jcocano/simple-templete/discussions) — Q&A, ideas, show-and-tell
- [Issues](https://github.com/jcocano/simple-templete/issues) — bugs, features, translations
- [Releases](https://github.com/jcocano/simple-templete/releases) — version history

Please read the [Code of Conduct](./CODE_OF_CONDUCT.md) before participating.

## Security

Found a vulnerability? Please **do not** open a public issue. See [SECURITY.md](./SECURITY.md) for the responsible disclosure process.

## License

[MIT](./LICENSE) © Jesus Cocaño.

If Simple Template saves you time, consider [buying me a coffee](https://buymeacoffee.com/jesuscocana) — it keeps the project moving.
