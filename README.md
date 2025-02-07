# LeetCode to Notion 扩展

## 项目简介
本扩展旨在提取 LeetCode 题目页面中的题目信息、代码和题解，并将其保存到 Notion 数据库中。它是一款 Chrome 扩展，支持自动提取 LeetCode 页面数据，并通过 Notion API 将数据保存到指定的 Notion 数据库中。

## 项目结构
- **src/background**：后台脚本，负责检测标签页更新并注入 content script。
- **src/content**：Content 脚本，从 LeetCode 页面中提取题目信息、代码和题解。
- **src/popup**：弹出窗口脚本，提供用户交互界面，用于配置 Notion API 以及数据提取功能。
- **src/config**：配置文件，管理 Notion API 密钥及相关配置。
- **src/services**：NotionService，处理与 Notion API 的交互，如创建数据库和页面。
- **src/types**：类型定义，如 LeetCodeNote，用于描述题目数据的结构。

## 功能特性
- 自动识别 LeetCode 题目页面，提取题目标题、难度、描述、标签、代码及笔记
- 将题目数据保存到 Notion 数据库，支持多种数据类型和结构化表示
- 提供 popup 界面进行配置和手动触发数据提取

## 安装步骤
1. 克隆仓库到本地
2. 安装依赖：`npm install` 或 `yarn`
3. 打包或直接加载扩展到 Chrome 浏览器（开发者模式加载 unpacked 扩展）
4. 在弹出窗口中配置 Notion API key、页面 ID 和数据库 ID

## 使用方法
1. 在 LeetCode 题目页面点击扩展图标，启动数据提取
2. 数据提取后，自动保存至 Notion 数据库
3. 通过 Notion 查看已保存的题目信息及代码

## 开发代办
- [ ] 更新 Notion 数据库表结构，将 <题目>、<题解> 和 <代码> 这3种长文本组织成结构化文本，放在条目内容中；<代码>部分需要使用代码块格式展示
- [ ] 增加 AI 提示/解题/生成题解功能，允许用户提供 API 接口，用于自动生成题解和提示
- [ ] 更新 popup 界面，提升用户体验和交互设计

## 贡献指南
欢迎大家提交 issue 或 pull request 来为项目贡献代码。如有任何问题或建议，请在 issue 区提出讨论。

## 联系方式
如有疑问，请联系项目负责人。 