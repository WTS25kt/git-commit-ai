//　このアプリをアプリ単体で使う場合は、'pushindex.html'を'index.html'煮直してから使う。

import express from 'express';
import { exec } from 'child_process';
import path from 'path';
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static('webapp-pushbutton'));

app.get('/projects', (req, res) => {
    const projectsDir = '/Users/shigoto/仕事/GitHub';
    exec(`ls ${projectsDir}`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error listing projects: ${stderr}`);
            return res.status(500).json({ error: 'プロジェクトの一覧を取得できませんでした。' });
        }
        const projects = stdout.trim().split('\n');
        res.json({ projects });
    });
});

app.post('/push', (req, res) => {
    const { projectPath } = req.body;
    if (!projectPath) {
        return res.status(400).json({ error: 'プロジェクトパスが指定されていません。' });
    }

    const pushCommand = `cd ${projectPath} && git push`;

    exec(pushCommand, (error, stdout, stderr) => {
        if (error) {
            console.error(`Push error: ${stderr}`);
            return res.status(500).json({ error: 'プッシュに失敗しました。' });
        }
        res.json({ message: 'プッシュが成功しました！', output: stdout });
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
