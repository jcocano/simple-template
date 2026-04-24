# Cómo contribuir a Simple Template

Gracias por tomarte el tiempo de contribuir. Toda forma de ayuda — reportar un bug, sugerir una feature, corregir un typo, traducir un string, escribir código — mejora el proyecto.

**Idiomas:** [English](../../CONTRIBUTING.md) · [Español](./CONTRIBUTING.md)

> **¿No estás listo para escribir código?** Una [estrella en GitHub](https://github.com/jcocano/simple-templete) o un [café](https://buymeacoffee.com/jesuscocana) también ayudan un montón.

## Índice

- [Código de Conducta](#c%C3%B3digo-de-conducta)
- [Formas de contribuir](#formas-de-contribuir)
- [Reportar bugs](#reportar-bugs)
- [Sugerir features](#sugerir-features)
- [Ayudar con traducciones](#ayudar-con-traducciones)
- [Setup de desarrollo](#setup-de-desarrollo)
- [Arquitectura del proyecto](#arquitectura-del-proyecto)
- [Convenciones de código](#convenciones-de-c%C3%B3digo)
- [Mensajes de commit](#mensajes-de-commit)
- [Proceso de pull request](#proceso-de-pull-request)
- [Seguridad](#seguridad)
- [Comunidad](#comunidad)

## Código de Conducta

Este proyecto sigue el [Contributor Covenant](./CODE_OF_CONDUCT.md). Al participar aceptás respetarlo. Reportá comportamientos inaceptables a `jesus.cocano@gmail.com`.

## Formas de contribuir

- **Ponele una estrella al repo** — bajo esfuerzo, muy útil para que el proyecto sea encontrado
- **Reportá un bug** — usá el [template de bug report](https://github.com/jcocano/simple-templete/issues/new?template=bug_report.yml)
- **Sugerí una feature** — usá el [template de feature request](https://github.com/jcocano/simple-templete/issues/new?template=feature_request.yml)
- **Ayudá con traducciones** — usá el [template de traducción](https://github.com/jcocano/simple-templete/issues/new?template=translation.yml)
- **Mejorá la documentación** — typos, aclaraciones, ejemplos, todo bienvenido
- **Mandá un pull request** — mirá [Proceso de pull request](#proceso-de-pull-request) más abajo
- **Sumate a las discusiones** — [GitHub Discussions](https://github.com/jcocano/simple-templete/discussions) para preguntas, ideas, show-and-tell
- **[Invitame un café](https://buymeacoffee.com/jesuscocana)** — banca el desarrollo

## Reportar bugs

Antes de abrir un issue, por favor:

1. Buscá en los [issues existentes](https://github.com/jcocano/simple-templete/issues) para evitar duplicados.
2. Probá reproducirlo en la rama `main`.
3. Juntá: SO + versión, versión de la app, pasos para reproducir, comportamiento esperado vs real, screenshots/logs si aplica.

Después abrí el [template de bug report](https://github.com/jcocano/simple-templete/issues/new?template=bug_report.yml).

Para issues de seguridad, mirá [SECURITY.md](./SECURITY.md) — por favor **no** abras un issue público.

## Sugerir features

Abrí el [template de feature request](https://github.com/jcocano/simple-templete/issues/new?template=feature_request.yml) con:

- El problema que querés resolver (no la solución primero)
- A quién afecta
- Alternativas que consideraste
- Si encaja con el scope local-first sin backend del proyecto

Features que requieran backend o infraestructura de cuentas (listas de contactos, tracking de envíos, CDN hosteado) están fuera del scope del core. Eso no significa "no" para siempre — pero sí que vamos a discutir el tradeoff con cuidado.

## Ayudar con traducciones

Simple Template viene en seis idiomas:

| Código | Idioma | Estado |
|--------|--------|--------|
| `es` | Español | Idioma fuente |
| `en` | Inglés | Completo |
| `pt` | Portugués (BR) | Completo |
| `fr` | Francés | Completo |
| `ja` | Japonés | Completo |
| `zh` | Chino (Simplificado) | Completo |

Las traducciones viven en `src/lib/i18n/<lang>.tsx`. Cada archivo es un objeto plano con claves de string.

### Para corregir o mejorar una traducción existente

1. Abrí `src/lib/i18n/<lang>.tsx`
2. Buscá la clave que querés mejorar
3. Editá el string, preservando los placeholders de interpolación (ej: `{name}`, `{n}`)
4. Mandá un PR con prefijo de commit `i18n(<lang>): …`

### Para agregar un idioma nuevo

1. Primero abrí un [issue de traducción](https://github.com/jcocano/simple-templete/issues/new?template=translation.yml) así coordinamos
2. Copiá `src/lib/i18n/en.tsx` como punto de partida (inglés es la referencia no-fuente más completa)
3. Traducí todas las claves — dejá los placeholders intactos
4. Registrá el idioma nuevo en el loader de i18n
5. Mandá un PR con prefijo de commit `i18n(<nuevo-lang>): add <Idioma> translation`

¿Falta contexto para un string? Abrí un issue — te aclaramos.

## Setup de desarrollo

### Requisitos

- **Node.js 20+**
- **npm** (viene con Node)
- Un toolchain de C funcionando (para `better-sqlite3`):
  - **macOS:** Xcode Command Line Tools (`xcode-select --install`)
  - **Linux (Debian/Ubuntu):** `sudo apt install build-essential python3`
  - **Windows:** Visual Studio Build Tools con el workload "Desktop development with C++"

### Clonar y correr

```sh
git clone https://github.com/jcocano/simple-templete.git
cd simple-templete
npm install
npm run dev
```

`npm install` dispara un paso de postinstall que rebuildea `better-sqlite3` para el ABI de Electron. Si falla, corré `npm run postinstall` manualmente.

### Scripts útiles

| Script | Descripción |
|---|---|
| `npm run dev` | Vite (renderer) + Electron (shell) con live reload |
| `npm run dev:web` | Sólo Vite, para iterar el renderer en un navegador |
| `npm run dev:electron` | Electron contra un Vite dev server ya corriendo |
| `npm run build:web` | Bundle de producción de Vite en `dist/` |
| `npm run pack` | `.app` / `.exe` / Linux sin empaquetar (sin instalador) |
| `npm run dist` | Instaladores completos en `release/` (sin firmar en máquina local) |
| `npm run test:export` | Smoke test del pipeline de export |

### Probar tus cambios

No hay un test runner completo configurado (ver [Arquitectura del proyecto](#arquitectura-del-proyecto)). Antes de abrir un PR:

1. Corré `npm run test:export` — valida el pipeline de export contra tres fixtures.
2. Corré `npm run dev` y ejercitá la feature manualmente.
3. Si tocaste packaging/Electron, corré `npm run pack` y abrí la app empaquetada.

## Arquitectura del proyecto

Para el contexto completo, mirá [CLAUDE.md](../../CLAUDE.md). En resumen:

- **El renderer no es una app ES-module estándar.** Los archivos en `src/` cargan en un orden específico desde `src/main.tsx` y adjuntan sus exports a `window`. El orden importa — registrá módulos nuevos correctamente.
- **Principios de arquitectura (no negociables para código nuevo):**
  - Single Responsibility — una función hace una cosa
  - Desacoplamiento visual / lógica — `.tsx` es presentación; la lógica vive en `src/lib/`
  - Modular por feature
  - DRY con regla de tres (sin abstracción antes de tres repeticiones)
  - Persistencia en SQLite (`localStorage` es estado legacy de prototipo)
  - Cross-platform: Windows, macOS, Linux
- **Postura de seguridad:** `contextIsolation: true`, `sandbox: true`, `nodeIntegration: false`, IPC sólo por preload vía `contextBridge`.
- **Protocolo custom `st-img://`** para servir imágenes del workspace sin relajar `webSecurity`.

## Convenciones de código

- **Sólo JavaScript/JSX** — no hay compilador de TypeScript configurado. `.tsx` es una conveniencia JSX.
- **Sin import implícito de React** — `vite.config.js` auto-inyecta `import React from 'react'` en build time. Usá `React.useState`, `React.useEffect`, etc.
- **Globals en `window`** — registrá componentes nuevos vía `Object.assign(window, { Foo })` y agregalos a `src/main.tsx` en la posición correcta.
- **Español para copy del usuario** — el idioma default es español; traducciones viven en `src/lib/i18n/<lang>.tsx`.
- **`localStorage` con namespace `mc:*`** (legacy) o `st:*` (actual). Preferí SQLite para cualquier cosa más allá de estado UI trivial.
- **Sin emojis en archivos commiteados** salvo que cumplan una función de UX en la UI de la app.

## Mensajes de commit

Seguí [Conventional Commits](https://www.conventionalcommits.org/) con estos scopes:

```
<tipo>(<scope>): <resumen corto>

[cuerpo opcional]
```

**Tipos:** `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `i18n`.

**Scopes comunes:** `editor`, `export`, `review`, `settings`, `electron`, `release`, `i18n(<lang>)`.

**Ejemplos:**

```
feat(editor): add multi-select for blocks
fix(export): escape HTML entities in plaintext output
i18n(pt): translate review panel strings
chore(release): wire electron-builder for macOS signing
```

Mantené los commits enfocados. No mezcles una feature con un refactor no relacionado.

**No incluyas líneas `Co-Authored-By`** — los commits deben estar autorados únicamente por el contributor.

## Proceso de pull request

1. Forkeá el repo y creá un branch desde `main`:
   ```sh
   git checkout -b feat/tu-feature
   ```
2. Hacé tus cambios. Mantené los diffs chicos y enfocados.
3. Corré `npm run test:export` y los smoke tests manuales relevantes a tu cambio.
4. Pusheá tu branch y abrí un PR contra `main`.
5. Completá el template de PR — describí qué, por qué, y cómo lo probaste.
6. Linkeá issues relacionados con `Closes #123` o `Refs #123`.
7. Tené paciencia: el proyecto lo mantiene una sola persona; el feedback puede tardar unos días.
8. Atendé los comentarios de review como commits nuevos (no fuerces el push durante la review — al final podés squashear).

**PRs que se van a cerrar rápido (lo siento):**

- Reformatear todo el codebase para matchear una preferencia de estilo personal
- Agregar backends, cuentas o telemetría sin discusión previa
- Refactors grandes sin un issue adjunto explicando la motivación
- Agregar dependencias para features que son one-liners

## Seguridad

Por favor reportá vulnerabilidades de forma privada. Mirá [SECURITY.md](./SECURITY.md).

## Comunidad

- [GitHub Discussions](https://github.com/jcocano/simple-templete/discussions) — preguntas, ideas, show-and-tell
- [Issues](https://github.com/jcocano/simple-templete/issues) — bugs, features, traducciones

Gracias por contribuir. Si el proyecto te sirve, pensá en [ponerle una estrella al repo](https://github.com/jcocano/simple-templete) o [invitarme un café](https://buymeacoffee.com/jesuscocana).
