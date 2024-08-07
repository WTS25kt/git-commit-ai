// server.jsに将来的に統合する

import express from 'express';
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// 必要なパス設定
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    const { folderPath } = req.body;

    // コマンドインジェクション対策: 入力のバリデーション
    if (typeof folderPath !== 'string' || !folderPath.match(/^[a-zA-Z0-9_\-/]+$/)) {
        return res.status(400).json({ message: '無効なフォルダパスです。' });
    }

    const absolutePath = path.resolve(__dirname, folderPath);

    // Git add コマンドの実行
    exec(`git add ${absolutePath}`, (error, stdout, stderr) => {
        if (error) {
            console.error(`エラー: ${stderr}`);
            return res.status(500).json({ message: `エラーが発生しました: ${stderr}` });
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
