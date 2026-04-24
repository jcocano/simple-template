# Simple Template

> Éditeur de modèles d'e-mails open-source et local-first pour macOS, Windows et Linux — une alternative no-code à Beefree qui fonctionne entièrement sur votre machine et que les agents IA peuvent piloter de bout en bout.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](../../LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/jcocano/simple-templete?style=social)](https://github.com/jcocano/simple-templete/stargazers)
[![GitHub issues](https://img.shields.io/github/issues/jcocano/simple-templete)](https://github.com/jcocano/simple-templete/issues)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](../../CONTRIBUTING.md)
[![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey.svg)](#installation)

**Langues :** [English](../../README.md) · [Español](../es/README.md) · [Português](../pt/README.md) · [Français](./README.md) · [日本語](../ja/README.md) · [简体中文](../zh/README.md)

---

Simple Template est une application de bureau pour toutes les personnes qui ont besoin de livrer des campagnes e-mail soignées et responsives sans toucher au HTML. Les modèles vivent sur votre disque — pas de comptes, pas de cloud, pas de tracking — et vous pouvez confier le clavier à un agent IA à tout moment via un serveur MCP intégré.

> **Le projet vous plaît ?** Une [étoile GitHub](https://github.com/jcocano/simple-templete) est le moyen le plus simple de l'aider à grandir.

## À qui ça s'adresse

- **Marketeurs, fondateurs, créateurs** qui veulent concevoir des e-mails visuellement sans passer par l'éditeur fermé d'une plateforme de mailing
- **Petites équipes** qui ont besoin de partager et d'itérer sur des modèles sans compte cloud
- **Utilisateurs soucieux de leur vie privée** qui refusent de déposer des brouillons sur les serveurs de quelqu'un d'autre
- **Utilisateurs avancés d'IA** sur Claude Desktop / Cursor / autres clients MCP qui veulent un vrai éditeur que leur agent peut piloter — pas plus de HTML généré

## Ce qui le rend spécial

- **Local-first par conception.** Vos modèles, images, blocs enregistrés, clés API et paramètres restent sur votre machine. Pas de comptes, pas de télémétrie, pas de synchronisation cloud.
- **Éditeur visuel par blocs.** Modèle section → colonne → bloc, ~20 types de blocs, aperçu responsive en direct, undo / redo, sauvegarde automatique.
- **IA intégrée.** Améliorez le texte de n'importe quel bloc ou générez des modèles complets avec Anthropic, OpenAI, Google, Ollama ou OpenRouter. Les clés API sont chiffrées dans le trousseau de votre OS.
- **Pilotable par agent (serveur MCP).** Les agents IA externes peuvent créer et éditer des modèles via 28 outils typés — zéro risque de HTML halluciné puisque l'agent utilise les mêmes actions que vous dans l'UI.
- **Partage privé.** Bundles `.st` en un clic via des liens profonds `simpletemplete://`, PIN optionnel.
- **Tests d'envoi réels.** Envoi de test SMTP + OAuth (Gmail / Outlook) intégré.
- **Exportez partout.** HTML / MJML / texte brut / ZIP. Les `{{variables}}` sont conservées comme littéraux pour que Mailchimp, Sendgrid, Brevo, Klaviyo les interprètent au moment de l'envoi.
- **Revue pré-envoi.** 7 catégories de vérifications (contenu, accessibilité, compatibilité, images, liens, variables, mentions légales) avant l'export.
- **Six langues.** Anglais, espagnol, portugais, français, japonais, chinois simplifié. Basculement en direct, sans rechargement.

## Ce que vous pouvez faire

### Concevoir des e-mails visuellement

Un document basé sur des sections (`sections → columns → blocks`) avec des mises en page `1col / 2col / 3col` et une vingtaine de types de blocs : `text`, `heading`, `hero`, `image`, `icon`, `button`, `divider`, `spacer`, `header`, `footer`, `product`, `social`, plus des types avancés (`video`, `GIF`, `countdown`, `QR`, `map`, `accordion`, `table`, HTML personnalisé et plus encore).

- Glisser-déposer depuis la palette de blocs, réorganisation des sections/blocs par glissement
- Contrôles de style par bloc : police, taille, graisse, couleur, alignement, padding, bordures, radius, arrière-plan
- **Surcharges mobile-only** : masquer un bloc sur mobile, taille de police différente, padding différent
- Bascule d'aperçu par appareil (desktop 600px / mobile 320px)
- Undo / redo, sauvegarde automatique toutes les ~30s, duplication / suppression depuis le clavier

### Réutiliser du contenu entre les modèles

- **Bibliothèque de blocs enregistrés** — enregistrez n'importe quelle section comme bloc réutilisable. Glissez depuis le panneau de bibliothèque vers n'importe quel modèle. Organisez par catégories (headers, footers, CTAs, témoignages, produits, réseaux sociaux, signatures, personnalisées, ou toute catégorie créée par glisser-déposer).
- **Bibliothèque d'images** par workspace — glissez-déposez des images, organisez-les en dossiers. Les images sont servies via un protocole personnalisé `st-img://` afin que rien ne soit téléversé nulle part.
- **Occasions (dossiers)** — regroupez les modèles par campagne ou par objectif avec une palette de couleurs.

### Peaufiner avec l'IA ✨

Branchez l'un des cinq fournisseurs et commencez à itérer :

| Fournisseur | Modèle par défaut |
|---|---|
| Anthropic | `claude-sonnet-4-5` |
| OpenAI | `gpt-4.1` |
| Google | `gemini-2.5-flash` |
| Ollama | local, sans clé API |
| OpenRouter | une seule clé API, de nombreux modèles |

- **Améliorer le texte de n'importe quel bloc** — choisissez un ton, obtenez trois variantes, appliquez celle que vous préférez
- **Générer un modèle complet à partir d'un prompt** — décrivez l'e-mail, récupérez une structure multi-sections valide
- Panneau de configuration par fournisseur avec les étapes précises pour obtenir une clé API
- Clés chiffrées dans le trousseau de votre OS (macOS Keychain, Windows Credential Manager, ou chiffrées au niveau fichier sur Linux)

### Laisser les agents IA piloter l'application (serveur MCP) 🤖

Simple Template embarque un serveur **Model Context Protocol**. Tout client compatible MCP (Claude Desktop, Cursor, Zed, etc.) peut se connecter et piloter l'application via 28 outils typés :

- **Modèles** — lister, lire, créer, dupliquer, renommer, mettre à la corbeille / restaurer / purger, mises à jour d'attributs
- **Structure** — ajouter / mettre à jour / supprimer / déplacer sections et blocs de manière incrémentale
- **Bibliothèque** — insérer des blocs enregistrés, enregistrer des sections comme blocs enregistrés, lister les images
- **Métadonnées** — définir l'objet, le texte de prévisualisation, from-name / from-email, les variables
- **Navigation** — `open_template` fait sauter l'agent vers l'éditeur pour que vous voyiez les changements en direct

**Pourquoi c'est mieux que « demande à l'IA d'écrire mon HTML » :**

- **Zéro HTML halluciné.** Chaque outil prend des paramètres structurés avec des schémas Zod stricts. Les agents ne peuvent pas inventer de champs ni cracher du balisage imaginaire — ils ne peuvent utiliser que les mêmes actions que vous dans l'UI.
- **Vous le voyez arriver.** Quand un agent édite, l'éditeur affiche un indicateur pulsant et un bouton « Reprendre le contrôle ». Les mutations de l'agent apparaissent en direct.
- **Configuration en un clic.** Paramètres → MCP propose des snippets JSON pré-interpolés pour Claude Desktop (`claude_desktop_config.json`) et Cursor (`~/.cursor/mcp.json`) — collez et redémarrez votre client.
- **Local et sécurisé.** Le serveur n'écoute que sur `127.0.0.1`, authentification par token Bearer, se termine à la fermeture de l'application.

### Partager les modèles en privé

- Exportez n'importe quel modèle en tant que bundle `.st` chiffré
- Partagez via un lien profond `simpletemplete://` — le destinataire clique, l'application s'ouvre, le bundle atterrit dans son workspace
- PIN optionnel pour un partage privé (le destinataire saisit le PIN avant l'import)
- Aucun compte ni serveur intermédiaire nécessaire

### Envoyer de vrais e-mails de test

- **SMTP** — Gmail, Outlook, Yahoo, iCloud, SendGrid, Mailgun, ou n'importe quel hôte SMTP
- **OAuth** — Gmail et Microsoft Outlook avec des flux en un clic (pas de mots de passe d'application)
- Objet préfixé par `[TEST]` / `[PRUEBA]` dans la langue de votre interface
- Variables substituées avec les valeurs `.sample` pour l'envoi de test

### Exporter vers n'importe quelle plateforme de mailing

| Format | Cas d'usage |
|---|---|
| **HTML** | Compatible e-mail, basé sur des tables, CSS en ligne, compatible Outlook |
| **MJML** | Source MJML éditable pour les workflows MJML |
| **Texte brut** | Extrait des blocs pour le fallback multipart |
| **ZIP** | HTML + texte brut + images regroupés |

Les `{{variables}}` sont **conservées comme littéraux** à l'export, afin que Mailchimp / Sendgrid / Brevo / Klaviyo / toute plateforme que vous utilisez puisse les interpréter au moment de l'envoi avec son propre moteur de templating.

### Livrer en toute confiance grâce à la revue pré-envoi

Appuyez sur `⌘⇧R` avant d'exporter. Le panneau de revue lance des vérifications dans sept catégories :

- **Contenu** — blocs vides, boutons sans lien, texte de prévisualisation manquant, URL suspectes
- **Variables** — variables inutilisées, références à des variables non définies
- **Accessibilité** — texte alternatif sur les images, hiérarchie des titres
- **Compatibilité** — avertissements Outlook, bizarreries connues des clients
- **Images** — images cassées ou manquantes (vérification HEAD async), fichiers trop volumineux
- **Liens** — URL inaccessibles ou mal formées
- **Mentions légales** — lien de désabonnement, adresse dans le pied de page, conformité CAN-SPAM

Chaque problème dispose d'une action de correction directe lorsque c'est possible (*Aller aux paramètres d'envoi*, *Ajouter un lien de désabonnement*, etc.).

### Organiser votre travail

- **Plusieurs workspaces** avec des données totalement isolées (modèles, images, blocs enregistrés, branding, variables, clés IA)
- **Paramètres par workspace** — branding (polices, texte de pied de page, adresse), envoi (SMTP/OAuth), fournisseur IA, langue, variables, options d'export
- **Thèmes** — indigo / ocean / violet × clair / sombre, plus réglages de densité et de radius
- **Palette de commandes** (`⌘K` / `Ctrl+K`) — recherchable parmi les actions rapides, la navigation, les paramètres, les thèmes, les modèles récents et l'insertion de blocs

## Promesse local-first

- **Pas de comptes, pas de cloud, pas de télémétrie** — jamais.
- **Toutes les données sur votre disque :**

| Plateforme | Emplacement |
|---|---|
| macOS | `~/Library/Application Support/Simple Template/` |
| Windows | `%APPDATA%\Simple Template\` |
| Linux | `~/.config/Simple Template/` |

- **Modèles + métadonnées** dans SQLite (`better-sqlite3`), documents de modèle individuels en JSON, images dans un dossier par workspace servies via `st-img://` (pas d'assouplissement de `webSecurity`).
- **Secrets** (clés IA, mots de passe SMTP, tokens OAuth) stockés dans le trousseau de votre OS — pas en clair.
- **Portable** — exportez des workspaces complets en tant que bundles `.st` chiffrés à tout moment.

## Installation

### Depuis les sources

```sh
git clone https://github.com/jcocano/simple-templete.git
cd simple-templete
npm install
npm run dev
```

Prérequis :
- **Node.js 20+**
- **Une chaîne d'outils C** pour `better-sqlite3` :
  - macOS : `xcode-select --install`
  - Debian/Ubuntu : `sudo apt install build-essential python3`
  - Windows : [Visual Studio Build Tools](https://visualstudio.microsoft.com/downloads/) avec « Desktop development with C++ »

### Binaires pré-compilés

Pas encore distribués — la version v0.1.0 est en attente de signature de code et de CI/CD. [Mettez une étoile au dépôt](https://github.com/jcocano/simple-templete) ou [suivez les releases](https://github.com/jcocano/simple-templete/releases) pour être notifié.

En attendant, vous pouvez compiler les installateurs localement :

```sh
npm run dist
```

Les binaires atterrissent dans `release/` — `.dmg` / `.zip` pour macOS, `.exe` pour Windows, `.AppImage` / `.deb` pour Linux.

## Au quotidien

### Raccourcis clavier

| Raccourci | Action |
|---|---|
| `⌘K` / `Ctrl+K` | Palette de commandes |
| `⌘S` / `Ctrl+S` | Enregistrer le modèle |
| `⌘D` / `Ctrl+D` | Dupliquer le bloc ou la section sélectionnés |
| `⌘P` / `Ctrl+P` | Ouvrir l'aperçu |
| `⌘⇧T` / `Ctrl+Shift+T` | Envoyer un e-mail de test |
| `⌘⇧R` / `Ctrl+Shift+R` | Ouvrir la revue pré-envoi |
| `⌘Z` / `⌘⇧Z` | Annuler / rétablir |
| `Backspace` / `Delete` | Supprimer le bloc ou la section sélectionnés |

### Connecter un agent IA (démarrage rapide MCP)

1. Ouvrez **Paramètres → MCP**
2. Copiez le snippet JSON pour votre client — Claude Desktop et Cursor sont affichés avec l'URL et le token pré-interpolés
3. Collez dans :
   - Claude Desktop : `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Cursor : `~/.cursor/mcp.json`
4. Redémarrez le client MCP
5. Demandez à l'agent de `list_templates` / `create_template` / `add_section` / etc. — regardez l'éditeur se mettre à jour en direct

L'application doit être en cours d'exécution pour que le serveur MCP réponde. Si vous fermez l'application → la connexion tombe (par conception).

## Pour les développeurs

### Scripts

| Commande | Description |
|---|---|
| `npm run dev` | Vite + Electron en parallèle avec live reload (port 5173) |
| `npm run dev:web` | Vite uniquement — itérez sur le renderer dans un navigateur |
| `npm run dev:electron` | Electron contre un serveur de dev Vite déjà lancé |
| `npm run start` | Electron contre le `dist/index.html` statique |
| `npm run build:web` | Bundle Vite de production dans `dist/` |
| `npm run pack` | `.app` / `.exe` empaquetés / Linux non empaqueté — sans installateur |
| `npm run dist` | Installateurs complets dans `release/` (non signés sur une machine de dev) |
| `npm run test:export` | Smoke test du pipeline d'export sur des fixtures |
| `npm run build:icons` | Régénère les icônes de l'application à partir de `assets/icon.svg` |

### Architecture en un coup d'œil

- **Shell Electron** avec des défauts de sécurité stricts (`contextIsolation: true`, `sandbox: true`, `nodeIntegration: false`, IPC uniquement via preload avec `contextBridge`)
- **Renderer React 18** avec une convention de modules **globals-on-`window`** — les fichiers sont chargés pour leurs effets de bord depuis `src/main.tsx` et s'enregistrent sur `window`. Voir [CLAUDE.md](../../CLAUDE.md) pour la justification complète.
- **better-sqlite3** pour les métadonnées locales + fichiers JSON pour les documents de modèle
- **Vite** pour le bundling, runtime JSX classique (auto-injection)
- **Pas de compilateur TypeScript** dans le pipeline — `.tsx` n'est que de la syntaxe JSX
- **Protocole personnalisé `st-img://`** pour servir les images de workspace sans assouplir `webSecurity`
- **MCP SDK** (`@modelcontextprotocol/sdk`) chargé via un `await import()` dynamique depuis le processus main (package ESM uniquement)
- **electron-builder** pour l'empaquetage cross-platform

### Où étendre

| Zone | Chemin |
|---|---|
| Logique du renderer | `src/lib/` |
| Écrans | `src/screens/` |
| Modales | `src/modals/` |
| Handlers IPC d'Electron | `electron/ipc/` |
| Persistance des données | `electron/storage/` |
| Fournisseurs IA | `electron/ai/` |
| Outils MCP | `electron/mcp/tools.js` |
| Dictionnaires i18n | `src/lib/i18n/<lang>.tsx` |

Voir [CONTRIBUTING.md](../../CONTRIBUTING.md) pour le guide développeur complet — conventions de commit, principes d'architecture et checklist de PR.

### Tests

Stade prototype — pas encore de lanceur de tests complet. Barre minimale avant d'ouvrir une PR :

1. `npm run test:export` passe (smoke test sur trois fixtures)
2. `npm run dev` et exercez la fonctionnalité manuellement
3. Si vous avez touché au packaging ou au main Electron, lancez aussi `npm run pack` et ouvrez l'application compilée

## Roadmap

**v0.1 (livrée) :**
- Éditeur visuel cœur, bibliothèque de blocs enregistrés, bibliothèque d'images, occasions
- IA sur 5 fournisseurs avec amélioration de texte et génération de modèle
- Serveur MCP avec 28 outils typés et verrouillage en direct de l'éditeur
- Export en HTML / MJML / texte brut / ZIP avec préservation des variables
- Envoi de test SMTP + OAuth (Gmail, Outlook)
- Revue pré-envoi sur 7 catégories
- Partage via bundles `.st` chiffrés + liens profonds `simpletemplete://`
- Six langues avec bascule en direct
- SQLite local-first + secrets dans le trousseau de l'OS

**v0.1.x (à suivre) :**
- Builds signés et notarisés (macOS + Windows)
- Pipeline de release CI/CD avec canal d'auto-update
- Installateurs pré-compilés à chaque release

**Plus tard (idées, pas des engagements) :**
- Embeds plus riches pour les blocs video / GIF / map / accordion
- Optimisation des images à l'export et réécriture de domaine CDN
- Fournisseurs IA supplémentaires
- Vérifications de revue plus poussées

**Hors périmètre par choix :**
- Listes de contacts, historique d'envoi, tracking d'ouverture/clic, CDN hébergé — tout cela appartient à votre plateforme de mailing, pas à un éditeur local.

## Soutenir le projet

Simple Template est libre et open source. S'il vous aide, voici tout ce qui est utile :

- **[Mettez une étoile au dépôt](https://github.com/jcocano/simple-templete)** pour que plus de monde le découvre
- **[Signalez un bug](https://github.com/jcocano/simple-templete/issues/new?template=bug_report.yml)** si quelque chose est cassé
- **[Demandez une fonctionnalité](https://github.com/jcocano/simple-templete/issues/new?template=feature_request.yml)** que vous aimeriez voir
- **[Aidez avec les traductions](https://github.com/jcocano/simple-templete/issues/new?template=translation.yml)** — corrigez des fautes, améliorez la copie, ou ajoutez une nouvelle langue
- **[Ouvrez une pull request](../../CONTRIBUTING.md)** — voir le guide de contribution pour la configuration de dev
- **[Rejoignez les discussions](https://github.com/jcocano/simple-templete/discussions)** pour les questions, idées et démonstrations
- **[Offrez-moi un café](https://buymeacoffee.com/jesuscocana)** si vous voulez financer le développement continu

## Communauté

- **[Discussions](https://github.com/jcocano/simple-templete/discussions)** — Q&R, idées, démonstrations
- **[Issues](https://github.com/jcocano/simple-templete/issues)** — bugs, fonctionnalités, traductions
- **[Releases](https://github.com/jcocano/simple-templete/releases)** — historique des versions

Merci de lire le [Code de conduite](../../CODE_OF_CONDUCT.md) avant de participer.

## Sécurité

Vous avez trouvé une vulnérabilité ? Merci de **ne pas** ouvrir d'issue publique. Voir [SECURITY.md](../../SECURITY.md) pour le processus de divulgation responsable.

## Licence

[MIT](../../LICENSE) © Jesus Cocaño.

Si Simple Template vous fait gagner du temps, pensez à [m'offrir un café](https://buymeacoffee.com/jesuscocana) — ça maintient le projet en mouvement.
