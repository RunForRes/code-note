// 等待 DOM 加载完成
document.addEventListener('DOMContentLoaded', () => {
    console.log('Popup loaded!');
    
    // 获取 DOM 元素
    const extractBtn = document.getElementById('extractBtn');
    const resultDiv = document.getElementById('result');
    
    async function sendMessageToContentScript(tabId, message, retries = 3) {
        for (let i = 0; i < retries; i++) {
            try {
                const response = await chrome.tabs.sendMessage(tabId, message);
                return response;
            } catch (error) {
                console.log(`Attempt ${i + 1} failed:`, error);
                if (i === retries - 1) throw error;
                // 等待一段时间后重试
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    }
    
    // 添加按钮点击事件
    extractBtn.addEventListener('click', async () => {
        try {
            // 显示加载状态
            resultDiv.innerHTML = '<div class="loading">正在提取数据...</div>';
            extractBtn.disabled = true;
            
            // 获取当前标签页
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            console.log('Current tab:', tab);
            
            // 确保是 LeetCode 页面
            if (!tab.url.includes('leetcode.com/problems/') && !tab.url.includes('leetcode.cn/problems/')) {
                throw new Error('请在 LeetCode 题目页面使用此扩展');
            }
            
            // 尝试发送消息给 content script
            const response = await sendMessageToContentScript(tab.id, { action: 'extractInfo' });
            console.log('Response:', response);
            
            // 显示结果
            if (response.error) {
                throw new Error(response.error);
            }
            
            resultDiv.innerHTML = `
                <div class="success">
                    <h3>${response.title}</h3>
                    <div class="info">
                        <span class="difficulty ${response.level.toLowerCase()}">${response.level}</span>
                        <span class="tags">${response.tags?.join(', ') || '无标签'}</span>
                    </div>
                    <div class="description">${response.description?.slice(0, 100)}...</div>
                </div>
            `;
            
        } catch (error) {
            console.error('Error:', error);
            document.getElementById('result').innerHTML = `
                <div class="error">
                    提取失败: ${error.message}<br>
                    请确保：<br>
                    1. 页面已完全加载<br>
                    2. 当前是 LeetCode 题目页面<br>
                    3. 尝试刷新页面后重试
                </div>
            `;
            
        } finally {
            // 恢复按钮状态
            extractBtn.disabled = false;
        }
    });
});