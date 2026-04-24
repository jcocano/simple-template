# Simple Template

> 面向 macOS、Windows 和 Linux 的开源、local-first 邮件模板编辑器 —— 一个完全在你本机运行的无代码 Beefree 替代品，AI agent 可端到端驱动。

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](../../LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/jcocano/simple-templete?style=social)](https://github.com/jcocano/simple-templete/stargazers)
[![GitHub issues](https://img.shields.io/github/issues/jcocano/simple-templete)](https://github.com/jcocano/simple-templete/issues)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](../../CONTRIBUTING.md)
[![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey.svg)](#install)

**语言：** [English](../../README.md) · [Español](../es/README.md) · [Português](../pt/README.md) · [Français](../fr/README.md) · [日本語](../ja/README.md) · [简体中文](./README.md)

---

Simple Template 是一款桌面应用，适合任何需要交付精致、响应式邮件营销活动但不想碰 HTML 的人。模板存放在你自己的磁盘上 —— 没有账号、没有云、没有追踪 —— 并且你可以随时通过内置的 MCP 服务器把键盘交给 AI agent。

> **喜欢这个项目？** 给一个 [GitHub star](https://github.com/jcocano/simple-templete) 是帮助它成长最简单的方式。

## 适合谁使用

- **市场人、创始人、创作者**，希望可视化地设计邮件，而不被某个邮件营销平台的封闭编辑器束缚
- **小型团队**，需要在没有云账号的情况下共享和迭代模板
- **注重隐私的用户**，拒绝把草稿文案放在别人的服务器上
- **AI 重度用户**，使用 Claude Desktop / Cursor / 其他 MCP 客户端，希望 agent 能驱动一个真正的编辑器 —— 而不是再生成一堆 HTML

## 特色亮点

- **Local-first 设计。** 你的模板、图片、保存的块、API key 和设置都留在你的机器上。没有账号、没有遥测、没有云同步。
- **可视化块编辑器。** Section → column → block 模型，约 20 种块类型，实时响应式预览、撤销 / 重做、自动保存。
- **内置 AI。** 使用 Anthropic、OpenAI、Google、Ollama 或 OpenRouter 优化任一块的文案或生成完整模板。API key 加密保存在你的 OS keychain 中。
- **可被 agent 驱动（MCP server）。** 外部 AI agent 可以通过 28 个强类型工具创建和编辑模板 —— 不会有任何凭空生成的 HTML，因为 agent 使用的是和你在 UI 中一样的操作。
- **私密分享。** 通过 `simpletemplete://` 深链一键分享 `.st` 包，可选 PIN。
- **真实投递测试。** 内置 SMTP + OAuth（Gmail / Outlook）测试发送。
- **导出到任何地方。** HTML / MJML / 纯文本 / ZIP。`{{variables}}` 以字面量形式保留，Mailchimp、Sendgrid、Brevo、Klaviyo 会在发送时解释它们。
- **发送前审查。** 导出前 7 类检查（内容、无障碍、兼容性、图片、链接、变量、法律）。
- **六种语言。** 英语、西班牙语、葡萄牙语、法语、日语、简体中文。实时切换，无需重载。

## 你可以做什么

### 可视化设计邮件

基于 section 的文档结构（`sections → columns → blocks`），支持 `1col / 2col / 3col` 布局以及约二十种块类型：text、heading、hero、image、icon、button、divider、spacer、header、footer、product、social，以及高级类型（video、GIF、countdown、QR、map、accordion、table、自定义 HTML 等等）。

- 从块面板拖放，通过拖拽重新排序 section/block
- 逐块的样式控制：字体、字号、字重、颜色、对齐、内边距、边框、圆角、背景
- **仅移动端覆盖**：在移动端隐藏某个块、使用不同的字号、不同的内边距
- 设备预览切换（桌面 600px / 移动 320px）
- 撤销 / 重做、约每 30 秒自动保存、用键盘复制 / 删除

### 在模板间复用内容

- **已保存块库** —— 把任意 section 保存为可复用的块。从库面板拖入任意模板。按类别组织（headers、footers、CTAs、testimonials、products、social、signatures、custom，或任何你通过拖放创建的类别）。
- **按工作区的图片库** —— 拖放图片进来，按文件夹组织。图片通过自定义 `st-img://` 协议提供，不会上传到任何地方。
- **Occasions（文件夹）** —— 按营销活动或用途分组模板，配有调色板。

### 用 AI 打磨 ✨

插入五个提供商中的任意一个，即可开始迭代：

| Provider | Default model |
|---|---|
| Anthropic | `claude-sonnet-4-5` |
| OpenAI | `gpt-4.1` |
| Google | `gemini-2.5-flash` |
| Ollama | local, no API key |
| OpenRouter | one API key, many models |

- **优化任一块的文案** —— 选择语气，获得三种变体，应用你喜欢的那个
- **从 prompt 生成完整模板** —— 描述这封邮件，得到一个有效的多 section 结构
- 每个提供商都有专属设置面板，包含获取 API key 的确切步骤
- Key 加密保存在你的 OS keychain 中（macOS Keychain、Windows Credential Manager，或在 Linux 上以文件加密方式存储）

### 让 AI agent 驱动应用（MCP server）🤖

Simple Template 内置了 **Model Context Protocol** 服务器。任何兼容 MCP 的客户端（Claude Desktop、Cursor、Zed 等）都可以连接并通过 28 个强类型工具操作应用：

- **模板** —— 列出、读取、创建、复制、重命名、移入回收站 / 恢复 / 清除、属性更新
- **结构** —— 增量地添加 / 更新 / 删除 / 移动 section 和 block
- **库** —— 插入已保存块、把 section 保存为已保存块、列出图片
- **元数据** —— 设置主题、预览文本、发件人姓名 / 发件人邮箱、变量
- **导航** —— `open_template` 会让 agent 跳转到编辑器，让你看到实时变更

**为什么这比“让 AI 帮我写 HTML”更好：**

- **零 HTML 幻觉。** 每个工具都接受带有严格 Zod schema 的结构化参数。Agent 无法凭空创造字段或输出编造的标记 —— 它只能使用你在 UI 中拥有的同样的操作。
- **你可以看着它发生。** 当 agent 正在编辑时，编辑器会叠加一个脉冲指示器和一个“接管控制”按钮。Agent 的变更实时显示出来。
- **一键配置。** Settings → MCP 中已经为 Claude Desktop（`claude_desktop_config.json`）和 Cursor（`~/.cursor/mcp.json`）预填好了 JSON 片段 —— 粘贴并重启你的客户端即可。
- **本地且安全。** 服务器仅绑定 `127.0.0.1`，使用 Bearer token 认证，应用关闭即退出。

### 私密分享模板

- 将任意模板导出为加密的 `.st` 包
- 通过 `simpletemplete://` 深链分享 —— 接收方点击，应用打开，包落入他们的工作区
- 可选 PIN 用于私密分享（接收方在导入前输入 PIN）
- 不需要中间账号或服务器

### 发送真实的测试邮件

- **SMTP** —— Gmail、Outlook、Yahoo、iCloud、SendGrid、Mailgun，或任何 SMTP 主机
- **OAuth** —— Gmail 和 Microsoft Outlook 的一键流程（无需应用专用密码）
- 根据你的 UI 语言，主题会加上 `[TEST]` / `[PRUEBA]` 前缀
- 测试发送时变量会用 `.sample` 值替换

### 导出到任意邮件营销平台

| Format | Use case |
|---|---|
| **HTML** | 邮件安全、基于表格、内联 CSS、兼容 Outlook |
| **MJML** | 可编辑的 MJML 源码，适配 MJML 工作流 |
| **Plain text** | 从块中提取，用于 multipart fallback |
| **ZIP** | HTML + 纯文本 + 图片一起打包 |

导出时 `{{variables}}` **以字面量保留**，这样 Mailchimp / Sendgrid / Brevo / Klaviyo / 你使用的任何平台都能在发送时用它们自己的模板引擎去解释。

### 通过发送前审查自信交付

导出前按下 `⌘⇧R`。审查面板会跨七个类别运行检查：

- **内容** —— 空块、未设置链接的按钮、缺失的预览文本、可疑的 URL
- **变量** —— 未使用的变量、对未定义变量的引用
- **无障碍** —— 图片的 alt 文本、标题层级
- **兼容性** —— Outlook 警告、已知客户端怪癖
- **图片** —— 损坏或缺失的图片（异步 HEAD 检查）、过大的文件
- **链接** —— 无法访问或格式错误的 URL
- **法律** —— 退订链接、页脚地址、CAN-SPAM 合规

每个问题都尽可能提供直接的修复操作（*前往投递设置*、*添加退订链接* 等）。

### 组织你的工作

- **多个工作区**，数据完全隔离（模板、图片、已保存块、品牌、变量、AI key）
- **按工作区的设置** —— 品牌（字体、页脚文本、地址）、投递（SMTP/OAuth）、AI 提供商、语言、变量、导出选项
- **主题** —— indigo / ocean / violet × light / dark，外加密度和圆角微调
- **命令面板**（`⌘K` / `Ctrl+K`）—— 可搜索的快速操作、导航、设置、主题、最近模板和块插入

## Local-first 承诺

- **没有账号、没有云、没有遥测** —— 永不。
- **所有数据都在你的磁盘上：**

| Platform | Location |
|---|---|
| macOS | `~/Library/Application Support/Simple Template/` |
| Windows | `%APPDATA%\Simple Template\` |
| Linux | `~/.config/Simple Template/` |

- **模板 + 元数据** 存储在 SQLite（`better-sqlite3`）中，单个模板文档以 JSON 形式存在，图片保存在按工作区组织的文件夹中并通过 `st-img://` 提供（不会放宽 `webSecurity`）。
- **敏感信息**（AI key、SMTP 密码、OAuth token）保存在你的 OS keychain 中 —— 不是明文。
- **可移植** —— 任何时候都可以把完整工作区导出为加密的 `.st` 包。

## 安装

### 从源码构建

```sh
git clone https://github.com/jcocano/simple-templete.git
cd simple-templete
npm install
npm run dev
```

要求：
- **Node.js 20+**
- **C 工具链**（用于 `better-sqlite3`）：
  - macOS：`xcode-select --install`
  - Debian/Ubuntu：`sudo apt install build-essential python3`
  - Windows：[Visual Studio Build Tools](https://visualstudio.microsoft.com/downloads/)，选择 “Desktop development with C++”

### 预构建二进制

暂未发布 —— v0.1.0 版本正在等待代码签名和 CI/CD。[给仓库加 star](https://github.com/jcocano/simple-templete) 或 [关注 release](https://github.com/jcocano/simple-templete/releases) 以获得通知。

在此之前，你可以在本地构建安装包：

```sh
npm run dist
```

二进制产物会出现在 `release/` 下 —— macOS 的 `.dmg` / `.zip`、Windows 的 `.exe`、Linux 的 `.AppImage` / `.deb`。

## 日常使用

### 键盘快捷键

| Shortcut | 操作 |
|---|---|
| `⌘K` / `Ctrl+K` | 命令面板 |
| `⌘S` / `Ctrl+S` | 保存模板 |
| `⌘D` / `Ctrl+D` | 复制选中的块或 section |
| `⌘P` / `Ctrl+P` | 打开预览 |
| `⌘⇧T` / `Ctrl+Shift+T` | 发送测试邮件 |
| `⌘⇧R` / `Ctrl+Shift+R` | 打开发送前审查 |
| `⌘Z` / `⌘⇧Z` | 撤销 / 重做 |
| `Backspace` / `Delete` | 删除选中的块或 section |

### 连接 AI agent（MCP 快速上手）

1. 打开 **Settings → MCP**
2. 复制对应客户端的 JSON 片段 —— Claude Desktop 和 Cursor 都已预先填好 URL 和 token
3. 粘贴到：
   - Claude Desktop：`~/Library/Application Support/Claude/claude_desktop_config.json`
   - Cursor：`~/.cursor/mcp.json`
4. 重启 MCP 客户端
5. 让 agent 执行 `list_templates` / `create_template` / `add_section` 等 —— 看着编辑器实时更新

应用必须保持运行，MCP 服务器才能响应。关闭应用 → 连接断开（有意为之）。

## 面向开发者

### 脚本

| Command | Description |
|---|---|
| `npm run dev` | Vite + Electron 并发运行，支持热重载（端口 5173） |
| `npm run dev:web` | 仅 Vite —— 在浏览器中迭代 renderer |
| `npm run dev:electron` | Electron 连接到正在运行的 Vite 开发服务器 |
| `npm run start` | Electron 运行静态 `dist/index.html` |
| `npm run build:web` | 生产环境 Vite 打包到 `dist/` |
| `npm run pack` | 打包 `.app` / `.exe` / Linux 未打包产物 —— 不生成安装包 |
| `npm run dist` | 完整安装包输出到 `release/`（开发机上为未签名） |
| `npm run test:export` | 用 fixture 对导出流程进行冒烟测试 |
| `npm run build:icons` | 从 `assets/icon.svg` 重新生成应用图标 |

### 架构一览

- **Electron shell** 采用严格的安全默认值（`contextIsolation: true`、`sandbox: true`、`nodeIntegration: false`，仅通过 `contextBridge` 使用 preload IPC）
- **React 18 renderer**，采用 **globals-on-`window`** 模块约定 —— 文件由 `src/main.tsx` 以副作用方式加载并注册到 `window`。完整说明见 [CLAUDE.md](../../CLAUDE.md)。
- **better-sqlite3** 用于本地元数据 + JSON 文件用于模板文档
- **Vite** 负责打包，使用经典 JSX runtime（自动注入）
- **流程中没有 TypeScript 编译器** —— `.tsx` 只是 JSX 语法
- **自定义 `st-img://` 协议** 在不放宽 `webSecurity` 的情况下提供工作区图片
- **MCP SDK**（`@modelcontextprotocol/sdk`）通过主进程的动态 `await import()` 加载（仅 ESM 的包）
- **electron-builder** 用于跨平台打包

### 在哪里扩展

| Area | Path |
|---|---|
| Renderer 逻辑 | `src/lib/` |
| 屏幕 | `src/screens/` |
| 模态框 | `src/modals/` |
| Electron IPC 处理器 | `electron/ipc/` |
| 数据持久化 | `electron/storage/` |
| AI 提供商 | `electron/ai/` |
| MCP 工具 | `electron/mcp/tools.js` |
| i18n 字典 | `src/lib/i18n/<lang>.tsx` |

完整的开发者指南（提交规范、架构原则和 PR 清单）见 [CONTRIBUTING.md](../../CONTRIBUTING.md)。

### 测试

原型阶段 —— 暂未配置完整的测试运行器。打开 PR 前的最低要求：

1. `npm run test:export` 通过（针对三个 fixture 的冒烟测试）
2. 运行 `npm run dev` 并手动体验该功能
3. 如果你改动了打包或 Electron 主进程，请同时运行 `npm run pack` 并打开构建产物

## 路线图

**v0.1（已发布）：**
- 核心可视化编辑器、已保存块库、图片库、occasions
- 跨 5 个提供商的 AI，含 improve-text 和 generate-template
- 带 28 个强类型工具和编辑器实时锁定的 MCP server
- 导出到 HTML / MJML / 纯文本 / ZIP，保留变量
- SMTP + OAuth（Gmail、Outlook）测试发送
- 跨 7 个类别的发送前审查
- 通过加密的 `.st` 包 + `simpletemplete://` 深链分享
- 六种语言，支持实时切换
- Local-first SQLite + OS keychain 敏感信息

**v0.1.x（下一步）：**
- 代码签名和公证的构建（macOS + Windows）
- CI/CD 发布流水线，包含自动更新通道
- 每次发布都提供预构建安装包

**之后（想法，非承诺）：**
- 为 video / GIF / map / accordion 块提供更丰富的嵌入
- 导出时的图片优化和 CDN 域名重写
- 更多 AI 提供商
- 更深入的审查检查

**有意不做：**
- 联系人列表、发送历史、打开/点击跟踪、托管 CDN —— 这些属于你的邮件营销平台，而不是本地编辑器。

## 支持项目

Simple Template 免费且开源。如果它对你有帮助，以下这些都很有用：

- **[给仓库加 star](https://github.com/jcocano/simple-templete)**，让更多人发现它
- **[报告 bug](https://github.com/jcocano/simple-templete/issues/new?template=bug_report.yml)**，如果有东西坏了
- **[提出功能请求](https://github.com/jcocano/simple-templete/issues/new?template=feature_request.yml)**，说出你想看到的
- **[帮助翻译](https://github.com/jcocano/simple-templete/issues/new?template=translation.yml)** —— 修正笔误、改善文案或添加新语言
- **[提交 pull request](../../CONTRIBUTING.md)** —— 开发环境搭建见 contributing 指南
- **[加入讨论](https://github.com/jcocano/simple-templete/discussions)**，进行问答、交流想法和展示成果
- **[请我喝一杯咖啡](https://buymeacoffee.com/jesuscocana)**，如果你愿意资助持续开发

## 社区

- **[Discussions](https://github.com/jcocano/simple-templete/discussions)** —— 问答、想法、展示成果
- **[Issues](https://github.com/jcocano/simple-templete/issues)** —— bug、功能、翻译
- **[Releases](https://github.com/jcocano/simple-templete/releases)** —— 版本历史

参与前请阅读 [Code of Conduct](../../CODE_OF_CONDUCT.md)。

## 安全

发现了漏洞？请**不要**公开提交 issue。责任披露流程见 [SECURITY.md](../../SECURITY.md)。

## 许可证

[MIT](../../LICENSE) © Jesus Cocaño。

如果 Simple Template 为你节省了时间，可以考虑[请我喝一杯咖啡](https://buymeacoffee.com/jesuscocana) —— 这能让项目继续向前。
