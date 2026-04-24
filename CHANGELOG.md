# Changelog

All notable changes to Simple Template are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.0.1] — 2026-04-24

First public cut. Feature list: see [README.md](./README.md#features).

### Added
- `electron-builder` packaging pipeline with macOS/Windows/Linux targets
- Production load path for the renderer (`dist/index.html`) with relative asset base
- `crashReporter` plus `uncaughtException` and `unhandledRejection` logging to the app's log directory
- Content-Security-Policy header applied via `session.webRequest` in production builds
- Full contributor documentation: `README.md` / `README.es.md`, `CONTRIBUTING.md` / `CONTRIBUTING.es.md`, `CODE_OF_CONDUCT.md` / `CODE_OF_CONDUCT.es.md`, `SECURITY.md` / `SECURITY.es.md`
- GitHub issue templates for bug reports, feature requests and translation help
- GitHub pull request template
- `FUNDING.yml` pointing to Buy Me a Coffee
- Real app icon in the sidebar and onboarding headers (replaces the `"S"` placeholder)

### Changed
- `package.json` gains full metadata: `description`, `author`, `homepage`, `repository`, `bugs`, `license`
- Vite config now emits relative asset paths (`base: './'`)

### Notes
- Native `better-sqlite3` rebuild runs automatically via `postinstall: electron-builder install-app-deps`

[Unreleased]: https://github.com/jcocano/simple-template/compare/v0.0.1...HEAD
[0.0.1]: https://github.com/jcocano/simple-template/releases/tag/v0.0.1
