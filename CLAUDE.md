# プロジェクト憲法 (CLAUDE.md)

## プロジェクト基本情報

| 項目 | 値 |
|------|-----|
| プロジェクト名 | TILT BREAKOUT |
| 目的 | 回転リング×固定障害物×ブロック崩しを組み合わせたブラウザゲーム |
| リポジトリ | t-sumita/tilt-breakout |
| ブランチ | main |
| 公開URL | https://tilt-breakout.subutomo.dev/ |

---

## アーキテクチャ

- ビルドレス。ES Modules(`<script type="module">`)のみ、外部ライブラリなし。
- `js/config.js` … 版・キャンバス寸法・色・パドル/ボール定数の単一の源
- `js/mathutils.js` … clamp/lerp/座標変換などの純粋関数
- `js/ball.js` … `Ball` エンティティ
- `js/physics.js` … 当たり判定・moción(運動)。矩形/円/十字/三角/回転リングの衝突を扱う
- `js/stages/stage{1,2,3}.js` … 各ステージのデータ定義(`docs/reference/stage-mock.html` 準拠)
- `js/input.js` … パドル入力(ポインタ/タッチ/キーボード)
- `js/renderer.js` … 描画専任(状態を持たない)
- `js/game.js` … 状態機械(title→serve→playing→stageClear/gameOver→win)
- `js/main.js` … 起点。ループ・HUD・バッジ注入の配線

新規ステージを追加する場合も、この6モジュール構成(config/mathutils/ball/physics/stage-data/renderer/game)を維持し、
描画・物理・データを混在させないこと。

---

## 開発ルール

### 指示・コミュニケーション
- CC (Claude Code) への指示は **日本語** で行う
- タスクは **1つずつ** 依頼する。前のタスクが完了してから次を依頼すること

### バージョン管理
- タスク完了ごとに **SemVer** をバンプする (`MAJOR.MINOR.PATCH`)
  - 破壊的変更: MAJOR、機能追加: MINOR、バグ修正: PATCH
- バージョンは `js/config.js` の `APP_VERSION` 単一定数で管理する(qed-arcade の `VERSION` ではなく `APP_VERSION` — talk-prompter/asset-tl 系の命名に統一)
- **他の場所に重複定義しない**

### コミット
- コミットメッセージは **日本語** で書く
- 形式: `種別: 内容の要約` (例: `feat: ステージ2の凹型ブラケットを実装`)
- **`git commit -F <ファイル>` を必ず使う。`-m` は使用禁止**(Windows/PowerShell 経由でマルチバイト文字が文字化けする実績があるため)

### ファイル操作
- 日本語を含むファイルの作成・編集は必ず **Edit/Write ツール** を使う
- **PowerShell 経由の日本語書き込みは禁止**(UTF-8 破損の実績があるため)
- バイナリ/非日本語ファイル(画像・JSON設定など)のコピーのみ Bash `cp` 可

### ステージ設計の最重要原則
- すべてのステージは **理論上 100% クリア可能** でなければならない
- 回転・可動ジャマーの配置は、狙えば必ず抜けられる「本物の隙間」を常に確保すること
- 見た目の緊張感(狭く見える隙間)は許容するが、理論上絶対に抜けられない配置は禁止
- ジャマー追加・改修時は、最大可動範囲でも通過可能な隙間が残ることを幾何的に確認してからコミットする

### ステージ実装の参照元
- `docs/reference/stage-mock.html` は使い捨ての確認用モックだが、**色・フレーム装飾・パドル操作・3ステージの障害物配置は正**として踏襲する
- とくにステージ2の中央凹型ブラケット構造と回転ジャマーの幾何関係は、モックの数値をそのまま実装の基準にする

### 認証方針
- 認証は **デフォルトで実装しない**
- 管理機能が必要になった時点で、脅威モデルを定義してから方式を選定する

### ステータス管理
- 作業状況は `STATUS.md` に記録する
- 実装計画は `PLAN.md` に記録する

---

## サイト共通部品(Subutomo 統一仕様)

- `assets/subutomo-badge.js` を読み込み、`SUBUTOMO_BADGE_CONFIG.currentSiteId = "tilt-breakout"` を設定する
- フッターは `footer-right` / `support-links` 構造(Ko-fi + GitHub Sponsors + Feedback)。**© 行はフッターHTMLに書かない**(バッジ側が担当)
- フィードバックフォームは qed-arcade と同一の Google フォームを流用し、`entry.2036331541` のみ本サイト用の値に変更する
- `config/subutomo-sites.json` はローカル参照コピー(正本は subutomo-template 側)。本サイトは台帳への自エントリ追加を**していない**(判断根拠は STATUS.md 参照)
