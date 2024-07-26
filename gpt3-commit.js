#!/usr/bin/env node

const { Configuration, OpenAIApi } = require('openai');
const prompts = require('prompts');
const { exec } = require('child_process');
require('dotenv').config();

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

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
  const prompt = `以下の変更内容に基づいてGitのコミットメッセージを生成してください:\n\n${diff}\n\nコミットメッセージ:`;
  const response = await openai.createCompletion({
    model: 'text-davinci-003',
    prompt: prompt,
    max_tokens: 150,
  });
  return response.data.choices[0].text.trim();
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
      message: `提案されたコミットメッセージ: "${message}"。このメッセージを使用しますか？`,
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