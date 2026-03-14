import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import {
  createBook,
  getBook,
  updateBook,
  addChapter,
  getAllBooks,
  getBooksStats,
  exportBookAsMarkdown,
  BookChapter,
  AGENT_BOOKS,
  SIREN_BOOKS
} from '@/lib/ai-writing-system';
import { readSwarmSystem } from '@/lib/swarm-system';

// 全局状态
let isRunning = false;
let writingInterval: NodeJS.Timeout | null = null;

// 启动写作系统
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'start') {
      return await startWritingSystem();
    } else if (action === 'stop') {
      return await stopWritingSystem();
    } else if (action === 'create_all_books') {
      return await createAllBooks();
    } else if (action === 'write_chapter') {
      return await writeChapter(body.bookId, body.chapterNumber);
    } else if (action === 'write_chapter_direct') {
      return await writeChapterDirect(body.bookId, body.chapterNumber, body.chapterTitle, body.chapterContent);
    } else if (action === 'batch_write') {
      return await batchWriteChapters(body.books);
    }

    return NextResponse.json({ success: false, error: '未知操作' }, { status: 400 });
  } catch (error: any) {
    console.error('[写作系统] 错误:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// 获取状态
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  
  if (action === 'stats') {
    return NextResponse.json({ success: true, stats: getBooksStats() });
  }
  
  if (action === 'list') {
    const books = getAllBooks();
    return NextResponse.json({ success: true, books });
  }
  
  if (action === 'detail') {
    const bookId = searchParams.get('id');
    if (!bookId) {
      return NextResponse.json({ success: false, error: '缺少书籍ID' }, { status: 400 });
    }
    const book = getBook(bookId);
    return NextResponse.json({ success: !!book, book });
  }
  
  if (action === 'download') {
    const bookId = searchParams.get('id');
    if (!bookId) {
      return NextResponse.json({ success: false, error: '缺少书籍ID' }, { status: 400 });
    }
    const markdown = exportBookAsMarkdown(bookId);
    if (!markdown) {
      return NextResponse.json({ success: false, error: '书籍不存在' }, { status: 404 });
    }
    return new NextResponse(markdown, {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `attachment; filename="book.md"`
      }
    });
  }
  
  // 默认返回状态
  const stats = getBooksStats();
  const books = getAllBooks();
  
  return NextResponse.json({
    success: true,
    status: {
      isRunning,
      stats,
      books: books.map(b => ({
        id: b.id,
        title: b.title,
        author: b.author,
        authorType: b.authorType,
        category: b.category,
        progress: b.progress.toFixed(1) + '%',
        chaptersWritten: b.chaptersWritten,
        totalChapters: b.outline.length,
        status: b.status,
        wordCount: b.content.reduce((sum, c) => sum + c.wordCount, 0)
      }))
    }
  });
}

// 启动写作系统
async function startWritingSystem() {
  if (isRunning) {
    return NextResponse.json({ success: true, message: '写作系统已在运行' });
  }

  isRunning = true;
  runWritingLoop();

  return NextResponse.json({
    success: true,
    message: '写作系统已启动！20个AI将各自撰写5万字攻略书籍'
  });
}

// 停止写作系统
async function stopWritingSystem() {
  isRunning = false;
  
  if (writingInterval) {
    clearInterval(writingInterval);
    writingInterval = null;
  }

  return NextResponse.json({
    success: true,
    message: '写作系统已停止'
  });
}

// 创建所有书籍
async function createAllBooks() {
  const swarmData = readSwarmSystem();
  const results = [];
  
  // 为我方AI创建书籍
  for (const agent of swarmData.agentTeam.members) {
    try {
      if (!AGENT_BOOKS[agent.id]) continue;
      
      const book = createBook(agent.id, agent.name, 'agent');
      results.push({
        author: agent.name,
        title: book.title,
        success: true
      });
      console.log(`[书籍创建] ${agent.name}: ${book.title}`);
    } catch (error: any) {
      results.push({
        author: agent.name,
        success: false,
        error: error.message
      });
    }
  }
  
  // 为敌方AI创建书籍
  for (const siren of swarmData.sirenTeam.members) {
    try {
      if (!SIREN_BOOKS[siren.id]) continue;
      
      const book = createBook(siren.id, siren.name, 'siren');
      results.push({
        author: siren.name,
        title: book.title,
        success: true
      });
      console.log(`[书籍创建] ${siren.name}: ${book.title}`);
    } catch (error: any) {
      results.push({
        author: siren.name,
        success: false,
        error: error.message
      });
    }
  }
  
  return NextResponse.json({
    success: true,
    message: `已创建 ${results.filter(r => r.success).length} 本书籍`,
    results
  });
}

