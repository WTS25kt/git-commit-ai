export function parseCommitMessage(message) {
    const summaryIndex = message.indexOf("### 概要（Summary）");
    const descriptionIndex = message.indexOf("### 詳細（Description）");
  
    let summaryContent = "";
    let descriptionContent = "";
  
    if (summaryIndex !== -1 && descriptionIndex !== -1) {
      summaryContent = message.slice(summaryIndex + "### 概要（Summary）".length, descriptionIndex).trim();
      descriptionContent = message.slice(descriptionIndex + "### 詳細（Description）".length).trim();
    } else {
      summaryContent = "コミットメッセージのフォーマットが期待通りでないため、詳細（Description）を参照してください。";
      descriptionContent = message;
      console.error("Failed to find summary or description in the message. Using the entire message as the description.");
    }
  
    const descriptionLines = descriptionContent.split('\n').map(line => line.trim()).filter(line => line);
  
    return { summary: summaryContent, description: descriptionLines.join('\n') };
  }
  