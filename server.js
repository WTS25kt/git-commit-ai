import express from 'express';
import OpenAI from 'openai';
import { exec } from 'child_process';
import dotenv from 'dotenv';
import path from 'path';
import { parseCommitMessage } from './parseMessage.js'; // 部品のimport
import { getProjects, getStatus, stageFiles } from './gitUtils.js'; // 部品のimport
import { commitMessagePrompt } from './prompts.js'; // 部品のimport

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
  const prompt = commitMessagePrompt(diff);
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

// 統合したエンドポイント
app.get('/projects', async (req, res) => {
  try {
    const projects = await getProjects();
    res.json({ projects });
  } catch (error) {
    res.status(500).json({ message: 'プロジェクト一覧の取得に失敗しました' });
  }
});

app.get('/status/:project', async (req, res) => {
  const project = req.params.project;
  const projectPath = path.join(devDir, project);

  try {
    const statusList = await getStatus(projectPath);
    res.json({ statusList });
  } catch (error) {
    res.status(500).json({ message: 'git statusの取得に失敗しました' });
  }
});

app.post('/stage', async (req, res) => {
  const { project, filePaths } = req.body;
  const projectPath = path.join(devDir, project);

  try {
    const message = await stageFiles(projectPath, filePaths);
    res.json({ message });
  } catch (error) {
    res.status(500).json({ message: 'ステージングに失敗しました' });
  }
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
