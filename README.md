# 備忘録
- アプリ名に_iをつける
- DBの接続が失敗する場合は、 [Qiita](https://qiita.com/workTimeShorterning/private/1d5cf6338d79812658a7) の記事を参照
- 手順書作成は、2回目のテスト実施時に行う。そのため、テストは2回実施。1回目のテストでつまづいた点は、上記のようにまとめる。
## 手順
- mysql.server start
- node server.js
- [開く](http://localhost:3000/) の記事を参照
## ブランチでのアプリバージョンを分かりやすく管理
- iOSなどのアプリでは、バージョンの管理をver_1.0.1とかver_2.1.2とかで管理していて分かりやすい
- そのため、Gitでブランチ作る時も、"version101/feauture/homepage-add"のように先頭にバージョンを入れておくと良いと思った
## version101/feauture/backquoete-delete
` バッククォート3つの行を削除する機能を追加したい

# Terminal　App(gpt3-commit.js)
## Usage
### 事前確認
#### ソースコードの修正とgit addを実行（変更内容をステージングエリアに移動）が完了していることを確認
- 変更のある全てのファイルをステージする場合は、このコマンドを実行
```zsh
git add .
```
画像挿入画像挿入画像挿入画像挿入画像挿入画像挿入
- 他の場合は、 [こちら](https://google.com) の記事を参照
### サーバーの起動
```zsh
node gpt3-commit.js
```
画像挿入画像挿入画像挿入画像挿入画像挿入画像挿入
### 未記載未記載未記載 
 未記載未記載未記載<br>
 画像挿入画像挿入画像挿入画像挿入画像挿入画像挿入 <br>

---
# Web App(server.js,webapp-forserverjs/index.html)
## Usage
### 事前確認
#### ソースコードの修正とgit addを実行（変更内容をステージングエリアに移動）が完了していることを確認
- 変更のある全てのファイルをステージする場合は、このコマンドを実行
```zsh
git add .
```
画像挿入画像挿入画像挿入画像挿入画像挿入画像挿入
- 他の場合は、 [こちら](https://google.com) の記事を参照
### サーバーの起動
```zsh
node server.js
```
画像挿入画像挿入画像挿入画像挿入画像挿入画像挿入
### ブラウザで[アプリ](http://localhost:3000)を開く<br>
 画像挿入画像挿入画像挿入画像挿入画像挿入画像挿入<br>
### ***Generate Commit Message***ボタン押下 <br>
 画像挿入画像挿入画像挿入画像挿入画像挿入画像挿入
### ***コミットする***ボタン押下 <br>
 画像挿入画像挿入画像挿入画像挿入画像挿入画像挿入
### 結果の確認
#### コミットメッセージが画面上に出力されていることを確認
 画像挿入画像挿入画像挿入画像挿入画像挿入画像挿入
#### Pullを実行し、GitHubでコミットメッセージを確認する
1. Pullを実行
> **GitHubを使った例:** <br>
> 
 画像挿入画像挿入画像挿入画像挿入画像挿入画像挿入 <br>
2. Githubでコミットメッセージを確認<br>
 画像挿入画像挿入画像挿入画像挿入画像挿入画像挿入<br>
