
// 定义 XPath 变量
const xpaths = {
    title: "//div[contains(@class, 'problem-content-title') and contains(@class, 'nice_font')]",
    // description: "//div[@class='description']",
    difficulty_level: "//span[contains(@class, 'label') and contains(@class, 'label-success') and contains(@class, 'round')]",
    // 其他的 XPath 变量...
  };
  
  // 定义一个用于提取信息的函数
  function extractInformation(xpathsStr) {
    // 内联 getElementTextByXPath 函数
    function getElementTextByXPath(xpath) {
      const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
      if (result.singleNodeValue) {
        // 去除开头和结尾的空白字符（包括换行符、空格等）
        let text = result.singleNodeValue.textContent.trim();
        // 用正则表达式将多余的空白字符和换行符替换为单个空格
        text = text.replace(/\s+/g, ' ');
        return text;
      }
      return null;
    }
  
    // 动态创建 xpaths 对象
    const xpaths = JSON.parse(xpathsStr);
    const results = {};
  
    for (const key in xpaths) {
      if (xpaths.hasOwnProperty(key)) {
        results[key] = getElementTextByXPath(xpaths[key]);
      }
    }
  
    return results;
  }
  
  async function extractProblemInfo(tab) {
    try {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const result = await chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        func: extractInformation,
        args: [JSON.stringify(xpaths)]
      });
      console.log('Result:', result);
      return result[0].result;
    } catch (error) {
      console.error('Failed to extract problem name:', error);
      throw error;
    }
  }
  
  async function saveProblemInfoToNotion(problemInfo) {
    const notionEndpoint = 'https://api.notion.com/v1/pages';
    const databaseId = '6feaca64aea049b19dd1e7fd647737e3'; // 替换为你的 Notion 数据库 ID
    const notionVersion = '2022-06-28'; // Notion API 版本
    const notionApiKey = 'secret_D77Y1IQU0hWJN9SWmKzKCb6XcwoaciMwEoJ1km9HtKd'; // 替换为你的 Notion API 密钥
  
    const requestData = {
      parent: { database_id: databaseId },
      properties: {
        '题目': { type: 'title', title: [{ type: 'text', text: { content: problemInfo.title } }] },
        '难度': { type: 'select', select: { name: problemInfo.difficulty_level } }
      }
    };
  
    try {
      const response = await fetch(notionEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${notionApiKey}`,
          'Content-Type': 'application/json',
          'Notion-Version': notionVersion
        },
        body: JSON.stringify(requestData)
      });
  
      if (!response.ok) {
        throw new Error('Failed to save problem to Notion');
      }
  
      const responseData = await response.json();
      console.log('Problem saved to Notion:', responseData);
    } catch (error) {
      console.error('Failed to save problem to Notion:', error);
      throw error;
    }
  }
  
  chrome.action.onClicked.addListener(async (tab) => {
    try {
      const problemInfo = await extractProblemInfo(tab);
      if (problemInfo) {
        console.log("Problem Info:", problemInfo);
        await saveProblemInfoToNotion(problemInfo);
      }
    } catch (error) {
      console.error('Failed to extract problem name:', error);
    }
  });