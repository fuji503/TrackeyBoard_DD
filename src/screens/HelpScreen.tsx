import type { CSSProperties, ReactNode } from 'react'
import KeyCap from '../components/KeyCap'
import { DEFAULT_KEYMAP } from '../data/keymaps'
import { buildKeyViews } from '../features/keymap/view'
import type { ScreenId } from '../hooks/useHashScreen'

const SECTIONS = [
  { id: 'about', title: 'このデモンストレータについて' },
  { id: 'screen', title: '画面の構成' },
  { id: 'legend', title: 'キーの見方' },
  { id: 'gesture', title: '4つの入力方法（タップ・ホールド・フリック・グライド）' },
  { id: 'mode', title: 'モードの切り替え（キーボード / トラックパッド / トラックポイント）' },
  { id: 'os', title: 'OS の切り替え' },
  { id: 'text', title: 'テキスト欄と HID キーコード履歴' },
  { id: 'console', title: '設定コンソール（キーボードサイズ・操作感の調整）' },
  { id: 'editor', title: 'キーボードエディタ' },
  { id: 'io', title: 'エクスポート / インポート' },
  { id: 'notes', title: '注意事項・よくある質問' },
] as const

type SectionId = (typeof SECTIONS)[number]['id']

const scrollTo = (id: SectionId) => document.getElementById(`help-${id}`)?.scrollIntoView({ behavior: 'smooth' })

