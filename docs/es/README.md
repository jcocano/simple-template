# Simple Template

> Editor de plantillas de email open-source y local-first para macOS, Windows y Linux — una alternativa no-code a Beefree que corre completamente en tu máquina y que los agentes de IA pueden operar de extremo a extremo.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](../../LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/jcocano/simple-template?style=social)](https://github.com/jcocano/simple-template/stargazers)
[![GitHub issues](https://img.shields.io/github/issues/jcocano/simple-template)](https://github.com/jcocano/simple-template/issues)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.md)
[![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey.svg)](#instalaci%C3%B3n)

**Idiomas:** [English](../../README.md) · [Español](./README.md) · [Português](../pt/README.md) · [Français](../fr/README.md) · [日本語](../ja/README.md) · [简体中文](../zh/README.md)

---

Simple Template es una aplicación de escritorio para cualquier persona que necesite crear campañas de email pulidas y responsive sin tocar HTML. Tus plantillas viven en tu disco — sin cuentas, sin nube, sin tracking — y puedes cederle el teclado a un agente de IA cuando quieras a través del servidor MCP integrado.

> **¿Te gusta el proyecto?** Una [estrella en GitHub](https://github.com/jcocano/simple-template) es la forma más fácil de ayudarnos a crecer.

## Para quién es

- **Equipos de marketing, fundadores y creadores** que quieren diseñar emails de forma visual sin depender del editor cerrado de una plataforma de mailing
- **Equipos pequeños** que necesitan compartir e iterar plantillas sin una cuenta en la nube
- **Usuarios que valoran la privacidad** y no quieren dejar sus borradores en servidores ajenos
- **Power users de IA** con Claude Desktop / Cursor / otros clientes MCP que buscan un editor real donde su agente pueda trabajar — sin más HTML generado al azar

## Qué lo hace especial

- **Local-first por diseño.** Tus plantillas, imágenes, bloques guardados, API keys y configuración permanecen en tu máquina. Sin cuentas, sin telemetría, sin sincronización en la nube.
- **Editor visual por bloques.** Modelo sección → columna → bloque, ~20 tipos de bloques, vista previa responsive en vivo, deshacer/rehacer, guardado automático.
- **IA integrada.** Mejora el texto de cualquier bloque o genera plantillas completas usando Anthropic, OpenAI, Google, Ollama u OpenRouter. Las API keys se guardan cifradas en el llavero del sistema.
- **Operable por agentes (servidor MCP).** Agentes de IA externos pueden crear y editar plantillas a través de 28 herramientas tipadas — cero posibilidad de HTML alucinado, porque el agente usa las mismas acciones que tú en la interfaz.
- **Comparte en privado.** Bundles `.st` cifrados con un click vía deep-links `simpletemplete://`, con PIN opcional.
- **Pruebas reales de envío.** SMTP + OAuth (Gmail / Outlook) integrado para mandar pruebas.
- **Exporta a cualquier plataforma.** HTML / MJML / texto plano / ZIP. Las `{{variables}}` se preservan como literales para que Mailchimp, Sendgrid, Brevo o Klaviyo las interpreten al momento del envío.
- **Revisión pre-envío.** 7 categorías de validaciones (contenido, accesibilidad, compatibilidad, imágenes, enlaces, variables, legal) antes de exportar.
- **Seis idiomas.** Inglés, español, portugués, francés, japonés, chino simplificado. Se cambian en vivo, sin recargar.

## Qué puedes hacer

### Diseñar emails de forma visual

Un documento basado en secciones (`secciones → columnas → bloques`) con layouts `1col / 2col / 3col` y cerca de veinte tipos de bloques: texto, encabezado, hero, imagen, ícono, botón, divisor, espaciador, header, footer, producto, redes, además de tipos avanzados (video, GIF, cuenta regresiva, QR, mapa, acordeón, tabla, HTML personalizado y más).

- Drag-and-drop desde la paleta de bloques; reordena secciones y bloques arrastrando
- Controles de estilo por bloque: fuente, tamaño, peso, color, alineación, padding, bordes, radius, fondo
- **Overrides solo para móvil**: ocultar un bloque en móvil, tamaño de fuente distinto, padding distinto
- Toggle de vista previa por dispositivo (escritorio 600px / móvil 320px)
- Deshacer / rehacer, guardado automático cada ~30 s, duplicar / eliminar desde el teclado

### Reutilizar contenido entre plantillas

- **Biblioteca de bloques guardados** — guarda cualquier sección como bloque reutilizable. Arrástralo desde el panel de biblioteca a cualquier plantilla. Organiza por categorías (headers, footers, CTAs, testimonios, productos, redes, firmas, personalizadas, o cualquier categoría que crees con drag-and-drop).
- **Biblioteca de imágenes** por workspace — arrastra imágenes y organízalas en carpetas. Se sirven mediante el protocolo personalizado `st-img://`, así nada se sube a ningún servidor.
- **Ocasiones (carpetas)** — agrupa plantillas por campaña u ocasión con una paleta de colores.

### Pulir con IA ✨

Conecta cualquiera de los cinco proveedores y empieza a iterar:

| Proveedor | Modelo por defecto |
|---|---|
| Anthropic | `claude-sonnet-4-5` |
| OpenAI | `gpt-4.1` |
| Google | `gemini-2.5-flash` |
| Ollama | local, sin API key |
| OpenRouter | una sola key, muchos modelos |

- **Mejorar el texto de cualquier bloque** — eliges el tono, recibes tres variantes y aplicas la que prefieras
- **Generar una plantilla completa desde un prompt** — describes el email y obtienes una estructura multi-sección válida
- Panel de configuración por proveedor con los pasos exactos para conseguir una API key
- Las keys se guardan cifradas en el llavero del sistema (Keychain en macOS, Credential Manager en Windows o un archivo cifrado en Linux)

### Permitir que agentes de IA manejen la app (servidor MCP) 🤖

Simple Template incluye un servidor **Model Context Protocol** integrado. Cualquier cliente compatible con MCP (Claude Desktop, Cursor, Zed, etc.) puede conectarse y operar la app a través de 28 herramientas tipadas:

- **Plantillas** — listar, leer, crear, duplicar, renombrar, mover a la papelera, restaurar, purgar y actualizar atributos
- **Estructura** — agregar, actualizar, eliminar y mover secciones y bloques de forma incremental
- **Biblioteca** — insertar bloques guardados, guardar secciones como bloques reutilizables, listar imágenes
- **Metadata** — definir asunto, preview, nombre/email del remitente y variables
- **Navegación** — `open_template` lleva al usuario al editor para ver los cambios en vivo

**Por qué esto es mejor que "pídele a la IA que te escriba el HTML":**

- **Cero HTML alucinado.** Cada herramienta recibe parámetros estructurados con esquemas Zod estrictos. Los agentes no pueden inventar campos ni inyectar markup improvisado — solo pueden usar las mismas acciones que tú en la interfaz.
- **Lo ves en vivo.** Cuando un agente está editando, el editor muestra un indicador con pulse y un botón "Tomar control". Las modificaciones del agente aparecen en tiempo real.
- **Configuración en un click.** Configuración → MCP tiene snippets JSON pre-rellenados para Claude Desktop (`claude_desktop_config.json`) y Cursor (`~/.cursor/mcp.json`) — los copias y reinicias el cliente.
- **Local y seguro.** El servidor escucha solo en `127.0.0.1`, autentica con Bearer token y se apaga cuando cierras la app.

### Compartir plantillas de forma privada

- Exporta cualquier plantilla como un bundle `.st` cifrado
- Compártelo mediante un deep-link `simpletemplete://` — el receptor hace click, se abre la app y el bundle queda en su workspace
- PIN opcional para compartir en privado (el receptor ingresa el PIN antes de importar)
- Sin cuentas ni servidores intermedios

### Enviar emails de prueba reales

- **SMTP** — Gmail, Outlook, Yahoo, iCloud, SendGrid, Mailgun o cualquier host SMTP
- **OAuth** — flujos de un click para Gmail y Microsoft Outlook (sin contraseñas de aplicación)
- El asunto incluye el prefijo `[PRUEBA]` / `[TEST]` en el idioma de tu interfaz
- Las variables se sustituyen por el valor `.sample` para el envío de prueba

### Exportar a cualquier plataforma de mailing

| Formato | Para qué sirve |
|---|---|
| **HTML** | Email-safe, basado en tablas, CSS inline, compatible con Outlook |
| **MJML** | Fuente MJML editable para flujos basados en MJML |
| **Texto plano** | Extraído de los bloques, fallback multipart |
| **ZIP** | HTML + texto plano + imágenes empaquetados |

Las `{{variables}}` se **preservan como literales** al exportar, de modo que Mailchimp, Sendgrid, Brevo, Klaviyo o cualquier plataforma de envío pueda interpretarlas con su propio motor de plantillas en el momento del envío.

### Envía con confianza gracias a la revisión pre-envío

Presiona `⌘⇧R` antes de exportar. El panel de revisión ejecuta validaciones en siete categorías:

- **Contenido** — bloques vacíos, botones sin enlace, preview text faltante, URLs sospechosas
- **Variables** — variables sin uso, referencias a variables no definidas
- **Accesibilidad** — texto alternativo en imágenes, jerarquía de encabezados
- **Compatibilidad** — advertencias de Outlook, peculiaridades conocidas de clientes
- **Imágenes** — imágenes rotas o faltantes (validación asíncrona con HEAD), archivos demasiado pesados
- **Enlaces** — URLs inaccesibles o malformadas
- **Legal** — enlace de baja, dirección en el footer, cumplimiento con CAN-SPAM

Cada problema incluye una acción de corrección directa cuando es posible (*Ir a configuración de envío*, *Agregar enlace de baja*, etc.).

### Organizar tu trabajo

- **Múltiples workspaces** con datos completamente aislados (plantillas, imágenes, bloques guardados, marca, variables y API keys de IA)
- **Configuración por workspace** — branding (fuentes, texto del footer, dirección), envío (SMTP/OAuth), proveedor de IA, idioma, variables y opciones de exportación
- **Temas** — indigo / ocean / violet × claro / oscuro, además de ajustes de densidad y radius
- **Paleta de comandos** (`⌘K` / `Ctrl+K`) — búsqueda sobre acciones rápidas, navegación, configuración, temas, plantillas recientes e inserción de bloques

## Promesa local-first

- **Sin cuentas, sin nube, sin telemetría** — nunca.
- **Todos los datos en tu disco:**

| Plataforma | Ubicación |
|---|---|
| macOS | `~/Library/Application Support/Simple Template/` |
| Windows | `%APPDATA%\Simple Template\` |
| Linux | `~/.config/Simple Template/` |

- **Plantillas y metadata** en SQLite (`better-sqlite3`); documentos individuales como JSON; imágenes en una carpeta por workspace servidas mediante `st-img://` (sin relajar `webSecurity`).
- **Secretos** (keys de IA, contraseñas SMTP, tokens OAuth) en el llavero del sistema — nunca en texto plano.
- **Portables** — exporta workspaces enteros como bundles `.st` cifrados cuando lo necesites.

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

Descarga el instalador para tu plataforma desde la [página de releases](https://github.com/jcocano/simple-template/releases):

| Plataforma | Descarga |
|---|---|
| macOS (Apple Silicon / Intel) | `.dmg` o `.zip` |
| Windows | `.exe` (instalador NSIS) |
| Linux | `.AppImage` o `.deb` |

> **Aviso — binarios sin firmar.** Simple Template es open source y todavía no incluye un Apple Developer ID de pago ni un certificado de code-signing de Windows. Los artefactos se compilan en CI desde el código público, pero tu sistema operativo te avisará la primera vez que los abras:
>
> - **macOS** — Gatekeeper indica *"no se puede abrir porque Apple no puede comprobar que no contenga software malicioso"*. Click derecho en la app → **Abrir** → confirmar. Desde Terminal: `xattr -d com.apple.quarantine "/Applications/Simple Template.app"`.
> - **Windows** — SmartScreen muestra *"Windows protegió tu PC"*. Click en **Más información** → **Ejecutar de todas formas**.
> - **Linux** — para el `.AppImage` debes marcarlo como ejecutable primero: `chmod +x SimpleTemplate-*.AppImage`. El `.deb` se instala normalmente con `apt install ./...deb`.
>
> Code-signing y notarización llegarán en una versión futura.

Si prefieres compilar los instaladores localmente:

```sh
npm run dist
```

Los binarios quedan en `release/` — `.dmg` / `.zip` para macOS, `.exe` para Windows, `.AppImage` / `.deb` para Linux.

## Úsala en tu día a día

### Atajos de teclado

| Atajo | Acción |
|---|---|
| `⌘K` / `Ctrl+K` | Paleta de comandos |
| `⌘S` / `Ctrl+S` | Guardar plantilla |
| `⌘D` / `Ctrl+D` | Duplicar bloque o sección seleccionado |
| `⌘P` / `Ctrl+P` | Abrir vista previa |
| `⌘⇧T` / `Ctrl+Shift+T` | Enviar email de prueba |
| `⌘⇧R` / `Ctrl+Shift+R` | Abrir revisión pre-envío |
| `⌘Z` / `⌘⇧Z` | Deshacer / rehacer |
| `Backspace` / `Delete` | Eliminar bloque o sección seleccionado |

### Conectar un agente de IA (quick start MCP)

1. Abre **Configuración → MCP**
2. Copia el snippet JSON de tu cliente — Claude Desktop y Cursor aparecen con la URL y el token pre-rellenados
3. Pégalo en:
   - Claude Desktop: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Cursor: `~/.cursor/mcp.json`
4. Reinicia el cliente MCP
5. Pídele al agente `list_templates` / `create_template` / `add_section` / etc. — observa el editor actualizarse en vivo

La app debe estar abierta para que el servidor MCP responda. Si cierras la app, la conexión se interrumpe (es así por diseño).

## Para personas desarrolladoras

### Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Vite + Electron en paralelo con live reload (puerto 5173) |
| `npm run dev:web` | Solo Vite — iterar el renderer en un navegador |
| `npm run dev:electron` | Electron apuntando a un servidor de desarrollo de Vite ya en ejecución |
| `npm run start` | Electron contra el `dist/index.html` estático |
| `npm run build:web` | Bundle de producción de Vite en `dist/` |
| `npm run pack` | Binario empaquetado `.app` / `.exe` / Linux sin instalador |
| `npm run dist` | Instaladores completos en `release/` (sin firmar en máquina local) |
| `npm run test:export` | Smoke test del pipeline de exportación contra los fixtures |
| `npm run build:icons` | Regenerar los íconos de la app desde `assets/icon.svg` |

### Arquitectura de un vistazo

- **Shell de Electron** con valores de seguridad estrictos (`contextIsolation: true`, `sandbox: true`, `nodeIntegration: false`, IPC solo a través de preload mediante `contextBridge`)
- **Renderer React 18** con una convención de **globals en `window`** — los archivos se cargan por side effects desde `src/main.tsx` y se registran en `window`. El orden en `src/main.tsx` importa; los archivos nuevos deben registrarse mediante `Object.assign(window, { Foo })`.
- **better-sqlite3** para metadata local + archivos JSON para los documentos de las plantillas
- **Vite** para el bundling, runtime JSX clásico (auto-inyectado)
- **Sin compilador de TypeScript** en el pipeline — `.tsx` es solo sintaxis JSX
- **Protocolo personalizado `st-img://`** para servir imágenes del workspace sin relajar `webSecurity`
- **MCP SDK** (`@modelcontextprotocol/sdk`) cargado mediante `await import()` dinámico desde el proceso principal (es un paquete ESM-only)
- **electron-builder** para empaquetado multiplataforma

### Dónde extender

| Área | Ruta |
|---|---|
| Lógica del renderer | `src/lib/` |
| Pantallas | `src/screens/` |
| Modales | `src/modals/` |
| Handlers IPC de Electron | `electron/ipc/` |
| Persistencia de datos | `electron/storage/` |
| Proveedores de IA | `electron/ai/` |
| Herramientas MCP | `electron/mcp/tools.js` |
| Diccionarios i18n | `src/lib/i18n/<lang>.tsx` |

Consulta [CONTRIBUTING.md](./CONTRIBUTING.md) para la guía completa de contribución — convenciones de commit, principios de arquitectura y checklist de PR.

### Pruebas

Estado prototipo — todavía no hay un test runner completo. El mínimo antes de abrir un PR:

1. Que `npm run test:export` pase (smoke test contra tres fixtures)
2. Ejecutar `npm run dev` y probar la funcionalidad manualmente
3. Si modificaste packaging o el proceso principal de Electron, ejecuta también `npm run pack` y abre la app empaquetada

## Apoya el proyecto

Simple Template es gratis y open-source. Si te resulta útil, cualquiera de estas opciones ayuda:

- **[Estrella en el repo](https://github.com/jcocano/simple-template)** para que más personas lo encuentren
- **[Reporta un bug](https://github.com/jcocano/simple-template/issues/new?template=bug_report.yml)** si algo está roto
- **[Pide una funcionalidad](https://github.com/jcocano/simple-template/issues/new?template=feature_request.yml)** que quieras ver
- **[Ayuda con traducciones](https://github.com/jcocano/simple-template/issues/new?template=translation.yml)** — typos, mejor copy o un idioma nuevo
- **[Abre un pull request](./CONTRIBUTING.md)** — consulta la guía de contribución para el setup de desarrollo
- **[Únete a las discusiones](https://github.com/jcocano/simple-template/discussions)** para preguntas, ideas y show-and-tell
- **[Invítame un café](https://buymeacoffee.com/jesuscocana)** si quieres apoyar el desarrollo

## Comunidad

- **[Discussions](https://github.com/jcocano/simple-template/discussions)** — preguntas, ideas, show-and-tell
- **[Issues](https://github.com/jcocano/simple-template/issues)** — bugs, funcionalidades, traducciones
- **[Releases](https://github.com/jcocano/simple-template/releases)** — historial de versiones

Lee el [Código de Conducta](./CODE_OF_CONDUCT.md) antes de participar.

## Seguridad

¿Encontraste una vulnerabilidad? Por favor **no** abras un issue público. Consulta [SECURITY.md](./SECURITY.md) para conocer el proceso de divulgación responsable.

## Licencia

[MIT](../../LICENSE) © Jesus Cocaño.

Si Simple Template te ahorra tiempo, considera [invitarme un café](https://buymeacoffee.com/jesuscocana) — ayuda a que el proyecto siga avanzando.
