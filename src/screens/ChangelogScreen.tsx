interface Release {
  version: string
  date: string
  title: string
  changes: string[]
}

// 新しい版を先頭に追加する
const RELEASES: Release[] = [
  {
    version: '1.1',
    date: '2026-10-17',
    title: '表記の統一と改版履歴',
    changes: [
      '「キーマップ JSON ダウンロード / アップロード」を「キーマップ JSON エクスポート / インポート」に表記変更（画面・使い方・メッセージ）',
      'メニューに「改版履歴」画面を追加',
    ],
  },
  {
    version: '1.0',
    date: '2026-10-12',
    title: '使い方ページ',
    changes: [
      'メニューに「使い方」画面を追加（目的、画面構成、キーの見方、4つの入力方法、モード・OS の切り替え、テキスト欄と HID 履歴、設定コンソール、エディタ、エクスポート / インポート、よくある質問）',
      '目次から各項目へスクロール',
      '画面を切り替えたらスクロール位置を先頭に戻すように変更',
    ],
  },
  {
    version: '0.6',
    date: '2026-10-11',
    title: 'テキスト選択、エクスポート画像への VTP 表示',
    changes: [
      'テキスト欄で範囲選択（左ボタンを押しながらドラッグ、Shift + 矢印 / Home / End）。入力で置き換え、BS / Del で削除',
      'エクスポートするキーマップ画像に VTP を表示',
      'HID キーコード履歴パネルをテキスト欄の左へ移動',
      'トラックポイント試験画面をメニューから削除（設定は設定コンソールへ）',
    ],
  },
  {
    version: '0.5',
    date: '2026-10-11',
    title: 'トラックパッドモードとバーチャルトラックポイント（VTP）',
    changes: [
      'トラックパッドモード: Tab の下フリックで切り替え。1本指で移動、タップで左クリック、2本指タップで右クリック、2本指スクロール',
      'トラックパッド中は Space キーが左・中・右ボタン。押しながら移動でドラッグ',
      'テキスト欄に仮想マウスカーソルを表示。左クリックでキャレットを移動',
      'VTP: G/H/B/N の角をホールドしてトラックポイントモードへ。不感帯・最高速度・感度カーブなどを設定可能',
      'ThinkPad 方式の中ボタン（押しながら移動でスクロール、動かさず離すとクリック）',
      'トラックパッド / トラックポイント用のモードレイヤーを追加し、エディタで編集可能に。VTP の位置をキーマップに保存',
      'モード表示（LED1）、ポインタ設定を設定コンソールと JSON に追加',
      '既存のキーマップは既定のモードレイヤーを補って読み込み',
    ],
  },
  {
    version: '0.4',
    date: '2026-10-11',
    title: 'キーボードエディタ',
    changes: [
      'キーと方向を選び、キーコード一覧から割り当て（Shift / Ctrl / Alt / GUI 修飾付きも可）',
      '方向ごとのフリック / グライド指定、印字の上書き、割り当ての解除',
      'レイヤーの切り替え。下位レイヤーから引き継ぐ印字は薄く表示',
      'キー配列の編集: 位置・大きさ（0.25u 単位）、キーの追加と削除、行・列の追加と削除、重なりの警告',
      'エディタ画面での元に戻す / やり直す',
      '印字に修飾名を表示（Ctrl+C など）',
    ],
  },
  {
    version: '0.3',
    date: '2026-10-11',
    title: 'エクスポート / インポート画面、Android の英数 / かな',
    changes: [
      'エクスポート / インポート画面を追加: キーマップ名（ファイル名）、キーマップ JSON の保存（ジェスチャー設定を含む）と読み込み（検証と設定の復元）、キーマップ画像の保存、既定（BM 配列 v3.5）に戻す',
      'キーマップと設定を画面間で共有し、ブラウザに保存',
      'Android でも英数 / かな（LANG2 / LANG1）を使用。変換 / 無変換は Windows のみ',
      '接続先は JIS 配列のパソコンを前提に',
    ],
  },
  {
    version: '0.2',
    date: '2026-10-11',
    title: 'テキスト欄、キーボードサイズ調整、キーマップ JSON と HID 変換',
    changes: [
      'テキスト欄: 点滅するキャレット、矢印 / Home / End / Del での編集、空白記号（□ ↵）の表示',
      'キーボードサイズ: キーピッチ（mm）の指定、幅に合わせる、17mm 実寸、定規による校正。端末ごとに保存',
      '設定コンソール: すべての設定に数値入力と − / + ボタン。グライド幅の既定値を 0.5 に',
      'ZMK 風のキーマップ JSON（物理レイアウト + レイヤー + 方向別バインディング）と、BM 配列 v3.5 の既定キーマップ',
      'HID キーコード変換エンジン（修飾キー、連続入力、グライド、OS 切り替え）',
      'HID キーコード履歴に QMK 風の名前・コード・入力文字を表示',
      'ヘッダーにバージョンを表示',
    ],
  },
  {
    version: '0.1',
    date: '2026-10-11',
    title: '最初の版',
    changes: [
      'ハンバーガーメニューによる画面の切り替え',
      'タップ / ホールド / フリック / グライドの判定',
      'BM 配列 v3.5 の仮キーボードを表示',
      'キーボード上でブラウザのスクロール・リロード・拡大・長押しメニューを抑止',
      'GitHub Pages で公開',
    ],
  },
]

export default function ChangelogScreen() {
  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-6 p-6 text-sm leading-relaxed text-slate-700">
      <h2 className="text-xl font-bold text-slate-900">改版履歴</h2>
      {RELEASES.map((r) => (
        <section key={r.version} className="flex flex-col gap-2 border-t border-slate-200 pt-4">
          <h3 className="flex flex-wrap items-baseline gap-x-3 text-base font-bold text-slate-900">
            <span>v{r.version}</span>
            <span className="text-xs font-normal text-slate-500">{r.date}</span>
            <span className="font-medium">{r.title}</span>
          </h3>
          <ul className="list-disc pl-5">
            {r.changes.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </section>
      ))}
    </article>
  )
}
