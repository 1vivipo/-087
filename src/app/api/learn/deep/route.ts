import { NextRequest, NextResponse } from 'next/server';
import { readKnowledgeBase, addKnowledgeItem } from '@/lib/knowledge-store';
import ZAI from 'z-ai-web-dev-sdk';

// 深度学习分析
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic, depth = 'medium' } = body;

    console.log('[深度学习] 主题:', topic, '深度:', depth);

    if (!topic) {
      return NextResponse.json({ success: false, error: '请提供学习主题' }, { status: 400 });
    }

    const zai = await ZAI.create();
    const kb = readKnowledgeBase();

    // 查找相关知识
    const relatedItems = kb.items.filter(item => 
      item.title.includes(topic) || 
      item.content.includes(topic) ||
      item.tags.some(tag => tag.includes(topic))
    );
    
    console.log('[深度学习] 找到相关知识:', relatedItems.length);

    // 准备上下文内容
    let contextContent = '';
    if (relatedItems.length > 0) {
      contextContent = relatedItems.map(item => 
        `【${item.title}】\n${item.content}`
      ).join('\n\n---\n\n');
    }

    // 根据深度级别设置分析要求
    const depthPrompts = {
      shallow: '进行基础分析，提取主要观点和关键信息。',
      medium: '进行中等深度分析，提取核心概念、关键技巧、实践方法和注意事项。',
      deep: '进行深度分析，包括：1) 核心理论框架 2) 详细方法论 3) 实践步骤 4) 常见误区 5) 进阶技巧 6) 案例分析 7) 与其他知识的关联'
    };

    // 使用 AI 进行深度分析
    const completion = await zai.chat.completions.create({
      messages: [
        { 
          role: 'system', 
          content: `你是一个恋爱技巧和社交心理学专家，擅长对知识进行深度分析和提炼。
${depthPrompts[depth as keyof typeof depthPrompts]}

请以结构化的方式输出分析结果，确保内容详实、有深度、可操作。
返回JSON格式。`
        },
        { 
          role: 'user', 
          content: `请对以下主题进行深度学习分析：

主题：${topic}

${contextContent ? `已有知识：\n${contextContent.substring(0, 5000)}\n\n` : ''}

请返回JSON格式的分析结果：
{
  "deepAnalysis": "深度分析内容（详细、结构化、包含实践指导）",
  "coreConcepts": ["核心概念1", "核心概念2"],
  "practicalMethods": ["实践方法1", "实践方法2"],
  "commonMistakes": ["常见误区1", "常见误区2"],
  "advancedTips": ["进阶技巧1", "进阶技巧2"],
  "relatedTopics": ["相关主题1", "相关主题2"],
  "summary": "学习总结",
  "actionPlan": ["行动步骤1", "行动步骤2"]
}`
        }
      ]
    });

    const responseText = completion.choices[0]?.message?.content || '';
    console.log('[深度学习] AI响应长度:', responseText.length);
    
    let analysisResult;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        analysisResult = {
          deepAnalysis: responseText,
          coreConcepts: [],
          practicalMethods: [],
          commonMistakes: [],
          advancedTips: [],
          relatedTopics: [],
          summary: '',
          actionPlan: []
        };
      }
    } catch {
      analysisResult = {
        deepAnalysis: responseText,
        coreConcepts: [],
        practicalMethods: [],
        commonMistakes: [],
        advancedTips: [],
        relatedTopics: [],
        summary: '',
        actionPlan: []
      };
    }

    // 创建新的深度学习条目
    const item = addKnowledgeItem({
      title: `深度学习：${topic}`,
      content: analysisResult.deepAnalysis,
      source: 'manual',
      category: '深度学习',
      tags: ['深度分析', topic],
      summary: analysisResult.summary,
      keyPoints: [...(analysisResult.coreConcepts || []), ...(analysisResult.practicalMethods || [])]
    });
    
    console.log('[深度学习] 知识已保存:', item.title);

    return NextResponse.json({ 
      success: true, 
      analysis: analysisResult,
      item,
      message: '深度学习分析完成'
    });
  } catch (error: any) {
    console.error('[深度学习失败]:', error);
    return NextResponse.json({ 
      success: false, 
      error: `深度学习失败: ${error.message}` 
    }, { status: 500 });
  }
}
