import fs from 'fs';
import path from 'path';

// 知识条目类型
export interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  source: 'document' | 'web' | 'manual';
  sourceType?: 'pdf' | 'txt' | 'docx' | 'url' | 'video' | 'book';
  sourceUrl?: string;
  category: string;
  tags: string[];
  summary?: string;
  keyPoints?: string[];
  createdAt: string;
  updatedAt: string;
}

// 知识库类型
export interface KnowledgeBase {
  items: KnowledgeItem[];
  categories: string[];
  totalItems: number;
  lastUpdated: string;
}

// 知识库文件路径
const KNOWLEDGE_FILE = path.join(process.cwd(), 'data', 'knowledge-base.json');

// 确保数据目录存在
function ensureDataDir() {
  const dataDir = path.dirname(KNOWLEDGE_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// 初始化知识库
function initKnowledgeBase(): KnowledgeBase {
  return {
    items: [],
    categories: ['默认', '社交技巧', '沟通艺术', '心理学', '约会技巧'],
    totalItems: 0,
    lastUpdated: new Date().toISOString()
  };
}

// 读取知识库
export function readKnowledgeBase(): KnowledgeBase {
  try {
    ensureDataDir();
    if (!fs.existsSync(KNOWLEDGE_FILE)) {
      const initial = initKnowledgeBase();
      fs.writeFileSync(KNOWLEDGE_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    const data = fs.readFileSync(KNOWLEDGE_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('读取知识库失败:', error);
    return initKnowledgeBase();
  }
}

// 保存知识库
export function saveKnowledgeBase(kb: KnowledgeBase): void {
  try {
    ensureDataDir();
    kb.totalItems = kb.items.length;
    kb.lastUpdated = new Date().toISOString();
    fs.writeFileSync(KNOWLEDGE_FILE, JSON.stringify(kb, null, 2), 'utf-8');
  } catch (error) {
    console.error('保存知识库失败:', error);
    throw error;
  }
}

// 添加知识条目
export function addKnowledgeItem(item: Omit<KnowledgeItem, 'id' | 'createdAt' | 'updatedAt'>): KnowledgeItem {
  const kb = readKnowledgeBase();
  const newItem: KnowledgeItem = {
    ...item,
    id: `kb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  kb.items.push(newItem);
  
  // 添加新分类
  if (!kb.categories.includes(item.category)) {
    kb.categories.push(item.category);
  }
  
  saveKnowledgeBase(kb);
  return newItem;
}

// 更新知识条目
export function updateKnowledgeItem(id: string, updates: Partial<KnowledgeItem>): KnowledgeItem | null {
  const kb = readKnowledgeBase();
  const index = kb.items.findIndex(item => item.id === id);
  
  if (index === -1) return null;
  
  kb.items[index] = {
    ...kb.items[index],
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  // 添加新分类
  if (updates.category && !kb.categories.includes(updates.category)) {
    kb.categories.push(updates.category);
  }
  
  saveKnowledgeBase(kb);
  return kb.items[index];
}

// 删除知识条目
export function deleteKnowledgeItem(id: string): boolean {
  const kb = readKnowledgeBase();
  const index = kb.items.findIndex(item => item.id === id);
  
  if (index === -1) return false;
  
  kb.items.splice(index, 1);
  saveKnowledgeBase(kb);
  return true;
}

// 搜索知识
export function searchKnowledge(query: string, category?: string): KnowledgeItem[] {
  const kb = readKnowledgeBase();
  const lowerQuery = query.toLowerCase();
  
  return kb.items.filter(item => {
    const matchQuery = 
      item.title.toLowerCase().includes(lowerQuery) ||
      item.content.toLowerCase().includes(lowerQuery) ||
      item.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
      (item.summary && item.summary.toLowerCase().includes(lowerQuery));
    
    const matchCategory = !category || item.category === category;
    
    return matchQuery && matchCategory;
  });
}

// 获取所有知识内容（用于 AI 上下文）
export function getAllKnowledgeContent(): string {
  const kb = readKnowledgeBase();
  if (kb.items.length === 0) {
    return '知识库目前为空。';
  }
  
  return kb.items.map(item => {
    let content = `【${item.title}】\n分类: ${item.category}\n`;
    if (item.summary) {
      content += `摘要: ${item.summary}\n`;
    }
    if (item.keyPoints && item.keyPoints.length > 0) {
      content += `要点:\n${item.keyPoints.map(p => `- ${p}`).join('\n')}\n`;
    }
    content += `内容:\n${item.content}`;
    return content;
  }).join('\n\n---\n\n');
}

// 获取知识统计
export function getKnowledgeStats() {
  const kb = readKnowledgeBase();
  const stats = {
    total: kb.items.length,
    byCategory: {} as Record<string, number>,
    bySource: {} as Record<string, number>,
    recentItems: kb.items.slice(-5).reverse()
  };
  
  kb.items.forEach(item => {
    stats.byCategory[item.category] = (stats.byCategory[item.category] || 0) + 1;
    stats.bySource[item.source] = (stats.bySource[item.source] || 0) + 1;
  });
  
  return stats;
}
