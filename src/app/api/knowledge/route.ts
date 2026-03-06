import { NextRequest, NextResponse } from 'next/server';
import {
  readKnowledgeBase,
  addKnowledgeItem,
  updateKnowledgeItem,
  deleteKnowledgeItem,
  searchKnowledge,
  getKnowledgeStats,
  getAllKnowledgeContent
} from '@/lib/knowledge-store';

// GET - 获取知识库
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const query = searchParams.get('query');
    const category = searchParams.get('category');
    const id = searchParams.get('id');

    if (action === 'stats') {
      const stats = getKnowledgeStats();
      return NextResponse.json({ success: true, stats });
    }

    if (action === 'search' && query) {
      const results = searchKnowledge(query, category || undefined);
      return NextResponse.json({ success: true, results });
    }

    if (action === 'content') {
      const content = getAllKnowledgeContent();
      return NextResponse.json({ success: true, content });
    }

    if (id) {
      const kb = readKnowledgeBase();
      const item = kb.items.find(i => i.id === id);
      if (!item) {
        return NextResponse.json({ success: false, error: '未找到该知识条目' }, { status: 404 });
      }
      return NextResponse.json({ success: true, item });
    }

    const kb = readKnowledgeBase();
    return NextResponse.json({ success: true, knowledgeBase: kb });
  } catch (error) {
    console.error('获取知识库失败:', error);
    return NextResponse.json({ success: false, error: '获取知识库失败' }, { status: 500 });
  }
}

// POST - 添加知识
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, source, sourceType, sourceUrl, category, tags, summary, keyPoints } = body;

    if (!title || !content) {
      return NextResponse.json({ success: false, error: '标题和内容不能为空' }, { status: 400 });
    }

    const item = addKnowledgeItem({
      title,
      content,
      source: source || 'manual',
      sourceType,
      sourceUrl,
      category: category || '默认',
      tags: tags || [],
      summary,
      keyPoints
    });

    return NextResponse.json({ success: true, item });
  } catch (error) {
    console.error('添加知识失败:', error);
    return NextResponse.json({ success: false, error: '添加知识失败' }, { status: 500 });
  }
}

// PUT - 更新知识
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: '缺少知识条目ID' }, { status: 400 });
    }

    const item = updateKnowledgeItem(id, updates);
    if (!item) {
      return NextResponse.json({ success: false, error: '未找到该知识条目' }, { status: 404 });
    }

    return NextResponse.json({ success: true, item });
  } catch (error) {
    console.error('更新知识失败:', error);
    return NextResponse.json({ success: false, error: '更新知识失败' }, { status: 500 });
  }
}

// DELETE - 删除知识
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: '缺少知识条目ID' }, { status: 400 });
    }

    const success = deleteKnowledgeItem(id);
    if (!success) {
      return NextResponse.json({ success: false, error: '未找到该知识条目' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除知识失败:', error);
    return NextResponse.json({ success: false, error: '删除知识失败' }, { status: 500 });
  }
}
