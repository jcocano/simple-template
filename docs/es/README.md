# Simple Template

> Editor de plantillas de email open-source y local-first para macOS, Windows y Linux — una alternativa no-code a Beefree que corre enteramente en tu máquina y que los agentes de IA pueden operar de punta a punta.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](../../LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/jcocano/simple-template?style=social)](https://github.com/jcocano/simple-template/stargazers)
[![GitHub issues](https://img.shields.io/github/issues/jcocano/simple-template)](https://github.com/jcocano/simple-template/issues)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.md)
[![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey.svg)](#instalaci%C3%B3n)

**Idiomas:** [English](../../README.md) · [Español](./README.md) · [Português](../pt/README.md) · [Français](../fr/README.md) · [日本語](../ja/README.md) · [简体中文](../zh/README.md)

---

Simple Template es una app de escritorio para cualquiera que necesite armar campañas de email pulidas y responsive sin tocar HTML. Tus plantillas viven en tu disco — sin cuentas, sin nube, sin tracking — y podés pasarle el teclado a un agente de IA cuando quieras vía el servidor MCP integrado.

> **¿Te gusta el proyecto?** Una [estrella en GitHub](https://github.com/jcocano/simple-template) es la forma más fácil de ayudarnos a crecer.

## Para quién es

- **Marketers, founders, creadores** que quieren diseñar emails de forma visual sin depender del editor cerrado de una plataforma de mailing
- **Equipos chicos** que necesitan compartir e iterar plantillas sin una cuenta en la nube
- **Usuarios que valoran la privacidad** y no quieren dejar sus borradores en servidores ajenos
- **Power users de IA** con Claude Desktop / Cursor / otros clientes MCP que buscan un editor real donde su agente pueda trabajar — no más HTML generado al azar

## Qué lo hace especial

- **Local-first por diseño.** Tus plantillas, imágenes, bloques guardados, API keys y settings se quedan en tu máquina. Sin cuentas, sin telemetría, sin cloud sync.
- **Editor visual por bloques.** Modelo sección → columna → bloque, ~20 tipos de bloques, preview responsive en vivo, undo/redo, autosave.
- **IA integrada.** Mejorá el texto de cualquier bloque o generá plantillas enteras usando Anthropic, OpenAI, Google, Ollama u OpenRouter. Las API keys se guardan encriptadas en el keychain de tu sistema.
- **Manejable por agentes (servidor MCP).** Agentes de IA externos pueden crear y editar plantillas a través de 28 tools tipados — cero chance de HTML alucinado porque el agente usa las mismas acciones que vos en la UI.
- **Compartí en privado.** Bundles `.st` encriptados con un click vía deep-links `simpletemplete://`, con PIN opcional.
- **Testeo real de envío.** SMTP + OAuth (Gmail / Outlook) integrado para mandar pruebas.
- **Exportá a cualquier lado.** HTML / MJML / plain text / ZIP. Las `{{variables}}` se preservan como literales para que Mailchimp, Sendgrid, Brevo, Klaviyo las interpreten en tiempo de envío.
- **Revisión pre-flight.** 7 categorías de chequeos (contenido, accesibilidad, compatibilidad, imágenes, links, variables, legal) antes de exportar.
- **Seis idiomas.** Inglés, Español, Portugués, Francés, Japonés, Chino Simplificado. Se cambian en vivo, sin reload.

## Qué podés hacer

### Diseñar emails de forma visual

Un documento basado en secciones (`secciones → columnas → bloques`) con layouts `1col / 2col / 3col` y cerca de veinte tipos de bloques: texto, heading, hero, imagen, ícono, botón, divisor, espaciador, header, footer, producto, redes, más tipos avanzados (video, GIF, cuenta regresiva, QR, mapa, acordeón, tabla, HTML custom y más).

- Drag-drop desde la paleta de bloques, reordenás secciones/bloques arrastrando
- Controles de estilo por bloque: fuente, tamaño, peso, color, alineación, padding, bordes, radius, background
- **Overrides solo-mobile**: ocultar un bloque en mobile, tamaño de fuente distinto, padding distinto
- Toggle de preview por dispositivo (desktop 600px / mobile 320px)
- Undo / redo, autosave cada ~30s, duplicar / borrar desde el teclado

### Reutilizar contenido entre plantillas

- **Biblioteca de saved blocks** — guardá cualquier sección como bloque reutilizable. Arrastrala desde el panel de biblioteca a cualquier plantilla. Organizá por categorías (headers, footers, CTAs, testimonios, productos, redes, firmas, custom, o cualquier categoría que crees con drag-drop).
- **Biblioteca de imágenes** por workspace — arrastrá imágenes, organizalas en carpetas. Se sirven vía el protocolo custom `st-img://` para que nada se suba a ningún lado.
- **Ocasiones (carpetas)** — agrupá plantillas por campaña u ocasión con una paleta de colores.

### Pulir con IA ✨

Conectá cualquiera de los cinco providers y empezá a iterar:

| Provider | Modelo por defecto |
|---|---|
| Anthropic | `claude-sonnet-4-5` |
| OpenAI | `gpt-4.1` |
| Google | `gemini-2.5-flash` |
| Ollama | local, sin API key |
| OpenRouter | una sola key, muchos modelos |

- **Mejorar el texto de cualquier bloque** — elegís el tono, te devuelve tres variantes, aplicás la que te gusta
- **Generar una plantilla entera desde un prompt** — describís el email, recibís una estructura multi-sección válida
- Panel de setup por provider con los pasos exactos para conseguir una API key
- Las keys se guardan encriptadas en el keychain del sistema (macOS Keychain, Credential Manager en Windows, o archivo encriptado en Linux)

### Dejar que agentes de IA manejen la app (servidor MCP) 🤖

Simple Template incluye un servidor **Model Context Protocol** embebido. Cualquier cliente compatible con MCP (Claude Desktop, Cursor, Zed, etc.) puede conectarse y operar la app a través de 28 tools tipados:

- **Plantillas** — listar, leer, crear, duplicar, renombrar, enviar a papelera / restaurar / purgar, actualizar atributos
- **Estructura** — agregar / actualizar / eliminar / mover secciones y bloques de forma incremental
- **Biblioteca** — insertar saved blocks, guardar secciones como saved blocks, listar imágenes
- **Metadata** — setear asunto, preview, from-name / from-email, variables
- **Navegación** — `open_template` hace que el agente te lleve al editor para ver los cambios en vivo

**Por qué esto es mejor que "pedile a la IA que te escriba el HTML":**

- **Cero HTML alucinado.** Cada tool recibe parámetros estructurados con schemas Zod estrictos. Los agentes no pueden inventar campos ni tirar markup improvisado — solo pueden usar las mismas acciones que vos en la UI.
- **Lo ves pasar en vivo.** Cuando un agente está editando, el editor muestra un indicador con pulse y un botón "Tomar control". Las mutaciones del agente aparecen en tiempo real.
- **Setup en un click.** Settings → MCP tiene snippets JSON pre-interpolados para Claude Desktop (`claude_desktop_config.json`) y Cursor (`~/.cursor/mcp.json`) — copiás y reiniciás el cliente.
- **Local y seguro.** El servidor bindea solo `127.0.0.1`, auth con Bearer token, se apaga cuando cerrás la app.

### Compartir plantillas de forma privada

- Exportá cualquier plantilla como un bundle `.st` encriptado
- Compartila vía deep-link `simpletemplete://` — el receptor hace click, se abre la app, el bundle aterriza en su workspace
- PIN opcional para compartir en privado (el receptor ingresa el PIN antes de importar)
- Sin cuentas ni servidores intermedios

### Mandar test emails de verdad

- **SMTP** — Gmail, Outlook, Yahoo, iCloud, SendGrid, Mailgun, o cualquier host SMTP
- **OAuth** — flujos de un click para Gmail y Microsoft Outlook (sin app passwords)
- El asunto lleva el prefijo `[PRUEBA]` / `[TEST]` en el idioma de tu UI
- Las variables se sustituyen por el valor `.sample` para el envío de prueba

### Exportar a cualquier plataforma de mailing

| Formato | Para qué sirve |
|---|---|
| **HTML** | Email-safe, basado en tablas, CSS inline, compatible con Outlook |
| **MJML** | Fuente MJML editable para flujos basados en MJML |
| **Plain text** | Extraído de los bloques, fallback multipart |
| **ZIP** | HTML + plain text + imágenes empaquetadas |

Las `{{variables}}` se **preservan como literales** al exportar, así Mailchimp / Sendgrid / Brevo / Klaviyo / cualquier plataforma donde envíes puede interpretarlas con su propio motor de templating en el momento del envío.

### Enviá con confianza gracias al review pre-flight

Apretá `⌘⇧R` antes de exportar. El panel de review corre chequeos en siete categorías:

- **Contenido** — bloques vacíos, botones sin link, preview text faltante, URLs sospechosas
- **Variables** — vars no usadas, referencias a vars no definidas
- **Accesibilidad** — alt text en imágenes, jerarquía de headings
- **Compatibilidad** — advertencias de Outlook, quirks conocidos de clientes
- **Imágenes** — imágenes rotas o faltantes (chequeo async con HEAD), archivos muy pesados
- **Links** — URLs inaccesibles o malformadas
- **Legal** — link de unsubscribe, dirección en el footer, compliance con CAN-SPAM

Cada issue tiene una acción de fix directo cuando es posible (*Ir a settings de delivery*, *Agregar link de unsubscribe*, etc.).

### Organizar tu trabajo

- **Múltiples workspaces** con datos completamente aislados (plantillas, imágenes, saved blocks, brand, vars, API keys de IA)
- **Settings por workspace** — branding (fuentes, texto del footer, dirección), delivery (SMTP/OAuth), provider de IA, idioma, variables, opciones de export
- **Temas** — indigo / ocean / violet × light / dark, más ajustes de densidad y radius
- **Paleta de comandos** (`⌘K` / `Ctrl+K`) — búsqueda sobre quick actions, navegación, settings, temas, plantillas recientes e inserción de bloques

## Promesa local-first

- **Sin cuentas, sin nube, sin telemetría** — nunca.
- **Todos los datos en tu disco:**

| Plataforma | Ubicación |
|---|---|
| macOS | `~/Library/Application Support/Simple Template/` |
| Windows | `%APPDATA%\Simple Template\` |
| Linux | `~/.config/Simple Template/` |

- **Plantillas + metadata** en SQLite (`better-sqlite3`), docs individuales como JSON, imágenes en una carpeta por workspace servidas vía `st-img://` (sin relajar `webSecurity`).
- **Secretos** (keys de IA, passwords SMTP, tokens OAuth) en el keychain de tu sistema — no plaintext.
- **Portables** — exportá workspaces enteros como bundles `.st` encriptados cuando quieras.

## Instalación

### Desde el código

```sh
git clone https://github.com/jcocano/simple-template.git
cd simple-template
npm install
npm run dev
```

Requisitos:
- **Node.js 20+**
- **Un toolchain de C** para `better-sqlite3`:
  - macOS: `xcode-select --install`
  - Debian/Ubuntu: `sudo apt install build-essential python3`
  - Windows: [Visual Studio Build Tools](https://visualstudio.microsoft.com/downloads/) con "Desktop development with C++"

### Binarios pre-compilados

Bajate el instalador para tu plataforma desde la [página de releases](https://github.com/jcocano/simple-template/releases):

| Plataforma | Descarga |
|---|---|
| macOS (Apple Silicon / Intel) | `.dmg` o `.zip` |
| Windows | `.exe` (instalador NSIS) |
| Linux | `.AppImage` o `.deb` |

> **Aviso — binarios sin firmar.** Simple Template es open source y todavía no incluye un Apple Developer ID pago ni un certificado de code-signing de Windows. Los artefactos se buildean en CI desde el código público, pero tu sistema operativo te va a avisar la primera vez que los abras:
>
> - **macOS** — Gatekeeper dice *"no se puede abrir porque Apple no puede comprobar que no contenga software malicioso"*. Click derecho en la app → **Abrir** → confirmar. Desde Terminal: `xattr -d com.apple.quarantine "/Applications/Simple Template.app"`.
> - **Windows** — SmartScreen muestra *"Windows protegió tu PC"*. Click en **Más información** → **Ejecutar de todas formas**.
> - **Linux** — para el `.AppImage` hay que marcarlo ejecutable primero: `chmod +x SimpleTemplate-*.AppImage`. El `.deb` se instala normal con `apt install ./...deb`.
>
> Code-signing y notarización van a llegar en una versión futura.

Si preferís buildear los instaladores localmente:

```sh
npm run dist
```

Los binarios aterrizan en `release/` — `.dmg` / `.zip` para macOS, `.exe` para Windows, `.AppImage` / `.deb` para Linux.

## Usala día a día

### Atajos de teclado

| Atajo | Acción |
|---|---|
| `⌘K` / `Ctrl+K` | Paleta de comandos |
| `⌘S` / `Ctrl+S` | Guardar plantilla |
| `⌘D` / `Ctrl+D` | Duplicar bloque o sección seleccionado |
| `⌘P` / `Ctrl+P` | Abrir preview |
| `⌘⇧T` / `Ctrl+Shift+T` | Enviar test email |
| `⌘⇧R` / `Ctrl+Shift+R` | Abrir review pre-flight |
| `⌘Z` / `⌘⇧Z` | Undo / redo |
| `Backspace` / `Delete` | Eliminar bloque o sección seleccionado |

### Conectar un agente de IA (quick start MCP)

1. Abrí **Settings → MCP**
2. Copiá el snippet JSON de tu cliente — Claude Desktop y Cursor aparecen con URL + token pre-interpolados
3. Pegalo en:
   - Claude Desktop: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Cursor: `~/.cursor/mcp.json`
4. Reiniciá el cliente MCP
5. Pedile al agente `list_templates` / `create_template` / `add_section` / etc. — mirá el editor actualizarse en vivo

La app tiene que estar abierta para que el servidor MCP responda. Si cerrás la app, la conexión se cae (es así por diseño).

## Para desarrolladores

### Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Vite + Electron en paralelo con live reload (puerto 5173) |
| `npm run dev:web` | Sólo Vite — iterar el renderer en un navegador |
| `npm run dev:electron` | Electron apuntando a un Vite dev server corriendo |
| `npm run start` | Electron contra el `dist/index.html` estático |
| `npm run build:web` | Bundle de producción Vite en `dist/` |
| `npm run pack` | Binario empaquetado `.app` / `.exe` / Linux sin empaquetar — sin instalador |
| `npm run dist` | Instaladores completos en `release/` (sin firmar en máquina local) |
| `npm run test:export` | Smoke test del pipeline de export contra fixtures |
| `npm run build:icons` | Regenerar íconos de la app desde `assets/icon.svg` |

### Arquitectura de un vistazo

- **Shell de Electron** con defaults de seguridad estrictos (`contextIsolation: true`, `sandbox: true`, `nodeIntegration: false`, IPC solo por preload vía `contextBridge`)
- **Renderer React 18** con una convención de **globals-en-`window`** — los archivos se cargan por side effects desde `src/main.tsx` y se registran en `window`. Ver [CLAUDE.md](../../CLAUDE.md) para el racional completo.
- **better-sqlite3** para metadata local + archivos JSON para los documentos de plantillas
- **Vite** para bundling, JSX runtime clásico (auto-inject)
- **Sin compilador de TypeScript** en el pipeline — `.tsx` es solo sintaxis JSX
- **Protocolo custom `st-img://`** para servir imágenes del workspace sin relajar `webSecurity`
- **MCP SDK** (`@modelcontextprotocol/sdk`) cargado con `await import()` dinámico desde el main process (el paquete es ESM-only)
- **electron-builder** para empaquetado cross-platform

### Dónde extender

| Área | Path |
|---|---|
| Lógica del renderer | `src/lib/` |
| Pantallas | `src/screens/` |
| Modales | `src/modals/` |
| Handlers IPC de Electron | `electron/ipc/` |
| Persistencia de datos | `electron/storage/` |
| Providers de IA | `electron/ai/` |
| Tools MCP | `electron/mcp/tools.js` |
| Diccionarios i18n | `src/lib/i18n/<lang>.tsx` |

Mirá [CONTRIBUTING.md](./CONTRIBUTING.md) para la guía completa de contribución — convenciones de commit, principios de arquitectura y checklist de PR.

### Testing

Estado prototipo — todavía no hay test runner completo. El mínimo antes de abrir un PR:

1. Que `npm run test:export` pase (smoke test contra tres fixtures)
2. Correr `npm run dev` y ejercitar la feature a mano
3. Si tocaste packaging o main de Electron, correr también `npm run pack` y abrir la app empaquetada

## Banca el proyecto

Simple Template es gratis y open-source. Si te sirve, cualquiera de estas ayuda:

- **[Estrella en el repo](https://github.com/jcocano/simple-template)** para que más gente lo encuentre
- **[Reportá un bug](https://github.com/jcocano/simple-template/issues/new?template=bug_report.yml)** si algo está roto
- **[Pedí una feature](https://github.com/jcocano/simple-template/issues/new?template=feature_request.yml)** que querés ver
- **[Ayudá con traducciones](https://github.com/jcocano/simple-template/issues/new?template=translation.yml)** — typos, mejor copy, o un idioma nuevo
- **[Abrí un pull request](./CONTRIBUTING.md)** — mirá la guía de contribución para el setup de dev
- **[Sumate a las discussions](https://github.com/jcocano/simple-template/discussions)** para preguntas, ideas y show-and-tell
- **[Invitame un café](https://buymeacoffee.com/jesuscocana)** si querés financiar el desarrollo

## Comunidad

- **[Discussions](https://github.com/jcocano/simple-template/discussions)** — Q&A, ideas, show-and-tell
- **[Issues](https://github.com/jcocano/simple-template/issues)** — bugs, features, traducciones
- **[Releases](https://github.com/jcocano/simple-template/releases)** — historial de versiones

Leé el [Código de Conducta](./CODE_OF_CONDUCT.md) antes de participar.

## Seguridad

¿Encontraste una vulnerabilidad? Por favor **no** abras un issue público. Mirá [SECURITY.md](./SECURITY.md) para el proceso de divulgación responsable.

## Licencia

[MIT](../../LICENSE) © Jesus Cocaño.

Si Simple Template te ahorra tiempo, considerá [invitarme un café](https://buymeacoffee.com/jesuscocana) — ayuda a que el proyecto siga avanzando.
