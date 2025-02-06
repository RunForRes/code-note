// 定义题目难度枚举
enum DifficultyLevel {
    EASY = '简单',
    MEDIUM = '中等',
    HARD = '困难'
}

// 定义代码部分的接口
interface CodeSection {
    language: string;
    solution: string;
    explanation?: string;
}

// 定义主要的笔记结构
interface LeetCodeNote {
    // 基本信息
    title: string;                 // 题目标题
    questionId: string;           // 题目编号
    level: DifficultyLevel;      // 难度级别
    url: string;                 // 题目链接
    
    // 内容
    description: string;         // 题目描述
    tags: string[];             // 题目标签
    
    // 解答相关
    codes: CodeSection[];       // 代码解决方案
    notes: string;              // 解题笔记
    
    // 元数据
    createDate: string;         // 创建时间
}