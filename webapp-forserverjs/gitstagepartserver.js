// server.jsに将来的に統合する

import express from 'express';
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// 必要なパス設定
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// リポジトリのルートディレクトリを指定
const repoRoot = path.resolve(__dirname, '..');

const app = express();
const PORT = 3000;

// 静的ファイルの提供
app.use(express.static(path.join(__dirname, 'button-part')));

// JSONボディの解析
app.use(express.json());

// ルートハンドリング
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'button-part', 'gitstagebuttonpart.html'));
});

// Gitステージングのエンドポイント
app.post('/stage', (req, res) => {
    const { filePaths } = req.body;

    if (!Array.isArray(filePaths)) {
        return res.status(400).json({ message: '無効なデータ形式です。' });
    }

    // ログ出力: 送信されたファイルパスを確認
    console.log('Received file paths:', filePaths);

    const resolvedPaths = filePaths.map(fp => path.resolve(repoRoot, fp));
    
    // コマンドインジェクション対策: パスの検証
    for (const rp of resolvedPaths) {
        if (!rp.startsWith(repoRoot)) {
            return res.status(400).json({ message: '無効なフォルダパスです。' });
        }
    }

    const command = `git add ${resolvedPaths.join(' ')}`;

    // Git add コマンドの実行
    exec(command, { cwd: repoRoot }, (error, stdout, stderr) => {
        if (error) {
            console.error(`エラー: ${stderr}`);
            return res.status(500).json({ message: 'エラーが発生しました' });
        }
        res.json({ message: 'ステージングが成功しました' });
    });
});

// 404ハンドラー
app.use((req, res, next) => {
    res.status(404).send('404: ページが見つかりません');
});

// エラーハンドリングミドルウェア
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('何か問題が発生しました');
});

// サーバーの起動
app.listen(PORT, () => {
    console.log(`サーバーがポート${PORT}で起動しました`);
});
