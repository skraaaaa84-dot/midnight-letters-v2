真夜中の手紙：Supabase接続版

【GitHubへのアップロード】
ZIPを解凍し、次のファイルをリポジトリの一番上へ直接アップロードしてください。

index.html
style.css
app.js
config.js
netlify.toml
README.txt

【次に必要な設定】
GitHubで config.js を開き、鉛筆マークで編集します。

PASTE_PROJECT_URL_HERE
→ SupabaseのProject URLへ変更

PASTE_PUBLISHABLE_KEY_HERE
→ SupabaseのPublishable keyへ変更

Secret keyやservice_roleは絶対に入れないでください。

【動作】
・statusがpublishedの投稿だけ表示
・新規投稿はstatus=pendingで保存
・検索、カテゴリー、ランキング
・共感数は現在ブラウザ端末内に保存
