# TrackeyBoard DD

物理デバイス「TrackeyBoard」の入力体験（タップ / ホールド / フリック / グライド）とトラックポイント操作をブラウザ上で再現・検証するデジタルデモンストレータ。

## 開発

```sh
npm install
npm run dev      # 開発サーバ
npm run build    # 型チェック + 本番ビルド (dist/)
npm run lint     # oxlint
```

## ディレクトリ構成

```
src/
  screens/              画面単位のコンポーネント（シミュレータ / エディタ / トラックポイント）
  components/           共通 UI コンポーネント（ハンバーガーメニュー、キーボード描画など）
  features/gesture/     タップ・ホールド・フリック・グライド判定ロジック
  features/keymap/      キーマップ解析、HID キーコード表、ジェスチャー → HID 変換エンジン
  features/text/        テキスト欄（ホスト OS 側）の編集モデル
  features/trackpoint/  仮想トラックポイントのロジック
  hooks/                カスタムフック
  types/                型定義（ZMK 風キーマップなど）
  data/keymaps/         既定のキーマップ JSON（BM 配列 v3.5）
  utils/                汎用ユーティリティ
```

## キーマップ JSON

ZMK の概念（物理レイアウト・レイヤー・`&kp` 等のバインディング）に合わせた形式です。
型定義は [src/types/keymap.ts](src/types/keymap.ts)、例は [src/data/keymaps/trackeyboard-bm-v35.json](src/data/keymaps/trackeyboard-bm-v35.json)。

- `layout.keys`: 各キーの位置と大きさ（単位: キーピッチ）
- `layers[].bindings`: キーごとに方向別のバインディング（`center`=タップ, `up`/`down`/`left`/`right`=フリック/グライド）
  - `glide`: グライド入力にする方向、`legend`: 印字の上書き
  - 省略した方向は下位レイヤーへ透過（`&trans`）
- `layers[].activation`: `always`（ベース）/ `os`（指定 OS で有効）/ `os_select`（OS 切替待機中）
  - 既定キーマップのレイヤー: `base` → `kana_eisu`（Mac/iOS/Android: 無変換・変換を英数・かなに）→ `apple`（Mac/iOS: Opt/Cmd, Fn🌐）→ `os_select`
- ビヘイビア: `&kp <keycode>`, `&none`, `&trans`, `&os_sel`, `&os_set <WIN|MAC|ANDROID|IOS>`, `&tp_toggle`
- キーコード名は ZMK 標準名。JIS 配列ホストで位置が異なる記号は `JP_` 接頭辞（例: `JP_AT`, `JP_DQT`）。修飾関数 `LS(...)` 等も使用可

ホスト OS は JIS 配列を前提とします（日本語ユーザー向けのため US 配列は対象外）。HID コードから JIS 配列での入力文字を求めてテキスト欄に表示します。

## デプロイ (GitHub Pages)

`main` ブランチへ push すると [.github/workflows/deploy.yml](.github/workflows/deploy.yml) が走り、ビルド結果が GitHub Pages に公開されます（Actions タブから手動実行も可）。

初回のみ、リポジトリの **Settings → Pages → Build and deployment → Source** を **GitHub Actions** に設定してください。

公開 URL: https://fuji503.github.io/TrackeyBoard_DD/
