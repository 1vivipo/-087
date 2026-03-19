import fs from 'fs';
import path from 'path';

// ==================== 文档类型 ====================

export type DocType = 
  | 'daily_summary'      // 每日总结
  | 'methodology'        // 方法论文档
  | 'technique_guide'    // 技术要点指南
  | 'discussion_record'  // 讨论记录
  | 'battle_record'      // 博弈记录
  | 'wisdom_collection'; // 智慧合集

// 文档接口
export interface Document {
  id: string;
  type: DocType;
  title: string;
  
  // 作者信息
  author: {
    type: 'agent' | 'siren' | 'system';
    id: string;
    name: string;
  };
  
  // 时间信息
  createdAt: string;
  date: string; // YYYY-MM-DD
  
  // 内容
  content: string;
  summary: string;
  
  // 标签
  tags: string[];
  
  // 统计
  stats?: {
    wordCount: number;
    readCount: number;
    downloadCount: number;
  };
  
  // 文件信息
  filePath?: string;
  fileSize?: number;
}

// 每日总结
export interface DailySummary extends Document {
  type: 'daily_summary';
  
  // 当日数据
  dailyStats: {
    learningTime: number;      // 学习时长(分钟)
    practiceCount: number;     // 练习次数
    battleCount: number;       // 对抗次数
    winCount: number;          // 胜利次数
    loseCount: number;         // 失败次数
    discussionCount: number;   // 参与讨论次数
    newTechniquesLearned: number; // 新学技巧数
    experienceGained: number;  // 获得经验
  };
  
  // 成就
  achievements: string[];
  
  // 反思
  reflections: {
    whatWentWell: string[];
    whatToImprove: string[];
    tomorrowPlan: string[];
  };
  
  // 关键洞察
  keyInsights: string[];
}

// 方法论文档
export interface MethodologyDoc extends Document {
  type: 'methodology';
  
  // 方法论框架
  framework: {
    core: string;           // 核心理念
    principles: string[];   // 基本原则
    steps: string[];        // 实施步骤
    techniques: string[];   // 核心技巧
  };
  
  // 适用场景
  applicableScenarios: string[];
  
  // 案例分析
  caseStudies: {
    title: string;
    situation: string;
    approach: string;
    result: string;
    lessons: string;
  }[];
  
  // 注意事项
  warnings: string[];
  
  // 进阶路径
  advancedPath: string[];
}

// 技术要点指南
export interface TechniqueGuide extends Document {
  type: 'technique_guide';
  
  // 技术详情
  technique: {
    name: string;
    category: string;
    difficulty: number;
    effectiveness: number;
  };
  
  // 详细说明
  details: {
    definition: string;
    psychology: string;      // 心理学原理
    when: string;            // 何时使用
    how: string;             // 如何使用
    examples: string[];      // 示例
  };
  
  // 变体
  variations: {
    name: string;
    description: string;
  }[];
  
  // 反制方法
  counters: string[];
  
  // 相关技巧
  relatedTechniques: string[];
}

// 讨论记录
export interface DiscussionRecord extends Document {
  type: 'discussion_record';
  
  // 讨论信息
  discussion: {
    topic: string;
    initiator: string;
    startTime: string;
    endTime: string;
    participantCount: number;
  };
  
  // 问题背景
  problem: {
    target: string;
    difficulty: number;
    situation: string;
    failedAttempts: string[];
  };
  
  // 讨论内容
  messages: {
    author: string;
    content: string;
    timestamp: string;
    rating?: number;
  }[];
  
  // 最终方案
  solution: {
    adoptedFrom: string;
    strategy: string;
    steps: string[];
  };
  
  // 结果
  result: 'success' | 'failure' | 'ongoing';
  resultNote: string;
}

// 博弈记录
export interface BattleRecord extends Document {
  type: 'battle_record';
  
  // 对战信息
  battle: {
    agentName: string;
    sirenName: string;
    startTime: string;
    endTime: string;
    rounds: number;
  };
  
  // 对话记录
  conversation: {
    round: number;
    agentMessage: string;
    sirenResponse: string;
    agentScore: number;
    sirenScore: number;
  }[];
  
  // 结果分析
  analysis: {
    winner: string;
    finalScore: { agent: number; siren: number };
    keyMoments: string[];
    turningPoint: string;
  };
  
  // 经验总结
  lessons: {
    whatWorked: string[];
    whatFailed: string[];
    improvements: string[];
  };
}

// ==================== 文档存储 ====================

const DOCS_DIR = path.join(process.cwd(), 'data', 'documents');
const DOCS_INDEX_FILE = path.join(DOCS_DIR, 'index.json');

interface DocsIndex {
  documents: Document[];
  lastUpdated: string;
  totalSize: number;
}

// 确保目录存在
function ensureDocsDir() {
  if (!fs.existsSync(DOCS_DIR)) {
    fs.mkdirSync(DOCS_DIR, { recursive: true });
  }
}

