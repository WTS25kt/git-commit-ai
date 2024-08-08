import express from 'express';
import OpenAI from 'openai';
import { exec } from 'child_process';
import dotenv from 'dotenv';
import path from 'path';

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

  const summaryIndex = message.indexOf("### 概要（Summary）");
  const descriptionIndex = message.indexOf("### 詳細（Description）");

  let summaryContent = "";
  let descriptionContent = "";

  if (summaryIndex !== -1 && descriptionIndex !== -1) {
    // フォーマットが期待通りの場合
    summaryContent = message.slice(summaryIndex + "### 概要（Summary）".length, descriptionIndex).trim();
    descriptionContent = message.slice(descriptionIndex + "### 詳細（Description）".length).trim();
  } else {
    // フォーマットが期待通りでない場合、応急処置として全体をサマリーにする
    summaryContent = message;
    console.error("Failed to find summary or description in the message. Using the entire message as the summary.");
    // 全体をサマリーではなく、全体をディスクリプションにして、サマリーには「コミットメッセージは以下（Description）を参照とする方向に改修予定
    // ログだけでなく、Web上にも、「フォーマットが期待通りでないため〜」と表示した方が良さそう
  }

  // 改行文字で分割してリスト項目を保持
  const descriptionLines = descriptionContent.split('\n').map(line => line.trim());

  return { summary: summaryContent, description: descriptionLines.join('\n') };
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
    const diff = await getGitDiff(projectPath);
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

    const commitMessage = `${summary}\n\n${description}`;
    exec(`git -C ${projectPath} commit -m "${commitMessage}"`, (error, stdout, stderr) => {
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