export default function HelpScreen({ onNavigate }: { onNavigate?: (id: ScreenId) => void }) {
  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-8 p-6 text-sm leading-relaxed text-slate-700">
      <header className="flex flex-col gap-2">
        <h2 className="text-xl font-bold text-slate-900">使い方</h2>
        <p>
          TrackeyBoard デジタルデモンストレータ（DD）の操作方法をまとめたページです。まずは
          <ScreenLink id="simulator" onNavigate={onNavigate}>
            メイン画面
          </ScreenLink>
          でキーボードを触ってみて、分からないところをここで確認してください。
        </p>
        <nav className="mt-2 rounded border border-slate-200 bg-white p-3">
          <div className="mb-1 text-xs font-bold text-slate-500">目次</div>
          <ol className="list-decimal pl-5">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <button type="button" className="text-left text-blue-700 hover:underline" onClick={() => scrollTo(s.id)}>
                  {s.title}
                </button>
              </li>
            ))}
          </ol>
        </nav>
      </header>

      <Section id="about">
        <p>
          <b>TrackeyBoard BM</b> は、メカニカルスイッチを持たない一枚の基板だけで作る、薄くて小さなモバイルキーボードです。
          キーを「押す」のではなく、基板の表面を<b>タップ・フリック</b>して入力し、同じ面をトラックパッドやトラックポイントとしても使えます。
        </p>
        <p>このデモンストレータは、その入力体験を実機ができる前にブラウザ上で再現・検証するためのものです。</p>
        <ul className="list-disc pl-5">
          <li>スマホのフリック入力のような操作でキーボードが打てるかを試す</li>
          <li>判定時間や移動距離などの設定値を変えて、操作感を比べる</li>
          <li>キー配列・キーマップを編集して、JSON で保存・共有する</li>
          <li>実機が送る予定の HID キーコード（USB キーボード / マウスの信号）を確認する</li>
        </ul>
        <Tip>
          おすすめは <b>iPad を横向き</b>にしての操作です。画面が大きいほど、実機と同じキーの大きさ（キーピッチ 17mm）で試せます。
          マウスでもクリックとドラッグで一通り操作できますが、複数の指を使う操作（Shift を押しながら入力、2本指スクロールなど）はタッチ画面が必要です。
        </Tip>
      </Section>

      <Section id="screen">
        <p>画面左上の ☰（ハンバーガーメニュー）から、次の画面を切り替えます。</p>
        <Table
          head={['画面', '内容']}
          rows={[
            ['メイン画面（シミュレータ）', 'キーボードを触って入力を試す画面'],
            ['キーボードエディタ', 'キー配列やキーごとの入力内容を編集する画面'],
            ['エクスポート / インポート', 'キーマップを JSON・画像で保存したり、読み込んだりする画面'],
            ['使い方', 'このページ'],
          ]}
        />
        <p>メイン画面は、上に3つのパネル、下にキーボードが並んでいます。</p>
        <Table
          head={['場所', '内容']}
          rows={[
            ['HIDキーコード履歴（左）', '入力のたびに、送られた HID キーコードが記録されます'],
            ['キー入力テキスト欄（中央）', '入力した文字が表示されます。パソコンの画面に相当します'],
            ['設定コンソール（右）', 'キーボードの大きさや操作感を調整します'],
            ['キーボードの左上', '今のモードと OS を色付きの丸で表示します（実機の LED に相当）'],
          ]}
        />
      </Section>

      <Section id="legend">
        <div className="flex flex-wrap items-center gap-6">
          <SampleKey index={18} />
          <ul className="flex-1 list-disc pl-5">
            <li>
              <b>中央の大きな文字</b>: タップで入力（この例では J）
            </li>
            <li>
              <b>上下左右の青い小さな文字</b>: その方向へフリック（またはグライド）で入力（上 Home、下 [、左 {'{'}、右 {'}'}）
            </li>
          </ul>
        </div>
        <div className="flex flex-wrap items-center gap-6">
          <SampleKey index={33} />
          <ul className="flex-1 list-disc pl-5">
            <li>
              <b>右下の赤い [ ] の文字</b>: Mac / iOS のときの入力（Win キーが Opt に、無変換が英数に、など）
            </li>
            <li>
              <b>点線の枠のキー</b>（Tab と 3つの Space）: トラックパッドモードで特別な役割を持つキー
            </li>
            <li>
              <b>G・H・B・N の交点の赤い点</b>: バーチャルトラックポイント（VTP）
            </li>
          </ul>
        </div>
      </Section>

      <Section id="gesture">
        <p>キーボードはスマホのフリック入力と同じ考え方で、1つのキーに最大5つの入力（中央 + 上下左右）があります。</p>
        <Table
          head={['操作', 'やり方', '入力されるもの']}
          rows={[
            ['タップ', 'キーに触れて、動かさずに離す', '中央の文字'],
            ['フリック', 'キーに触れて上下左右にずらしてから離す', 'その方向の文字。何度動かしても、離した時点の方向で 1 回だけ入力'],
            [
              'ホールド',
              'キーに触れたまま指を止めて待つ（既定 0.4 秒）',
              '文字キーなら連続入力、Shift などの修飾キーなら押しっぱなし。フリックした先でもホールドできます',
            ],
            [
              'グライド',
              'キーに触れて、その方向へ指を滑らせ続ける',
              '滑らせた距離に応じて連続入力（既定では 0.5 キー分ごとに 1 回）。止めるとホールドに切り替わります',
            ],
          ]}
        />
        <h4 className="font-bold text-slate-800">使い分けのコツ</h4>
        <ul className="list-disc pl-5">
          <li>普段の入力は <b>タップ</b> と <b>フリック</b>、続けて同じ文字を打つときは <b>ホールド</b> です。</li>
          <li>
            <b>グライド</b> は「何回押すか」を指の移動距離で調整したいキーに使います。既定では <b>, キーの矢印（↑↓←→）</b>と
            <b> Ent キー左の BS</b> だけがグライドです。カーソルを 3 文字戻す、3 文字消す、といった操作が指の移動だけでできます。
          </li>
          <li>1 つの方向はフリックかグライドのどちらか一方です（キーボードエディタで方向ごとに切り替えられます）。</li>
          <li>
            Shift や Ctrl は<b>ホールドしたまま、別の指で他のキーを入力</b>します（例: Shift をホールドして A をタップ → 大文字 A）。
          </li>
          <li>入力中は、キーの色と、選ばれている方向の文字のハイライトで状態が分かります（水色: 入力中、黄: ホールド、緑: グライド）。</li>
        </ul>
      </Section>

      <Section id="mode">
        <p>
          実機は 1 枚の基板を、キーボード・トラックパッド・トラックポイントの 3 通りに使い分けます。今のモードはキーボード左上の
          「モード」表示で確認できます（緑: キーボード、橙: トラックパッド、青: トラックポイント）。
        </p>
        <Table
          head={['切り替え', '操作']}
          rows={[
            ['キーボード → トラックパッド', 'Tab キーを下へフリック'],
            ['トラックパッド → キーボード', 'Tab の位置から触り始めて下へフリック（Tab から他の方向に動かした場合はカーソル移動になります）'],
            ['キーボード → トラックポイント', '赤い点（VTP）に触れたまま少し待つ（既定 0.25 秒）'],
            ['トラックポイント → キーボード', 'VTP から指を離すと自動で戻ります'],
          ]}
        />
        <p>
          トラックパッド・トラックポイントで動かすマウスカーソルは、<b>キー入力テキスト欄の中にだけ表示される仮想のカーソル</b>です（パソコンやタブレットのカーソルは動きません）。
          左クリックするとテキストのその位置に文字カーソルが移ります。
        </p>
        <h4 className="font-bold text-slate-800">トラックパッドモード</h4>
        <Table
          head={['操作', '動作']}
          rows={[
            ['1 本指でなぞる', 'カーソル移動（速く動かすほど遠くまで動きます）'],
            ['1 本指でタップ', '左クリック'],
            ['2 本指でタップ', '右クリック'],
            ['2 本指でなぞる', 'スクロール'],
            ['下段の Space 3 つ', '左クリック / 中クリック / 右クリックのボタン'],
            ['左の Space を押したまま別の指でなぞる', 'ドラッグ（テキストの範囲選択）'],
          ]}
        />
        <p className="text-xs text-slate-500">ダブルタップや長押しでのドラッグは、実機の仕様に合わせて入れていません。</p>
        <h4 className="font-bold text-slate-800">トラックポイントモード</h4>
        <p>
          ThinkPad の赤いポッチをイメージしたものです。VTP に触れた最初の位置を基準に、<b>指をずらした量でカーソルの速さ</b>が決まります（ジョイスティックのような操作）。
          モード中に使えるのは VTP と下段の Space 3 つだけです。
        </p>
        <Table
          head={['操作', '動作']}
          rows={[
            ['VTP に触れたまま指をずらす', 'カーソル移動（大きくずらすほど速い）'],
            ['左 / 右の Space', '左クリック / 右クリック（左を押したまま VTP を動かすとドラッグ）'],
            ['中央の Space を押したまま VTP を動かす', 'スクロール'],
            ['中央の Space を動かさずに離す', '中クリック'],
          ]}
        />
        <Tip>
          VTP は G・H・B・N のキーの角にあるため、素早く触ったときや、待つ前に指を動かしたときの扱いを設定コンソールで切り替えられます（下のキーの入力にする / 何もしない など）。
          実機での最適な挙動を探るための検証用の設定です。
        </Tip>
      </Section>

      <Section id="os">
        <p>実機は接続先の OS に合わせて、修飾キーや日本語入力キーの働きを切り替えます。</p>
        <ol className="list-decimal pl-5">
          <li>
            左下の <b>Ctrl を上へフリック</b>すると OS 切替待機になります（OS 表示が点滅）。
          </li>
          <li>
            <b>Q</b>（Win/Linux）・<b>W</b>（Mac）・<b>E</b>（Android）・<b>R</b>（iOS）のどれかをタップします。
          </li>
          <li>それ以外のキーに触れるか、3 秒たつとキャンセルされます。</li>
        </ol>
        <Table
          head={['OS', '主な違い']}
          rows={[
            ['Win/Linux', '無変換・変換キーはそのまま（OS 表示は緑）'],
            ['Android', '無変換 → 英数、変換 → かな（OS 表示は緑）'],
            ['Mac / iOS', '英数・かなに加え、Win → Opt、Alt → Cmd、Tab の上フリック → Fn🌐（OS 表示は橙）'],
          ]}
        />
      </Section>

      <Section id="text">
        <h4 className="font-bold text-slate-800">キー入力テキスト欄</h4>
        <p>
          キーボードから送られた信号を、<b>JIS 配列のパソコンが受け取ったときの入力結果</b>として表示します。
          青い縦線が文字カーソルで、矢印・Home・End・BS・Del もパソコンと同じように働きます。
        </p>
        <ul className="list-disc pl-5">
          <li>「空白・改行を表示」にチェックすると、スペースを □、改行を ↵ で表示します。</li>
          <li>Shift をホールドしたまま矢印・Home・End を入力すると、範囲選択になります（選択中の入力は置き換え、BS / Del は削除）。</li>
          <li>Ctrl などを押しながらの入力はショートカット扱いのため、文字は入りません。</li>
          <li>日本語変換（IME）は再現していないので、かな入力や変換はできません。</li>
        </ul>
        <h4 className="font-bold text-slate-800">HID キーコード履歴</h4>
        <p>実機がパソコンへ送る予定の信号を、新しいものが下に来る順で表示します。</p>
        <Table
          head={['表示の例', '意味']}
          rows={[
            ['tap / flick↑ / glide← / hold / release', '操作の種類と方向'],
            ['KC_LSFT+KC_2  0x1F  "', '送られたキー（修飾キー付き）、HID の番号、入力される文字'],
            ['mode', 'モードや OS の切り替え'],
            ['MOUSE dx=+46 dy=+12 / WHEEL v=-3', 'マウスの移動量・スクロール量（指を離すまでの合計）'],
            ['BTN1 / BTN2 / BTN3', 'マウスの左 / 右 / 中ボタン'],
          ]}
        />
      </Section>

      <Section id="console">
        <p>設定はこのブラウザに自動で保存されます。各項目は見出しを押すと開閉でき、「既定値に戻す」で初期値に戻せます。</p>
        <h4 className="font-bold text-slate-800">キーボードサイズ（実機と同じ大きさで試す）</h4>
        <p>
          ブラウザからは画面の物理的な大きさが分からないため、次の手順で一度だけ補正してください（端末ごとに必要です）。
        </p>
        <ol className="list-decimal pl-5">
          <li>「実機サイズ (17mm)」を押す</li>
          <li>画面上のキー 1 個の幅（枠線から枠線まで）を定規で測る</li>
          <li>測った値を「実測補正」に入力して「補正」を押す</li>
        </ol>
        <p>これで以降の「17mm」がほぼ実寸になります。キーピッチは数値入力や − / ＋ ボタン（0.1mm 刻み）でも変えられます。</p>
        <h4 className="font-bold text-slate-800">ジェスチャー判定・トラックパッド・トラックポイント</h4>
        <Table
          head={['項目', '内容']}
          rows={[
            ['ホールド判定', '指を止めてからホールドになるまでの時間'],
            ['フリック距離 / グライド幅', 'フリックと判定する距離 / グライドで 1 回入力する距離（キー幅に対する比率と、実機での mm）'],
            ['カーソル速度・加速・スクロール幅', 'トラックパッドの操作感'],
            ['VTP 半径・移行時間・移行前の扱い', 'VTP への入り方'],
            ['不感帯・最大ずらし・最高速度・感度カーブ', 'トラックポイントの操作感（指をずらした量 → カーソル速度）'],
          ]}
        />
      </Section>

      <Section id="editor">
        <ol className="list-decimal pl-5">
          <li>上のキーボードで、編集したいキーをタップします（赤枠で選択）。</li>
          <li>右側の十字で、編集する方向（タップ / 上下左右）を選びます。</li>
          <li>下の一覧からキーコードを選ぶと割り当てられます。「修飾を付ける」で Ctrl + C などのショートカットも割り当てられます。</li>
        </ol>
        <ul className="list-disc pl-5">
          <li>「編集するレイヤー」で、Mac/iOS 用の差し替えや、トラックパッド / トラックポイント中のボタンなども編集できます。</li>
          <li>「キー配列の編集」タブでは、キーの位置・大きさ、行・列の追加と削除、VTP の位置を変えられます。</li>
          <li>「元に戻す / やり直す」は、エディタ画面を開いている間だけ使えます。</li>
          <li>編集内容はメイン画面にすぐ反映され、ブラウザに保存されます。</li>
        </ul>
      </Section>

      <Section id="io">
        <Table
          head={['操作', '内容']}
          rows={[
            ['キーマップ名', 'ダウンロードするファイル名になります（例: 「テスト配列」→ テスト配列.json）'],
            [
              'キーマップ JSON ダウンロード',
              'キー配列・キーマップと、設定コンソールの値（ジェスチャー判定・トラックパッド・トラックポイント）を保存します。キーボードサイズは端末ごとの値なので含みません',
            ],
            ['キーマップ JSON アップロード', '保存した JSON を読み込み、設定値も復元します。形式が正しくない場合は理由を表示して中止します'],
            ['キーマップ画像ダウンロード', 'キーボードの印字を PNG 画像で保存します'],
            ['キーマップを既定に戻す', '初期の配列（BM 配列 v3.5）に戻します'],
          ]}
        />
        <Tip>
          設定を変えて試した結果を人に共有するときは、JSON をダウンロードして送り、相手にアップロードしてもらうと同じ状態を再現できます。
        </Tip>
      </Section>

      <Section id="notes">
        <dl className="flex flex-col gap-3">
          <Qa q="データはどこに保存されますか？">
            すべて使っているブラウザの中だけに保存され、サーバーには送られません。別の端末やブラウザとは共有されないので、移すときは JSON のエクスポート / インポートを使ってください。
            プライベートブラウズでは、閉じると消えることがあります。
          </Qa>
          <Qa q="キーボードの上でスワイプしても画面がスクロール・リロードしません">
            フリック操作の邪魔にならないよう、キーボード上ではブラウザのスクロールや引っ張ってのリロードを止めています。パネルや画面のスクロールは、キーボード以外の場所で行ってください。
          </Qa>
          <Qa q="US 配列のパソコンでの動きは確認できますか？">
            日本語ユーザー向けのため、接続先は JIS 配列のパソコンを前提にしています。記号の HID キーコードも JIS 配列に合わせています。
          </Qa>
          <Qa q="実機との違いはありますか？">
            画面のタッチと基板のタッチセンサーでは、反応のしかたや指の滑り具合が異なります。キーの大きさを実寸に合わせても、操作感は目安として捉えてください。
          </Qa>
          <Qa q="おかしな状態になったら">
            画面を再読み込みしてください。キーマップを初期に戻すには「エクスポート / インポート」の「キーマップを既定に戻す」、設定値は設定コンソールの「既定値に戻す」を使います。
          </Qa>
        </dl>
      </Section>
    </article>
  )
}

