import { Client } from '@notionhq/client';
import { NOTION_CONFIG, loadConfig } from '../config/config';

export class NotionService {
    constructor() {
        this.notion = null;
        this.initialized = false;
    }

    async initialize() {
        if (!this.initialized) {
            await loadConfig();
            if (!NOTION_CONFIG.API_KEY) {
                throw new Error('Notion API Key not configured');
            }
            this.notion = new Client({ auth: NOTION_CONFIG.API_KEY });
            this.initialized = true;
        }
    }

    async updateDatabaseTags(newTags) {
        console.log('updateDatabaseTags called with:', newTags);
        await this.initialize();
        try {
            console.log('Updating database tags...');
            // 获取当前数据库信息
            console.log('Database ID:', NOTION_CONFIG.DATABASE_ID);
            console.log('API Key:', NOTION_CONFIG.API_KEY);
            const database = await this.notion.databases.retrieve({
                database_id: NOTION_CONFIG.DATABASE_ID
            });
            console.log('Database retrieved successfully:', database);
            // 获取现有标签
            const existingTags = database.properties.Tags.multi_select.options.map(
                option => option.name
            );

            // 找出需要添加的新标签
            const tagsToAdd = newTags.filter(tag => !existingTags.includes(tag));

            if (tagsToAdd.length === 0) {
                return; // 没有新标签需要添加
            }

            // 更新数据库，添加新标签
            await this.notion.databases.update({
                database_id: NOTION_CONFIG.DATABASE_ID,
                properties: {
                    Tags: {
                        multi_select: {
                            options: [
                                ...database.properties.Tags.multi_select.options,
                                ...tagsToAdd.map(tag => ({
                                    name: tag,
                                    color: (() => {
                                        const colors = ["default", "blue", "brown", "orange", "yellow", "green", "red", "purple", "pink", "gray"];
                                        return colors[Math.floor(Math.random() * colors.length)];
                                    })()
                                }))
                            ]
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error updating database tags:', error);
            throw error;
        }
    }

    async createLeetCodePage(leetCodeInfo) {
        console.log('createLeetCodePage called with:', leetCodeInfo);
        await this.initialize();
        
        try {
            // 先更新数据库的标签选项
            await this.updateDatabaseTags(leetCodeInfo.tags || []);

            // 然后创建页面
            const response = await this.notion.pages.create({
                parent: {
                    type: "database_id",
                    database_id: NOTION_CONFIG.DATABASE_ID
                },
                properties: {
                    // 标题
                    "Title": {
                        title:[{
                            text: {
                                content: leetCodeInfo.title,
                                link: {
                                    url: leetCodeInfo.url
                                }
                            },
                        }]
                    },
                    // 难度级别
                    "Level": {
                        select: {
                            name: leetCodeInfo.level || "中等"
                        }
                    },
                    // 标签
                    "Tags": {
                        multi_select: (leetCodeInfo.tags || []).map(tag => ({
                            name: tag
                        }))
                    },
                    // 创建日期
                    "Date": {
                        date: {
                            start: new Date().toISOString()
                        }
                    }
                },
                // 将完整的内容组织在页面中
                children: [
                    // Description 标题
                    {
                        object: 'block',
                        type: 'heading_1',
                        heading_1: {
                            rich_text: [{
                                text: {
                                    content: "Description"
                                }
                            }],
                        }
                    },
                    // 题目描述内容
                    ...leetCodeInfo.description,
                    // Code 标题
                    {
                        object: 'block',
                        type: 'heading_1',
                        heading_1: {
                            rich_text: [{
                                text: {
                                    content: "Code"
                                }
                            }],
                        }
                    },
                    // 代码内容
                    {
                        object: 'block',
                        type: 'code',
                        code: {
                            rich_text: [{
                                text: {
                                    content: leetCodeInfo.codes || ""
                                }
                            }],
                            language: 'javascript'  // 可以根据实际语言修改
                        }
                    },
                    // Note 标题
                    {
                        object: 'block',
                        type: 'heading_1',
                        heading_1: {
                            rich_text: [{
                                text: {
                                    content: "Note"
                                }
                            }],
                        }
                    },
                    // 笔记内容（预留空白段落）
                    {
                        object: 'block',
                        type: 'paragraph',
                        paragraph: {
                            rich_text: []
                        }
                    }
                ]
            });
            
            return response;
        } catch (error) {
            console.error('Error creating Notion page:', error);
            throw error;
        }
    }

    async createLeetCodeDatabase(pageId) {
        await this.initialize();
        
        try {
            const response = await this.notion.databases.create({
                parent: {
                    type: "page_id",
                    page_id: pageId
                },
                icon: {
                    type: "emoji",
                    emoji: "📘"
                },
                title: [
                    {
                        type: "text",
                        text: {
                            content: "LeetCode Problems",
                            link: null
                        }
                    }
                ],
                properties: {
                    // 标题
                    Title: {
                        title: [{
                            type: "rich_text",
                        }]
                    },
                    // 难度级别
                    Level: {
                        select: {
                            options: [
                                {
                                    name: "简单",
                                    color: "green"
                                },
                                {
                                    name: "中等",
                                    color: "yellow"
                                },
                                {
                                    name: "困难",
                                    color: "red"
                                }
                            ]
                        }
                    },
                    // 标签
                    Tags: {
                        multi_select: {
                            options: [
                                {
                                    name: "数组",
                                    color: "blue"
                                },
                                {
                                    name: "字符串",
                                    color: "green"
                                },
                                {
                                    name: "动态规划",
                                    color: "red"
                                }
                                // 可以添加更多预设标签
                            ]
                        }
                    },
                    // 创建日期
                    Date: {
                        date: {}
                    },
                }
            });
            
            return response;
        } catch (error) {
            console.error('Error creating database:', error);
            throw error;
        }
    }
}