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
  features/trackpoint/  仮想トラックポイントのロジック
  hooks/                カスタムフック
  types/                型定義（ZMK 風キーマップなど）
  data/                 デフォルトのキーマップ JSON など
  utils/                汎用ユーティリティ
```
