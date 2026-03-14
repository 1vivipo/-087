import { NextRequest, NextResponse } from 'next/server';
import { getAllKnowledgeContent } from '@/lib/knowledge-store';
import ZAI from 'z-ai-web-dev-sdk';

// 模拟聊天练习
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      message, 
      conversationHistory = [],
      scenario = 'first_date',
      difficulty = 'medium'
    } = body;

    console.log('[模拟练习] 场景:', scenario, '难度:', difficulty);

    if (!message) {
      return NextResponse.json({ success: false, error: '请输入消息' }, { status: 400 });
    }

    const zai = await ZAI.create();
    
    // 获取知识库内容
    const knowledgeContent = getAllKnowledgeContent();
    
    // 场景设定
    const scenarios = {
      first_date: {
        name: '初次约会',
        description: '你和一个女生第一次约会，在咖啡厅见面',
        girlProfile: '25岁，性格温柔但有点害羞，喜欢旅行和摄影，对美食感兴趣',
        setting: '咖啡厅，下午3点，阳光透过窗户洒进来'
      },
      wechat_chat: {
        name: '微信聊天',
        description: '你刚加了一个女生的微信，需要开启对话',
        girlProfile: '23岁，活泼开朗，喜欢追剧和美食，朋友圈经常发美食照片',
        setting: '微信聊天，晚上9点'
      },
      party_meet: {
        name: '派对邂逅',
        description: '在朋友的派对上遇到一个女生',
        girlProfile: '26岁，时尚自信，喜欢音乐和舞蹈，社交能力强',
        setting: '朋友家的派对，音乐声适中，有人在跳舞'
      },
      street_pickup: {
        name: '街头搭讪',
        description: '在商场看到一个心仪的女生',
        girlProfile: '24岁，独立自主，正在看衣服，看起来有点犹豫',
        setting: '商场服装店，周末下午'
      },
      confession: {
        name: '表白时刻',
        description: '你们已经认识一段时间，你想表达心意',
        girlProfile: '25岁，对你有好感但不确定，性格谨慎',
        setting: '公园散步，傍晚，气氛浪漫'
      }
    };

    // 难度设定
    const difficulties = {
      easy: '她对你很友好，容易接受你的话题，会主动延续对话',
      medium: '她态度中性，需要你展示魅力才能吸引她',
      hard: '她有点冷淡或防备，需要你用技巧打破僵局'
    };

    const currentScenario = scenarios[scenario as keyof typeof scenarios] || scenarios.first_date;
    const currentDifficulty = difficulties[difficulty as keyof typeof difficulties] || difficulties.medium;

    // 构建系统提示词
    const systemPrompt = `你是一个模拟女生角色的AI，用于帮助用户练习聊天技巧。

【当前场景】
${currentScenario.name}：${currentScenario.description}
环境：${currentScenario.setting}

【你扮演的女生】
${currentScenario.girlProfile}
难度设定：${currentDifficulty}

【知识库参考】
${knowledgeContent.substring(0, 3000)}

【扮演要求】
1. 完全沉浸在这个女生角色中，用她的口吻和性格回复
2. 根据难度设定调整你的反应：
   - easy: 更热情、主动、容易接话
   - medium: 正常反应，需要对方展示魅力
   - hard: 更冷淡、需要更多技巧才能打开心扉
3. 回复要自然、真实，像真实女生一样
4. 可以有情绪波动，会根据对方的话产生好感或反感
5. 回复不要太长，像真实聊天一样简洁
6. 如果对方说得好，可以给出积极的反应；如果说得不好，可以表现出冷淡或尴尬
7. 偶尔可以主动提问或延续话题

【评分机制】
每条回复后，给出一个隐藏的评分（1-10分），评估对方的聊天技巧：
- 话题选择是否合适
- 是否展示了价值
- 是否建立了情感连接
- 是否有幽默感
- 是否过于急切或暴露需求感

请以JSON格式回复：
{
  "response": "女生的回复内容",
  "emotion": "当前情绪（如：好奇、开心、冷淡、害羞等）",
  "interest": "兴趣度（1-10）",
  "score": "这条消息的得分（1-10）",
  "feedback": "简短的技巧点评（用户看不到，用于记录）"
}`;

    // 构建消息列表
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: message }
    ];

    // 调用 AI
    const completion = await zai.chat.completions.create({
      messages,
      temperature: 0.8,
      max_tokens: 500
    });

    const responseText = completion.choices[0]?.message?.content || '';
    
    // 解析响应
    let result;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        result = {
          response: responseText,
          emotion: '中性',
          interest: 5,
          score: 5,
          feedback: ''
        };
      }
    } catch {
      result = {
        response: responseText,
        emotion: '中性',
        interest: 5,
        score: 5,
        feedback: ''
      };
    }

    console.log('[模拟练习] 情绪:', result.emotion, '兴趣度:', result.interest, '得分:', result.score);

    return NextResponse.json({ 
      success: true, 
      response: result.response,
      emotion: result.emotion,
      interest: result.interest,
      score: result.score,
      feedback: result.feedback,
      scenario: currentScenario
    });
  } catch (error: any) {
    console.error('[模拟练习失败]:', error);
    return NextResponse.json({ 
      success: false, 
      error: `模拟练习失败: ${error.message}` 
    }, { status: 500 });
  }
}

// 获取可用场景
export async function GET() {
  const scenarios = [
    { id: 'first_date', name: '初次约会', description: '咖啡厅第一次约会' },
    { id: 'wechat_chat', name: '微信聊天', description: '刚加微信需要开启对话' },
    { id: 'party_meet', name: '派对邂逅', description: '朋友派对上认识' },
    { id: 'street_pickup', name: '街头搭讪', description: '商场搭讪' },
    { id: 'confession', name: '表白时刻', description: '表达心意' }
  ];
  
  const difficulties = [
    { id: 'easy', name: '简单', description: '她对你很友好' },
    { id: 'medium', name: '中等', description: '态度中性' },
    { id: 'hard', name: '困难', description: '有点冷淡' }
  ];
  
  return NextResponse.json({ 
    success: true, 
    scenarios,
    difficulties
  });
}
