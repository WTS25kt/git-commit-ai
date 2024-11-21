export const commitMessagePrompt = (diff) => `
以下の変更内容に基づいて、Gitのコミットメッセージを日本語で生成してください。

変更内容:
${diff}

### 概要（Summary）
以下に概要を記載してください:
### 詳細（Description）
以下に詳細を記載してください:
`;
