# Simple Template

> macOS、Windows、Linux 向けのオープンソースかつローカルファーストなメールテンプレートエディタ。完全にご自身のマシン上で動作し、AI エージェントがエンドツーエンドで操作できる、no-code な Beefree の代替です。

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](../../LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/jcocano/simple-templete?style=social)](https://github.com/jcocano/simple-templete/stargazers)
[![GitHub issues](https://img.shields.io/github/issues/jcocano/simple-templete)](https://github.com/jcocano/simple-templete/issues)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](../../CONTRIBUTING.md)
[![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey.svg)](#install)

**言語:** [English](../../README.md) · [Español](../es/README.md) · [Português](../pt/README.md) · [Français](../fr/README.md) · [日本語](./README.md) · [简体中文](../zh/README.md)

---

Simple Template は、HTML に触れることなく洗練されたレスポンシブなメールキャンペーンを作成したいすべての方のためのデスクトップアプリです。テンプレートはお使いのディスク上に保存され、アカウントもクラウドもトラッキングもありません。さらに、内蔵の MCP サーバーを通じて、いつでも AI エージェントにキーボードを引き渡すことができます。

> **このプロジェクトを気に入っていただけましたか？** [GitHub のスター](https://github.com/jcocano/simple-templete)が、成長を後押しする最も簡単な方法です。

## こんな方に

- **マーケター、創業者、クリエイター** — メール配信プラットフォームの閉じたエディタを使わず、ビジュアルにメールをデザインしたい方
- **小規模チーム** — クラウドアカウントなしでテンプレートを共有し、反復的に改善したい方
- **プライバシー重視のユーザー** — 下書きを他人のサーバーに置きたくない方
- **AI パワーユーザー** — Claude Desktop / Cursor / その他の MCP クライアントを使い、生成される HTML ではなく、エージェントが実際に操作できる本物のエディタを求める方

## 特長

- **ローカルファースト設計。** テンプレート、画像、保存済みブロック、API キー、設定はすべてお使いのマシンに留まります。アカウントも、テレメトリも、クラウド同期もありません。
- **ビジュアルブロックエディタ。** section → column → block モデル、約 20 種類のブロックタイプ、ライブなレスポンシブプレビュー、undo / redo、自動保存。
- **AI を内蔵。** Anthropic、OpenAI、Google、Ollama、OpenRouter を使って、任意のブロックのテキストを改善したり、テンプレート全体を生成したりできます。API キーは OS のキーチェーンで暗号化されます。
- **エージェント操作可能（MCP サーバー）。** 外部の AI エージェントが 28 種類の型付きツールを通してテンプレートを作成・編集できます。エージェントは UI と同じアクションを使うため、HTML をハルシネートする可能性はゼロです。
- **プライベートに共有。** `simpletemplete://` ディープリンク経由のワンクリック `.st` バンドル、オプションの PIN。
- **実配信のテスト。** SMTP + OAuth（Gmail / Outlook）テスト送信を内蔵。
- **どこへでもエクスポート。** HTML / MJML / プレーンテキスト / ZIP。`{{variables}}` はリテラルとして保持されるため、Mailchimp、Sendgrid、Brevo、Klaviyo が送信時に解釈します。
- **プリフライトレビュー。** エクスポート前に 7 つのチェックカテゴリ（コンテンツ、アクセシビリティ、互換性、画像、リンク、変数、法的要件）を実行します。
- **6 言語対応。** 英語、スペイン語、ポルトガル語、フランス語、日本語、簡体字中国語。リロードなしでライブに切り替えられます。

## できること

### ビジュアルにメールをデザイン

セクションベースのドキュメント（`sections → columns → blocks`）で、`1col / 2col / 3col` のレイアウトと約 20 種類のブロックタイプに対応します：text、heading、hero、image、icon、button、divider、spacer、header、footer、product、social、加えて高度なタイプ（video、GIF、countdown、QR、map、accordion、table、custom HTML など）。

- ブロックパレットからドラッグ＆ドロップ、ドラッグでセクション／ブロックを並べ替え
- ブロックごとのスタイルコントロール：フォント、サイズ、ウェイト、色、配置、パディング、ボーダー、角丸、背景
- **モバイル専用のオーバーライド**：モバイルでブロックを非表示にしたり、別のフォントサイズや別のパディングを設定したりできます
- デバイスプレビュー切り替え（desktop 600px / mobile 320px）
- Undo / redo、約 30 秒ごとの自動保存、キーボードからの複製／削除

### テンプレート間でコンテンツを再利用

- **保存済みブロックライブラリ** — 任意のセクションを再利用可能なブロックとして保存できます。ライブラリパネルから任意のテンプレートへドラッグします。カテゴリ（headers、footers、CTAs、testimonials、products、social、signatures、custom、またはドラッグ＆ドロップで作成した任意のカテゴリ）に整理できます。
- **ワークスペースごとの画像ライブラリ** — 画像をドラッグ＆ドロップで取り込み、フォルダに整理します。画像はカスタムの `st-img://` プロトコル経由で配信されるため、どこにもアップロードされません。
- **Occasions（フォルダ）** — テンプレートをキャンペーンや用途ごとにカラーパレット付きでグループ化できます。

### AI で仕上げる ✨

5 つのプロバイダのいずれかを接続して、すぐに反復を始められます：

| Provider | Default model |
|---|---|
| Anthropic | `claude-sonnet-4-5` |
| OpenAI | `gpt-4.1` |
| Google | `gemini-2.5-flash` |
| Ollama | local, no API key |
| OpenRouter | one API key, many models |

- **任意のブロックでテキストを改善** — トーンを選んで 3 つのバリエーションを取得し、好きなものを適用できます
- **プロンプトから完全なテンプレートを生成** — メールを説明すると、有効な複数セクション構造が返されます
- プロバイダごとの設定パネルに、API キー取得までの具体的な手順が掲載されています
- キーは OS のキーチェーン（macOS Keychain、Windows Credential Manager、または Linux ではファイル暗号化）で暗号化されます

### AI エージェントにアプリを操作させる（MCP サーバー）🤖

Simple Template には **Model Context Protocol** サーバーが組み込まれています。MCP 互換のあらゆるクライアント（Claude Desktop、Cursor、Zed など）が接続し、28 種類の型付きツールを通じてアプリを操作できます：

- **Templates** — 一覧、読み取り、作成、複製、リネーム、ゴミ箱／復元／完全削除、属性の更新
- **Structure** — セクションとブロックの追加／更新／削除／移動を段階的に実行
- **Library** — 保存済みブロックの挿入、セクションの保存済みブロックとしての保存、画像の一覧
- **Metadata** — 件名、プレビュー、from-name / from-email、変数の設定
- **Navigation** — `open_template` でエージェントが自動的にエディタへ遷移し、ライブの変更を確認できます

**これが「AI に HTML を書かせる」より優れている理由：**

- **HTML のハルシネーションがゼロ。** すべてのツールは厳密な Zod スキーマ付きの構造化パラメータを取ります。エージェントがフィールドを発明したり、でっちあげのマークアップを吐き出したりすることはできません。UI であなたが使うのと同じアクションしか使えないのです。
- **動作を目の前で確認できます。** エージェントが編集している間、エディタにはパルスインジケータと「Take control」ボタンが重ねて表示されます。エージェントの変更はライブで反映されます。
- **ワンクリックでセットアップ。** Settings → MCP には、Claude Desktop（`claude_desktop_config.json`）と Cursor（`~/.cursor/mcp.json`）向けに事前展開済みの JSON スニペットが用意されています。貼り付けてクライアントを再起動するだけです。
- **ローカルかつ安全。** サーバーは `127.0.0.1` のみにバインドし、Bearer トークン認証を使用し、アプリを閉じると停止します。

### テンプレートをプライベートに共有

- 任意のテンプレートを暗号化された `.st` バンドルとしてエクスポート
- `simpletemplete://` ディープリンクで共有 — 受信者がクリックするとアプリが開き、バンドルがそのワークスペースに届きます
- プライベート共有のためのオプションの PIN（受信者はインポート前に PIN を入力します）
- 中間アカウントやサーバーは不要です

### 実際のテストメールを送信

- **SMTP** — Gmail、Outlook、Yahoo、iCloud、SendGrid、Mailgun、またはその他任意の SMTP ホスト
- **OAuth** — Gmail と Microsoft Outlook のワンクリックフロー（アプリパスワード不要）
- 件名は UI の言語に応じて `[TEST]` / `[PRUEBA]` が付加されます
- テスト送信では変数が `.sample` の値に置換されます

### 任意のメール配信プラットフォームへエクスポート

| Format | Use case |
|---|---|
| **HTML** | メールセーフ、テーブルベース、インライン CSS、Outlook 互換 |
| **MJML** | MJML ワークフロー向けに編集可能な MJML ソース |
| **Plain text** | マルチパートのフォールバック用にブロックから抽出 |
| **ZIP** | HTML + プレーンテキスト + 画像をひとまとめに |

`{{variables}}` はエクスポート時に**リテラルとして保持される**ため、Mailchimp / Sendgrid / Brevo / Klaviyo など、配信に使うプラットフォームが独自のテンプレートエンジンで送信時に解釈できます。

### プリフライトレビューで自信を持って配信

エクスポート前に `⌘⇧R` を押します。レビューパネルは 7 つのカテゴリにわたってチェックを実行します：

- **Content** — 空のブロック、リンクのないボタン、プレビューテキストの欠落、疑わしい URL
- **Variables** — 未使用の変数、未定義の変数への参照
- **Accessibility** — 画像の alt テキスト、見出しの階層
- **Compatibility** — Outlook 警告、既知のクライアント固有の挙動
- **Images** — 壊れている／欠落している画像（非同期 HEAD チェック）、肥大化したファイル
- **Links** — 到達不能または不正な形式の URL
- **Legal** — 配信停止リンク、フッターの住所、CAN-SPAM 準拠

可能な限り、すべての問題に直接の修正アクション（*Go to delivery settings*、*Add unsubscribe link* など）が用意されています。

### 作業を整理する

- **複数ワークスペース** — データ（templates、images、saved blocks、brand、vars、AI keys）を完全に分離
- **ワークスペースごとの設定** — ブランディング（フォント、フッターテキスト、住所）、配信（SMTP/OAuth）、AI プロバイダ、言語、変数、エクスポートオプション
- **テーマ** — indigo / ocean / violet × light / dark、加えて密度と角丸の調整
- **コマンドパレット**（`⌘K` / `Ctrl+K`） — クイックアクション、ナビゲーション、設定、テーマ、最近のテンプレート、ブロック挿入を横断して検索可能

## ローカルファーストの約束

- **アカウントもクラウドもテレメトリも、一切ありません。**
- **すべてのデータはお使いのディスクに：**

| Platform | Location |
|---|---|
| macOS | `~/Library/Application Support/Simple Template/` |
| Windows | `%APPDATA%\Simple Template\` |
| Linux | `~/.config/Simple Template/` |

- **テンプレート + メタデータ**は SQLite（`better-sqlite3`）に、個々のテンプレートドキュメントは JSON として、画像はワークスペースごとのフォルダに保存され、`st-img://` 経由で配信されます（`webSecurity` を緩めることはありません）。
- **シークレット**（AI キー、SMTP パスワード、OAuth トークン）は OS のキーチェーンに保存されます。平文ではありません。
- **ポータブル** — いつでもワークスペース全体を暗号化された `.st` バンドルとしてエクスポートできます。

## インストール

### ソースから

```sh
git clone https://github.com/jcocano/simple-templete.git
cd simple-templete
npm install
npm run dev
```

要件：
- **Node.js 20+**
- `better-sqlite3` のための **C ツールチェーン**：
  - macOS: `xcode-select --install`
  - Debian/Ubuntu: `sudo apt install build-essential python3`
  - Windows: [Visual Studio Build Tools](https://visualstudio.microsoft.com/downloads/)（"Desktop development with C++" を選択）

### ビルド済みバイナリ

まだ提供されていません。v0.1.0 リリースはコード署名と CI/CD を待っている状態です。通知を受け取りたい方は、[リポジトリにスター](https://github.com/jcocano/simple-templete)を付けるか、[リリースをウォッチ](https://github.com/jcocano/simple-templete/releases)してください。

それまでは、ローカルでインストーラーをビルドできます：

```sh
npm run dist
```

バイナリは `release/` に出力されます — macOS 用の `.dmg` / `.zip`、Windows 用の `.exe`、Linux 用の `.AppImage` / `.deb`。

## 日々の使い方

### キーボードショートカット

| ショートカット | アクション |
|---|---|
| `⌘K` / `Ctrl+K` | コマンドパレット |
| `⌘S` / `Ctrl+S` | テンプレートを保存 |
| `⌘D` / `Ctrl+D` | 選択中のブロックまたはセクションを複製 |
| `⌘P` / `Ctrl+P` | プレビューを開く |
| `⌘⇧T` / `Ctrl+Shift+T` | テストメールを送信 |
| `⌘⇧R` / `Ctrl+Shift+R` | プリフライトレビューを開く |
| `⌘Z` / `⌘⇧Z` | Undo / redo |
| `Backspace` / `Delete` | 選択中のブロックまたはセクションを削除 |

### AI エージェントを接続する（MCP クイックスタート）

1. **Settings → MCP** を開きます
2. お使いのクライアント向けの JSON スニペットをコピーします — Claude Desktop と Cursor の両方について、URL とトークンが事前展開された状態で表示されます
3. 次の場所に貼り付けます：
   - Claude Desktop: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Cursor: `~/.cursor/mcp.json`
4. MCP クライアントを再起動します
5. エージェントに `list_templates` / `create_template` / `add_section` などを依頼し、エディタがライブで更新される様子を確認してください

MCP サーバーが応答するためには、アプリが起動している必要があります。アプリを閉じると接続は切断されます（仕様です）。

## 開発者向け

### スクリプト

| Command | Description |
|---|---|
| `npm run dev` | Vite + Electron をライブリロード付きで並行実行（port 5173） |
| `npm run dev:web` | Vite のみ — ブラウザでレンダラーを反復 |
| `npm run dev:electron` | 稼働中の Vite 開発サーバーに対して Electron を起動 |
| `npm run start` | 静的な `dist/index.html` に対して Electron を起動 |
| `npm run build:web` | `dist/` への本番 Vite バンドル |
| `npm run pack` | パッケージ化された `.app` / `.exe` / Linux 展開済み — インストーラーなし |
| `npm run dist` | `release/` への完全なインストーラー（開発マシンでは未署名） |
| `npm run test:export` | フィクスチャに対するエクスポートパイプラインのスモークテスト |
| `npm run build:icons` | `assets/icon.svg` からアプリアイコンを再生成 |

### アーキテクチャ概観

- **Electron シェル**は厳格なセキュリティデフォルト（`contextIsolation: true`、`sandbox: true`、`nodeIntegration: false`、`contextBridge` 経由の preload のみの IPC）
- **React 18 レンダラー**は **globals-on-`window`** モジュール規約に従います。ファイルは `src/main.tsx` から副作用目的でロードされ、`window` に登録されます。詳しい理由は [CLAUDE.md](../../CLAUDE.md) を参照してください。
- **better-sqlite3** でローカルメタデータを、テンプレートドキュメントは JSON ファイルで保持
- **Vite** でバンドル、classic JSX ランタイム（自動注入）
- パイプラインに **TypeScript コンパイラは含まれません** — `.tsx` は JSX の記法のみ
- **カスタム `st-img://` プロトコル** — `webSecurity` を緩めることなくワークスペースの画像を配信
- **MCP SDK**（`@modelcontextprotocol/sdk`）はメインプロセスから動的 `await import()` 経由でロードされます（ESM-only パッケージ）
- **electron-builder** によるクロスプラットフォームパッケージング

### 拡張するなら

| Area | Path |
|---|---|
| レンダラーロジック | `src/lib/` |
| 画面 | `src/screens/` |
| モーダル | `src/modals/` |
| Electron IPC ハンドラ | `electron/ipc/` |
| データ永続化 | `electron/storage/` |
| AI プロバイダ | `electron/ai/` |
| MCP ツール | `electron/mcp/tools.js` |
| i18n 辞書 | `src/lib/i18n/<lang>.tsx` |

完全な開発者ガイド（コミット規約、アーキテクチャ原則、PR チェックリスト）は [CONTRIBUTING.md](../../CONTRIBUTING.md) を参照してください。

### テスト

プロトタイプ段階であり、まだ本格的なテストランナーはありません。PR を開く前の最低限のバー：

1. `npm run test:export` が通ること（3 つのフィクスチャに対するスモークテスト）
2. `npm run dev` で機能を手動で確認すること
3. パッケージングや Electron main に触れた場合は、`npm run pack` も実行し、ビルド済みアプリを開くこと

## ロードマップ

**v0.1（リリース済み）：**
- コアのビジュアルエディタ、保存済みブロックライブラリ、画像ライブラリ、occasions
- 5 つのプロバイダをまたいだ AI（テキスト改善とテンプレート生成）
- 28 種類の型付きツールとエディタのライブロックを備えた MCP サーバー
- HTML / MJML / プレーンテキスト / ZIP へのエクスポート（変数は保持）
- SMTP + OAuth（Gmail、Outlook）のテスト送信
- 7 カテゴリにわたるプリフライトレビュー
- 暗号化された `.st` バンドル + `simpletemplete://` ディープリンクでの共有
- ライブ切り替え対応の 6 言語
- ローカルファーストな SQLite + OS キーチェーンのシークレット

**v0.1.x（次）：**
- コード署名と公証済みビルド（macOS + Windows）
- 自動更新チャネル付きの CI/CD リリースパイプライン
- リリースごとにビルド済みインストーラーを提供

**今後（アイデア、約束ではありません）：**
- video / GIF / map / accordion ブロックのよりリッチな埋め込み
- エクスポート画像の最適化と CDN ドメインの書き換え
- 追加の AI プロバイダ
- より深いレビューチェック

**意図的にスコープ外：**
- 連絡先リスト、送信履歴、開封／クリックトラッキング、ホスティングされた CDN — これらはローカルエディタではなく、お使いの配信プラットフォームに属するものです。

## プロジェクトを応援する

Simple Template は無料かつオープンソースです。お役に立てたなら、以下のどれもがありがたいです：

- **[リポジトリにスターを付ける](https://github.com/jcocano/simple-templete)** — より多くの人に見つけてもらえます
- **[バグを報告する](https://github.com/jcocano/simple-templete/issues/new?template=bug_report.yml)** — 何かが壊れていたら
- **[機能リクエストを送る](https://github.com/jcocano/simple-templete/issues/new?template=feature_request.yml)** — 欲しい機能があれば
- **[翻訳を手伝う](https://github.com/jcocano/simple-templete/issues/new?template=translation.yml)** — タイプミスの修正、表現の改善、または新しい言語の追加
- **[プルリクエストを送る](../../CONTRIBUTING.md)** — 開発セットアップは contributing ガイドを参照してください
- **[ディスカッションに参加する](https://github.com/jcocano/simple-templete/discussions)** — 質問、アイデア、ショーアンドテル
- **[コーヒーを奢る](https://buymeacoffee.com/jesuscocana)** — 継続的な開発を支援したい方はこちら

## コミュニティ

- **[Discussions](https://github.com/jcocano/simple-templete/discussions)** — Q&A、アイデア、ショーアンドテル
- **[Issues](https://github.com/jcocano/simple-templete/issues)** — バグ、機能、翻訳
- **[Releases](https://github.com/jcocano/simple-templete/releases)** — バージョン履歴

参加前に [Code of Conduct](../../CODE_OF_CONDUCT.md) をお読みください。

## セキュリティ

脆弱性を見つけましたか？ 公開 issue は**開かないでください**。責任ある情報開示のプロセスは [SECURITY.md](../../SECURITY.md) を参照してください。

## ライセンス

[MIT](../../LICENSE) © Jesus Cocaño.

Simple Template が時間の節約に役立ったなら、[コーヒーを奢る](https://buymeacoffee.com/jesuscocana)ことをご検討ください。プロジェクトを前進させる力になります。
