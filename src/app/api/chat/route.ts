import { NextRequest, NextResponse } from 'next/server';
import { getAllKnowledgeContent, readKnowledgeBase } from '@/lib/knowledge-store';
import ZAI from 'z-ai-web-dev-sdk';

// 智能对话
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, conversationHistory = [] } = body;

    if (!message) {
      return NextResponse.json({ success: false, error: '请输入消息' }, { status: 400 });
    }

    const zai = await ZAI.create();
    
    // 获取知识库内容
    const knowledgeContent = getAllKnowledgeContent();
    const kb = readKnowledgeBase();
    
    // 构建系统提示词
    const systemPrompt = `你是一个智能学习助手，你已经学习了以下知识：

${knowledgeContent}

---

你现在的身份和任务：
1. 你是一个社交技巧和约会专家，擅长帮助用户提升与异性沟通的能力
2. 你已经学习了《迷男方法》等社交技巧相关的知识
3. 你需要运用你学到的知识来回答用户的问题
4. 回答时要：
   - 结合知识库中的具体内容
   - 提供实用的建议和技巧
   - 给出具体的行动步骤
   - 必要时举例说明
5. 如果用户问的问题超出了你的知识范围，诚实地说明，并建议用户可以让你学习相关内容
6. 保持友好、专业、有帮助的态度

知识库统计：
- 总条目数：${kb.items.length}
- 分类：${kb.categories.join('、')}

请基于你学到的知识来回答用户的问题。`;

    // 构建消息列表
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.map((msg: { role: string; content: string }) => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: message }
    ];

    // 调用 AI 进行对话
    const completion = await zai.chat.completions.create({
      messages,
      temperature: 0.7,
      max_tokens: 2000
    });

    const response = completion.choices[0]?.message?.content || '抱歉，我无法生成回复。';

    return NextResponse.json({ 
      success: true, 
      response,
      knowledgeUsed: kb.items.length > 0
    });
  } catch (error) {
    console.error('对话失败:', error);
    return NextResponse.json({ success: false, error: '对话失败' }, { status: 500 });
  }
}