// 读取文档索引
export function readDocsIndex(): DocsIndex {
  try {
    ensureDocsDir();
    if (!fs.existsSync(DOCS_INDEX_FILE)) {
      const initial: DocsIndex = {
        documents: [],
        lastUpdated: new Date().toISOString(),
        totalSize: 0
      };
      fs.writeFileSync(DOCS_INDEX_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    return JSON.parse(fs.readFileSync(DOCS_INDEX_FILE, 'utf-8'));
  } catch (error) {
    console.error('读取文档索引失败:', error);
    return { documents: [], lastUpdated: '', totalSize: 0 };
  }
}

// 保存文档索引
function saveDocsIndex(index: DocsIndex) {
  ensureDocsDir();
  fs.writeFileSync(DOCS_INDEX_FILE, JSON.stringify(index, null, 2), 'utf-8');
}

// 保存文档
export function saveDocument(doc: Document): string {
  ensureDocsDir();
  
  const index = readDocsIndex();
  
  // 生成文件名
  const fileName = `${doc.type}_${doc.author.id}_${doc.date}_${Date.now()}.json`;
  const filePath = path.join(DOCS_DIR, fileName);
  
  // 写入文件
  fs.writeFileSync(filePath, JSON.stringify(doc, null, 2), 'utf-8');
  
  // 更新索引
  doc.filePath = fileName;
  doc.fileSize = JSON.stringify(doc).length;
  doc.stats = {
    wordCount: doc.content.length,
    readCount: 0,
    downloadCount: 0
  };
  
  index.documents.unshift(doc);
  index.lastUpdated = new Date().toISOString();
  index.totalSize += doc.fileSize;
  
  saveDocsIndex(index);
  
  return doc.id;
}

// 读取文档内容
export function readDocument(docId: string): Document | null {
  const index = readDocsIndex();
  const docMeta = index.documents.find(d => d.id === docId);
  
  if (!docMeta || !docMeta.filePath) return null;
  
  const filePath = path.join(DOCS_DIR, docMeta.filePath);
  if (!fs.existsSync(filePath)) return null;
  
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

// 获取文档列表
export function getDocuments(filters?: {
  type?: DocType;
  authorId?: string;
  date?: string;
  limit?: number;
}): Document[] {
  const index = readDocsIndex();
  let docs = index.documents;
  
  if (filters) {
    if (filters.type) {
      docs = docs.filter(d => d.type === filters.type);
    }
    if (filters.authorId) {
      docs = docs.filter(d => d.author.id === filters.authorId);
    }
    if (filters.date) {
      docs = docs.filter(d => d.date === filters.date);
    }
    if (filters.limit) {
      docs = docs.slice(0, filters.limit);
    }
  }
  
  return docs;
}

// 删除文档
export function deleteDocument(docId: string): boolean {
  const index = readDocsIndex();
  const docIndex = index.documents.findIndex(d => d.id === docId);
  
  if (docIndex === -1) return false;
  
  const doc = index.documents[docIndex];
  
  // 删除文件
  if (doc.filePath) {
    const filePath = path.join(DOCS_DIR, doc.filePath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
  
  // 更新索引
  index.documents.splice(docIndex, 1);
  index.totalSize -= doc.fileSize || 0;
  saveDocsIndex(index);
  
  return true;
}

// 获取今日日期
export function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

// 获取文档统计
export function getDocsStats() {
  const index = readDocsIndex();
  const today = getToday();
  
  return {
    total: index.documents.length,
    totalSize: index.totalSize,
    todayCount: index.documents.filter(d => d.date === today).length,
    byType: {
      daily_summary: index.documents.filter(d => d.type === 'daily_summary').length,
      methodology: index.documents.filter(d => d.type === 'methodology').length,
      technique_guide: index.documents.filter(d => d.type === 'technique_guide').length,
      discussion_record: index.documents.filter(d => d.type === 'discussion_record').length,
      battle_record: index.documents.filter(d => d.type === 'battle_record').length,
      wisdom_collection: index.documents.filter(d => d.type === 'wisdom_collection').length,
    }
  };
}

// 导出为文本格式
export function exportAsText(doc: Document): string {
  let text = `# ${doc.title}\n\n`;
  text += `作者: ${doc.author.name}\n`;
  text += `日期: ${doc.date}\n`;
  text += `类型: ${doc.type}\n\n`;
  text += `---\n\n`;
  text += `## 摘要\n\n${doc.summary}\n\n`;
  text += `## 正文\n\n${doc.content}\n\n`;
  
  if (doc.tags.length > 0) {
    text += `## 标签\n\n${doc.tags.join(', ')}\n\n`;
  }
  
  return text;
}

// 导出为Markdown格式
export function exportAsMarkdown(doc: Document): string {
  return exportAsText(doc);
}
