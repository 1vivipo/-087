import fs from 'fs';
import path from 'path';

// ==================== AI写作系统 ====================

// 书籍模板
export interface BookTemplate {
  id: string;
  title: string;
  author: string;
  authorId: string;
  authorType: 'agent' | 'siren';
  
  // 书籍信息
  category: string;           // 分类
  targetAudience: string;     // 目标读者
  wordCount: number;          // 目标字数
  chaptersWritten: number;    // 已写章节
  
  // 状态
  status: 'planning' | 'writing' | 'completed';
  progress: number;           // 进度百分比
  
  // 大纲
  outline: ChapterOutline[];
  
  // 内容
  content: BookChapter[];
  
  // 时间
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

// 章节大纲
export interface ChapterOutline {
  number: number;
  title: string;
  wordCount: number;
  keyPoints: string[];
  status: 'pending' | 'writing' | 'completed';
}

// 书籍章节
export interface BookChapter {
  number: number;
  title: string;
  content: string;
  wordCount: number;
  createdAt: string;
}

// 写作任务
export interface WritingTask {
  id: string;
  bookId: string;
  chapterNumber: number;
  assignedTo: string;
  status: 'pending' | 'writing' | 'completed';
  priority: number;
  createdAt: string;
}

// ==================== 书籍主题分配 ====================

// 我方AI的书籍主题
export const AGENT_BOOKS: Record<string, { title: string; category: string; description: string }> = {
  'agent_001': {
    title: '《闪电攻略：七小时从认识到亲密》',
    category: '速推技巧',
    description: '系统讲解如何快速推进关系，从认识到亲密的最短路径'
  },
  'agent_002': {
    title: '《读心术：读懂她，拿下她》',
    category: '心理分析',
    description: '深入女性心理，精准把握她的需求和弱点'
  },
  'agent_003': {
    title: '《聊天圣经：让她爱上和你说话》',
    category: '聊天技巧',
    description: '从开场白到暧昧，完整聊天体系'
  },
  'agent_004': {
    title: '《驯化论：让她心甘情愿跟着你》',
    category: '驯化技巧',
    description: '框架控制与服从性训练的完整方法论'
  },
  'agent_005': {
    title: '《长期关系：从热恋到白头》',
    category: '长期关系',
    description: '建立和维护长期亲密关系的完整指南'
  },
  'agent_006': {
    title: '《征服高难度：拿下不可能的她》',
    category: '高难度攻略',
    description: '冰山美人、高冷总裁、海王级别的攻略方法'
  },
  'agent_007': {
    title: '《吸引力法则：让她主动靠近你》',
    category: '吸引力建立',
    description: '打造致命吸引力，让她无法抗拒'
  },
  'agent_008': {
    title: '《挽回圣经：从分手到复合》',
    category: '挽回技巧',
    description: '断联、复联、二次吸引的完整方法'
  },
  'agent_009': {
    title: '《全能攻略：追女生的完整路线图》',
    category: '综合攻略',
    description: '从入门到精通的完整追女生体系'
  },
  'agent_010': {
    title: '《社交圈攻略：人脉变现爱情》',
    category: '社交技巧',
    description: '利用社交圈和朋友圈建立吸引力'
  }
};

// 敌方AI的书籍主题
export const SIREN_BOOKS: Record<string, { title: string; category: string; description: string }> = {
  'siren_001': {
    title: '《情感操控：让他对你欲罢不能》',
    category: '情感操控',
    description: '女性视角的情感操控技巧'
  },
  'siren_002': {
    title: '《朋友圈艺术：永远的朋友，永远的暧昧》',
    category: '朋友圈陷阱',
    description: '如何优雅地把男生放进朋友圈'
  },
  'siren_003': {
    title: '《备胎管理：渔场经营指南》',
    category: '备胎管理',
    description: '如何管理多个追求者'
  },
  'siren_004': {
    title: '《忽冷忽热：让他猜不透放不下》',
    category: '情绪操控',
    description: '情绪过山车的艺术'
  },
  'siren_005': {
    title: '《价值打压：让他觉得自己不够好》',
    category: '价值打压',
    description: '降低对方自尊的方法'
  },
  'siren_006': {
    title: '《暧昧学：给他希望，不给他答案》',
    category: '暧昧技巧',
    description: '永远暧昧的艺术'
  },
  'siren_007': {
    title: '《承诺躲避：如何优雅地不承诺》',
    category: '承诺管理',
    description: '享受追求而不必承诺'
  },
  'siren_008': {
    title: '《愧疚陷阱：让他心甘情愿付出》',
    category: '愧疚操控',
    description: '利用愧疚感获取利益'
  },
  'siren_009': {
    title: '《嫉妒诱导：让他为你竞争》',
    category: '嫉妒操控',
    description: '激发竞争心理的方法'
  },
  'siren_010': {
    title: '《海王宝典：女性视角的顶级操控》',
    category: '综合操控',
    description: '顶级海王的完整方法论'
  }
};

// ==================== 章节模板 ====================

// 通用章节结构
export function generateChapterOutlines(bookTitle: string, category: string): ChapterOutline[] {
  const baseOutlines: ChapterOutline[] = [
    { number: 1, title: '序言：为什么写这本书', wordCount: 2000, keyPoints: ['写作动机', '核心理念', '读者收益'], status: 'pending' },
    { number: 2, title: '第一章：基础认知', wordCount: 4000, keyPoints: ['核心概念', '基本原理', '常见误区'], status: 'pending' },
    { number: 3, title: '第二章：核心理论', wordCount: 5000, keyPoints: ['理论框架', '关键要素', '底层逻辑'], status: 'pending' },
    { number: 4, title: '第三章：实战准备', wordCount: 4000, keyPoints: ['心态建设', '能力培养', '资源准备'], status: 'pending' },
    { number: 5, title: '第四章：核心技巧', wordCount: 6000, keyPoints: ['核心方法', '操作步骤', '注意事项'], status: 'pending' },
    { number: 6, title: '第五章：进阶技巧', wordCount: 5000, keyPoints: ['高级方法', '组合运用', '时机把握'], status: 'pending' },
    { number: 7, title: '第六章：实战案例', wordCount: 6000, keyPoints: ['成功案例', '失败案例', '经验总结'], status: 'pending' },
    { number: 8, title: '第七章：常见问题', wordCount: 4000, keyPoints: ['问题解答', '疑难处理', '特殊情况'], status: 'pending' },
    { number: 9, title: '第八章：避坑指南', wordCount: 4000, keyPoints: ['常见错误', '风险警示', '应对方法'], status: 'pending' },
    { number: 10, title: '第九章：长期发展', wordCount: 4000, keyPoints: ['持续进步', '能力提升', '未来规划'], status: 'pending' },
    { number: 11, title: '第十章：总结与展望', wordCount: 3000, keyPoints: ['核心总结', '行动建议', '未来展望'], status: 'pending' },
    { number: 12, title: '附录：工具与资源', wordCount: 3000, keyPoints: ['实用工具', '参考资源', '延伸阅读'], status: 'pending' }
  ];
  
  return baseOutlines;
}

// ==================== 数据存储 ====================

const BOOKS_DIR = path.join(process.cwd(), 'data', 'books');
const BOOKS_INDEX_FILE = path.join(BOOKS_DIR, 'index.json');

interface BooksIndex {
  books: BookTemplate[];
  tasks: WritingTask[];
  stats: {
    totalBooks: number;
    completedBooks: number;
    totalWords: number;
    totalChapters: number;
  };
  lastUpdated: string;
}

// 确保目录
function ensureDir() {
  if (!fs.existsSync(BOOKS_DIR)) {
    fs.mkdirSync(BOOKS_DIR, { recursive: true });
  }
}

// 读取索引
export function readBooksIndex(): BooksIndex {
  try {
    ensureDir();
    if (!fs.existsSync(BOOKS_INDEX_FILE)) {
      const initial: BooksIndex = {
        books: [],
        tasks: [],
        stats: { totalBooks: 0, completedBooks: 0, totalWords: 0, totalChapters: 0 },
        lastUpdated: new Date().toISOString()
      };
      fs.writeFileSync(BOOKS_INDEX_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    return JSON.parse(fs.readFileSync(BOOKS_INDEX_FILE, 'utf-8'));
  } catch (error) {
    console.error('读取书籍索引失败:', error);
    return { books: [], tasks: [], stats: { totalBooks: 0, completedBooks: 0, totalWords: 0, totalChapters: 0 }, lastUpdated: '' };
  }
}

// 保存索引
function saveBooksIndex(index: BooksIndex) {
  ensureDir();
  index.lastUpdated = new Date().toISOString();
  fs.writeFileSync(BOOKS_INDEX_FILE, JSON.stringify(index, null, 2), 'utf-8');
}

// 创建书籍
export function createBook(authorId: string, authorName: string, authorType: 'agent' | 'siren'): BookTemplate {
  const bookConfig = authorType === 'agent' ? AGENT_BOOKS[authorId] : SIREN_BOOKS[authorId];
  
  if (!bookConfig) {
    throw new Error(`未找到 ${authorId} 的书籍配置`);
  }
  
  const book: BookTemplate = {
    id: `book_${authorId}_${Date.now()}`,
    title: bookConfig.title,
    author: authorName,
    authorId,
    authorType,
    category: bookConfig.category,
    targetAudience: authorType === 'agent' ? '想提升恋爱技巧的男性' : '想提升情感掌控力的女性',
    wordCount: 50000,
    chaptersWritten: 0,
    status: 'planning',
    progress: 0,
    outline: generateChapterOutlines(bookConfig.title, bookConfig.category),
    content: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  // 保存到索引
  const index = readBooksIndex();
  index.books.push(book);
  index.stats.totalBooks++;
  saveBooksIndex(index);
  
  // 保存书籍文件
  const bookFile = path.join(BOOKS_DIR, `${book.id}.json`);
  fs.writeFileSync(bookFile, JSON.stringify(book, null, 2), 'utf-8');
  
  return book;
}

// 获取书籍
export function getBook(bookId: string): BookTemplate | null {
  const bookFile = path.join(BOOKS_DIR, `${bookId}.json`);
  if (!fs.existsSync(bookFile)) return null;
  return JSON.parse(fs.readFileSync(bookFile, 'utf-8'));
}

// 更新书籍
export function updateBook(book: BookTemplate): void {
  ensureDir();
  book.updatedAt = new Date().toISOString();
  
  // 更新书籍文件
  const bookFile = path.join(BOOKS_DIR, `${book.id}.json`);
  fs.writeFileSync(bookFile, JSON.stringify(book, null, 2), 'utf-8');
  
  // 更新索引
  const index = readBooksIndex();
  const bookIndex = index.books.findIndex(b => b.id === book.id);
  if (bookIndex !== -1) {
    index.books[bookIndex] = book;
  }
  
  // 更新统计
  index.stats.totalWords = index.books.reduce((sum, b) => 
    sum + b.content.reduce((s, c) => s + c.wordCount, 0), 0);
  index.stats.totalChapters = index.books.reduce((sum, b) => sum + b.content.length, 0);
  index.stats.completedBooks = index.books.filter(b => b.status === 'completed').length;
  
  saveBooksIndex(index);
}

// 添加章节
export function addChapter(bookId: string, chapter: BookChapter): void {
  const book = getBook(bookId);
  if (!book) return;
  
  book.content.push(chapter);
  book.chaptersWritten = book.content.length;
  book.progress = (book.content.length / book.outline.length) * 100;
  
  // 更新大纲状态
  const outline = book.outline.find(o => o.number === chapter.number);
  if (outline) {
    outline.status = 'completed';
  }
  
  if (book.content.length >= book.outline.length) {
    book.status = 'completed';
    book.completedAt = new Date().toISOString();
  } else {
    book.status = 'writing';
  }
  
  updateBook(book);
}

// 获取所有书籍
export function getAllBooks(): BookTemplate[] {
  const index = readBooksIndex();
  return index.books;
}

// 获取统计
export function getBooksStats() {
  const index = readBooksIndex();
  return index.stats;
}

// 导出书籍为Markdown
export function exportBookAsMarkdown(bookId: string): string {
  const book = getBook(bookId);
  if (!book) return '';
  
  let md = `# ${book.title}\n\n`;
  md += `**作者**: ${book.author}\n\n`;
  md += `**分类**: ${book.category}\n\n`;
  md += `**字数**: ${book.content.reduce((sum, c) => sum + c.wordCount, 0)}字\n\n`;
  md += `---\n\n`;
  
  for (const chapter of book.content) {
    md += `## ${chapter.title}\n\n`;
    md += chapter.content;
    md += '\n\n---\n\n';
  }
  
  return md;
}
