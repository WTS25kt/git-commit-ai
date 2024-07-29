#!/usr/bin/env node

import OpenAI from 'openai';
import prompts from 'prompts';
import { exec } from 'child_process';
import dotenv from 'dotenv';

dotenv.config();

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
  return response.choices[0].message.content.trim();
}

async function main() {
  try {
    const diff = await getGitDiff();
    if (!diff) {
      console.log('ステージングエリアに変更がありません。コミットはキャンセルされました。');
      return;
    }

    const message = await generateCommitMessage(diff);
    const confirm = await prompts({
      type: 'confirm',
      name: 'value',
      message: `提案されたコミットメッセージ:\n${message}\nこのメッセージを使用しますか？`,
      initial: true,
    });

    if (confirm.value) {
      exec(`git commit -m "${message}"`, (error) => {
        if (error) {
          console.error('コミットエラー:', error);
        } else {
          console.log('コミットが成功しました。');
        }
      });
    } else {
      console.log('コミットはキャンセルされました。');
    }
  } catch (error) {
    console.error('エラー:', error);
  }
}

main();