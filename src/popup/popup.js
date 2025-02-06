import { saveConfig, loadConfig } from '../config/config';
import { NotionService } from '../services/notionService';

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Popup loaded!');
    
    const notionService = new NotionService();
    
    // DOM 元素
    const extractBtn = document.getElementById('extractBtn');
    const resultDiv = document.getElementById('result');
    const settingsForm = document.getElementById('settingsForm');
    const createDbBtn = document.getElementById('createDbBtn');
    const configMessage = document.getElementById('configMessage');
    
    // 加载配置
    const config = await loadConfig();
    document.getElementById('apiKey').value = config.API_KEY || '';
    document.getElementById('pageId').value = config.PAGE_ID || '';
    document.getElementById('databaseId').value = config.DATABASE_ID || '';

    // 保存 Notion 配置
    settingsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const apiKey = document.getElementById('apiKey').value;
            const pageId = document.getElementById('pageId').value;
            const databaseId = document.getElementById('databaseId').value;
            await saveConfig(apiKey, pageId, databaseId);
            showMessage(configMessage, '配置已保存！');
        } catch (error) {
            showMessage(configMessage, '保存配置失败：' + error.message, 'error');
        }
    });
    
    // 创建数据库
    createDbBtn.addEventListener('click', async () => {
        try {
            const pageId = document.getElementById('pageId').value;
            if (!pageId) {
                showMessage(configMessage, '请输入页面 ID！', 'error');
                return;
            }

            createDbBtn.disabled = true;
            showMessage(configMessage, '正在创建数据库...');
            
            const response = await notionService.createLeetCodeDatabase(pageId);
            await saveConfig(
                document.getElementById('apiKey').value,
                document.getElementById('pageId').value,
                response.id
            );
            
            showMessage(configMessage, '数据库创建成功！ID: ' + response.id);
        } catch (error) {
            showMessage(configMessage, '创建数据库失败：' + error.message, 'error');
        } finally {
            createDbBtn.disabled = false;
        }
    });

    // 原有的提取功能代码
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
    
    extractBtn.addEventListener('click', async () => {
        try {
            resultDiv.innerHTML = '<div class="loading">正在提取数据...</div>';
            extractBtn.disabled = true;
            
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!tab.url.includes('leetcode.com/problems/') && !tab.url.includes('leetcode.cn/problems/')) {
                throw new Error('请在 LeetCode 题目页面使用此扩展');
            }
            
            // 1. 提取数据
            const leetCodeInfo = await sendMessageToContentScript(tab.id, { action: 'extractInfo' });
            
            if (leetCodeInfo.error) {
                throw new Error(leetCodeInfo.error);
            }

            // 2. 保存到 Notion
            resultDiv.innerHTML = '<div class="loading">正在保存到 Notion...</div>';
            await notionService.createLeetCodePage(leetCodeInfo);
            
            // 3. 显示成功结果
            resultDiv.innerHTML = `
                <div class="success">
                    <h3>${leetCodeInfo.title}</h3>
                    <div class="info">
                        <span class="difficulty ${leetCodeInfo.level?.toLowerCase()}">${leetCodeInfo.level}</span>
                        <span class="tags">${leetCodeInfo.tags?.join(', ') || '无标签'}</span>
                    </div>
                    <div class="description">${leetCodeInfo.description?.slice(0, 100)}...</div>
                    <div class="save-status">✅ 已保存到 Notion</div>
                </div>
            `;
            
        } catch (error) {
            console.error('Error:', error);
            resultDiv.innerHTML = `
                <div class="error">
                    操作失败: ${error.message}<br>
                    请确保：<br>
                    1. 页面已完全加载<br>
                    2. 当前是 LeetCode 题目页面<br>
                    3. Notion API 配置正确<br>
                    4. 尝试刷新页面后重试
                </div>
            `;
        } finally {
            extractBtn.disabled = false;
        }
    });
});

// 辅助函数：显示消息
function showMessage(element, text, type = 'success') {
    element.textContent = text;
    element.className = `message ${type}`;
    element.style.display = 'block';
}