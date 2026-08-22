# STATUS.md — 作業状況

## 現在のバージョン
`0.1.0`

## 最終更新
2026-08-22

## 状態
- [x] リポジトリ初期化(ローカル、`main` ブランチ)
- [x] コアゲーム実装(config/mathutils/ball/physics/stages/input/renderer/game/main)
- [x] サイト共通部品の配線(バッジ/フッター/manifest/favicon プレースホルダ/Cloudflare Analytics プレースホルダ)
- [x] 3点セット(CLAUDE.md/STATUS.md/PLAN.md)作成
- [x] `.claude/settings.json` 作成(acceptEdits + git push 系拒否)
- [x] ローカルサーバー+Playwright での動作確認(タイトル→発射→プレイ→パドル反射→スコア加算まで確認、エラーなし)
- [ ] GitHub リポジトリ作成・初回コミット・push(このセッションの残タスク)
- [ ] GitHub Pages 公開

## 直近の変更
- `0.1.0`: 初回実装。`docs/reference/stage-mock.html` を正として、3ステージ(クラシック配置/凹型ブラケット要塞/三重回転リング)・2Dパドル操作(傾き連動・スマホ2本指対応)・スコア/ライフ/ステージ進行の状態機械を実装。Subutomo 共通フッター/バッジ/manifest/favicon(プレースホルダ)を配線。

## 動作確認メモ
- ローカル `python -m http.server 8791` + Playwright ヘッドレス Chromium で title→serve→playing の一連の遷移、1本指ドラッグでのパドル移動、ブロック破壊によるスコア加算(0000→0020)を確認。
- コンソールエラーは Cloudflare Analytics のプレースホルダトークンによる CORS エラーのみ(実トークン登録後に解消する想定。コードのバグではない)。
- ステージ2・3は幾何定義をモックの数値からそのまま移植しており、目視での個別プレイ確認(要塞ステージの凹型ギャップ・三重リングの隙間)は未実施。**次回セッションでの優先確認事項。**

---

## このセッションでの判断ログ(ユーザー確認を省略し、最も妥当と判断して決定した事項)

1. **`config/subutomo-sites.json` 台帳への自エントリ追加を見送った。** qed-arcade からそのままコピーし、`tilt-breakout` の項目は追加していない。台帳の正本は `subutomo-template` 側にあるため、勝手に改変せず現状維持を選択。追加が必要なら別途判断すること。
2. **`scripts/drive.mjs`(Playwright 動作確認ドライバ)はコミット対象から除外し `.gitignore` に追加した。** このマシン固有の絶対パス(`C:/Users/subut/AppData/Local/npm-cache/_npx/...`)をハードコードしており、他環境では動かないため。`scripts/shots/`(スクリーンショット)も同様にローカル専用として除外。
3. **favicon/apple-touch-icon はプレースホルダ。** Pillow 非依存の自前 PNG エンコーダ(`scripts/gen_favicon.py`)でインディゴ×シアンのリング+パドル+ボールを描いた簡易デザインを生成。本番デザインへの差し替えが必要(PLAN.md フェーズ3に記載)。
4. **Cloudflare Web Analytics のトークンはプレースホルダ(`PLACEHOLDER_TOKEN_REGISTER_LATER`)のまま。** 実トークンは Cloudflare 側での登録が必要なため後日差し替え(PLAN.md フェーズ3に記載)。
5. **版定数名は `APP_VERSION` を採用。** ユーザー指示により qed-arcade の `VERSION` ではなく talk-prompter/asset-tl 系の命名に統一。`js/config.js` 単一箇所で管理。
6. **フィードバックフォームの `entry.2036331541` 値は `TILT BREAKOUT (tilt)` とした。** 「tilt-breakout であることが分かる相当の値」という指示に対する具体的な文字列の選定。
7. **フッターに `©` 行を書かない方針を厳守。** Subutomo バッジ(`subutomo-badge.js`)側が担当する仕様のため、`index.html` にはコピーライト行を含めていない。
8. **`.claude/settings.json` は今回限りでなく今後の通常セッションの標準設定として作成。** `defaultMode: "acceptEdits"` + `git push` 系コマンドのみ拒否。今回セッションの push 許可はこの設定とは別に、ユーザーからの明示的な一回限りの許可に基づく。
9. **ボール発射角の計算式は自己設計。** モックには発射角の仕様が明記されていなかったため、`launchAngleDeg`(基準 -68°)を中心に、パドル傾き `tilt / maxTiltDeg` に応じて左右に振る式を独自に採用(`game.js` の `_launchFromPaddle`)。常に上方向へ飛ぶことを優先。
10. **衝突解決は1フレームにつき1イベントのみ処理する方式を採用。** 複数形状に同時衝突した場合の処理を単純化し、安定性を優先(貫通・多重ヒットのバグを避けるための設計判断)。
11. **ステージ2の回転十字ジャマーと中央スクエアの最小クリアランス(≥20px)は、アーム最大伸長時の半径とブラケットギャップ位置の幾何計算で確保されるよう定数を設定。** モックの数値(`cross jammer x:∓75, size:34` 等)をそのまま採用しつつ、「クリア不能な配置を作らない」という最重要原則に沿って値を検証済み(詳細な再検証はフェーズ3以降の目視確認で継続)。
12. **ステージ3の中央コアHPは初回ヒット時に 10〜99 のランダム2桁整数を確定させ、以後固定する方式。** 「?」表示から実数値表示への切り替えタイミングをヒット時点と解釈。
13. **README は今回作成していない。** ユーザー指示は CLAUDE.md/STATUS.md/PLAN.md の3点セットのみだったため、README の新規作成は範囲外と判断し見送った。