function Section({ id, children }: { id: SectionId; children: ReactNode }) {
  const title = SECTIONS.find((s) => s.id === id)?.title
  return (
    <section id={`help-${id}`} className="flex scroll-mt-4 flex-col gap-3">
      <h3 className="border-b border-slate-200 pb-1 text-base font-bold text-slate-900">{title}</h3>
      {children}
    </section>
  )
}

function Table({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h} className="border border-slate-200 bg-slate-100 px-2 py-1 font-bold whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j} className={`border border-slate-200 bg-white px-2 py-1 align-top ${j === 0 ? 'font-medium whitespace-nowrap' : ''}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Tip({ children }: { children: ReactNode }) {
  return <p className="rounded border-l-4 border-blue-400 bg-blue-50 px-3 py-2 text-slate-700">{children}</p>
}

function Qa({ q, children }: { q: string; children: ReactNode }) {
  return (
    <div>
      <dt className="font-bold text-slate-800">Q. {q}</dt>
      <dd className="pl-4">{children}</dd>
    </div>
  )
}

function ScreenLink({ id, onNavigate, children }: { id: ScreenId; onNavigate?: (id: ScreenId) => void; children: ReactNode }) {
  return (
    <button type="button" className="mx-0.5 text-blue-700 underline" onClick={() => onNavigate?.(id)}>
      {children}
    </button>
  )
}

/** 既定キーマップのキー1個を見本として表示する */
function SampleKey({ index }: { index: number }) {
  const view = buildKeyViews(DEFAULT_KEYMAP)[index]
  const pitch = 96
  return (
    <div
      className="relative shrink-0 border-t-2 border-l-2 border-slate-400"
      style={{ '--pitch': `${pitch}px`, width: pitch, height: pitch } as CSSProperties}
      aria-hidden
    >
      <KeyCap view={{ ...view, rect: { ...view.rect, x: 0, y: 0 } }} />
    </div>
  )
}
