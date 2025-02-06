// 提取代码部分
function extractCodeSections() {
    try {
        // 获取所有代码行
        const codeLines = Array.from(document.querySelectorAll('.view-line'));
        
        // 使用正则表达式匹配空格
        const indentRegex = /^\s+/;
        
        // 处理每一行，保留缩进
        const code = codeLines.map(line => {
            const text = line.textContent;
            // 获取缩进空格
            const indent = text.match(indentRegex)?.[0] || '';
            // 获取实际内容
            const content = text.trim();
            // 如果是空行，直接返回换行符
            if (!content) return '';
            // 组合缩进和内容
            return `${indent}${content}`;
        }).join('\n');
        
        return code;
    } catch (error) {
        console.error('提取代码时出错：', error);
        return null;
    }
}

// 主要提取函数
async function extractLeetCodeInfo() {
    console.log('Extracting basic information...');
    try {
        // 基本信息提取
        const title = document.querySelector('.text-title-large a[href^="/problems/"]')?.textContent?.trim();
        const difficulty = document.querySelector('div[class*="text-difficulty-"]')?.textContent?.trim();
        const description = document.querySelector('div[data-track-load="description_content"]')?.textContent?.trim();
        const url = window.location.href;
        
        // 标签提取
        const tags = Array.from(
            document.querySelectorAll('a.relative.inline-flex.items-center.justify-center.text-caption')
        ).map(tag => tag.textContent.trim());
        
        // 创建笔记对象
        const leetCodeNote = {
            title,
            level: difficulty,
            url,
            description,
            tags,
            codes: extractCodeSections(),
            notes: '', // 初始为空，可以后续在 Notion 中补充
            createDate: new Date().toISOString(),
        };

        return leetCodeNote;
    } catch (error) {
        console.error('提取题目信息时出错：', error);
        return null;
    }
}

// 修改消息监听部分
if (chrome && chrome.runtime && chrome.runtime.onMessage) {
    // 监听消息
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {    
        if (request.action === 'extractInfo') {
            // 使用异步 IIFE 来处理异步函数
            (async () => {
                try {
                    const info = await extractLeetCodeInfo();
                    console.log('Extracted info:', info);
                    sendResponse(info);
                } catch (error) {
                    console.error('Extraction error:', error);
                    sendResponse({ error: error.message });
                }
            })();
            return true; // 保持消息通道开放
        }
    });
} else {
    console.error('Chrome runtime API not available');
}