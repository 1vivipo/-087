import { NextRequest, NextResponse } from 'next/server';
import { addKnowledgeItem } from '@/lib/knowledge-store';
import ZAI from 'z-ai-web-dev-sdk';

// 解析文件内容
async function parseFileContent(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const fileName = file.name.toLowerCase();
  
  if (fileName.endsWith('.txt')) {
    return buffer.toString('utf-8');
  }
  
  if (fileName.endsWith('.pdf')) {
    // 对于 PDF，我们需要使用 Python 脚本来提取
    // 这里简化处理，返回提示信息
    return `[PDF文件: ${file.name}] - 需要使用PDF解析工具提取内容`;
  }
  
  if (fileName.endsWith('.docx')) {
    return `[DOCX文件: ${file.name}] - 需要使用DOCX解析工具提取内容`;
  }
  
  // 默认当作文本处理
  try {
    return buffer.toString('utf-8');
  } catch {
    return `[二进制文件: ${file.name}]`;
  }
}

// 使用 AI 分析和总结内容
async function analyzeContent(content: string, title: string): Promise<{
  summary: string;
  keyPoints: string[];
  category: string;
  tags: string[];
}> {
  try {
    const zai = await ZAI.create();
    
    const prompt = `请分析以下知识内容，并提供：
1. 一个简洁的摘要（100字以内）
2. 3-5个关键要点
3. 一个合适的分类（如：社交技巧、沟通艺术、心理学、约会技巧等）
4. 3-5个相关标签

标题：${title}
内容：
${content.substring(0, 3000)}

请以JSON格式返回，格式如下：
{
  "summary": "摘要内容",
  "keyPoints": ["要点1", "要点2", "要点3"],
  "category": "分类",
  "tags": ["标签1", "标签2", "标签3"]
}`;

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: '你是一个知识管理助手，擅长分析和总结各类知识内容。请始终以JSON格式返回结果。' },
        { role: 'user', content: prompt }
      ]
    });

    const responseText = completion.choices[0]?.message?.content || '';
    
    // 尝试解析 JSON
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch {
      // 解析失败，使用默认值
    }
    
    return {
      summary: '内容分析中...',
      keyPoints: [],
      category: '默认',
      tags: []
    };
  } catch (error) {
    console.error('分析内容失败:', error);
    return {
      summary: '内容分析失败',
      keyPoints: [],
      category: '默认',
      tags: []
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const category = formData.get('category') as string;
    const autoAnalyze = formData.get('autoAnalyze') === 'true';

    if (!file) {
      return NextResponse.json({ success: false, error: '请上传文件' }, { status: 400 });
    }

    // 解析文件内容
    const content = await parseFileContent(file);
    const fileTitle = title || file.name.replace(/\.[^/.]+$/, '');
    
    // 确定文件类型
    const fileName = file.name.toLowerCase();
    let sourceType: 'pdf' | 'txt' | 'docx' = 'txt';
    if (fileName.endsWith('.pdf')) sourceType = 'pdf';
    else if (fileName.endsWith('.docx')) sourceType = 'docx';

    // 如果启用自动分析，使用 AI 分析内容
    let summary = '';
    let keyPoints: string[] = [];
    let tags: string[] = [];
    let finalCategory = category || '默认';

    if (autoAnalyze && content.length > 50) {
      const analysis = await analyzeContent(content, fileTitle);
      summary = analysis.summary;
      keyPoints = analysis.keyPoints;
      tags = analysis.tags;
      if (!category) {
        finalCategory = analysis.category;
      }
    }

    // 添加到知识库
    const item = addKnowledgeItem({
      title: fileTitle,
      content,
      source: 'document',
      sourceType,
      category: finalCategory,
      tags,
      summary,
      keyPoints
    });

    return NextResponse.json({ 
      success: true, 
      item,
      message: `文件 "${file.name}" 已成功添加到知识库`
    });
  } catch (error) {
    console.error('上传文件失败:', error);
    return NextResponse.json({ success: false, error: '上传文件失败' }, { status: 500 });
  }
}
