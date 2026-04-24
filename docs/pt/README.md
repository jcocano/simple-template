# Simple Template

> Editor de templates de email open-source e local-first para macOS, Windows e Linux — uma alternativa no-code ao Beefree que roda inteiramente na sua máquina e que agentes de IA podem operar de ponta a ponta.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](../../LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/jcocano/simple-template?style=social)](https://github.com/jcocano/simple-template/stargazers)
[![GitHub issues](https://img.shields.io/github/issues/jcocano/simple-template)](https://github.com/jcocano/simple-template/issues)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](../../CONTRIBUTING.md)
[![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey.svg)](#instalação)

**Idiomas:** [English](../../README.md) · [Español](../es/README.md) · [Português](./README.md) · [Français](../fr/README.md) · [日本語](../ja/README.md) · [简体中文](../zh/README.md)

---

Simple Template é um app desktop para qualquer pessoa que precise entregar campanhas de email responsivas e bem acabadas sem tocar em HTML. Os templates ficam no seu disco — sem contas, sem nuvem, sem rastreamento — e você pode passar o teclado para um agente de IA a qualquer momento através de um servidor MCP embutido.

> **Gostou do projeto?** Dar uma [estrela no GitHub](https://github.com/jcocano/simple-template) é a forma mais fácil de ajudá-lo a crescer.

## Para quem é

- **Profissionais de marketing, fundadores, criadores** que querem desenhar emails visualmente sem ficar presos ao editor fechado de uma plataforma de mailing
- **Times pequenos** que precisam compartilhar e iterar templates sem uma conta na nuvem
- **Usuários preocupados com privacidade** que se recusam a colocar rascunhos nos servidores de outra pessoa
- **Usuários avançados de IA** rodando Claude Desktop / Cursor / outros clientes MCP que querem um editor de verdade que seu agente possa operar — e não mais HTML gerado

## O que o torna especial

- **Local-first por design.** Seus templates, imagens, blocos salvos, chaves de API e configurações ficam na sua máquina. Sem contas, sem telemetria, sem sincronização na nuvem.
- **Editor visual de blocos.** Modelo seção → coluna → bloco, ~20 tipos de blocos, preview responsivo ao vivo, desfazer / refazer, autosave.
- **IA integrada.** Melhore o texto de qualquer bloco ou gere templates completos usando Anthropic, OpenAI, Google, Ollama ou OpenRouter. Chaves de API criptografadas no keychain do seu sistema operacional.
- **Operável por agentes (servidor MCP).** Agentes de IA externos podem criar e editar templates através de 28 ferramentas tipadas — zero chance de HTML alucinado, porque o agente usa as mesmas ações que você usa na interface.
- **Compartilhe de forma privada.** Pacotes `.st` com um clique via deep links `simpletemplete://`, com PIN opcional.
- **Teste de entrega real.** Envio de teste via SMTP + OAuth (Gmail / Outlook) integrado.
- **Exporte para qualquer lugar.** HTML / MJML / texto puro / ZIP. `{{variables}}` são mantidas como literais, então Mailchimp, Sendgrid, Brevo, Klaviyo as interpretam na hora do envio.
- **Revisão pré-envio.** 7 categorias de checagem (conteúdo, acessibilidade, compatibilidade, imagens, links, variáveis, legal) antes de você exportar.
- **Seis idiomas.** Inglês, espanhol, português, francês, japonês, chinês simplificado. Alterna ao vivo, sem recarregar.

## O que você pode fazer

### Desenhe emails visualmente

Um documento baseado em seções (`sections → columns → blocks`) com layouts `1col / 2col / 3col` e cerca de vinte tipos de blocos: text, heading, hero, image, icon, button, divider, spacer, header, footer, product, social, além de tipos avançados (video, GIF, countdown, QR, map, accordion, table, custom HTML e mais).

- Arrastar e soltar a partir da paleta de blocos, reordene seções/blocos arrastando
- Controles de estilo por bloco: fonte, tamanho, peso, cor, alinhamento, padding, bordas, raio, fundo
- **Overrides apenas para mobile**: esconder um bloco no mobile, tamanho de fonte diferente, padding diferente
- Toggle de preview por dispositivo (desktop 600px / mobile 320px)
- Desfazer / refazer, autosave a cada ~30s, duplicar / deletar pelo teclado

### Reutilize conteúdo entre templates

- **Biblioteca de blocos salvos** — salve qualquer seção como um bloco reutilizável. Arraste do painel da biblioteca para qualquer template. Organize em categorias (headers, footers, CTAs, depoimentos, produtos, social, assinaturas, custom ou qualquer categoria que você crie com drag-drop).
- **Biblioteca de imagens** por workspace — arraste e solte imagens, organize em pastas. Imagens servidas via um protocolo custom `st-img://`, então nada é enviado para lugar nenhum.
- **Ocasiões (pastas)** — agrupe templates por campanha ou propósito com uma paleta de cores.

### Lapide com IA ✨

Conecte qualquer um dos cinco provedores e comece a iterar:

| Provider | Default model |
|---|---|
| Anthropic | `claude-sonnet-4-5` |
| OpenAI | `gpt-4.1` |
| Google | `gemini-2.5-flash` |
| Ollama | local, no API key |
| OpenRouter | one API key, many models |

- **Melhore o texto de qualquer bloco** — escolha um tom, receba três variantes, aplique a que você gostar
- **Gere um template completo a partir de um prompt** — descreva o email, receba de volta uma estrutura multi-seção válida
- Painel de configuração por provedor com os passos exatos para obter uma chave de API
- Chaves criptografadas no keychain do seu sistema operacional (macOS Keychain, Windows Credential Manager ou criptografadas em arquivo no Linux)

### Deixe agentes de IA operarem o app (servidor MCP) 🤖

Simple Template vem com um servidor **Model Context Protocol** embutido. Qualquer cliente compatível com MCP (Claude Desktop, Cursor, Zed, etc.) pode se conectar e operar o app através de 28 ferramentas tipadas:

- **Templates** — listar, ler, criar, duplicar, renomear, enviar para a lixeira / restaurar / excluir definitivamente, atualizar atributos
- **Estrutura** — adicionar / atualizar / deletar / mover seções e blocos de forma incremental
- **Biblioteca** — inserir blocos salvos, salvar seções como blocos salvos, listar imagens
- **Metadados** — definir assunto, preview, from-name / from-email, variáveis
- **Navegação** — `open_template` faz o agente te levar até o editor para ver as mudanças ao vivo

**Por que isso é melhor do que "pedir para a IA escrever meu HTML":**

- **Zero HTML alucinado.** Toda ferramenta recebe parâmetros estruturados com schemas Zod rigorosos. Agentes não conseguem inventar campos ou despejar markup inventado — só podem usar as mesmas ações que você tem na interface.
- **Você vê acontecendo.** Quando um agente está editando, o editor sobrepõe um indicador pulsante e um botão "Tomar controle". As mutações do agente aparecem ao vivo.
- **Configuração com um clique.** Configurações → MCP tem snippets JSON pré-interpolados para Claude Desktop (`claude_desktop_config.json`) e Cursor (`~/.cursor/mcp.json`) — cole e reinicie seu cliente.
- **Local e seguro.** O servidor faz bind apenas em `127.0.0.1`, autenticação por Bearer token, morre quando o app é fechado.

### Compartilhe templates de forma privada

- Exporte qualquer template como um pacote `.st` criptografado
- Compartilhe via deep link `simpletemplete://` — o destinatário clica, o app abre, o pacote aparece no workspace dele
- PIN opcional para compartilhamento privado (o destinatário digita o PIN antes de importar)
- Sem conta ou servidor intermediário

### Envie emails de teste reais

- **SMTP** — Gmail, Outlook, Yahoo, iCloud, SendGrid, Mailgun ou qualquer host SMTP
- **OAuth** — Gmail e Microsoft Outlook com fluxos de um clique (sem app passwords)
- Assunto prefixado com `[TEST]` / `[PRUEBA]` no idioma da sua interface
- Variáveis substituídas pelos valores `.sample` no envio de teste

### Exporte para qualquer plataforma de mailing

| Format | Use case |
|---|---|
| **HTML** | Email-safe, baseado em tabelas, CSS inline, compatível com Outlook |
| **MJML** | Código-fonte MJML editável para workflows MJML |
| **Plain text** | Extraído dos blocos para fallback multipart |
| **ZIP** | HTML + texto puro + imagens empacotados |

`{{variables}}` são **preservadas como literais** na exportação, então Mailchimp / Sendgrid / Brevo / Klaviyo / qualquer plataforma que você use para enviar consegue interpretá-las na hora do envio com a própria engine de templating.

### Entregue com confiança usando a revisão pré-envio

Aperte `⌘⇧R` antes de exportar. O painel de revisão roda checagens em sete categorias:

- **Conteúdo** — blocos vazios, botões sem link, preview text ausente, URLs suspeitas
- **Variáveis** — vars não usadas, referências a vars não definidas
- **Acessibilidade** — alt text em imagens, hierarquia de headings
- **Compatibilidade** — avisos do Outlook, peculiaridades conhecidas de clientes
- **Imagens** — imagens quebradas ou ausentes (checagem HEAD assíncrona), arquivos grandes demais
- **Links** — URLs inalcançáveis ou malformadas
- **Legal** — link de unsubscribe, endereço no footer, conformidade com CAN-SPAM

Todo problema tem uma ação direta de correção quando possível (*Ir para configurações de entrega*, *Adicionar link de unsubscribe*, etc.).

### Organize seu trabalho

- **Múltiplos workspaces** com dados totalmente isolados (templates, imagens, blocos salvos, marca, vars, chaves de IA)
- **Configurações por workspace** — branding (fontes, texto de footer, endereço), entrega (SMTP/OAuth), provedor de IA, idioma, variáveis, opções de exportação
- **Temas** — indigo / ocean / violet × light / dark, mais ajustes de densidade e raio
- **Paleta de comandos** (`⌘K` / `Ctrl+K`) — buscável por ações rápidas, navegação, configurações, temas, templates recentes e inserção de blocos

## Promessa local-first

- **Sem contas, sem nuvem, sem telemetria** — nunca.
- **Todos os dados no seu disco:**

| Platform | Location |
|---|---|
| macOS | `~/Library/Application Support/Simple Template/` |
| Windows | `%APPDATA%\Simple Template\` |
| Linux | `~/.config/Simple Template/` |

- **Templates + metadados** em SQLite (`better-sqlite3`), documentos individuais de template como JSON, imagens em uma pasta por workspace servidas via `st-img://` (sem afrouxar o `webSecurity`).
- **Segredos** (chaves de IA, senhas SMTP, tokens OAuth) armazenados no keychain do seu sistema operacional — não em texto puro.
- **Portátil** — exporte workspaces inteiros como pacotes `.st` criptografados a qualquer momento.

## Instalação

### A partir do código-fonte

```sh
git clone https://github.com/jcocano/simple-template.git
cd simple-template
npm install
npm run dev
```

Requisitos:
- **Node.js 20+**
- **Uma toolchain C** para o `better-sqlite3`:
  - macOS: `xcode-select --install`
  - Debian/Ubuntu: `sudo apt install build-essential python3`
  - Windows: [Visual Studio Build Tools](https://visualstudio.microsoft.com/downloads/) com "Desktop development with C++"

### Binários pré-compilados

Baixe o instalador para sua plataforma na [página de releases](https://github.com/jcocano/simple-template/releases):

| Plataforma | Download |
|---|---|
| macOS (Apple Silicon / Intel) | `.dmg` ou `.zip` |
| Windows | `.exe` (instalador NSIS) |
| Linux | `.AppImage` ou `.deb` |

> **Atenção — binários sem assinatura.** Simple Template é open source e ainda não inclui um Apple Developer ID pago nem um certificado de code-signing do Windows. Os artefatos são compilados em CI a partir do código público, mas seu sistema operacional vai te avisar na primeira vez que abrir:
>
> - **macOS** — Gatekeeper diz *"não pode ser aberto porque a Apple não pode verificar se contém software malicioso"*. Clique com botão direito na app → **Abrir** → confirmar. No Terminal: `xattr -d com.apple.quarantine "/Applications/Simple Template.app"`.
> - **Windows** — SmartScreen mostra *"O Windows protegeu seu PC"*. Clique em **Mais informações** → **Executar mesmo assim**.
> - **Linux** — para o `.AppImage`, marque como executável primeiro: `chmod +x SimpleTemplate-*.AppImage`. O `.deb` instala normalmente com `apt install ./...deb`.
>
> Code-signing e notarização virão em uma versão futura.

Se preferir gerar os instaladores localmente:

```sh
npm run dist
```

Os binários aparecem em `release/` — `.dmg` / `.zip` para macOS, `.exe` para Windows, `.AppImage` / `.deb` para Linux.

## No dia a dia

### Atalhos de teclado

| Atalho | Ação |
|---|---|
| `⌘K` / `Ctrl+K` | Paleta de comandos |
| `⌘S` / `Ctrl+S` | Salvar template |
| `⌘D` / `Ctrl+D` | Duplicar bloco ou seção selecionada |
| `⌘P` / `Ctrl+P` | Abrir preview |
| `⌘⇧T` / `Ctrl+Shift+T` | Enviar email de teste |
| `⌘⇧R` / `Ctrl+Shift+R` | Abrir revisão pré-envio |
| `⌘Z` / `⌘⇧Z` | Desfazer / refazer |
| `Backspace` / `Delete` | Remover bloco ou seção selecionada |

### Conectar um agente de IA (MCP quick start)

1. Abra **Configurações → MCP**
2. Copie o snippet JSON para o seu cliente — tanto Claude Desktop quanto Cursor aparecem com URL + token pré-interpolados
3. Cole em:
   - Claude Desktop: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Cursor: `~/.cursor/mcp.json`
4. Reinicie o cliente MCP
5. Peça ao agente para `list_templates` / `create_template` / `add_section` / etc. — veja o editor atualizar ao vivo

O app precisa estar rodando para o servidor MCP responder. Fechou o app → a conexão cai (por design).

## Para desenvolvedores

### Scripts

| Comando | Descrição |
|---|---|
| `npm run dev` | Vite + Electron concorrentes com live reload (porta 5173) |
| `npm run dev:web` | Apenas Vite — itere o renderer no navegador |
| `npm run dev:electron` | Electron apontado para um servidor Vite dev em execução |
| `npm run start` | Electron contra o `dist/index.html` estático |
| `npm run build:web` | Bundle Vite de produção em `dist/` |
| `npm run pack` | `.app` / `.exe` empacotado / Linux unpacked — sem instalador |
| `npm run dist` | Instaladores completos em `release/` (sem assinatura numa máquina de dev) |
| `npm run test:export` | Smoke test da pipeline de exportação contra fixtures |
| `npm run build:icons` | Regerar ícones do app a partir de `assets/icon.svg` |

### Arquitetura em resumo

- **Shell Electron** com defaults estritos de segurança (`contextIsolation: true`, `sandbox: true`, `nodeIntegration: false`, IPC apenas via preload com `contextBridge`)
- **Renderer React 18** com convenção de módulos **globals-on-`window`** — arquivos são carregados por efeito colateral a partir de `src/main.tsx` e se registram em `window`. Veja [CLAUDE.md](../../CLAUDE.md) para a explicação completa.
- **better-sqlite3** para metadados locais + arquivos JSON para documentos de template
- **Vite** para bundling, JSX runtime clássico (auto-inject)
- **Sem compilador TypeScript** no pipeline — `.tsx` é apenas sintaxe JSX
- **Protocolo custom `st-img://`** para servir imagens do workspace sem relaxar o `webSecurity`
- **MCP SDK** (`@modelcontextprotocol/sdk`) carregado via `await import()` dinâmico a partir do main process (pacote ESM-only)
- **electron-builder** para empacotamento cross-platform

### Onde estender

| Área | Caminho |
|---|---|
| Lógica do renderer | `src/lib/` |
| Telas | `src/screens/` |
| Modais | `src/modals/` |
| Handlers IPC do Electron | `electron/ipc/` |
| Persistência de dados | `electron/storage/` |
| Provedores de IA | `electron/ai/` |
| Ferramentas MCP | `electron/mcp/tools.js` |
| Dicionários de i18n | `src/lib/i18n/<lang>.tsx` |

Veja [CONTRIBUTING.md](../../CONTRIBUTING.md) para o guia completo do desenvolvedor — convenções de commit, princípios de arquitetura e o checklist de PR.

### Testes

Estágio de protótipo — ainda sem um test runner completo. Barra mínima antes de abrir um PR:

1. `npm run test:export` passa (smoke test contra três fixtures)
2. `npm run dev` e exercitar a feature manualmente
3. Se você mexeu em packaging ou no main do Electron, também rode `npm run pack` e abra o app compilado

## Apoie o projeto

Simple Template é gratuito e open source. Se te ajuda, estas são formas úteis de apoiar:

- **[Dê uma estrela no repo](https://github.com/jcocano/simple-template)** para mais pessoas encontrarem
- **[Reporte um bug](https://github.com/jcocano/simple-template/issues/new?template=bug_report.yml)** se algo estiver quebrado
- **[Peça uma feature](https://github.com/jcocano/simple-template/issues/new?template=feature_request.yml)** que você queira ver
- **[Ajude com traduções](https://github.com/jcocano/simple-template/issues/new?template=translation.yml)** — corrigir typos, melhorar textos ou adicionar um novo idioma
- **[Abra um pull request](../../CONTRIBUTING.md)** — veja o guia de contribuição para o setup de dev
- **[Participe das discussões](https://github.com/jcocano/simple-template/discussions)** para perguntas, ideias e show-and-tell
- **[Me pague um café](https://buymeacoffee.com/jesuscocana)** se quiser financiar o desenvolvimento contínuo

## Comunidade

- **[Discussions](https://github.com/jcocano/simple-template/discussions)** — Q&A, ideias, show-and-tell
- **[Issues](https://github.com/jcocano/simple-template/issues)** — bugs, features, traduções
- **[Releases](https://github.com/jcocano/simple-template/releases)** — histórico de versões

Por favor, leia o [Código de Conduta](../../CODE_OF_CONDUCT.md) antes de participar.

## Segurança

Encontrou uma vulnerabilidade? **Não** abra uma issue pública, por favor. Veja [SECURITY.md](../../SECURITY.md) para o processo de divulgação responsável.

## Licença

[MIT](../../LICENSE) © Jesus Cocaño.

Se Simple Template te economiza tempo, considere [me pagar um café](https://buymeacoffee.com/jesuscocana) — isso mantém o projeto andando.
