// server.jsに将来的に統合する

// 必要なモジュールのインポート
import express from 'express';
import { exec } from 'child_process';
import path from 'path';

// 必要に応じて__dirnameの代替を設定
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static('public'));

app.post('/stage', (req, res) => {
    const { filePaths } = req.body;

    if (!filePaths || filePaths.length === 0) {
        return res.status(400).json({ message: 'ファイルパスが指定されていません' });
    }

    const addCommands = filePaths.map(filePath => `git add "${path.resolve(filePath)}"`).join(' && ');

    exec(addCommands, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error: ${stderr}`);
            return res.status(500).json({ message: `エラーが発生しました: ${stderr}` });
        }
        res.json({ message: 'ステージングが成功しました' });
    });
});

app.listen(PORT, () => {
    console.log(`サーバーがポート ${PORT} で起動しました`);
});
