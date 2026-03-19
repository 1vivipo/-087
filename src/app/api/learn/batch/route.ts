import { NextRequest, NextResponse } from 'next/server';
import { addKnowledgeItem } from '@/lib/knowledge-store';
import ZAI from 'z-ai-web-dev-sdk';

// 精选主题列表 - 更快完成
const DEFAULT_TOPICS = [
  '迷男方法核心技巧',
  '如何与女生聊天开场白',
  '吸引力法则恋爱心理学',
  '第一次约会技巧',
  '微信聊天撩妹技巧',
  '冷读术技巧',
  '情绪价值提供方法',
  '表白技巧时机'
];

// 批量网络学习
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topics, useDefaults = false } = body;

    const topicsToLearn = useDefaults ? DEFAULT_TOPICS : (topics || []);
    
    if (topicsToLearn.length === 0) {
      return NextResponse.json({ success: false, error: '请提供学习主题或使用默认主题' }, { status: 400 });
    }

    console.log('[批量学习] 开始学习', topicsToLearn.length, '个主题');

    const zai = await ZAI.create();
    const results = [];
    const errors = [];

    // 逐个处理主题
    for (let i = 0; i < topicsToLearn.length; i++) {
      const topic = topicsToLearn[i];
      console.log(`[批量学习 ${i+1}/${topicsToLearn.length}]`, topic);

      try {
        // 使用 AI 直接生成内容
        const completion = await zai.chat.completions.create({
          messages: [
            { 
              role: 'system', 
              content: '你是恋爱技巧专家。请生成详细、实用的知识内容，包含具体方法和技巧。返回JSON格式。'
            },
            { 
              role: 'user', 
              content: `主题: ${topic}\n\n请生成详细的知识内容，返回JSON：
{
  "title": "标题",
  "content": "详细内容（包含具体方法、技巧、案例）",
  "summary": "摘要",
  "keyPoints": ["要点1", "要点2", "要点3"],
  "category": "分类",
  "tags": ["标签1", "标签2"]
}`
            }
          ]
        });

        const responseText = completion.choices[0]?.message?.content || '';
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          
          const knowledgeItem = addKnowledgeItem({
            title: parsed.title || topic,
            content: parsed.content,
            source: 'web',
            category: parsed.category || '批量学习',
            tags: parsed.tags || [topic],
            summary: parsed.summary,
            keyPoints: parsed.keyPoints
          });
          
          results.push({ topic, success: true, item: knowledgeItem });
          console.log('[成功]', topic);
        }
        
        // 短暂延迟
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error: any) {
        console.error('[失败]', topic, error.message);
        errors.push({ topic, error: error.message });
      }
    }

    console.log(`[批量学习完成] 成功: ${results.length}, 失败: ${errors.length}`);

    return NextResponse.json({ 
      success: true, 
      results,
      errors,
      total: topicsToLearn.length,
      successCount: results.length,
      errorCount: errors.length,
      message: `批量学习完成！成功: ${results.length}, 失败: ${errors.length}`
    });
  } catch (error: any) {
    console.error('[批量学习失败]', error);
    return NextResponse.json({ 
      success: false, 
      error: `批量学习失败: ${error.message}` 
    }, { status: 500 });
  }
}

// 获取默认主题列表
export async function GET() {
  return NextResponse.json({ 
    success: true, 
    defaultTopics: DEFAULT_TOPICS.map(t => ({ topic: t, type: 'article' })),
    total: DEFAULT_TOPICS.length
  });
}
