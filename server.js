import express from 'express';
import OpenAI from 'openai';
import { exec } from 'child_process';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.static('webapp-forserverjs'));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function getGitDiff() {
  return new Promise((resolve, reject) => {
    exec('git diff --cached', (error, stdout) => {
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

  // "### 概要（Summary）" と "### 詳細（Description）" で分割する
  const summaryIndex = message.indexOf("### 概要（Summary）");
  const descriptionIndex = message.indexOf("### 詳細（Description）");

  if (summaryIndex === -1 || descriptionIndex === -1) {
    console.error("Failed to find summary or description in the message");
    return { summary: "", description: "" };
  }

  const summaryContent = message.slice(summaryIndex + "### 概要（Summary）".length, descriptionIndex).trim();
  const descriptionContent = message.slice(descriptionIndex + "### 詳細（Description）".length).trim();

  // 改行文字で分割してリスト項目を保持
  const descriptionLines = descriptionContent.split('\n').map(line => line.trim());
  // デバッグログでリストごとに改行されていることが確認できた。この行を入れたことで、バグが起きた可能性がありコメントアウト
  // console.log('リストごとに改行されているか確認:', descriptionLines);  // デバッグ用ログ

  return { summary: summaryContent, description: descriptionLines.join('\n') };
}

app.post('/generate-commit-message', async (req, res) => {
  try {
    const diff = await getGitDiff();
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
    const { summary, description } = req.body;
    console.log('Received summary:', summary);  // デバッグ用ログ
    console.log('Received description:', description);  // デバッグ用ログ

    // summary と description のチェックを削除

    const commitMessage = `${summary}\n\n${description}`;
    exec(`git commit -m "${commitMessage}"`, (error, stdout, stderr) => {
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
