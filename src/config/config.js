export const NOTION_CONFIG = {
    API_ENDPOINT: 'https://api.notion.com/v1',
    API_KEY: '',
    DATABASE_ID: '',
    PAGE_ID: ''  // 添加 PAGE_ID 用于创建数据库
};

// 从 Chrome storage 加载配置
export async function loadConfig() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(
            ['NOTION_API_KEY', 'NOTION_DATABASE_ID', 'NOTION_PAGE_ID'],
            (result) => {
                NOTION_CONFIG.API_KEY = result.NOTION_API_KEY || '';
                NOTION_CONFIG.DATABASE_ID = result.NOTION_DATABASE_ID || '';
                NOTION_CONFIG.PAGE_ID = result.NOTION_PAGE_ID || '';
                resolve(NOTION_CONFIG);
            }
        );
    });
}

// 保存配置到 Chrome storage
export async function saveConfig(apiKey, pageId, databaseId = '') {
    return new Promise((resolve) => {
        chrome.storage.sync.set({
            NOTION_API_KEY: apiKey,
            NOTION_PAGE_ID: pageId,
            NOTION_DATABASE_ID: databaseId
        }, () => {
            NOTION_CONFIG.API_KEY = apiKey;
            NOTION_CONFIG.PAGE_ID = pageId;
            NOTION_CONFIG.DATABASE_ID = databaseId;
            resolve();
        });
    });
}

// 验证配置是否完整
export function validateConfig() {
    if (!NOTION_CONFIG.API_KEY) {
        throw new Error('请先配置 Notion API Key');
    }
    if (!NOTION_CONFIG.DATABASE_ID && !NOTION_CONFIG.PAGE_ID) {
        throw new Error('请先配置 Page ID 或 Database ID');
    }
    return true;
}