import express from 'express';
import OpenAI from 'openai';
import { exec } from 'child_process';
import dotenv from 'dotenv';
import path from 'path';
import { parseCommitMessage } from './parseMessage.js'; // 新しい関数のimport

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.static('webapp-forserverjs'));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const devDir = process.env.DEV_DIR || '/Users/shigoto/仕事/GitHub';

async function getGitDiff(projectPath) {
  return new Promise((resolve, reject) => {
    exec(`git -C ${projectPath} diff --cached`, (error, stdout) => {
      if (error) {
        return reject(error);
      }
      resolve(stdout.trim());
    });
  });
}

async function generateCommitMessage(diff) {
  const prompt = `以下の変更内容に基づいて、Gitのコミットメッセージを日本語で生成してください。\n\n変更内容:\n${diff}\n\n### 概要（Summary）\n以下に概要を記載してください:\n### 詳細（Description）\n以下に詳細を記載してください:`;
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: prompt }
    ],
    max_tokens: 150,
  });

  console.log('API Response:', response);

  const message = response.choices[0].message.content.trim();
  console.log('Generated Message:', message);

  const { summary, description } = parseCommitMessage(message);

  return { summary, description };
}

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

app.post('/generate-commit-message', async (req, res) => {
  try {
    const { projectPath } = req.body;
    const fullProjectPath = path.join(devDir, projectPath);
    const diff = await getGitDiff(fullProjectPath);
    if (!diff) {
      return res.status(400).json({ error: 'ステージングエリアに変更がありません。' });
    }

    const { summary, description } = await generateCommitMessage(diff);
    res.json({ summary, description });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/commit-changes', async (req, res) => {
  try {
    const { projectPath, summary, description } = req.body;
    const fullProjectPath = path.join(devDir, projectPath);

    const commitMessage = `${summary}\n\n${description}`;
    exec(`git -C ${fullProjectPath} commit -m "${commitMessage}"`, (error, stdout, stderr) => {
      if (error) {
        return res.status(500).json({ error: `コミットエラー: ${stderr}` });
      }
      res.json({ message: 'コミットが成功しました。', output: stdout });
    });
  } catch (error) {
    console.error('Error processing /commit-changes:', error);
    res.status(500).json({ error: '内部サーバーエラーが発生しました。' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
