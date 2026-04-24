# Simple Template

> Open-source, local-first email template editor for macOS, Windows and Linux — a no-code Beefree alternative that runs entirely on your machine and that AI agents can drive end-to-end.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/jcocano/simple-templete?style=social)](https://github.com/jcocano/simple-templete/stargazers)
[![GitHub issues](https://img.shields.io/github/issues/jcocano/simple-templete)](https://github.com/jcocano/simple-templete/issues)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.md)
[![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey.svg)](#install)

**Languages:** [English](./README.md) · [Español](./docs/es/README.md) · [Português](./docs/pt/README.md) · [Français](./docs/fr/README.md) · [日本語](./docs/ja/README.md) · [简体中文](./docs/zh/README.md)

---

Simple Template is a desktop app for anyone who needs to ship polished, responsive email campaigns without touching HTML. Templates live on your disk — no accounts, no cloud, no tracking — and you can hand the keyboard to an AI agent any time via a built-in MCP server.

> **Like the project?** A [GitHub star](https://github.com/jcocano/simple-templete) is the easiest way to help it grow.

## Who it's for

- **Marketers, founders, creators** who want to design emails visually without a mailing platform's walled editor
- **Small teams** that need to share and iterate on templates without a cloud account
- **Privacy-minded users** who refuse to put draft copy on someone else's servers
- **AI power users** running Claude Desktop / Cursor / other MCP clients who want a real editor their agent can operate — not more generated HTML

## What makes it special

- **Local-first by design.** Your templates, images, saved blocks, API keys and settings stay on your machine. No accounts, no telemetry, no cloud sync.
- **Visual block editor.** Section → column → block model, ~20 block types, live responsive preview, undo / redo, autosave.
- **AI built in.** Improve any block's text or generate full templates using Anthropic, OpenAI, Google, Ollama or OpenRouter. API keys encrypted in your OS keychain.
- **Agent-drivable (MCP server).** External AI agents can create and edit templates through 28 typed tools — zero chance of hallucinated HTML because the agent uses the same actions you do in the UI.
- **Share privately.** One-click `.st` bundles over `simpletemplete://` deep links, optional PIN.
- **Real delivery testing.** SMTP + OAuth (Gmail / Outlook) test-send built in.
- **Export anywhere.** HTML / MJML / plain text / ZIP. `{{variables}}` kept as literals so Mailchimp, Sendgrid, Brevo, Klaviyo interpret them at send time.
- **Pre-flight review.** 7 check categories (content, accessibility, compatibility, images, links, variables, legal) before you export.
- **Six languages.** English, Spanish, Portuguese, French, Japanese, Chinese Simplified. Switches live, no reload.

## What you can do

### Design emails visually

A section-based document (`sections → columns → blocks`) with `1col / 2col / 3col` layouts and about twenty block types: text, heading, hero, image, icon, button, divider, spacer, header, footer, product, social, plus advanced types (video, GIF, countdown, QR, map, accordion, table, custom HTML and more).

- Drag-drop from the block palette, reorder sections/blocks by dragging
- Per-block style controls: font, size, weight, color, alignment, padding, borders, radius, background
- **Mobile-only overrides**: hide a block on mobile, different font size, different padding
- Device preview toggle (desktop 600px / mobile 320px)
- Undo / redo, autosave every ~30s, duplicate / delete from the keyboard

### Reuse content across templates

- **Saved blocks library** — save any section as a reusable block. Drag from the library panel into any template. Organize into categories (headers, footers, CTAs, testimonials, products, social, signatures, custom, or any category you create with drag-drop).
- **Image library** per workspace — drag-drop images in, organize into folders. Images served via a custom `st-img://` protocol so nothing is uploaded anywhere.
- **Occasions (folders)** — group templates by campaign or purpose with a color palette.

### Polish with AI ✨

Plug in any of five providers and start iterating:

| Provider | Default model |
|---|---|
| Anthropic | `claude-sonnet-4-5` |
| OpenAI | `gpt-4.1` |
| Google | `gemini-2.5-flash` |
| Ollama | local, no API key |
| OpenRouter | one API key, many models |

- **Improve text on any block** — pick a tone, get three variants, apply the one you like
- **Generate a full template from a prompt** — describe the email, get back a valid multi-section structure
- Per-provider setup panel with the exact steps to get an API key
- Keys encrypted in your OS keychain (macOS Keychain, Windows Credential Manager, or file-encrypted on Linux)

### Let AI agents drive the app (MCP server) 🤖

Simple Template ships with an embedded **Model Context Protocol** server. Any MCP-compatible client (Claude Desktop, Cursor, Zed, etc.) can connect and operate the app through 28 typed tools:

- **Templates** — list, read, create, duplicate, rename, trash / restore / purge, attribute updates
- **Structure** — add / update / delete / move sections and blocks incrementally
- **Library** — insert saved blocks, save sections as saved blocks, list images
- **Metadata** — set subject, preview, from-name / from-email, variables
- **Navigation** — `open_template` makes the agent jump you to the editor to see live changes

**Why this beats "ask the AI to write my HTML":**

- **Zero hallucinated HTML.** Every tool takes structured parameters with strict Zod schemas. Agents can't invent fields or dump made-up markup — they can only use the same actions you have in the UI.
- **You watch it happen.** When an agent is editing, the editor overlays a pulse indicator and a "Take control" button. The agent's mutations appear live.
- **One-click setup.** Settings → MCP has JSON snippets pre-interpolated for Claude Desktop (`claude_desktop_config.json`) and Cursor (`~/.cursor/mcp.json`) — paste and restart your client.
- **Local and secure.** Server binds `127.0.0.1` only, Bearer token auth, dies when the app closes.

### Share templates privately

- Export any template as an encrypted `.st` bundle
- Share via `simpletemplete://` deep link — recipient clicks, app opens, bundle lands in their workspace
- Optional PIN for private sharing (recipient enters PIN before import)
- No intermediate account or server required

### Send real test emails

- **SMTP** — Gmail, Outlook, Yahoo, iCloud, SendGrid, Mailgun, or any SMTP host
- **OAuth** — Gmail and Microsoft Outlook with one-click flows (no app passwords)
- Subject prefixed with `[TEST]` / `[PRUEBA]` in your UI language
- Variables substituted with `.sample` values for the test send

### Export to any mailing platform

| Format | Use case |
|---|---|
| **HTML** | Email-safe, table-based, inline CSS, Outlook-compatible |
| **MJML** | Editable MJML source for MJML workflows |
| **Plain text** | Extracted from blocks for multipart fallback |
| **ZIP** | HTML + plain text + images bundled |

`{{variables}}` are **preserved as literals** on export, so Mailchimp / Sendgrid / Brevo / Klaviyo / whatever platform you ship through can interpret them at send time with their own templating engine.

### Ship confidently with pre-flight review

Hit `⌘⇧R` before you export. The review panel runs checks across seven categories:

- **Content** — empty blocks, unlinked buttons, missing preview text, suspicious URLs
- **Variables** — unused vars, references to undefined vars
- **Accessibility** — alt text on images, heading hierarchy
- **Compatibility** — Outlook warnings, known client quirks
- **Images** — broken or missing images (async HEAD check), oversized files
- **Links** — unreachable or malformed URLs
- **Legal** — unsubscribe link, footer address, CAN-SPAM compliance

Every issue has a direct fix action where possible (*Go to delivery settings*, *Add unsubscribe link*, etc.).

### Organize your work

- **Multiple workspaces** with fully isolated data (templates, images, saved blocks, brand, vars, AI keys)
- **Per-workspace settings** — branding (fonts, footer text, address), delivery (SMTP/OAuth), AI provider, language, variables, export options
- **Themes** — indigo / ocean / violet × light / dark, plus density and radius tweaks
- **Command palette** (`⌘K` / `Ctrl+K`) — searchable across quick actions, navigation, settings, themes, recent templates and block insertion

## Local-first promise

- **No accounts, no cloud, no telemetry** — ever.
- **All data on your disk:**

| Platform | Location |
|---|---|
| macOS | `~/Library/Application Support/Simple Template/` |
| Windows | `%APPDATA%\Simple Template\` |
| Linux | `~/.config/Simple Template/` |

- **Templates + metadata** in SQLite (`better-sqlite3`), individual template docs as JSON, images in a per-workspace folder served via `st-img://` (no `webSecurity` loosening).
- **Secrets** (AI keys, SMTP passwords, OAuth tokens) stored in your OS keychain — not plaintext.
- **Portable** — export full workspaces as encrypted `.st` bundles any time.

## Install

### From source

```sh
git clone https://github.com/jcocano/simple-templete.git
cd simple-templete
npm install
npm run dev
```

Requirements:
- **Node.js 20+**
- **A C toolchain** for `better-sqlite3`:
  - macOS: `xcode-select --install`
  - Debian/Ubuntu: `sudo apt install build-essential python3`
  - Windows: [Visual Studio Build Tools](https://visualstudio.microsoft.com/downloads/) with "Desktop development with C++"

### Pre-built binaries

Not shipped yet — v0.1.0 release is pending code-signing and CI/CD. [Star the repo](https://github.com/jcocano/simple-templete) or [watch for releases](https://github.com/jcocano/simple-templete/releases) to get notified.

Until then, you can build installers locally:

```sh
npm run dist
```

Binaries land in `release/` — `.dmg` / `.zip` for macOS, `.exe` for Windows, `.AppImage` / `.deb` for Linux.

## Use it day-to-day

### Keyboard shortcuts

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

### Connect an AI agent (MCP quick start)

1. Open **Settings → MCP**
2. Copy the JSON snippet for your client — both Claude Desktop and Cursor are shown with URL + token pre-interpolated
3. Paste into:
   - Claude Desktop: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Cursor: `~/.cursor/mcp.json`
4. Restart the MCP client
5. Ask the agent to `list_templates` / `create_template` / `add_section` / etc. — watch the editor update live

The app must be running for the MCP server to answer. Close the app → connection drops (by design).

## For developers

### Scripts

| Command | Description |
|---|---|
| `npm run dev` | Vite + Electron concurrently with live reload (port 5173) |
| `npm run dev:web` | Vite only — iterate the renderer in a browser |
| `npm run dev:electron` | Electron against a running Vite dev server |
| `npm run start` | Electron against the static `dist/index.html` |
| `npm run build:web` | Production Vite bundle into `dist/` |
| `npm run pack` | Packaged `.app` / `.exe` / Linux unpacked — no installer |
| `npm run dist` | Full installers into `release/` (unsigned on a dev machine) |
| `npm run test:export` | Smoke test the export pipeline against fixtures |
| `npm run build:icons` | Regenerate app icons from `assets/icon.svg` |

### Architecture at a glance

- **Electron shell** with strict security defaults (`contextIsolation: true`, `sandbox: true`, `nodeIntegration: false`, preload-only IPC via `contextBridge`)
- **React 18 renderer** with a **globals-on-`window`** module convention — files load for side effects from `src/main.tsx` and register onto `window`. See [CLAUDE.md](./CLAUDE.md) for the full rationale.
- **better-sqlite3** for local metadata + JSON files for template documents
- **Vite** for bundling, classic JSX runtime (auto-inject)
- **No TypeScript compiler** in the pipeline — `.tsx` is JSX syntax only
- **Custom `st-img://` protocol** for serving workspace images without relaxing `webSecurity`
- **MCP SDK** (`@modelcontextprotocol/sdk`) loaded via dynamic `await import()` from the main process (ESM-only package)
- **electron-builder** for cross-platform packaging

### Where to extend

| Area | Path |
|---|---|
| Renderer logic | `src/lib/` |
| Screens | `src/screens/` |
| Modals | `src/modals/` |
| Electron IPC handlers | `electron/ipc/` |
| Data persistence | `electron/storage/` |
| AI providers | `electron/ai/` |
| MCP tools | `electron/mcp/tools.js` |
| i18n dictionaries | `src/lib/i18n/<lang>.tsx` |

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full developer guide — commit conventions, architecture principles, and the PR checklist.

### Testing

Prototype-stage — no full test runner yet. Minimum bar before opening a PR:

1. `npm run test:export` passes (smoke test against three fixtures)
2. `npm run dev` and exercise the feature manually
3. If you touched packaging or Electron main, also run `npm run pack` and open the built app

## Roadmap

**v0.1 (shipped):**
- Core visual editor, saved-blocks library, image library, occasions
- AI across 5 providers with improve-text and generate-template
- MCP server with 28 typed tools and editor live-lock
- Export to HTML / MJML / plain text / ZIP with variable preservation
- SMTP + OAuth (Gmail, Outlook) test-send
- Pre-flight review across 7 categories
- Share via encrypted `.st` bundles + `simpletemplete://` deep links
- Six languages with live switching
- Local-first SQLite + OS-keychain secrets

**v0.1.x (next):**
- Code-signed and notarized builds (macOS + Windows)
- CI/CD release pipeline with auto-update channel
- Pre-built installers on every release

**Later (ideas, not commitments):**
- Richer embeds for video / GIF / map / accordion blocks
- Export image optimization and CDN domain rewriting
- Additional AI providers
- Deeper review checks

**Out of scope on purpose:**
- Contact lists, send history, open/click tracking, hosted CDN — those belong in your mailing platform, not in a local editor.

## Support the project

Simple Template is free and open source. If it helps you, these are all useful:

- **[Star the repo](https://github.com/jcocano/simple-templete)** so more people find it
- **[Report a bug](https://github.com/jcocano/simple-templete/issues/new?template=bug_report.yml)** if something's broken
- **[Request a feature](https://github.com/jcocano/simple-templete/issues/new?template=feature_request.yml)** you want to see
- **[Help with translations](https://github.com/jcocano/simple-templete/issues/new?template=translation.yml)** — fix typos, improve copy, or add a new language
- **[Open a pull request](./CONTRIBUTING.md)** — see the contributing guide for the dev setup
- **[Join the discussions](https://github.com/jcocano/simple-templete/discussions)** for questions, ideas, and show-and-tell
- **[Buy me a coffee](https://buymeacoffee.com/jesuscocana)** if you want to fund ongoing development

## Community

- **[Discussions](https://github.com/jcocano/simple-templete/discussions)** — Q&A, ideas, show-and-tell
- **[Issues](https://github.com/jcocano/simple-templete/issues)** — bugs, features, translations
- **[Releases](https://github.com/jcocano/simple-templete/releases)** — version history

Please read the [Code of Conduct](./CODE_OF_CONDUCT.md) before participating.

## Security

Found a vulnerability? Please **do not** open a public issue. See [SECURITY.md](./SECURITY.md) for the responsible disclosure process.

## License

[MIT](./LICENSE) © Jesus Cocaño.

If Simple Template saves you time, consider [buying me a coffee](https://buymeacoffee.com/jesuscocana) — it keeps the project moving.
