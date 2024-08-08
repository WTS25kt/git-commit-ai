// server.jsに将来的に統合する

import express from 'express';
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// 必要なパス設定
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ユーザー認証とディレクトリ登録の機能を将来的に統合する
// 環境変数から開発ディレクトリを取得
const devDir = process.env.DEV_DIR || '/Users/shigoto/仕事/GitHub';

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

// プロジェクト一覧を取得するエンドポイント
app.get('/projects', (req, res) => {
    exec(`ls -d ${devDir}/*/`, (error, stdout, stderr) => {
        if (error) {
            console.error(`エラー: ${stderr}`);
            return res.status(500).json({ message: 'プロジェクト一覧の取得に失敗しました' });
        }
        const projects = stdout.split('\n').filter(Boolean).map(dir => path.basename(dir));
        res.json({ projects });
    });
});

// プロジェクト内のgit status情報を取得するエンドポイント
app.get('/status/:project', (req, res) => {
    const project = req.params.project;
    const projectPath = path.join(devDir, project);

    exec(`git -C ${projectPath} status --short`, (error, stdout, stderr) => {
        if (error) {
            console.error(`エラー: ${stderr}`);
            return res.status(500).json({ message: 'git statusの取得に失敗しました' });
        }

        // 状態文字を取り除く前のログ出力
        const rawStatusList = stdout.split('\n').filter(Boolean);
        console.log('Raw status list:', rawStatusList);

        // 状態文字を取り除き、ファイルパスのみを取得
        const statusList = rawStatusList.map(line => {
            const parts = line.trim().split(/\s+/);
            return parts.slice(1).join(' '); // 状態文字を除去
        });

        // 状態文字を取り除いた後のログ出力
        console.log('Processed status list:', statusList);

        res.json({ statusList });
    });
});

// ファイルのステージングを行うエンドポイント
app.post('/stage', (req, res) => {
    const { project, filePaths } = req.body;
    const projectPath = path.join(devDir, project);

    if (!Array.isArray(filePaths)) {
        return res.status(400).json({ message: '無効なデータ形式です。' });
    }

    console.log('Received file paths:', filePaths);

    const resolvedPaths = filePaths.map(fp => path.resolve(projectPath, fp));
    console.log('Resolved file paths:', resolvedPaths);

    const command = `git -C ${projectPath} add ${resolvedPaths.join(' ')}`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`エラー: ${stderr}`);
            return res.status(500).json({ message: 'ステージングに失敗しました' });
        }
        res.json({ message: 'ステージングが成功しました' });
    });
});

// サーバーの起動
app.listen(PORT, () => {
    console.log(`サーバーがポート${PORT}で起動しました`);
});