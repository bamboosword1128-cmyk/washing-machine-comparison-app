# 洗濯機説明ナビ 2025–2026

ノジマ店頭スタッフ向けの静的Webアプリです。このフォルダだけで起動・公開できます。

公開URL: https://bamboosword1128-cmyk.github.io/washing-machine-comparison-app/

## 主な機能

- 102基本機種をメーカー・発売年・タイプ・洗濯容量・乾燥容量・乾燥方式で絞り込み
- ヒートポンプ式、自動投入、温水洗浄、乾燥フィルターのお手入れをワンタップで絞り込み
- 最大4機種を横並び比較し、異なる項目を自動強調
- 「差分のみ表示」と、事実だけで構成する「主な違い」サマリー
- 全自動洗濯機では不要な乾燥比較項目を非表示
- 詳細画面から、公式カタログのページ範囲と公式仕様ページを確認
- 360px幅のスマートフォン、タブレット、PCに対応

## ローカル起動

`洗濯機説明ナビ.command` をダブルクリックするか、ターミナルで次を実行します。

```sh
python3 -m http.server 4174 --directory app
```

ブラウザで `http://localhost:4174` を開きます。

## データ更新

編集元は `scripts/build-data.mjs` です。変更後に次を実行します。

```sh
node scripts/research-official-specs.mjs
node scripts/build-data.mjs
node scripts/validate-data.mjs
node scripts/check-source-links.mjs
```

最初のコマンドは102機種のメーカー公式仕様・製品ページを読み取り、`scripts/data/official-enrichment.json` を更新します。公開用データ `app/data.js` と調査台帳 `SOURCE_NOTES.md` は、その補完データと作業フォルダ内の公式カタログ出典を統合して生成されます。最初と最後のコマンドはネット接続を使います。公式に確認できない値は `null` または空文字のままにしてください。

## Netlify

このフォルダを新しいNetlifyサイトのベースディレクトリに指定します。`netlify.toml` により `app/` が公開対象になります。実際の公開操作は行っていません。

## GitHub Pages

`main` ブランチへプッシュすると、`.github/workflows/deploy-pages.yml` が `app/` をGitHub Pagesへ自動公開します。GitHubリポジトリの Settings → Pages で、Source は **GitHub Actions** を使用します。

## データ方針

- メーカー公式情報のみを使用
- 保存済み公式カタログは2026年8月13日に全ページを画像化して確認
- 2026年8月12日時点で発売済みの2025・2026年国内向けモデル
- 点数、順位、星、総合評価は不使用
- 価格、在庫、販売終了状態は固定しない
- 詳細な採否と未収録項目は `SOURCE_NOTES.md` を参照
