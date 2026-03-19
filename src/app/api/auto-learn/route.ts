import { NextRequest, NextResponse } from 'next/server';
import { addKnowledgeItem, readKnowledgeBase } from '@/lib/knowledge-store';
import {
  readLearningStatus,
  saveLearningStatus,
  updateLearningStatus,
  addLearningRecord,
  getNextTopics,
  LearningStatus
} from '@/lib/learning-engine';
import ZAI from 'z-ai-web-dev-sdk';

// 全局学习状态
let learningInterval: NodeJS.Timeout | null = null;
let isAutoLearning = false;

// 开始自主学习
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, topics } = body;

    if (action === 'start') {
      return await startAutoLearning();
    } else if (action === 'stop') {
      return await stopAutoLearning();
    } else if (action === 'learn_one') {
      return await learnOneTopic();
    } else if (action === 'learn_batch') {
      return await learnBatch(topics || 5);
    }

    return NextResponse.json({ success: false, error: '未知操作' }, { status: 400 });
  } catch (error: any) {
    console.error('[自动学习] 错误:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// 获取学习状态
export async function GET() {
  const status = readLearningStatus();
  const kb = readKnowledgeBase();
  
  return NextResponse.json({
    success: true,
    status: {
      ...status,
      knowledgeBaseSize: kb.items.length,
      isAutoLearning
    }
  });
}

// 开始自动学习
async function startAutoLearning() {
  if (isAutoLearning) {
    return NextResponse.json({ 
      success: true, 
      message: '自动学习已在运行中' 
    });
  }

  isAutoLearning = true;
  updateLearningStatus({ isLearning: true });

  // 启动后台学习
  runAutoLearning();

  return NextResponse.json({
    success: true,
    message: '自动学习已启动，智能体将持续自主学习'
  });
}

// 停止自动学习
async function stopAutoLearning() {
  isAutoLearning = false;
  
  if (learningInterval) {
    clearInterval(learningInterval);
    learningInterval = null;
  }
  
  updateLearningStatus({ isLearning: false });

  return NextResponse.json({
    success: true,
    message: '自动学习已停止'
  });
}

// 运行自动学习循环
async function runAutoLearning() {
  const learn = async () => {
    if (!isAutoLearning) return;

    try {
      const status = readLearningStatus();
      const nextTopics = getNextTopics();
      
      if (nextTopics.length === 0) {
        console.log('[自动学习] 所有主题已学习完成');
        return;
      }

      const topic = nextTopics[0];
      console.log('[自动学习] 开始学习:', topic);
      
      updateLearningStatus({
        currentTopic: topic,
        progress: 0
      });

      const result = await learnTopic(topic);
      
      if (result.success) {
        addLearningRecord({
          topic,
          timestamp: new Date().toISOString(),
          success: true,
          category: result.category || '自动学习',
          relatedTopics: result.relatedTopics || []
        });
        
        console.log('[自动学习] 完成:', topic);
      }

      updateLearningStatus({
        currentTopic: '',
        progress: 100,
        nextTopics: getNextTopics()
      });

    } catch (error) {
      console.error('[自动学习] 学习出错:', error);
    }
  };

  // 立即学习一次
  await learn();

  // 设置定时学习（每30秒学习一个主题）
  learningInterval = setInterval(async () => {
    if (isAutoLearning) {
      await learn();
    }
  }, 30000);
}

// 学习单个主题
async function learnOneTopic() {
  const nextTopics = getNextTopics();
  
  if (nextTopics.length === 0) {
    return NextResponse.json({
      success: false,
      message: '所有主题已学习完成'
    });
  }

  const topic = nextTopics[0];
  const result = await learnTopic(topic);

  if (result.success) {
    addLearningRecord({
      topic,
      timestamp: new Date().toISOString(),
      success: true,
      category: result.category || '手动学习',
      relatedTopics: result.relatedTopics || []
    });
  }

  return NextResponse.json({
    success: result.success,
    topic,
    message: result.success ? `已学习: ${topic}` : `学习失败: ${topic}`
  });
}

// 批量学习
async function learnBatch(count: number) {
  const nextTopics = getNextTopics().slice(0, count);
  const results = [];

  for (const topic of nextTopics) {
    const result = await learnTopic(topic);
    
    if (result.success) {
      addLearningRecord({
        topic,
        timestamp: new Date().toISOString(),
        success: true,
        category: result.category || '批量学习',
        relatedTopics: result.relatedTopics || []
      });
      results.push({ topic, success: true });
    } else {
      results.push({ topic, success: false });
    }

    // 短暂延迟
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return NextResponse.json({
    success: true,
    results,
    message: `批量学习完成: ${results.filter(r => r.success).length}/${results.length}`
  });
}

// 学习特定主题
async function learnTopic(topic: string): Promise<{
  success: boolean;
  category?: string;
  relatedTopics?: string[];
}> {
  try {
    const zai = await ZAI.create();

    // 使用AI生成详细内容
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `你是一个恋爱技巧和社交心理学专家。请生成关于给定主题的详细、实用的知识内容。
要求：
1. 内容必须详细、实用、可操作
2. 包含具体的技巧、方法、案例
3. 提供实践建议
4. 返回JSON格式`
        },
        {
          role: 'user',
          content: `主题: ${topic}

请生成详细的知识内容，返回JSON格式：
{
  "title": "标题",
  "content": "详细内容（包含理论解释、具体方法、实践技巧、案例分析）",
  "summary": "简短摘要",
  "keyPoints": ["要点1", "要点2", "要点3", "要点4"],
  "category": "分类",
  "tags": ["标签1", "标签2", "标签3"],
  "relatedTopics": ["相关主题1", "相关主题2"],
  "practiceTips": ["实践建议1", "实践建议2"]
}`
        }
      ]
    });

    const responseText = completion.choices[0]?.message?.content || '';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);

      addKnowledgeItem({
        title: parsed.title || topic,
        content: parsed.content,
        source: 'web',
        category: parsed.category || '自动学习',
        tags: parsed.tags || [topic],
        summary: parsed.summary,
        keyPoints: parsed.keyPoints
      });

      return {
        success: true,
        category: parsed.category,
        relatedTopics: parsed.relatedTopics || []
      };
    }

    return { success: false };
  } catch (error) {
    console.error('[学习主题失败]', topic, error);
    return { success: false };
  }
}
