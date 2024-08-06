import express from 'express';
import OpenAI from 'openai';
import { exec } from 'child_process';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
app.use(express.json());

// __dirname の代わりに使うための設定（ESモジュールで__dirnameが使えないため）
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 静的ファイルを提供するディレクトリを設定
app.use(express.static(path.join(__dirname, 'webapp-forserverjs')));

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
  const prompt = `以下の変更内容に基づいて、Gitのコミットメッセージの概要（Summary）と詳細（Description）を日本語で生成してください。\n\n変更内容:\n${diff}\n\n概要（Summary）:\n詳細（Description）:`;
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: prompt }
    ],
    max_tokens: 150,
  });

  const message = response.choices[0].message.content.trim();
  const [summaryLine, ...descriptionLines] = message.split('\n').map(line => line.trim());
  const summary = summaryLine.replace('概要（Summary）:', '').trim();
  const description = descriptionLines.join('\n').replace('詳細（Description）:', '').trim();

  return { summary, description };
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

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
