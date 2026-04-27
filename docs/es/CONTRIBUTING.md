# Cómo contribuir a Simple Template

Gracias por tomarte el tiempo de contribuir. Toda forma de ayuda — reportar un bug, sugerir una funcionalidad, corregir un typo, traducir un string o escribir código — mejora el proyecto.

**Idiomas:** [English](../../CONTRIBUTING.md) · [Español](./CONTRIBUTING.md)

> **¿No estás listo para escribir código?** Una [estrella en GitHub](https://github.com/jcocano/simple-template) o un [café](https://buymeacoffee.com/jesuscocana) también ayudan mucho.

## Índice

- [Código de Conducta](#c%C3%B3digo-de-conducta)
- [Formas de contribuir](#formas-de-contribuir)
- [Reportar bugs](#reportar-bugs)
- [Sugerir funcionalidades](#sugerir-funcionalidades)
- [Ayudar con traducciones](#ayudar-con-traducciones)
- [Configuración de desarrollo](#configuraci%C3%B3n-de-desarrollo)
- [Arquitectura del proyecto](#arquitectura-del-proyecto)
- [Convenciones de código](#convenciones-de-c%C3%B3digo)
- [Mensajes de commit](#mensajes-de-commit)
- [Proceso de pull request](#proceso-de-pull-request)
- [Seguridad](#seguridad)
- [Comunidad](#comunidad)

## Código de Conducta

Este proyecto sigue el [Contributor Covenant](./CODE_OF_CONDUCT.md). Al participar aceptas respetarlo. Reporta comportamientos inaceptables a `jesus.cocano@gmail.com`.

## Formas de contribuir

- **Dale una estrella al repo** — bajo esfuerzo, muy útil para que el proyecto sea encontrado
- **Reporta un bug** — usa el [template de bug report](https://github.com/jcocano/simple-template/issues/new?template=bug_report.yml)
- **Sugiere una funcionalidad** — usa el [template de feature request](https://github.com/jcocano/simple-template/issues/new?template=feature_request.yml)
- **Ayuda con traducciones** — usa el [template de traducción](https://github.com/jcocano/simple-template/issues/new?template=translation.yml)
- **Mejora la documentación** — typos, aclaraciones, ejemplos, todo es bienvenido
- **Envía un pull request** — consulta [Proceso de pull request](#proceso-de-pull-request) más abajo
- **Únete a las discusiones** — [GitHub Discussions](https://github.com/jcocano/simple-template/discussions) para preguntas, ideas y show-and-tell
- **[Invítame un café](https://buymeacoffee.com/jesuscocana)** — apoya el desarrollo

## Reportar bugs

Antes de abrir un issue:

1. Busca en los [issues existentes](https://github.com/jcocano/simple-template/issues) para evitar duplicados.
2. Intenta reproducirlo en la rama `main`.
3. Reúne: SO + versión, versión de la app, pasos para reproducir, comportamiento esperado vs. real, capturas de pantalla o logs si aplica.

Después abre el [template de bug report](https://github.com/jcocano/simple-template/issues/new?template=bug_report.yml).

Para issues de seguridad, consulta [SECURITY.md](./SECURITY.md) — por favor **no** abras un issue público.

## Sugerir funcionalidades

Abre el [template de feature request](https://github.com/jcocano/simple-template/issues/new?template=feature_request.yml) con:

- El problema que quieres resolver (no la solución primero)
- A quién afecta
- Alternativas que consideraste
- Si encaja con el alcance local-first sin backend del proyecto

Las funcionalidades que requieren backend o infraestructura de cuentas (listas de contactos, tracking de envíos, CDN hosteado) están fuera del alcance del core. Eso no significa "no" para siempre — pero sí que el tradeoff se discutirá con cuidado.

## Ayudar con traducciones

Simple Template está disponible en seis idiomas:

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

1. Abre `src/lib/i18n/<lang>.tsx`
2. Busca la clave que quieres mejorar
3. Edita el string preservando los placeholders de interpolación (por ejemplo `{name}`, `{n}`)
4. Envía un PR con el prefijo de commit `i18n(<lang>): …`

### Para agregar un idioma nuevo

1. Primero abre un [issue de traducción](https://github.com/jcocano/simple-template/issues/new?template=translation.yml) para coordinar
2. Copia `src/lib/i18n/en.tsx` como punto de partida (inglés es la referencia no-fuente más completa)
3. Traduce todas las claves; deja los placeholders intactos
4. Registra el idioma nuevo en el loader de i18n
5. Envía un PR con el prefijo de commit `i18n(<nuevo-lang>): add <Idioma> translation`

¿Falta contexto para un string? Abre un issue — te lo aclaramos.

## Configuración de desarrollo

### Requisitos

- **Node.js 20+**
- **npm** (incluido con Node)
- Un toolchain de C funcionando (para `better-sqlite3`):
  - **macOS:** Xcode Command Line Tools (`xcode-select --install`)
  - **Linux (Debian/Ubuntu):** `sudo apt install build-essential python3`
  - **Windows:** Visual Studio Build Tools con el workload "Desktop development with C++"

### Clonar y ejecutar

```sh
git clone https://github.com/jcocano/simple-template.git
cd simple-template
npm install
npm run dev
```

`npm install` ejecuta un paso de postinstall que recompila `better-sqlite3` para el ABI de Electron. Si falla, ejecuta `npm run postinstall` manualmente.

### Scripts útiles

| Script | Descripción |
|---|---|
| `npm run dev` | Vite (renderer) + Electron (shell) con live reload |
| `npm run dev:web` | Solo Vite, para iterar el renderer en un navegador |
| `npm run dev:electron` | Electron contra un servidor de desarrollo de Vite ya en ejecución |
| `npm run build:web` | Bundle de producción de Vite en `dist/` |
| `npm run pack` | `.app` / `.exe` / Linux sin empaquetar (sin instalador) |
| `npm run dist` | Instaladores completos en `release/` (sin firmar en máquina local) |
| `npm run test:export` | Smoke test del pipeline de exportación |

### Probar tus cambios

No hay un test runner completo configurado (consulta [Arquitectura del proyecto](#arquitectura-del-proyecto)). Antes de abrir un PR:

1. Ejecuta `npm run test:export` — valida el pipeline de exportación contra tres fixtures.
2. Ejecuta `npm run dev` y prueba la funcionalidad manualmente.
3. Si modificaste packaging o Electron, ejecuta `npm run pack` y abre la app empaquetada.

## Arquitectura del proyecto

En resumen:

- **El renderer no es una app ES-module estándar.** Los archivos en `src/` se cargan en un orden específico desde `src/main.tsx` y registran sus exports en `window`. El orden importa — registra los módulos nuevos correctamente.
- **Principios de arquitectura (no negociables para código nuevo):**
  - Single Responsibility — una función hace una sola cosa
  - Desacoplamiento visual / lógica — `.tsx` es presentación; la lógica vive en `src/lib/`
  - Modular por funcionalidad
  - DRY con regla de tres (sin abstracción antes de tres repeticiones)
  - Persistencia en SQLite (`localStorage` es estado legacy de prototipo)
  - Multiplataforma: Windows, macOS, Linux
- **Postura de seguridad:** `contextIsolation: true`, `sandbox: true`, `nodeIntegration: false`, IPC solo a través de preload mediante `contextBridge`.
- **Protocolo personalizado `st-img://`** para servir imágenes del workspace sin relajar `webSecurity`.

## Convenciones de código

- **Solo JavaScript/JSX** — no hay compilador de TypeScript configurado. `.tsx` es una conveniencia de sintaxis JSX.
- **Sin import implícito de React** — `vite.config.js` auto-inyecta `import React from 'react'` en build time. Usa `React.useState`, `React.useEffect`, etc.
- **Globals en `window`** — registra los componentes nuevos mediante `Object.assign(window, { Foo })` y agrégalos a `src/main.tsx` en la posición correcta.
- **Español para el copy del usuario** — el idioma por defecto es español; las traducciones viven en `src/lib/i18n/<lang>.tsx`.
- **`localStorage` con namespace `mc:*`** (legacy) o `st:*` (actual). Prefiere SQLite para cualquier cosa más allá de estado de UI trivial.
- **Sin emojis en archivos versionados** salvo que cumplan una función de UX en la interfaz de la app.

## Mensajes de commit

Sigue [Conventional Commits](https://www.conventionalcommits.org/) con estos scopes:

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

Mantén los commits enfocados. No mezcles una funcionalidad con un refactor no relacionado.

**No incluyas líneas `Co-Authored-By`** — los commits deben estar autorados únicamente por la persona que contribuye.

## Proceso de pull request

1. Haz un fork del repo y crea una rama desde `main`:
   ```sh
   git checkout -b feat/tu-feature
   ```
2. Realiza tus cambios. Mantén los diffs pequeños y enfocados.
3. Ejecuta `npm run test:export` y los smoke tests manuales relevantes a tu cambio.
4. Haz push de tu rama y abre un PR contra `main`.
5. Completa el template de PR — describe qué, por qué y cómo lo probaste.
6. Vincula los issues relacionados con `Closes #123` o `Refs #123`.
7. Ten paciencia: el proyecto lo mantiene una sola persona; el feedback puede tardar unos días.
8. Atiende los comentarios de revisión como commits nuevos (no fuerces el push durante la revisión — al final puedes hacer squash).

**PRs que se cerrarán rápido (lo siento):**

- Reformatear todo el codebase para ajustarlo a una preferencia de estilo personal
- Agregar backends, cuentas o telemetría sin discusión previa
- Refactors grandes sin un issue adjunto que explique la motivación
- Agregar dependencias para funcionalidades que son one-liners

## Seguridad

Por favor reporta vulnerabilidades de forma privada. Consulta [SECURITY.md](./SECURITY.md).

## Comunidad

- [GitHub Discussions](https://github.com/jcocano/simple-template/discussions) — preguntas, ideas, show-and-tell
- [Issues](https://github.com/jcocano/simple-template/issues) — bugs, funcionalidades, traducciones

Gracias por contribuir. Si el proyecto te resulta útil, considera [darle una estrella al repo](https://github.com/jcocano/simple-template) o [invitarme un café](https://buymeacoffee.com/jesuscocana).
