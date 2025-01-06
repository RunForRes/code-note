(function initContentScript() {
    // 立即添加调试标记
    try {
        console.log('Content Script 初始化开始');
        
        // 确保 body 存在
        if (document.body) {
            document.body.appendChild(debugDiv);
        } else {
            // 如果 body 还不存在，等待 DOM 加载
            document.addEventListener('DOMContentLoaded', () => {
                document.body.appendChild(debugDiv);
            });
        }
        
        console.log('Content Script 初始化完成');
    } catch (error) {
        console.error('Content Script 初始化失败:', error);
    }
})();

// 使用 window.onload 确保在页面加载完成后执行
window.onload = () => {
    console.log('Content script loaded via window.onload!');
    // 测试 DOM 是否可访问
    const title = document.querySelector('div[data-cy="question-title"]');
    console.log('Found title element:', title);
};

// 使用 MutationObserver 监听 DOM 变化
const observer = new MutationObserver((mutations) => {
    console.log('DOM changed:', mutations);
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});

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
function extractLeetCodeInfo() {
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
            updateDate: new Date().toISOString()
        };

        return leetCodeNote;
    } catch (error) {
        console.error('提取题目信息时出错：', error);
        return null;
    }
}

// 验证数据完整性
function validateLeetCodeNote(note) {
    const requiredFields = ['title', 'level', 'description', 'url'];
    return requiredFields.every(field => Boolean(note[field]));
}

// 监听消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {    
    if (request.action === 'extractInfo') {
        try {
            const info = extractLeetCodeInfo();
            console.log('Extracted info:', info);
            sendResponse(info);
        } catch (error) {
            console.error('Extraction error:', error);
            sendResponse({ error: error.message });
        }
    }
    return true;
});