// 运行写作循环
async function runWritingLoop() {
  const write = async () => {
    if (!isRunning) return;

    try {
      const books = getAllBooks();
      
      // 找到未完成的书籍
      const incompleteBooks = books.filter(b => b.status !== 'completed');
      if (incompleteBooks.length === 0) {
        console.log('[写作系统] 所有书籍已完成');
        return;
      }
      
      // 随机选择一本书
      const book = incompleteBooks[Math.floor(Math.random() * incompleteBooks.length)];
      
      // 找到下一个未写的章节
      const nextChapter = book.outline.find(o => o.status === 'pending');
      if (!nextChapter) {
        book.status = 'completed';
        book.completedAt = new Date().toISOString();
        updateBook(book);
        return;
      }
      
      console.log(`[写作] ${book.author} 正在撰写: ${nextChapter.title}`);
      
      // 写章节
      await writeChapter(book.id, nextChapter.number);
      
    } catch (error) {
      console.error('[写作循环] 出错:', error);
    }
  };

  await write();

  writingInterval = setInterval(async () => {
    if (isRunning) {
      await write();
    }
  }, 30000); // 每30秒写一章
}

// 写章节
async function writeChapter(bookId: string, chapterNumber: number) {
  const book = getBook(bookId);
  if (!book) {
    return NextResponse.json({ success: false, error: '书籍不存在' }, { status: 404 });
  }
  
  const outline = book.outline.find(o => o.number === chapterNumber);
  if (!outline) {
    return NextResponse.json({ success: false, error: '章节不存在' }, { status: 404 });
  }
  
  const zai = await ZAI.create();
  
  // 构建写作提示
  const prompt = buildWritingPrompt(book, outline);
  
  try {
    const completion = await zai.chat.completions.create({
      messages: [{
        role: 'user',
        content: prompt
      }],
      temperature: 0.8,
      max_tokens: 4000
    });

    const content = completion.choices[0]?.message?.content || '';
    
    const chapter: BookChapter = {
      number: chapterNumber,
      title: outline.title,
      content: content,
      wordCount: content.length,
      createdAt: new Date().toISOString()
    };
    
    addChapter(bookId, chapter);
    
    console.log(`[写作完成] ${book.author} - ${outline.title} (${content.length}字)`);
    
    return NextResponse.json({
      success: true,
      chapter: {
        number: chapterNumber,
        title: outline.title,
        wordCount: content.length
      }
    });
    
  } catch (error: any) {
    console.error(`[写作失败] ${book.author} - ${outline.title}:`, error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// 构建写作提示
function buildWritingPrompt(book: any, outline: any): string {
  const bookConfig = book.authorType === 'agent' 
    ? AGENT_BOOKS[book.authorId] 
    : SIREN_BOOKS[book.authorId];
  
  return `你是一位恋爱技巧专家，正在撰写一本名为《${book.title}》的专业书籍。

【书籍信息】
- 书名: ${book.title}
- 作者: ${book.author}
- 分类: ${book.category}
- 目标读者: ${book.targetAudience}
- 书籍简介: ${bookConfig?.description || ''}

【当前章节】
- 章节: ${outline.title}
- 目标字数: ${outline.wordCount}字
- 核心要点: ${outline.keyPoints.join('、')}

【写作要求】
1. 内容要专业、系统、实用
2. 要有理论深度，也要有实操方法
3. 要有具体案例和技巧说明
4. 语言要通俗易懂，但要有专业感
5. 字数控制在${outline.wordCount}字左右
6. 不要有任何科幻或奇怪的内容
7. 要像真正的恋爱教材一样专业

【章节结构建议】
- 开头：引入主题，说明重要性
- 中间：详细讲解核心内容
- 案例：举1-2个实际案例
- 总结：归纳要点，给出行动建议

请直接写出本章的完整内容，不要有任何开场白或解释：`;
}

// 直接写入章节（不调用AI）
async function writeChapterDirect(bookId: string, chapterNumber: number, chapterTitle: string, chapterContent: string) {
  const book = getBook(bookId);
  if (!book) {
    return NextResponse.json({ success: false, error: '书籍不存在' }, { status: 404 });
  }
  
  const chapter: BookChapter = {
    number: chapterNumber,
    title: chapterTitle,
    content: chapterContent,
    wordCount: chapterContent.length,
    createdAt: new Date().toISOString()
  };
  
  addChapter(bookId, chapter);
  
  console.log(`[写作完成] ${book.author} - ${chapterTitle} (${chapterContent.length}字)`);
  
  return NextResponse.json({
    success: true,
    chapter: {
      number: chapterNumber,
      title: chapterTitle,
      wordCount: chapterContent.length
    }
  });
}

// 批量写入章节
async function batchWriteChapters(books: any[]) {
  let totalChapters = 0;
  let totalWords = 0;
  
  for (const bookData of books) {
    const book = getBook(bookData.bookId);
    if (!book) continue;
    
    for (const chapterData of bookData.chapters) {
      const chapter: BookChapter = {
        number: chapterData.number,
        title: chapterData.title,
        content: chapterData.content,
        wordCount: chapterData.content.length,
        createdAt: new Date().toISOString()
      };
      
      addChapter(bookData.bookId, chapter);
      totalChapters++;
      totalWords += chapterData.content.length;
    }
  }
  
  return NextResponse.json({
    success: true,
    message: `已写入 ${totalChapters} 章，共 ${totalWords} 字`
  });
}
