# Contributing to Simple Template

Thanks for taking the time to contribute. Every form of help — filing a bug, suggesting a feature, fixing a typo, translating a string, writing code — makes the project better.

**Languages:** [English](./CONTRIBUTING.md) · [Español](./docs/es/CONTRIBUTING.md)

> **Not ready to write code?** A [GitHub star](https://github.com/jcocano/simple-template) or a [coffee](https://buymeacoffee.com/jesuscocana) also helps a lot.

## Table of contents

- [Code of Conduct](#code-of-conduct)
- [Ways to contribute](#ways-to-contribute)
- [Reporting bugs](#reporting-bugs)
- [Suggesting features](#suggesting-features)
- [Helping with translations](#helping-with-translations)
- [Development setup](#development-setup)
- [Project architecture](#project-architecture)
- [Coding conventions](#coding-conventions)
- [Commit messages](#commit-messages)
- [Pull request process](#pull-request-process)
- [Security](#security)
- [Community](#community)

## Code of Conduct

This project follows the [Contributor Covenant](./CODE_OF_CONDUCT.md). By participating you agree to uphold it. Report unacceptable behavior to `jesus.cocano@gmail.com`.

## Ways to contribute

- **Star the repo** — low effort, very helpful for discoverability
- **Report a bug** — use the [bug report template](https://github.com/jcocano/simple-template/issues/new?template=bug_report.yml)
- **Suggest a feature** — use the [feature request template](https://github.com/jcocano/simple-template/issues/new?template=feature_request.yml)
- **Help with translations** — use the [translation template](https://github.com/jcocano/simple-template/issues/new?template=translation.yml)
- **Improve documentation** — typos, clarifications, examples all welcome
- **Submit a pull request** — see [Pull request process](#pull-request-process) below
- **Join discussions** — [GitHub Discussions](https://github.com/jcocano/simple-template/discussions) for Q&A, ideas, show-and-tell
- **[Buy me a coffee](https://buymeacoffee.com/jesuscocana)** — funds ongoing development

## Reporting bugs

Before opening an issue, please:

1. Search [existing issues](https://github.com/jcocano/simple-template/issues) to avoid duplicates.
2. Try reproducing on the `main` branch.
3. Collect: OS + version, app version, steps to reproduce, expected vs actual behavior, screenshots/logs if relevant.

Then open the [bug report template](https://github.com/jcocano/simple-template/issues/new?template=bug_report.yml).

For security issues, see [SECURITY.md](./SECURITY.md) — please **do not** open a public issue.

## Suggesting features

Open the [feature request template](https://github.com/jcocano/simple-template/issues/new?template=feature_request.yml) with:

- The problem you're trying to solve (not the solution first)
- Who it affects
- Alternatives you've considered
- Whether it fits the local-first, no-backend scope of the project

Features that require a backend or account infrastructure (contact lists, send tracking, hosted CDN) are out of scope for the core app. That doesn't mean "no" forever — but it does mean we'll discuss the tradeoff carefully.

## Helping with translations

Simple Template currently ships in six languages:

| Code | Language | Status |
|------|----------|--------|
| `es` | Spanish  | Source language |
| `en` | English  | Complete |
| `pt` | Portuguese (BR) | Complete |
| `fr` | French   | Complete |
| `ja` | Japanese | Complete |
| `zh` | Chinese (Simplified) | Complete |

Translations live in `src/lib/i18n/<lang>.tsx`. Each file is a flat object of string keys.

### To fix or improve an existing translation

1. Open `src/lib/i18n/<lang>.tsx`
2. Find the key you want to improve
3. Edit the string, preserving interpolation placeholders (e.g. `{name}`, `{n}`)
4. Submit a PR with commit prefix `i18n(<lang>): …`

### To add a new language

1. Open a [translation issue](https://github.com/jcocano/simple-template/issues/new?template=translation.yml) first so we can coordinate
2. Copy `src/lib/i18n/en.tsx` as your starting point (English is the most complete non-source reference)
3. Translate every key — leave placeholders intact
4. Register the new language in the i18n loader
5. Submit a PR with commit prefix `i18n(<new-lang>): add <Language> translation`

Missing context for a string? Open an issue — we'll clarify.

## Development setup

### Prerequisites

- **Node.js 20+**
- **npm** (comes with Node)
- A working C toolchain (for `better-sqlite3`):
  - **macOS:** Xcode Command Line Tools (`xcode-select --install`)
  - **Linux (Debian/Ubuntu):** `sudo apt install build-essential python3`
  - **Windows:** Visual Studio Build Tools with the "Desktop development with C++" workload

### Clone and run

```sh
git clone https://github.com/jcocano/simple-template.git
cd simple-template
npm install
npm run dev
```

`npm install` triggers a postinstall step that rebuilds `better-sqlite3` for the Electron ABI. If this fails, rerun `npm run postinstall` manually.

### Useful scripts

| Script | Description |
|---|---|
| `npm run dev` | Vite (renderer) + Electron (shell) with live reload |
| `npm run dev:web` | Just Vite, for browser-only renderer iteration |
| `npm run dev:electron` | Electron against a running Vite dev server |
| `npm run build:web` | Vite production bundle into `dist/` |
| `npm run pack` | Packaged `.app` / `.exe` / unpacked Linux (no installer) |
| `npm run dist` | Full installers into `release/` (unsigned on a dev machine) |
| `npm run test:export` | Smoke test for the export pipeline |

### Testing your changes

There is no full test runner configured (see [Project architecture](#project-architecture)). Before opening a PR:

1. Run `npm run test:export` — it validates the export pipeline against three fixtures.
2. Run `npm run dev` and exercise the feature manually.
3. If you touched packaging/Electron, run `npm run pack` and open the packaged app.

## Project architecture

For the full context, see [CLAUDE.md](./CLAUDE.md). In short:

- **Renderer is not a standard ES-module app.** Files under `src/` load in a specific order from `src/main.tsx` and attach their exports to `window`. Order matters — register new modules correctly.
- **Architecture principles (non-negotiable for new code):**
  - Single Responsibility — one function does one thing
  - Visual / logic decoupling — `.tsx` is presentation; logic lives in `src/lib/`
  - Modular by feature
  - DRY with rule of three (no abstraction before three repetitions)
  - Persistence in SQLite (`localStorage` is legacy prototype state)
  - Cross-platform: Windows, macOS, Linux
- **Security posture:** `contextIsolation: true`, `sandbox: true`, `nodeIntegration: false`, preload-only IPC via `contextBridge`.
- **Custom protocol `st-img://`** for serving workspace images without relaxing web security.

## Coding conventions

- **JavaScript/JSX only** — no TypeScript compiler is configured. `.tsx` is a JSX convenience.
- **No implicit React import** — `vite.config.js` auto-injects `import React from 'react'` at build time. Use `React.useState`, `React.useEffect`, etc.
- **Globals on `window`** — register new components via `Object.assign(window, { Foo })` and add them to `src/main.tsx` in the right position.
- **Spanish for user-facing copy** — default language is Spanish; translations live in `src/lib/i18n/<lang>.tsx`.
- **`localStorage` namespaced with `mc:*`** (legacy) or `st:*` (current). Prefer SQLite for anything beyond trivial UI state.
- **No emojis in committed files** unless they serve a UX purpose in the app UI.

## Commit messages

Follow [Conventional Commits](https://www.conventionalcommits.org/) with these scopes:

```
<type>(<scope>): <short summary>

[optional body]
```

**Types:** `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `i18n`.

**Common scopes:** `editor`, `export`, `review`, `settings`, `electron`, `release`, `i18n(<lang>)`.

**Examples:**

```
feat(editor): add multi-select for blocks
fix(export): escape HTML entities in plaintext output
i18n(pt): translate review panel strings
chore(release): wire electron-builder for macOS signing
```

Keep commits focused. Don't mix a feature with an unrelated refactor.

**Do not include `Co-Authored-By` lines** — commits must be authored solely by the contributor.

## Pull request process

1. Fork the repo and create a branch from `main`:
   ```sh
   git checkout -b feat/your-feature
   ```
2. Make your changes. Keep diffs small and focused.
3. Run `npm run test:export` and manual smoke tests relevant to your change.
4. Push your branch and open a PR against `main`.
5. Fill in the PR template — describe what, why, and how you tested.
6. Link any related issues with `Closes #123` or `Refs #123`.
7. Be patient: the project is maintained by one person; feedback may take a few days.
8. Address review comments as new commits (don't force-push during review — it's fine to squash at the end).

**PRs that will be closed quickly (sorry):**

- Reformatting the whole codebase to match a personal style preference
- Adding backends, accounts, or telemetry without prior discussion
- Large refactors without an accompanying issue explaining the motivation
- Adding dependencies for features that are one-liners

## Security

Please report vulnerabilities privately. See [SECURITY.md](./SECURITY.md).

## Community

- [GitHub Discussions](https://github.com/jcocano/simple-template/discussions) — Q&A, ideas, show-and-tell
- [Issues](https://github.com/jcocano/simple-template/issues) — bugs, features, translations

Thank you for contributing. If the project helps you, consider [starring the repo](https://github.com/jcocano/simple-template) or [buying me a coffee](https://buymeacoffee.com/jesuscocana).
