// 在文件顶部添加以下导入语句
import TurndownService from 'turndown';
import { markdownToRichText, markdownToBlocks } from '@tryfabric/martian';

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
        // 原先直接获取 innerHTML 转换为富文本，现在先转换为 Markdown，再转换为 Notion 富文本
        const descriptionNode = document.querySelector('div[data-track-load="description_content"]');
        if (!descriptionNode) {
            throw new Error('找不到题目描述节点');
        }

        const turndownService = new TurndownService({
            codeBlockStyle: 'fenced',
            bulletListMarker: '-',
            strongDelimiter: '**',
            emDelimiter: '*'
        });

        // 处理空格
        turndownService.addRule('nbsp', {
            filter: function (node) {
                return node.nodeType === 3 && node.nodeValue === '\u00A0';
            },
            replacement: function () {
                return ' ';
            }
        });

        // 处理行内代码
        turndownService.addRule('code', {
            filter: 'code',
            replacement: function(content) {
                return '`' + content + '`';
            }
        });

        // 处理加粗文本
        turndownService.addRule('strong', {
            filter: 'strong',
            replacement: function(content) {
                return '**' + content + '**';
            }
        });

        // 处理斜体文本
        turndownService.addRule('em', {
            filter: 'em',
            replacement: function(content) {
                return '*' + content + '*';
            }
        });

        // 处理列表项
        turndownService.addRule('listItem', {
            filter: 'li',
            replacement: function(content, node, options) {
                content = content
                    .replace(/^\n+/, '') // 移除开头的换行
                    .replace(/\n+$/, '\n') // 替换结尾的换行
                    .replace(/\n/gm, '\n    '); // 缩进续行
                let prefix = options.bulletListMarker + ' ';
                return prefix + content + (node.nextSibling ? '\n' : '');
            }
        });

        // 处理段落
        turndownService.addRule('paragraph', {
            filter: 'p',
            replacement: function(content) {
                return '\n\n' + content + '\n\n';
            }
        });

        // 处理预格式化文本块
        turndownService.addRule('pre', {
            filter: 'pre',
            replacement: function(content, node) {
                // 获取 pre 标签内的所有文本节点和元素
                const lines = [];
                let currentLine = '';
                
                // 遍历所有子节点
                node.childNodes.forEach(child => {
                    if (child.nodeType === 3) { // 文本节点
                        currentLine += child.textContent;
                    } else if (child.nodeType === 1) { // 元素节点
                        if (child.tagName === 'BR') {
                            lines.push(currentLine);
                            currentLine = '';
                        } else if (child.tagName === 'STRONG') {
                            // 在加粗文本后添加空格
                            currentLine += `**${child.textContent}** `;
                        } else {
                            currentLine += child.textContent;
                        }
                    }
                    
                    // 如果遇到换行符，保存当前行
                    if (currentLine.includes('\n')) {
                        const parts = currentLine.split('\n');
                        lines.push(...parts.slice(0, -1));
                        currentLine = parts[parts.length - 1];
                    }
                });
                
                // 添加最后一行
                if (currentLine) {
                    lines.push(currentLine);
                }
                
                // 为每行添加引用前缀，保持空行的引用
                const quotedLines = lines.map(line => 
                    line.trim() ? `> ${line}` : '>'
                );
                
                return '\n' + quotedLines.join('\n') + '\n';
            }
        });

        // 直接传入 DOM 节点
        const descriptionMarkdown = turndownService.turndown(descriptionNode);
        const options = {
            notionLimits: {
                truncate: false,
            },
        };
        const descriptionBlocks = markdownToBlocks(descriptionMarkdown, options);
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
            description: descriptionBlocks,
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