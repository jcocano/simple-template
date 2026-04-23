# Simple Template

> Editor de plantillas de correo open-source y local-first para macOS, Windows y Linux — una alternativa no-code a Beefree.io.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/jcocano/simple-templete?style=social)](https://github.com/jcocano/simple-templete/stargazers)
[![GitHub issues](https://img.shields.io/github/issues/jcocano/simple-templete)](https://github.com/jcocano/simple-templete/issues)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.es.md)
[![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey.svg)](#instalaci%C3%B3n)

**Idiomas:** [English](./README.md) · [Español](./README.es.md)

---

Simple Template es una app de escritorio para usuarios no técnicos que necesitan armar plantillas de correo responsivas sin tocar código. Las plantillas viven en tu máquina — sin cuentas, sin nube, sin tracking.

> **¿Te gusta el proyecto?** Una [estrella en GitHub](https://github.com/jcocano/simple-templete) es la forma más fácil de ayudar a que crezca.

## Funcionalidades

- Editor visual por bloques (secciones → columnas → bloques)
- Local-first: SQLite en tu disco, nada sale de tu máquina
- Exporta a **HTML**, **MJML**, **texto plano** o **ZIP** (HTML + imágenes inlined)
- Envío de prueba por SMTP (Gmail, SendGrid, Mailgun, cualquier host)
- Revisión pre-flight con **21 checks automáticos** antes de exportar
- Modo claro / oscuro con tres temas de acento (indigo, ocean, violet)
- Totalmente internacionalizada: español, inglés, portugués, francés, japonés, chino
- Biblioteca de imágenes por workspace, con drag-and-drop y carpetas
- Undo / redo con atajos de teclado
- Paleta de comandos (`⌘K` / `Ctrl+K`)

## Instalación

### Desde el código fuente

```sh
git clone https://github.com/jcocano/simple-templete.git
cd simple-templete
npm install
npm run dev
```

Necesitás Node 20+ y un toolchain de C funcionando para `better-sqlite3` (viene con Xcode en macOS, `build-essential` en Debian/Ubuntu, Visual Studio Build Tools en Windows).

### Binarios pre-compilados

Todavía no disponibles — la release v0.1.0 está pendiente de code-signing y CI/CD. [Ponele una estrella al repo](https://github.com/jcocano/simple-templete) o [suscribite a los releases](https://github.com/jcocano/simple-templete/releases) para enterarte.

Mientras tanto, podés generar los instaladores localmente:

```sh
npm run dist
```

Los binarios salen en `release/` (`.dmg` / `.zip` para macOS, `.exe` para Windows, `.AppImage` / `.deb` para Linux).

## Scripts

| Script | Descripción |
|---|---|
| `npm run dev` | Vite + Electron con live reload |
| `npm run build:web` | Bundle de producción de Vite en `dist/` |
| `npm run pack` | `.app` / `.exe` / Linux sin empaquetar, sin instalador |
| `npm run dist` | Instaladores completos en `release/` (sin firmar en máquina local) |
| `npm run test:export` | Smoke test del pipeline de export |

## Atajos de teclado

| Atajo | Acción |
|---|---|
| `⌘K` / `Ctrl+K` | Paleta de comandos |
| `⌘S` / `Ctrl+S` | Guardar plantilla |
| `⌘D` / `Ctrl+D` | Duplicar bloque o sección seleccionada |
| `⌘P` / `Ctrl+P` | Abrir preview |
| `⌘⇧T` / `Ctrl+Shift+T` | Enviar correo de prueba |
| `⌘⇧R` / `Ctrl+Shift+R` | Abrir pre-flight review |
| `⌘Z` / `⌘⇧Z` | Undo / redo |
| `Backspace` / `Delete` | Eliminar bloque o sección seleccionada |

## Cómo apoyar el proyecto

Simple Template es gratis y open source. Si te sirve, acá van las formas de devolver algo — cualquiera suma:

- **[Ponele una estrella al repo](https://github.com/jcocano/simple-templete)** para que más gente lo encuentre
- **[Reportá un bug](https://github.com/jcocano/simple-templete/issues/new?template=bug_report.yml)** si algo está roto
- **[Pedí una feature](https://github.com/jcocano/simple-templete/issues/new?template=feature_request.yml)** que te gustaría ver
- **[Ayudá con traducciones](https://github.com/jcocano/simple-templete/issues/new?template=translation.yml)** — corrigiendo typos, proponiendo mejor copy, o agregando un idioma nuevo
- **[Abrí un pull request](./CONTRIBUTING.es.md)** — mirá la guía de contribución para el setup de dev
- **[Sumate a las discusiones](https://github.com/jcocano/simple-templete/discussions)** para preguntas, ideas y show-and-tell
- **[Invitame un café](https://buymeacoffee.com/jesuscocana)** si querés bancar el desarrollo

Mirá [CONTRIBUTING.es.md](./CONTRIBUTING.es.md) para la guía completa de contribución.

## Roadmap

**v0.1 (actual):**
- Editor core, export, envío de prueba SMTP, pre-flight review
- Seis idiomas
- SQLite local
- Sólo local (sin backend)

**v0.1.x (próximo):**
- Iconos de app para las tres plataformas
- Builds firmados y notarizados (macOS + Windows)
- Pipeline de release CI/CD
- Canal de auto-update

**Más adelante (ideas, no compromisos):**
- Optimización de imágenes y reescritura de dominios en export
- Listas de contactos, historial de envíos, tracking de aperturas/clicks (esto requiere infraestructura — no está en el core local-first)

## Arquitectura

- **Electron** con defaults de seguridad estrictos (`contextIsolation`, `sandbox`, IPC solo por preload)
- **React 18** en el renderer con una convención custom de globals-en-`window` (ver [CLAUDE.md](./CLAUDE.md) si sos un agente AI o un contributor curioso)
- **better-sqlite3** para persistencia local
- **Vite** para el bundling
- Protocolo custom `st-img://` para servir imágenes del workspace sin relajar `webSecurity`
- Usa `electron-builder` para empaquetado cross-platform

Para notas detalladas de arquitectura, mirá [CONTRIBUTING.es.md](./CONTRIBUTING.es.md).

## Comunidad

- [Discusiones](https://github.com/jcocano/simple-templete/discussions) — preguntas, ideas, show-and-tell
- [Issues](https://github.com/jcocano/simple-templete/issues) — bugs, features, traducciones
- [Releases](https://github.com/jcocano/simple-templete/releases) — historial de versiones

Leé el [Código de Conducta](./CODE_OF_CONDUCT.es.md) antes de participar.

## Seguridad

¿Encontraste una vulnerabilidad? Por favor **no** abras un issue público. Mirá [SECURITY.es.md](./SECURITY.es.md) para el proceso de divulgación responsable.

## Licencia

[MIT](./LICENSE) © Jesus Cocaño.

Si Simple Template te ahorra tiempo, pensá en [invitarme un café](https://buymeacoffee.com/jesuscocana) — ayuda a que el proyecto siga avanzando.
