// 监听标签页更新
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && 
        (tab.url?.includes('leetcode.com/problems/') || 
         tab.url?.includes('leetcode.cn/problems/'))) {
        
        console.log('检测到 LeetCode 页面，注入 content script');
        
        // 尝试注入 content script
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ['content/content.js']
        }).then(() => {
            console.log('Content script 注入成功');
        }).catch((err) => {
            console.error('Content script 注入失败:', err);
        });
    }
});

// 监听安装/更新事件
chrome.runtime.onInstalled.addListener((details) => {
    console.log('扩展已安装/更新', details);
});

// 监听扩展图标点击（可选）
chrome.action.onClicked.addListener((tab) => {
  console.log('扩展图标被点击', tab);
});

// 添加一些基础的消息监听（方便后续开发）
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('收到消息:', message);
  console.log('发送者:', sender);
  
  // 如果需要异步响应，返回 true
  // return true;
});